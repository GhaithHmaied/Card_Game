import { Injectable } from '@nestjs/common';
import {
  Contract,
  GameState,
  RoundScore,
  TeamId,
  Trick,
  Suit,
  Rank,
} from '../../common/types';
import { TrickService } from './trick.service';

/**
 * Score calculation for Coinché / Belote.
 *
 * Scoring rules:
 * - Total card points in a round: 152 (162 with 10-de-der)
 * - Last trick bonus ("10 de der"): +10 points
 * - Belote/Rebelote: +20 points to the team holding K+Q of trump
 * - Capot (winning all 8 tricks): 250 points total (replaces card points)
 *
 * Contract resolution:
 * - If contracting team meets/exceeds their bid: they score their card points + contract value
 *   Defending team scores their own card points
 * - If contracting team fails: defending team scores 160 + contract value
 *   Contracting team scores 0
 *
 * Multipliers:
 * - Coinche: double the contract value
 * - Surcoinche: quadruple the contract value
 */
@Injectable()
export class ScoreService {
  constructor(private readonly trickService: TrickService) {}

  /**
   * Calculate round score after all 8 tricks are played.
   */
  calculateRoundScore(state: GameState): RoundScore {
    const contract = state.contract!;
    const trumpSuit = contract.suit;

    // Sum card points per team
    let teamACardPoints = 0;
    let teamBCardPoints = 0;
    let teamATricks = 0;
    let teamBTricks = 0;

    for (const trick of state.completedTricks) {
      const points = this.trickService.trickPoints(trick, trumpSuit);
      if (trick.winnerTeam === 'teamA') {
        teamACardPoints += points;
        teamATricks++;
      } else {
        teamBCardPoints += points;
        teamBTricks++;
      }
    }

    // 10 de der: +10 for the team that won the last trick
    const lastTrick = state.completedTricks[state.completedTricks.length - 1];
    if (lastTrick.winnerTeam === 'teamA') {
      teamACardPoints += 10;
    } else {
      teamBCardPoints += 10;
    }

    // Detect Capot (one team won all tricks)
    const capotTeam = teamATricks === 8 ? 'teamA' : teamBTricks === 8 ? 'teamB' : null;
    const isCapot = capotTeam !== null;

    if (isCapot) {
      // Capot: 252 total points (162 card points + 90 bonus, simplified to 250 in many rules)
      if (capotTeam === 'teamA') {
        teamACardPoints = 252;
        teamBCardPoints = 0;
      } else {
        teamBCardPoints = 252;
        teamACardPoints = 0;
      }
    }

    // Belote bonus (+20)
    const beloteTeam = this.detectBelote(state, trumpSuit);

    // Resolve contract
    const contractTeamPoints =
      contract.team === 'teamA' ? teamACardPoints : teamBCardPoints;
    const defendingTeamPoints =
      contract.team === 'teamA' ? teamBCardPoints : teamACardPoints;

    const contractFulfilled = contractTeamPoints >= contract.value;

    let multiplier = 1;
    if (contract.coinched) multiplier = 2;
    if (contract.surcoinched) multiplier = 4;

    let teamAScore: number;
    let teamBScore: number;

    if (contractFulfilled) {
      // Contract met
      if (contract.team === 'teamA') {
        teamAScore = (teamACardPoints + contract.value) * multiplier;
        teamBScore = teamBCardPoints;
      } else {
        teamBScore = (teamBCardPoints + contract.value) * multiplier;
        teamAScore = teamACardPoints;
      }
    } else {
      // Contract failed — defending team gets everything
      if (contract.team === 'teamA') {
        teamAScore = 0;
        teamBScore = (160 + contract.value) * multiplier;
      } else {
        teamBScore = 0;
        teamAScore = (160 + contract.value) * multiplier;
      }
    }

    // Add belote bonus (always goes to holder, even if contract fails)
    if (beloteTeam === 'teamA') teamAScore += 20;
    if (beloteTeam === 'teamB') teamBScore += 20;

    return {
      teamA: teamAScore,
      teamB: teamBScore,
      beloteTeam: beloteTeam ?? undefined,
      capot: isCapot,
      contractFulfilled,
    };
  }

  /**
   * Detect which team has Belote (King + Queen of trump).
   */
  private detectBelote(state: GameState, trumpSuit: Suit): TeamId | null {
    for (const player of state.players) {
      // Check in completed tricks (cards already played)
      const playedCards = state.completedTricks.flatMap((t) =>
        t.cards.filter((tc) => tc.playerId === player.id).map((tc) => tc.card),
      );

      const allCards = [...player.hand, ...playedCards];

      if (this.trickService.hasBelote(allCards, trumpSuit)) {
        return player.team;
      }
    }
    return null;
  }
}
