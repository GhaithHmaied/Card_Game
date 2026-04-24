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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
const common_1 = require("@nestjs/common");
const types_1 = require("../../common/types");
const trick_service_1 = require("./trick.service");
let ValidationService = class ValidationService {
    constructor(trickService) {
        this.trickService = trickService;
    }
    getLegalPlays(hand, trick, trumpSuit, playerId, state) {
        if (trick.cards.length === 0) {
            return hand;
        }
        const leadSuit = trick.leadSuit;
        const cardsOfLeadSuit = hand.filter((c) => c.suit === leadSuit);
        const trumpCards = hand.filter((c) => c.suit === trumpSuit);
        if (leadSuit === trumpSuit) {
            return this.handleTrumpLead(hand, trick, trumpSuit, cardsOfLeadSuit);
        }
        if (cardsOfLeadSuit.length > 0) {
            return cardsOfLeadSuit;
        }
        return this.handleCantFollow(hand, trick, trumpSuit, trumpCards, playerId, state);
    }
    isLegalPlay(card, hand, trick, trumpSuit, playerId, state) {
        const inHand = hand.some((c) => c.suit === card.suit && c.rank === card.rank);
        if (!inHand)
            return false;
        const legalPlays = this.getLegalPlays(hand, trick, trumpSuit, playerId, state);
        return legalPlays.some((c) => c.suit === card.suit && c.rank === card.rank);
    }
    handleTrumpLead(hand, trick, trumpSuit, trumpCardsInHand) {
        if (trumpCardsInHand.length === 0)
            return hand;
        const highestTrump = this.trickService.getHighestTrumpInTrick(trick, trumpSuit);
        if (highestTrump) {
            const higherTrumps = this.getHigherTrumps(trumpCardsInHand, highestTrump, trumpSuit);
            if (higherTrumps.length > 0)
                return higherTrumps;
        }
        return trumpCardsInHand;
    }
    handleCantFollow(hand, trick, trumpSuit, trumpCards, playerId, state) {
        const partnerWinning = this.isPartnerWinning(trick, trumpSuit, playerId, state);
        if (partnerWinning) {
            return hand;
        }
        if (trumpCards.length === 0)
            return hand;
        const highestTrump = this.trickService.getHighestTrumpInTrick(trick, trumpSuit);
        if (highestTrump) {
            const higherTrumps = this.getHigherTrumps(trumpCards, highestTrump, trumpSuit);
            if (higherTrumps.length > 0)
                return higherTrumps;
        }
        return trumpCards;
    }
    isPartnerWinning(trick, trumpSuit, playerId, state) {
        if (trick.cards.length === 0)
            return false;
        const currentWinner = this.trickService.getCurrentTrickWinner(trick, trumpSuit);
        if (!currentWinner)
            return false;
        const myTeam = state.players.find((p) => p.id === playerId)?.team;
        const winnerTeam = state.players.find((p) => p.id === currentWinner.playerId)?.team;
        return myTeam === winnerTeam;
    }
    getHigherTrumps(trumpCards, highestTrump, trumpSuit) {
        const TRUMP_ORDER = {
            [types_1.Rank.Jack]: 8,
            [types_1.Rank.Nine]: 7,
            [types_1.Rank.Ace]: 6,
            [types_1.Rank.Ten]: 5,
            [types_1.Rank.King]: 4,
            [types_1.Rank.Queen]: 3,
            [types_1.Rank.Eight]: 2,
            [types_1.Rank.Seven]: 1,
        };
        const threshold = TRUMP_ORDER[highestTrump.rank];
        return trumpCards.filter((c) => TRUMP_ORDER[c.rank] > threshold);
    }
};
exports.ValidationService = ValidationService;
exports.ValidationService = ValidationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [trick_service_1.TrickService])
], ValidationService);
//# sourceMappingURL=validation.service.js.map