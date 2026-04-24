import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Card, Suit, Rank } from '../../common/types';

/**
 * Deck management: creation, cryptographic shuffle, and dealing.
 * Standard 32-card Belote/Coinché deck (7-A in each suit).
 */
@Injectable()
export class DeckService {
  /**
   * Create a fresh 32-card deck.
   */
  createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of Object.values(Suit)) {
      for (const rank of Object.values(Rank)) {
        deck.push({ suit, rank });
      }
    }
    return deck;
  }

  /**
   * Fisher-Yates shuffle using crypto-random bytes (anti-cheat).
   */
  shuffle(deck: Card[]): Card[] {
    const cards = [...deck];
    const bytes = randomBytes(cards.length * 4);

    for (let i = cards.length - 1; i > 0; i--) {
      // Use 4 bytes for each random number to minimize bias
      const randomValue = bytes.readUInt32BE((cards.length - 1 - i) * 4);
      const j = randomValue % (i + 1);
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    return cards;
  }

  /**
   * Deal 8 cards to each of 4 players.
   * In Coinché, all 32 cards are dealt at once (unlike classic Belote's 3-2-3).
   */
  deal(deck: Card[]): Card[][] {
    const hands: Card[][] = [[], [], [], []];
    for (let i = 0; i < 32; i++) {
      hands[i % 4].push(deck[i]);
    }
    return hands;
  }

  /**
   * Sort a hand for display: by suit, then by rank order.
   */
  sortHand(hand: Card[]): Card[] {
    const suitOrder: Record<Suit, number> = {
      [Suit.Spades]: 0,
      [Suit.Hearts]: 1,
      [Suit.Diamonds]: 2,
      [Suit.Clubs]: 3,
    };
    const rankOrder: Record<Rank, number> = {
      [Rank.Ace]: 8,
      [Rank.King]: 7,
      [Rank.Queen]: 6,
      [Rank.Jack]: 5,
      [Rank.Ten]: 4,
      [Rank.Nine]: 3,
      [Rank.Eight]: 2,
      [Rank.Seven]: 1,
    };

    return [...hand].sort((a, b) => {
      const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
      if (suitDiff !== 0) return suitDiff;
      return rankOrder[b.rank] - rankOrder[a.rank];
    });
  }
}
