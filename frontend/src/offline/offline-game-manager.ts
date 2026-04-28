import {
  GameState,
  GamePhase,
  PlayerState,
  SeatIndex,
  Bid,
  BidType,
  PlaceBidPayload,
  PlayCardPayload,
  Contract,
  Trick,
} from './types';
import { DeckService } from './engine/deck';
import { BiddingService } from './engine/bidding';
import { TrickService } from './engine/trick';
import { ScoreService } from './engine/score';
import { ValidationService } from './engine/validation';

export const OFFLINE_ROOM_ID = 'offline';
export const OFFLINE_HUMAN_ID = 'offline-human';

export class OfflineGameManager {
  private state: GameState | null = null;

  private readonly deckService = new DeckService();
  private readonly trickService = new TrickService();
  private readonly biddingService = new BiddingService();
  private readonly scoreService = new ScoreService(this.trickService);
  private readonly validationService = new ValidationService(this.trickService);

  getState(): GameState {
    if (!this.state) throw new Error('Game not started');
    return this.state;
  }

  startGame(): GameState {
    const players: PlayerState[] = [
      {
        id: OFFLINE_HUMAN_ID,
        username: 'You',
        seat: 0,
        team: 'teamA',
        hand: [],
        connected: true,
      },
      {
        id: 'offline-bot-1',
        username: 'Bot Ada',
        seat: 1,
        team: 'teamB',
        hand: [],
        connected: true,
      },
      {
        id: 'offline-bot-2',
        username: 'Bot Ben',
        seat: 2,
        team: 'teamA',
        hand: [],
        connected: true,
      },
      {
        id: 'offline-bot-3',
        username: 'Bot Cy',
        seat: 3,
        team: 'teamB',
        hand: [],
        connected: true,
      },
    ];

    const gameId = `offline-${Date.now()}`;
    const state: GameState = {
      id: gameId,
      roomId: OFFLINE_ROOM_ID,
      phase: GamePhase.Dealing,
      players,
      dealer: 0 as SeatIndex,
      currentTurn: 1 as SeatIndex,
      bids: [],
      contract: null,
      consecutivePasses: 0,
      currentTrick: { cards: [], leadSuit: null as any },
      completedTricks: [],
      trickCount: 0,
      roundScores: [],
      gameScore: { teamA: 0, teamB: 0 },
      targetScore: 500,
      turnStartedAt: Date.now(),
      turnTimeoutMs: 30000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const dealt = this.dealCards(state);
    dealt.phase = GamePhase.Bidding;
    dealt.turnStartedAt = Date.now();
    this.state = dealt;
    return dealt;
  }

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

  processBid(
    playerId: string,
    payload: PlaceBidPayload,
  ): {
    state: GameState;
    biddingOver: boolean;
    allPassed: boolean;
    contract: Contract | null;
    bid: Bid;
  } {
    const state = this.getState();
    this.assertPhase(state, GamePhase.Bidding);
    this.assertTurn(state, playerId);

    const bid: Bid = {
      playerId,
      type: payload.type as BidType,
      suit: payload.suit,
      value: payload.value,
    };

    if (!this.biddingService.isValidBid(bid, state)) {
      throw new Error('Invalid bid');
    }

    state.bids.push(bid);

    const { over, allPassed } = this.biddingService.isBiddingOver(state.bids);

    let contract: Contract | null = null;

    if (over && allPassed) {
      state.dealer = this.nextSeat(state.dealer);
      state.currentTurn = this.nextSeat(state.dealer);
      state.bids = [];
      const redealt = this.dealCards(state);
      redealt.phase = GamePhase.Bidding;
      redealt.turnStartedAt = Date.now();
      this.state = redealt;
      state.updatedAt = Date.now();
      return {
        state: redealt,
        biddingOver: true,
        allPassed: true,
        contract: null,
        bid,
      };
    }

    if (over) {
      contract = this.biddingService.buildContract(state.bids, state);
      state.contract = contract;
      state.phase = GamePhase.Playing;
      state.currentTurn = this.nextSeat(state.dealer);
      state.currentTrick = { cards: [], leadSuit: null as any };
      state.completedTricks = [];
      state.trickCount = 0;
    } else {
      state.currentTurn = this.nextSeat(state.currentTurn);
    }

    state.turnStartedAt = Date.now();
    state.updatedAt = Date.now();
    return { state, biddingOver: over, allPassed, contract, bid };
  }

  playCard(
    playerId: string,
    payload: PlayCardPayload,
  ): {
    state: GameState;
    trickComplete: boolean;
    roundComplete: boolean;
    gameOver: boolean;
    lastCompletedTrick?: Trick;
  } {
    const state = this.getState();
    this.assertPhase(state, GamePhase.Playing);
    this.assertTurn(state, playerId);

    const player = state.players.find((p) => p.id === playerId)!;
    const card = payload.card;

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

    if (state.currentTrick.cards.length === 0) {
      state.currentTrick.leadSuit = card.suit;
    }

    state.currentTrick.cards.push({ playerId, card });

    player.hand = player.hand.filter(
      (c) => !(c.suit === card.suit && c.rank === card.rank),
    );

    let trickComplete = false;
    let roundComplete = false;
    let gameOver = false;
    let lastCompletedTrick: Trick | undefined;

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
      lastCompletedTrick =
        state.completedTricks[state.completedTricks.length - 1];
      state.trickCount++;

      if (state.trickCount === 8) {
        roundComplete = true;
        const roundScore = this.scoreService.calculateRoundScore(state);
        state.roundScores.push(roundScore);
        state.gameScore.teamA += roundScore.teamA;
        state.gameScore.teamB += roundScore.teamB;

        if (
          state.gameScore.teamA >= state.targetScore ||
          state.gameScore.teamB >= state.targetScore
        ) {
          gameOver = true;
          state.phase = GamePhase.GameOver;
        } else {
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
      } else {
        const winnerPlayer = state.players.find(
          (p) => p.id === winner.playerId,
        )!;
        state.currentTurn = winnerPlayer.seat;
        state.currentTrick = { cards: [], leadSuit: null as any };
      }
    } else {
      state.currentTurn = this.nextSeat(state.currentTurn);
    }

    state.turnStartedAt = Date.now();
    state.updatedAt = Date.now();
    return { state, trickComplete, roundComplete, gameOver, lastCompletedTrick };
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
