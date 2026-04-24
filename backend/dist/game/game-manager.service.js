"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GameManagerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManagerService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const redis_service_1 = require("../redis/redis.service");
const queue_service_1 = require("../queue/queue.service");
const rooms_service_1 = require("../rooms/rooms.service");
const deck_service_1 = require("./engine/deck.service");
const bidding_service_1 = require("./engine/bidding.service");
const trick_service_1 = require("./engine/trick.service");
const score_service_1 = require("./engine/score.service");
const validation_service_1 = require("./engine/validation.service");
const types_1 = require("../common/types");
let GameManagerService = GameManagerService_1 = class GameManagerService {
    constructor(redisService, queueService, roomsService, deckService, biddingService, trickService, scoreService, validationService) {
        this.redisService = redisService;
        this.queueService = queueService;
        this.roomsService = roomsService;
        this.deckService = deckService;
        this.biddingService = biddingService;
        this.trickService = trickService;
        this.scoreService = scoreService;
        this.validationService = validationService;
        this.logger = new common_1.Logger(GameManagerService_1.name);
    }
    async startGame(roomId) {
        const room = await this.roomsService.getRoom(roomId);
        if (!room || room.players.length !== 4) {
            throw new Error('Room must have exactly 4 players');
        }
        await this.roomsService.markPlaying(roomId);
        const gameId = (0, uuid_1.v4)();
        const players = room.players.map((p) => ({
            id: p.id,
            username: p.username,
            seat: p.seat,
            team: (p.seat === 0 || p.seat === 2 ? 'teamA' : 'teamB'),
            hand: [],
            connected: true,
        }));
        const state = {
            id: gameId,
            roomId,
            phase: types_1.GamePhase.Dealing,
            players,
            dealer: 0,
            currentTurn: 1,
            bids: [],
            contract: null,
            consecutivePasses: 0,
            currentTrick: { cards: [], leadSuit: null },
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
        const dealtState = this.dealCards(state);
        dealtState.phase = types_1.GamePhase.Bidding;
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
    dealCards(state) {
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
    async processBid(gameId, payload, playerId) {
        const state = await this.getState(gameId);
        this.assertPhase(state, types_1.GamePhase.Bidding);
        this.assertTurn(state, playerId);
        const bid = {
            playerId,
            type: payload.type,
            suit: payload.suit,
            value: payload.value,
        };
        if (!this.biddingService.isValidBid(bid, state)) {
            throw new Error('Invalid bid');
        }
        state.bids.push(bid);
        const { over, allPassed } = this.biddingService.isBiddingOver(state.bids);
        let contract = null;
        if (over && allPassed) {
            state.dealer = this.nextSeat(state.dealer);
            state.currentTurn = this.nextSeat(state.dealer);
            state.bids = [];
            const redealt = this.dealCards(state);
            redealt.phase = types_1.GamePhase.Bidding;
            redealt.turnStartedAt = Date.now();
            await this.saveState(redealt);
            return { state: redealt, biddingOver: true, allPassed: true, contract: null };
        }
        if (over) {
            contract = this.biddingService.buildContract(state.bids, state);
            state.contract = contract;
            state.phase = types_1.GamePhase.Playing;
            state.currentTurn = this.nextSeat(state.dealer);
            state.currentTrick = { cards: [], leadSuit: null };
            state.completedTricks = [];
            state.trickCount = 0;
        }
        else {
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
    async playCard(gameId, payload, playerId) {
        const state = await this.getState(gameId);
        this.assertPhase(state, types_1.GamePhase.Playing);
        this.assertTurn(state, playerId);
        const player = state.players.find((p) => p.id === playerId);
        const card = payload.card;
        if (!this.validationService.isLegalPlay(card, player.hand, state.currentTrick, state.contract.suit, playerId, state)) {
            throw new Error('Illegal card play');
        }
        if (state.currentTrick.cards.length === 0) {
            state.currentTrick.leadSuit = card.suit;
        }
        state.currentTrick.cards.push({ playerId, card });
        player.hand = player.hand.filter((c) => !(c.suit === card.suit && c.rank === card.rank));
        let trickComplete = false;
        let roundComplete = false;
        let gameOver = false;
        if (state.currentTrick.cards.length === 4) {
            trickComplete = true;
            const winner = this.trickService.resolveTrick(state.currentTrick, state.contract.suit);
            state.currentTrick.winnerId = winner.playerId;
            state.currentTrick.winnerTeam = this.trickService.getWinnerTeam(winner.playerId, state);
            state.completedTricks.push({ ...state.currentTrick });
            state.trickCount++;
            if (state.trickCount === 8) {
                roundComplete = true;
                const roundScore = this.scoreService.calculateRoundScore(state);
                state.roundScores.push(roundScore);
                state.gameScore.teamA += roundScore.teamA;
                state.gameScore.teamB += roundScore.teamB;
                if (state.gameScore.teamA >= state.targetScore ||
                    state.gameScore.teamB >= state.targetScore) {
                    gameOver = true;
                    state.phase = types_1.GamePhase.GameOver;
                }
                else {
                    state.dealer = this.nextSeat(state.dealer);
                    state.currentTurn = this.nextSeat(state.dealer);
                    state.bids = [];
                    state.contract = null;
                    state.currentTrick = { cards: [], leadSuit: null };
                    state.completedTricks = [];
                    state.trickCount = 0;
                    state.phase = types_1.GamePhase.Dealing;
                    const redealt = this.dealCards(state);
                    redealt.phase = types_1.GamePhase.Bidding;
                }
                this.queueService.publishGameEvent('round_complete', {
                    gameId,
                    roundScore,
                    gameScore: state.gameScore,
                    gameOver,
                });
            }
            else {
                const winnerPlayer = state.players.find((p) => p.id === winner.playerId);
                state.currentTurn = winnerPlayer.seat;
                state.currentTrick = { cards: [], leadSuit: null };
            }
        }
        else {
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
    async handleReconnect(playerId, gameId) {
        const state = await this.redisService.getGameState(gameId);
        if (!state)
            return null;
        const player = state.players.find((p) => p.id === playerId);
        if (!player)
            return null;
        player.connected = true;
        player.disconnectedAt = undefined;
        await this.redisService.clearDisconnectTimer(playerId);
        await this.saveState(state);
        return state;
    }
    async handleDisconnect(playerId, gameId, gracePeriodMs) {
        const state = await this.redisService.getGameState(gameId);
        if (!state)
            return;
        const player = state.players.find((p) => p.id === playerId);
        if (!player)
            return;
        player.connected = false;
        player.disconnectedAt = Date.now();
        await this.redisService.setDisconnectTimer(playerId, gracePeriodMs);
        await this.saveState(state);
    }
    async getState(gameId) {
        const state = await this.redisService.getGameState(gameId);
        if (!state)
            throw new Error('Game not found');
        return state;
    }
    getPlayerView(state, playerId) {
        return {
            ...state,
            players: state.players.map((p) => ({
                ...p,
                hand: p.id === playerId ? p.hand : p.hand.map(() => null),
                cardCount: p.hand.length,
            })),
        };
    }
    async saveState(state) {
        state.updatedAt = Date.now();
        await this.redisService.setGameState(state.id, state);
    }
    assertPhase(state, expected) {
        if (state.phase !== expected) {
            throw new Error(`Expected phase ${expected}, got ${state.phase}`);
        }
    }
    assertTurn(state, playerId) {
        const current = state.players.find((p) => p.seat === state.currentTurn);
        if (!current || current.id !== playerId) {
            throw new Error('Not your turn');
        }
    }
    nextSeat(seat) {
        return ((seat + 1) % 4);
    }
};
exports.GameManagerService = GameManagerService;
exports.GameManagerService = GameManagerService = GameManagerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        queue_service_1.QueueService,
        rooms_service_1.RoomsService,
        deck_service_1.DeckService,
        bidding_service_1.BiddingService,
        trick_service_1.TrickService,
        score_service_1.ScoreService,
        validation_service_1.ValidationService])
], GameManagerService);
//# sourceMappingURL=game-manager.service.js.map