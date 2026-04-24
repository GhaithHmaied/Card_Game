"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeckService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const types_1 = require("../../common/types");
let DeckService = class DeckService {
    createDeck() {
        const deck = [];
        for (const suit of Object.values(types_1.Suit)) {
            for (const rank of Object.values(types_1.Rank)) {
                deck.push({ suit, rank });
            }
        }
        return deck;
    }
    shuffle(deck) {
        const cards = [...deck];
        const bytes = (0, crypto_1.randomBytes)(cards.length * 4);
        for (let i = cards.length - 1; i > 0; i--) {
            const randomValue = bytes.readUInt32BE((cards.length - 1 - i) * 4);
            const j = randomValue % (i + 1);
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        return cards;
    }
    deal(deck) {
        const hands = [[], [], [], []];
        for (let i = 0; i < 32; i++) {
            hands[i % 4].push(deck[i]);
        }
        return hands;
    }
    sortHand(hand) {
        const suitOrder = {
            [types_1.Suit.Spades]: 0,
            [types_1.Suit.Hearts]: 1,
            [types_1.Suit.Diamonds]: 2,
            [types_1.Suit.Clubs]: 3,
        };
        const rankOrder = {
            [types_1.Rank.Ace]: 8,
            [types_1.Rank.King]: 7,
            [types_1.Rank.Queen]: 6,
            [types_1.Rank.Jack]: 5,
            [types_1.Rank.Ten]: 4,
            [types_1.Rank.Nine]: 3,
            [types_1.Rank.Eight]: 2,
            [types_1.Rank.Seven]: 1,
        };
        return [...hand].sort((a, b) => {
            const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
            if (suitDiff !== 0)
                return suitDiff;
            return rankOrder[b.rank] - rankOrder[a.rank];
        });
    }
};
exports.DeckService = DeckService;
exports.DeckService = DeckService = __decorate([
    (0, common_1.Injectable)()
], DeckService);
//# sourceMappingURL=deck.service.js.map