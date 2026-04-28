import { Card, Suit, Rank } from '../types';

export class DeckService {
  createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of Object.values(Suit)) {
      for (const rank of Object.values(Rank)) {
        deck.push({ suit, rank });
      }
    }
    return deck;
  }

  shuffle(deck: Card[]): Card[] {
    const cards = [...deck];
    const bytes = new Uint32Array(cards.length);
    crypto.getRandomValues(bytes);

    for (let i = cards.length - 1; i > 0; i--) {
      const j = bytes[i] % (i + 1);
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    return cards;
  }

  deal(deck: Card[]): Card[][] {
    const hands: Card[][] = [[], [], [], []];
    for (let i = 0; i < 32; i++) {
      hands[i % 4].push(deck[i]);
    }
    return hands;
  }

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
