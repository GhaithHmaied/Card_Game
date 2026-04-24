import { Injectable } from '@nestjs/common';
import {
  Bid,
  BidType,
  Contract,
  GameState,
  SeatIndex,
  TeamId,
  VALID_BID_VALUES,
} from '../../common/types';

/**
 * Bidding phase logic for Coinché.
 *
 * Rules:
 * - Players bid in turn (starting from dealer + 1)
 * - Each bid must be higher than the previous
 * - A player can pass, bid, coinche, or surcoinche
 * - Coinche: opposing team doubles the contract value
 * - Surcoinche: contracting team re-doubles (4x)
 * - Bidding ends when 3 consecutive passes follow a bid
 *   OR when all 4 players pass (re-deal)
 *   OR after a coinche/surcoinche + a pass
 */
@Injectable()
export class BiddingService {
  /**
   * Get the current highest bid (excluding passes).
   */
  getHighestBid(bids: Bid[]): Bid | null {
    const realBids = bids.filter((b) => b.type === BidType.Bid);
    return realBids.length > 0 ? realBids[realBids.length - 1] : null;
  }

  /**
   * Check if a bid is valid given the current bidding state.
   */
  isValidBid(bid: Bid, state: GameState): boolean {
    const currentPlayer = state.players.find((p) => p.seat === state.currentTurn);
    if (!currentPlayer || bid.playerId !== currentPlayer.id) return false;

    switch (bid.type) {
      case BidType.Pass:
        return true;

      case BidType.Bid: {
        if (!bid.suit || !bid.value) return false;
        if (!VALID_BID_VALUES.includes(bid.value as any)) return false;

        const highest = this.getHighestBid(state.bids);
        if (highest && bid.value <= highest.value!) return false;

        // Can't bid after coinche/surcoinche
        const lastNonPass = this.getLastNonPassBid(state.bids);
        if (
          lastNonPass &&
          (lastNonPass.type === BidType.Coinche ||
            lastNonPass.type === BidType.Surcoinche)
        ) {
          return false;
        }

        return true;
      }

      case BidType.Coinche: {
        const highest = this.getHighestBid(state.bids);
        if (!highest) return false;

        // Only opposing team can coinche
        const bidderTeam = this.getPlayerTeam(highest.playerId, state);
        const myTeam = this.getPlayerTeam(bid.playerId, state);
        if (bidderTeam === myTeam) return false;

        // Can't coinche if already coinched
        const lastNonPass = this.getLastNonPassBid(state.bids);
        if (lastNonPass?.type === BidType.Coinche) return false;
        if (lastNonPass?.type === BidType.Surcoinche) return false;

        return true;
      }

      case BidType.Surcoinche: {
        const lastNonPass = this.getLastNonPassBid(state.bids);
        if (lastNonPass?.type !== BidType.Coinche) return false;

        // Only the contracting team can surcoinche
        const highest = this.getHighestBid(state.bids);
        if (!highest) return false;
        const bidderTeam = this.getPlayerTeam(highest.playerId, state);
        const myTeam = this.getPlayerTeam(bid.playerId, state);
        return bidderTeam === myTeam;
      }

      default:
        return false;
    }
  }

  /**
   * Determine if bidding phase is over.
   * Bidding ends when:
   * 1. All 4 players pass (no bids made) → re-deal
   * 2. 3 consecutive passes after a bid → contract set
   * 3. 1 pass after coinche/surcoinche → contract set
   */
  isBiddingOver(bids: Bid[]): { over: boolean; allPassed: boolean } {
    if (bids.length < 4) return { over: false, allPassed: false };

    // All 4 passed?
    if (bids.every((b) => b.type === BidType.Pass)) {
      return { over: true, allPassed: true };
    }

    const lastBids = bids.slice(-3);

    // After coinche/surcoinche, just 1 pass ends bidding
    const lastNonPass = this.getLastNonPassBid(bids);
    if (
      lastNonPass &&
      (lastNonPass.type === BidType.Coinche ||
        lastNonPass.type === BidType.Surcoinche)
    ) {
      const bidsAfter = bids.slice(bids.indexOf(lastNonPass) + 1);
      if (bidsAfter.length >= 1 && bidsAfter.every((b) => b.type === BidType.Pass)) {
        return { over: true, allPassed: false };
      }
    }

    // 3 consecutive passes after at least one real bid
    const hasRealBid = bids.some((b) => b.type === BidType.Bid);
    if (
      hasRealBid &&
      lastBids.length === 3 &&
      lastBids.every((b) => b.type === BidType.Pass)
    ) {
      return { over: true, allPassed: false };
    }

    return { over: false, allPassed: false };
  }

  /**
   * Build the contract from the bidding history.
   */
  buildContract(bids: Bid[], state: GameState): Contract | null {
    const highest = this.getHighestBid(bids);
    if (!highest || !highest.suit || !highest.value) return null;

    const coinched = bids.some((b) => b.type === BidType.Coinche);
    const surcoinched = bids.some((b) => b.type === BidType.Surcoinche);

    return {
      team: this.getPlayerTeam(highest.playerId, state),
      playerId: highest.playerId,
      suit: highest.suit,
      value: highest.value,
      coinched,
      surcoinched,
    };
  }

  private getLastNonPassBid(bids: Bid[]): Bid | null {
    for (let i = bids.length - 1; i >= 0; i--) {
      if (bids[i].type !== BidType.Pass) return bids[i];
    }
    return null;
  }

  private getPlayerTeam(playerId: string, state: GameState): TeamId {
    const player = state.players.find((p) => p.id === playerId);
    return player?.team ?? 'teamA';
  }
}
