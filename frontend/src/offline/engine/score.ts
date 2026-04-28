import {
  GameState,
  RoundScore,
  TeamId,
  Suit,
} from '../types';
import { TrickService } from './trick';

export class ScoreService {
  constructor(private readonly trickService: TrickService) {}

  calculateRoundScore(state: GameState): RoundScore {
    const contract = state.contract!;
    const trumpSuit = contract.suit;

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

    const lastTrick = state.completedTricks[state.completedTricks.length - 1];
    if (lastTrick.winnerTeam === 'teamA') {
      teamACardPoints += 10;
    } else {
      teamBCardPoints += 10;
    }

    const capotTeam = teamATricks === 8 ? 'teamA' : teamBTricks === 8 ? 'teamB' : null;
    const isCapot = capotTeam !== null;

    if (isCapot) {
      if (capotTeam === 'teamA') {
        teamACardPoints = 252;
        teamBCardPoints = 0;
      } else {
        teamBCardPoints = 252;
        teamACardPoints = 0;
      }
    }

    const beloteTeam = this.detectBelote(state, trumpSuit);

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
      if (contract.team === 'teamA') {
        teamAScore = (teamACardPoints + contract.value) * multiplier;
        teamBScore = teamBCardPoints;
      } else {
        teamBScore = (teamBCardPoints + contract.value) * multiplier;
        teamAScore = teamACardPoints;
      }
    } else {
      if (contract.team === 'teamA') {
        teamAScore = 0;
        teamBScore = (160 + contract.value) * multiplier;
      } else {
        teamBScore = 0;
        teamAScore = (160 + contract.value) * multiplier;
      }
    }

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

  private detectBelote(state: GameState, trumpSuit: Suit): TeamId | null {
    for (const player of state.players) {
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
