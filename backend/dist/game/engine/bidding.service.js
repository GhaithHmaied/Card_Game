"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiddingService = void 0;
const common_1 = require("@nestjs/common");
const types_1 = require("../../common/types");
let BiddingService = class BiddingService {
    getHighestBid(bids) {
        const realBids = bids.filter((b) => b.type === types_1.BidType.Bid);
        return realBids.length > 0 ? realBids[realBids.length - 1] : null;
    }
    isValidBid(bid, state) {
        const currentPlayer = state.players.find((p) => p.seat === state.currentTurn);
        if (!currentPlayer || bid.playerId !== currentPlayer.id)
            return false;
        switch (bid.type) {
            case types_1.BidType.Pass:
                return true;
            case types_1.BidType.Bid: {
                if (!bid.suit || !bid.value)
                    return false;
                if (!types_1.VALID_BID_VALUES.includes(bid.value))
                    return false;
                const highest = this.getHighestBid(state.bids);
                if (highest && bid.value <= highest.value)
                    return false;
                const lastNonPass = this.getLastNonPassBid(state.bids);
                if (lastNonPass &&
                    (lastNonPass.type === types_1.BidType.Coinche ||
                        lastNonPass.type === types_1.BidType.Surcoinche)) {
                    return false;
                }
                return true;
            }
            case types_1.BidType.Coinche: {
                const highest = this.getHighestBid(state.bids);
                if (!highest)
                    return false;
                const bidderTeam = this.getPlayerTeam(highest.playerId, state);
                const myTeam = this.getPlayerTeam(bid.playerId, state);
                if (bidderTeam === myTeam)
                    return false;
                const lastNonPass = this.getLastNonPassBid(state.bids);
                if (lastNonPass?.type === types_1.BidType.Coinche)
                    return false;
                if (lastNonPass?.type === types_1.BidType.Surcoinche)
                    return false;
                return true;
            }
            case types_1.BidType.Surcoinche: {
                const lastNonPass = this.getLastNonPassBid(state.bids);
                if (lastNonPass?.type !== types_1.BidType.Coinche)
                    return false;
                const highest = this.getHighestBid(state.bids);
                if (!highest)
                    return false;
                const bidderTeam = this.getPlayerTeam(highest.playerId, state);
                const myTeam = this.getPlayerTeam(bid.playerId, state);
                return bidderTeam === myTeam;
            }
            default:
                return false;
        }
    }
    isBiddingOver(bids) {
        if (bids.length < 4)
            return { over: false, allPassed: false };
        if (bids.every((b) => b.type === types_1.BidType.Pass)) {
            return { over: true, allPassed: true };
        }
        const lastBids = bids.slice(-3);
        const lastNonPass = this.getLastNonPassBid(bids);
        if (lastNonPass &&
            (lastNonPass.type === types_1.BidType.Coinche ||
                lastNonPass.type === types_1.BidType.Surcoinche)) {
            const bidsAfter = bids.slice(bids.indexOf(lastNonPass) + 1);
            if (bidsAfter.length >= 1 && bidsAfter.every((b) => b.type === types_1.BidType.Pass)) {
                return { over: true, allPassed: false };
            }
        }
        const hasRealBid = bids.some((b) => b.type === types_1.BidType.Bid);
        if (hasRealBid &&
            lastBids.length === 3 &&
            lastBids.every((b) => b.type === types_1.BidType.Pass)) {
            return { over: true, allPassed: false };
        }
        return { over: false, allPassed: false };
    }
    buildContract(bids, state) {
        const highest = this.getHighestBid(bids);
        if (!highest || !highest.suit || !highest.value)
            return null;
        const coinched = bids.some((b) => b.type === types_1.BidType.Coinche);
        const surcoinched = bids.some((b) => b.type === types_1.BidType.Surcoinche);
        return {
            team: this.getPlayerTeam(highest.playerId, state),
            playerId: highest.playerId,
            suit: highest.suit,
            value: highest.value,
            coinched,
            surcoinched,
        };
    }
    getLastNonPassBid(bids) {
        for (let i = bids.length - 1; i >= 0; i--) {
            if (bids[i].type !== types_1.BidType.Pass)
                return bids[i];
        }
        return null;
    }
    getPlayerTeam(playerId, state) {
        const player = state.players.find((p) => p.id === playerId);
        return player?.team ?? 'teamA';
    }
};
exports.BiddingService = BiddingService;
exports.BiddingService = BiddingService = __decorate([
    (0, common_1.Injectable)()
], BiddingService);
//# sourceMappingURL=bidding.service.js.map