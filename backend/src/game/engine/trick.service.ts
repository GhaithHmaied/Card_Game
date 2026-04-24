import { Injectable } from '@nestjs/common';
import {
  Card,
  Suit,
  Rank,
  Trick,
  TrickCard,
  TeamId,
  GameState,
} from '../../common/types';

/**
 * Trick resolution for Coinché / Belote.
 *
 * Card ranking:
 *   Trump suit:  J(20) > 9(14) > A(11) > 10(10) > K(4) > Q(3) > 8(0) > 7(0)
 *   Non-trump:   A(11) > 10(10) > K(4) > Q(3) > J(2) > 9(0) > 8(0) > 7(0)
 *
 * Trick rules:
 * - Must follow lead suit if possible
 * - Must trump if can't follow suit AND partner is NOT winning
 * - Must overtrump if possible (play higher trump than current highest trump)
 * - If can't follow suit and can't trump (or partner is winning), play any card
 */
@Injectable()
export class TrickService {
  // Card point values
  private readonly TRUMP_POINTS: Record<Rank, number> = {
    [Rank.Jack]: 20,
    [Rank.Nine]: 14,
    [Rank.Ace]: 11,
    [Rank.Ten]: 10,
    [Rank.King]: 4,
    [Rank.Queen]: 3,
    [Rank.Eight]: 0,
    [Rank.Seven]: 0,
  };

  private readonly NON_TRUMP_POINTS: Record<Rank, number> = {
    [Rank.Ace]: 11,
    [Rank.Ten]: 10,
    [Rank.King]: 4,
    [Rank.Queen]: 3,
    [Rank.Jack]: 2,
    [Rank.Nine]: 0,
    [Rank.Eight]: 0,
    [Rank.Seven]: 0,
  };

  // Card ranking (higher = stronger)
  private readonly TRUMP_ORDER: Record<Rank, number> = {
    [Rank.Jack]: 8,
    [Rank.Nine]: 7,
    [Rank.Ace]: 6,
    [Rank.Ten]: 5,
    [Rank.King]: 4,
    [Rank.Queen]: 3,
    [Rank.Eight]: 2,
    [Rank.Seven]: 1,
  };

  private readonly NON_TRUMP_ORDER: Record<Rank, number> = {
    [Rank.Ace]: 8,
    [Rank.Ten]: 7,
    [Rank.King]: 6,
    [Rank.Queen]: 5,
    [Rank.Jack]: 4,
    [Rank.Nine]: 3,
    [Rank.Eight]: 2,
    [Rank.Seven]: 1,
  };

  /**
   * Determine the winner of a completed trick.
   */
  resolveTrick(trick: Trick, trumpSuit: Suit): TrickCard {
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

  /**
   * Calculate the total points in a trick.
   */
  trickPoints(trick: Trick, trumpSuit: Suit): number {
    return trick.cards.reduce(
      (sum, tc) => sum + this.cardPoints(tc.card, trumpSuit),
      0,
    );
  }

  /**
   * Get the point value of a single card.
   */
  cardPoints(card: Card, trumpSuit: Suit): number {
    if (card.suit === trumpSuit) {
      return this.TRUMP_POINTS[card.rank];
    }
    return this.NON_TRUMP_POINTS[card.rank];
  }

  /**
   * Check if card A beats card B.
   */
  private beats(
    a: Card,
    b: Card,
    leadSuit: Suit,
    trumpSuit: Suit,
  ): boolean {
    const aIsTrump = a.suit === trumpSuit;
    const bIsTrump = b.suit === trumpSuit;

    // Trump beats non-trump
    if (aIsTrump && !bIsTrump) return true;
    if (!aIsTrump && bIsTrump) return false;

    // Both trump
    if (aIsTrump && bIsTrump) {
      return this.TRUMP_ORDER[a.rank] > this.TRUMP_ORDER[b.rank];
    }

    // Neither is trump
    // Must follow lead suit — only cards of lead suit can win
    if (a.suit === leadSuit && b.suit !== leadSuit) return true;
    if (a.suit !== leadSuit && b.suit === leadSuit) return false;

    // Same suit (lead suit) — compare by non-trump order
    if (a.suit === b.suit) {
      return this.NON_TRUMP_ORDER[a.rank] > this.NON_TRUMP_ORDER[b.rank];
    }

    // Different non-lead suits — first card wins (current winner stays)
    return false;
  }

  /**
   * Check if the King and Queen of trump suit (Belote) are in a player's hand.
   */
  hasBelote(hand: Card[], trumpSuit: Suit): boolean {
    const hasKing = hand.some(
      (c) => c.suit === trumpSuit && c.rank === Rank.King,
    );
    const hasQueen = hand.some(
      (c) => c.suit === trumpSuit && c.rank === Rank.Queen,
    );
    return hasKing && hasQueen;
  }

  /**
   * Get the team of a player by ID.
   */
  getWinnerTeam(winnerId: string, state: GameState): TeamId {
    const player = state.players.find((p) => p.id === winnerId);
    return player?.team ?? 'teamA';
  }

  /**
   * Get the current trick winner (while trick is in progress).
   */
  getCurrentTrickWinner(trick: Trick, trumpSuit: Suit): TrickCard | null {
    if (trick.cards.length === 0) return null;
    return this.resolveTrick(
      { ...trick, cards: trick.cards },
      trumpSuit,
    );
  }

  /**
   * Get the highest trump card in the current trick.
   */
  getHighestTrumpInTrick(trick: Trick, trumpSuit: Suit): Card | null {
    const trumpCards = trick.cards.filter((tc) => tc.card.suit === trumpSuit);
    if (trumpCards.length === 0) return null;

    return trumpCards.reduce((highest, tc) => {
      if (this.TRUMP_ORDER[tc.card.rank] > this.TRUMP_ORDER[highest.card.rank]) {
        return tc;
      }
      return highest;
    }).card;
  }
}
