import {
  Card,
  Suit,
  Rank,
  GameState,
  Trick,
} from '../types';
import { TrickService } from './trick';

export class ValidationService {
  constructor(private readonly trickService: TrickService) {}

  getLegalPlays(
    hand: Card[],
    trick: Trick,
    trumpSuit: Suit,
    playerId: string,
    state: GameState,
  ): Card[] {
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

    return this.handleCantFollow(
      hand,
      trick,
      trumpSuit,
      trumpCards,
      playerId,
      state,
    );
  }

  isLegalPlay(
    card: Card,
    hand: Card[],
    trick: Trick,
    trumpSuit: Suit,
    playerId: string,
    state: GameState,
  ): boolean {
    const inHand = hand.some(
      (c) => c.suit === card.suit && c.rank === card.rank,
    );
    if (!inHand) return false;

    const legalPlays = this.getLegalPlays(hand, trick, trumpSuit, playerId, state);
    return legalPlays.some(
      (c) => c.suit === card.suit && c.rank === card.rank,
    );
  }

  private handleTrumpLead(
    hand: Card[],
    trick: Trick,
    trumpSuit: Suit,
    trumpCardsInHand: Card[],
  ): Card[] {
    if (trumpCardsInHand.length === 0) return hand;

    const highestTrump = this.trickService.getHighestTrumpInTrick(trick, trumpSuit);
    if (highestTrump) {
      const higherTrumps = this.getHigherTrumps(trumpCardsInHand, highestTrump, trumpSuit);
      if (higherTrumps.length > 0) return higherTrumps;
    }

    return trumpCardsInHand;
  }

  private handleCantFollow(
    hand: Card[],
    trick: Trick,
    trumpSuit: Suit,
    trumpCards: Card[],
    playerId: string,
    state: GameState,
  ): Card[] {
    const partnerWinning = this.isPartnerWinning(trick, trumpSuit, playerId, state);

    if (partnerWinning) {
      return hand;
    }

    if (trumpCards.length === 0) return hand;

    const highestTrump = this.trickService.getHighestTrumpInTrick(trick, trumpSuit);
    if (highestTrump) {
      const higherTrumps = this.getHigherTrumps(trumpCards, highestTrump, trumpSuit);
      if (higherTrumps.length > 0) return higherTrumps;
    }

    return trumpCards;
  }

  private isPartnerWinning(
    trick: Trick,
    trumpSuit: Suit,
    playerId: string,
    state: GameState,
  ): boolean {
    if (trick.cards.length === 0) return false;

    const currentWinner = this.trickService.getCurrentTrickWinner(trick, trumpSuit);
    if (!currentWinner) return false;

    const myTeam = state.players.find((p) => p.id === playerId)?.team;
    const winnerTeam = state.players.find(
      (p) => p.id === currentWinner.playerId,
    )?.team;

    return myTeam === winnerTeam;
  }

  private getHigherTrumps(
    trumpCards: Card[],
    highestTrump: Card,
    trumpSuit: Suit,
  ): Card[] {
    const TRUMP_ORDER: Record<Rank, number> = {
      [Rank.Jack]: 8,
      [Rank.Nine]: 7,
      [Rank.Ace]: 6,
      [Rank.Ten]: 5,
      [Rank.King]: 4,
      [Rank.Queen]: 3,
      [Rank.Eight]: 2,
      [Rank.Seven]: 1,
    };

    const threshold = TRUMP_ORDER[highestTrump.rank];
    return trumpCards.filter((c) => TRUMP_ORDER[c.rank] > threshold);
  }
}
