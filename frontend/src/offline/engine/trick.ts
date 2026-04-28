import {
  Card,
  Suit,
  Rank,
  Trick,
  TrickCard,
  TeamId,
  GameState,
} from '../types';

export class TrickService {
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

  trickPoints(trick: Trick, trumpSuit: Suit): number {
    return trick.cards.reduce(
      (sum, tc) => sum + this.cardPoints(tc.card, trumpSuit),
      0,
    );
  }

  cardPoints(card: Card, trumpSuit: Suit): number {
    if (card.suit === trumpSuit) {
      return this.TRUMP_POINTS[card.rank];
    }
    return this.NON_TRUMP_POINTS[card.rank];
  }

  private beats(
    a: Card,
    b: Card,
    leadSuit: Suit,
    trumpSuit: Suit,
  ): boolean {
    const aIsTrump = a.suit === trumpSuit;
    const bIsTrump = b.suit === trumpSuit;

    if (aIsTrump && !bIsTrump) return true;
    if (!aIsTrump && bIsTrump) return false;

    if (aIsTrump && bIsTrump) {
      return this.TRUMP_ORDER[a.rank] > this.TRUMP_ORDER[b.rank];
    }

    if (a.suit === leadSuit && b.suit !== leadSuit) return true;
    if (a.suit !== leadSuit && b.suit === leadSuit) return false;

    if (a.suit === b.suit) {
      return this.NON_TRUMP_ORDER[a.rank] > this.NON_TRUMP_ORDER[b.rank];
    }

    return false;
  }

  hasBelote(hand: Card[], trumpSuit: Suit): boolean {
    const hasKing = hand.some(
      (c) => c.suit === trumpSuit && c.rank === Rank.King,
    );
    const hasQueen = hand.some(
      (c) => c.suit === trumpSuit && c.rank === Rank.Queen,
    );
    return hasKing && hasQueen;
  }

  getWinnerTeam(winnerId: string, state: GameState): TeamId {
    const player = state.players.find((p) => p.id === winnerId);
    return player?.team ?? 'teamA';
  }

  getCurrentTrickWinner(trick: Trick, trumpSuit: Suit): TrickCard | null {
    if (trick.cards.length === 0) return null;
    return this.resolveTrick(
      { ...trick, cards: trick.cards },
      trumpSuit,
    );
  }

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
