import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { RedisService } from '../redis/redis.service';
import { QueueService } from '../queue/queue.service';
import { RoomsService } from '../rooms/rooms.service';
import { DeckService } from './engine/deck.service';
import { BiddingService } from './engine/bidding.service';
import { TrickService } from './engine/trick.service';
import { ScoreService } from './engine/score.service';
import { ValidationService } from './engine/validation.service';
import {
  GameState,
  GamePhase,
  PlayerState,
  SeatIndex,
  TeamId,
  Bid,
  Card,
  Trick,
  Contract,
  RoomState,
  PlayCardPayload,
  PlaceBidPayload,
} from '../common/types';

@Injectable()
export class GameManagerService {
  private readonly logger = new Logger(GameManagerService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly queueService: QueueService,
    private readonly roomsService: RoomsService,
    private readonly deckService: DeckService,
    private readonly biddingService: BiddingService,
    private readonly trickService: TrickService,
    private readonly scoreService: ScoreService,
    private readonly validationService: ValidationService,
  ) {}

  // ================================================================
  // GAME LIFECYCLE
  // ================================================================

  /**
   * Initialize a new game from a full room.
   */
  async startGame(roomId: string): Promise<GameState> {
    const room = await this.roomsService.getRoom(roomId);
    if (!room || room.players.length !== 4) {
      throw new Error('Room must have exactly 4 players');
    }

    await this.roomsService.markPlaying(roomId);

    const gameId = uuid();
    const players: PlayerState[] = room.players.map((p) => ({
      id: p.id,
      username: p.username,
      seat: p.seat,
      team: (p.seat === 0 || p.seat === 2 ? 'teamA' : 'teamB') as TeamId,
      hand: [],
      connected: true,
    }));

    const state: GameState = {
      id: gameId,
      roomId,
      phase: GamePhase.Dealing,
      players,
      dealer: 0 as SeatIndex,
      currentTurn: 1 as SeatIndex, // player after dealer starts bidding
      bids: [],
      contract: null,
      consecutivePasses: 0,
      currentTrick: { cards: [], leadSuit: null as any },
      completedTricks: [],
      trickCount: 0,
      roundScores: [],
      gameScore: { teamA: 0, teamB: 0 },
      targetScore: 1000,
      turnStartedAt: Date.now(),
      turnTimeoutMs: 30000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Deal cards
    const dealtState = this.dealCards(state);
    dealtState.phase = GamePhase.Bidding;
    dealtState.turnStartedAt = Date.now();

    await this.redisService.setGameState(gameId, dealtState);

    this.queueService.publishGameEvent('game_started', {
      gameId,
      roomId,
      players: players.map((p) => ({ id: p.id, username: p.username, team: p.team })),
    });

    this.logger.log(`Game ${gameId} started in room ${roomId}`);
    return dealtState;
  }

  /**
   * Deal cards for a new round.
   */
  private dealCards(state: GameState): GameState {
    const deck = this.deckService.createDeck();
    const shuffled = this.deckService.shuffle(deck);
    const hands = this.deckService.deal(shuffled);

    for (let i = 0; i < 4; i++) {
      const playerBySeat = state.players.find((p) => p.seat === i);
      if (playerBySeat) {
        playerBySeat.hand = this.deckService.sortHand(hands[i]);
      }
    }

    return state;
  }

  // ================================================================
  // BIDDING
  // ================================================================

  /**
   * Process a player's bid.
   */
  async processBid(
    gameId: string,
    payload: PlaceBidPayload,
    playerId: string,
  ): Promise<{
    state: GameState;
    biddingOver: boolean;
    allPassed: boolean;
    contract: Contract | null;
  }> {
    const state = await this.getState(gameId);
    this.assertPhase(state, GamePhase.Bidding);
    this.assertTurn(state, playerId);

    const bid: Bid = {
      playerId,
      type: payload.type,
      suit: payload.suit,
      value: payload.value,
    };

    if (!this.biddingService.isValidBid(bid, state)) {
      throw new Error('Invalid bid');
    }

    state.bids.push(bid);

    // Check if bidding is over
    const { over, allPassed } = this.biddingService.isBiddingOver(state.bids);

    let contract: Contract | null = null;

    if (over && allPassed) {
      // Re-deal: rotate dealer and start new bidding
      state.dealer = this.nextSeat(state.dealer);
      state.currentTurn = this.nextSeat(state.dealer);
      state.bids = [];
      const redealt = this.dealCards(state);
      redealt.phase = GamePhase.Bidding;
      redealt.turnStartedAt = Date.now();
      await this.saveState(redealt);
      return { state: redealt, biddingOver: true, allPassed: true, contract: null };
    }

    if (over) {
      // Contract established
      contract = this.biddingService.buildContract(state.bids, state);
      state.contract = contract;
      state.phase = GamePhase.Playing;
      // Player after dealer leads the first trick
      state.currentTurn = this.nextSeat(state.dealer);
      state.currentTrick = { cards: [], leadSuit: null as any };
      state.completedTricks = [];
      state.trickCount = 0;
    } else {
      // Next player's turn to bid
      state.currentTurn = this.nextSeat(state.currentTurn);
    }

    state.turnStartedAt = Date.now();
    await this.saveState(state);

    this.queueService.publishGameEvent('bid_made', {
      gameId,
      bid,
      biddingOver: over,
      contract,
    });

    return { state, biddingOver: over, allPassed, contract };
  }

  // ================================================================
  // CARD PLAY
  // ================================================================

  /**
   * Process a card played by a player.
   */
  async playCard(
    gameId: string,
    payload: PlayCardPayload,
    playerId: string,
  ): Promise<{
    state: GameState;
    trickComplete: boolean;
    roundComplete: boolean;
    gameOver: boolean;
  }> {
    const state = await this.getState(gameId);
    this.assertPhase(state, GamePhase.Playing);
    this.assertTurn(state, playerId);

    const player = state.players.find((p) => p.id === playerId)!;
    const card = payload.card;

    // Validate the play
    if (
      !this.validationService.isLegalPlay(
        card,
        player.hand,
        state.currentTrick,
        state.contract!.suit,
        playerId,
        state,
      )
    ) {
      throw new Error('Illegal card play');
    }

    // Set lead suit if first card in trick
    if (state.currentTrick.cards.length === 0) {
      state.currentTrick.leadSuit = card.suit;
    }

    // Play the card
    state.currentTrick.cards.push({ playerId, card });

    // Remove card from player's hand
    player.hand = player.hand.filter(
      (c) => !(c.suit === card.suit && c.rank === card.rank),
    );

    let trickComplete = false;
    let roundComplete = false;
    let gameOver = false;

    // Check if trick is complete (4 cards played)
    if (state.currentTrick.cards.length === 4) {
      trickComplete = true;
      const winner = this.trickService.resolveTrick(
        state.currentTrick,
        state.contract!.suit,
      );

      state.currentTrick.winnerId = winner.playerId;
      state.currentTrick.winnerTeam = this.trickService.getWinnerTeam(
        winner.playerId,
        state,
      );

      state.completedTricks.push({ ...state.currentTrick });
      state.trickCount++;

      // Check if round is complete (8 tricks)
      if (state.trickCount === 8) {
        roundComplete = true;
        const roundScore = this.scoreService.calculateRoundScore(state);
        state.roundScores.push(roundScore);
        state.gameScore.teamA += roundScore.teamA;
        state.gameScore.teamB += roundScore.teamB;

        // Check if game is over
        if (
          state.gameScore.teamA >= state.targetScore ||
          state.gameScore.teamB >= state.targetScore
        ) {
          gameOver = true;
          state.phase = GamePhase.GameOver;
        } else {
          // Start new round
          state.dealer = this.nextSeat(state.dealer);
          state.currentTurn = this.nextSeat(state.dealer);
          state.bids = [];
          state.contract = null;
          state.currentTrick = { cards: [], leadSuit: null as any };
          state.completedTricks = [];
          state.trickCount = 0;
          state.phase = GamePhase.Dealing;

          const redealt = this.dealCards(state);
          redealt.phase = GamePhase.Bidding;
        }

        this.queueService.publishGameEvent('round_complete', {
          gameId,
          roundScore,
          gameScore: state.gameScore,
          gameOver,
        });
      } else {
        // Next trick — winner leads
        const winnerPlayer = state.players.find(
          (p) => p.id === winner.playerId,
        )!;
        state.currentTurn = winnerPlayer.seat;
        state.currentTrick = { cards: [], leadSuit: null as any };
      }
    } else {
      // Next player in trick
      state.currentTurn = this.nextSeat(state.currentTurn);
    }

    state.turnStartedAt = Date.now();
    await this.saveState(state);

    this.queueService.publishGameEvent('card_played', {
      gameId,
      playerId,
      card,
      trickComplete,
      roundComplete,
    });

    return { state, trickComplete, roundComplete, gameOver };
  }

  // ================================================================
  // RECONNECTION
  // ================================================================

  /**
   * Handle player reconnection — restore their game state.
   */
  async handleReconnect(
    playerId: string,
    gameId: string,
  ): Promise<GameState | null> {
    const state = await this.redisService.getGameState(gameId);
    if (!state) return null;

    const player = state.players.find((p) => p.id === playerId);
    if (!player) return null;

    player.connected = true;
    player.disconnectedAt = undefined;

    await this.redisService.clearDisconnectTimer(playerId);
    await this.saveState(state);

    return state;
  }

  /**
   * Handle player disconnection.
   */
  async handleDisconnect(
    playerId: string,
    gameId: string,
    gracePeriodMs: number,
  ): Promise<void> {
    const state = await this.redisService.getGameState(gameId);
    if (!state) return;

    const player = state.players.find((p) => p.id === playerId);
    if (!player) return;

    player.connected = false;
    player.disconnectedAt = Date.now();

    await this.redisService.setDisconnectTimer(playerId, gracePeriodMs);
    await this.saveState(state);
  }

  // ================================================================
  // HELPERS
  // ================================================================

  async getState(gameId: string): Promise<GameState> {
    const state = await this.redisService.getGameState(gameId);
    if (!state) throw new Error('Game not found');
    return state;
  }

  /**
   * Get a sanitized state for a specific player (hides other players' hands).
   */
  getPlayerView(state: GameState, playerId: string): any {
    return {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        hand: p.id === playerId ? p.hand : p.hand.map(() => null), // hide other hands
        cardCount: p.hand.length,
      })),
    };
  }

  private async saveState(state: GameState): Promise<void> {
    state.updatedAt = Date.now();
    await this.redisService.setGameState(state.id, state);
  }

  private assertPhase(state: GameState, expected: GamePhase): void {
    if (state.phase !== expected) {
      throw new Error(`Expected phase ${expected}, got ${state.phase}`);
    }
  }

  private assertTurn(state: GameState, playerId: string): void {
    const current = state.players.find((p) => p.seat === state.currentTurn);
    if (!current || current.id !== playerId) {
      throw new Error('Not your turn');
    }
  }

  private nextSeat(seat: SeatIndex): SeatIndex {
    return ((seat + 1) % 4) as SeatIndex;
  }
}
