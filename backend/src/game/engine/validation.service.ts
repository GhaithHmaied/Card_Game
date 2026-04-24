import { Injectable } from '@nestjs/common';
import {
  Card,
  Suit,
  Rank,
  GameState,
  Trick,
} from '../../common/types';
import { TrickService } from './trick.service';

/**
 * Validates whether a card play is legal according to Coinché rules.
 *
 * Rules:
 * 1. Must follow suit (play a card of the lead suit) if possible
 * 2. If can't follow suit:
 *    a. If partner is currently winning the trick: can play anything
 *    b. If partner is NOT winning: must trump (play a trump card) if possible
 *    c. When trumping: must overtrump (play a higher trump) if possible
 * 3. If can't follow suit and can't trump: can play anything
 * 4. If lead suit IS trump: must overtrump if possible
 */
@Injectable()
export class ValidationService {
  constructor(private readonly trickService: TrickService) {}

  /**
   * Get all legal cards a player can play from their hand.
   */
  getLegalPlays(
    hand: Card[],
    trick: Trick,
    trumpSuit: Suit,
    playerId: string,
    state: GameState,
  ): Card[] {
    // Leading the trick — can play anything
    if (trick.cards.length === 0) {
      return hand;
    }

    const leadSuit = trick.leadSuit;
    const cardsOfLeadSuit = hand.filter((c) => c.suit === leadSuit);
    const trumpCards = hand.filter((c) => c.suit === trumpSuit);

    // Case: Lead suit is trump
    if (leadSuit === trumpSuit) {
      return this.handleTrumpLead(hand, trick, trumpSuit, cardsOfLeadSuit);
    }

    // Case: Has cards of lead suit → must follow
    if (cardsOfLeadSuit.length > 0) {
      return cardsOfLeadSuit;
    }

    // Case: Can't follow suit
    return this.handleCantFollow(
      hand,
      trick,
      trumpSuit,
      trumpCards,
      playerId,
      state,
    );
  }

  /**
   * Check if a specific card is a legal play.
   */
  isLegalPlay(
    card: Card,
    hand: Card[],
    trick: Trick,
    trumpSuit: Suit,
    playerId: string,
    state: GameState,
  ): boolean {
    // Card must be in player's hand
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

    // Must overtrump if possible
    const highestTrump = this.trickService.getHighestTrumpInTrick(trick, trumpSuit);
    if (highestTrump) {
      const higherTrumps = this.getHigherTrumps(trumpCardsInHand, highestTrump, trumpSuit);
      if (higherTrumps.length > 0) return higherTrumps;
    }

    // Can't overtrump — play any trump
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
    // Check if partner is winning the trick
    const partnerWinning = this.isPartnerWinning(trick, trumpSuit, playerId, state);

    if (partnerWinning) {
      // Partner is winning — can play anything (including discarding)
      return hand;
    }

    // Partner is NOT winning — must trump if possible
    if (trumpCards.length === 0) return hand; // can play anything

    // Must overtrump if possible
    const highestTrump = this.trickService.getHighestTrumpInTrick(trick, trumpSuit);
    if (highestTrump) {
      const higherTrumps = this.getHigherTrumps(trumpCards, highestTrump, trumpSuit);
      if (higherTrumps.length > 0) return higherTrumps;
    }

    // Can't overtrump — must still play a trump (undertrump)
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
