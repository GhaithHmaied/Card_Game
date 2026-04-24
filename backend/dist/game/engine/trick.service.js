"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrickService = void 0;
const common_1 = require("@nestjs/common");
const types_1 = require("../../common/types");
let TrickService = class TrickService {
    constructor() {
        this.TRUMP_POINTS = {
            [types_1.Rank.Jack]: 20,
            [types_1.Rank.Nine]: 14,
            [types_1.Rank.Ace]: 11,
            [types_1.Rank.Ten]: 10,
            [types_1.Rank.King]: 4,
            [types_1.Rank.Queen]: 3,
            [types_1.Rank.Eight]: 0,
            [types_1.Rank.Seven]: 0,
        };
        this.NON_TRUMP_POINTS = {
            [types_1.Rank.Ace]: 11,
            [types_1.Rank.Ten]: 10,
            [types_1.Rank.King]: 4,
            [types_1.Rank.Queen]: 3,
            [types_1.Rank.Jack]: 2,
            [types_1.Rank.Nine]: 0,
            [types_1.Rank.Eight]: 0,
            [types_1.Rank.Seven]: 0,
        };
        this.TRUMP_ORDER = {
            [types_1.Rank.Jack]: 8,
            [types_1.Rank.Nine]: 7,
            [types_1.Rank.Ace]: 6,
            [types_1.Rank.Ten]: 5,
            [types_1.Rank.King]: 4,
            [types_1.Rank.Queen]: 3,
            [types_1.Rank.Eight]: 2,
            [types_1.Rank.Seven]: 1,
        };
        this.NON_TRUMP_ORDER = {
            [types_1.Rank.Ace]: 8,
            [types_1.Rank.Ten]: 7,
            [types_1.Rank.King]: 6,
            [types_1.Rank.Queen]: 5,
            [types_1.Rank.Jack]: 4,
            [types_1.Rank.Nine]: 3,
            [types_1.Rank.Eight]: 2,
            [types_1.Rank.Seven]: 1,
        };
    }
    resolveTrick(trick, trumpSuit) {
        const leadSuit = trick.leadSuit;
        let winner = trick.cards[0];
        for (let i = 1; i < trick.cards.length; i++) {
            const challenger = trick.cards[i];
            if (this.beats(challenger.card, winner.card, leadSuit, trumpSuit)) {
                winner = challenger;
            }
        }
        return winner;
    }
    trickPoints(trick, trumpSuit) {
        return trick.cards.reduce((sum, tc) => sum + this.cardPoints(tc.card, trumpSuit), 0);
    }
    cardPoints(card, trumpSuit) {
        if (card.suit === trumpSuit) {
            return this.TRUMP_POINTS[card.rank];
        }
        return this.NON_TRUMP_POINTS[card.rank];
    }
    beats(a, b, leadSuit, trumpSuit) {
        const aIsTrump = a.suit === trumpSuit;
        const bIsTrump = b.suit === trumpSuit;
        if (aIsTrump && !bIsTrump)
            return true;
        if (!aIsTrump && bIsTrump)
            return false;
        if (aIsTrump && bIsTrump) {
            return this.TRUMP_ORDER[a.rank] > this.TRUMP_ORDER[b.rank];
        }
        if (a.suit === leadSuit && b.suit !== leadSuit)
            return true;
        if (a.suit !== leadSuit && b.suit === leadSuit)
            return false;
        if (a.suit === b.suit) {
            return this.NON_TRUMP_ORDER[a.rank] > this.NON_TRUMP_ORDER[b.rank];
        }
        return false;
    }
    hasBelote(hand, trumpSuit) {
        const hasKing = hand.some((c) => c.suit === trumpSuit && c.rank === types_1.Rank.King);
        const hasQueen = hand.some((c) => c.suit === trumpSuit && c.rank === types_1.Rank.Queen);
        return hasKing && hasQueen;
    }
    getWinnerTeam(winnerId, state) {
        const player = state.players.find((p) => p.id === winnerId);
        return player?.team ?? 'teamA';
    }
    getCurrentTrickWinner(trick, trumpSuit) {
        if (trick.cards.length === 0)
            return null;
        return this.resolveTrick({ ...trick, cards: trick.cards }, trumpSuit);
    }
    getHighestTrumpInTrick(trick, trumpSuit) {
        const trumpCards = trick.cards.filter((tc) => tc.card.suit === trumpSuit);
        if (trumpCards.length === 0)
            return null;
        return trumpCards.reduce((highest, tc) => {
            if (this.TRUMP_ORDER[tc.card.rank] > this.TRUMP_ORDER[highest.card.rank]) {
                return tc;
            }
            return highest;
        }).card;
    }
};
exports.TrickService = TrickService;
exports.TrickService = TrickService = __decorate([
    (0, common_1.Injectable)()
], TrickService);
//# sourceMappingURL=trick.service.js.map