import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameHistory } from './game-history.entity';
import { GameState } from '../common/types';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(GameHistory)
    private readonly historyRepo: Repository<GameHistory>,
  ) {}

  async saveGame(state: GameState): Promise<GameHistory> {
    const winner =
      state.gameScore.teamA >= state.targetScore ? 'teamA' : 'teamB';

    const entry = this.historyRepo.create({
      roomCode: state.roomId,
      teamA: state.players
        .filter((p) => p.team === 'teamA')
        .map((p) => ({ id: p.id, username: p.username })),
      teamB: state.players
        .filter((p) => p.team === 'teamB')
        .map((p) => ({ id: p.id, username: p.username })),
      teamAScore: state.gameScore.teamA,
      teamBScore: state.gameScore.teamB,
      winner: winner as 'teamA' | 'teamB',
      totalRounds: state.roundScores.length,
      roundDetails: state.roundScores.map((rs, i) => ({
        contract: state.contract
          ? {
              team: state.contract.team,
              suit: state.contract.suit,
              value: state.contract.value,
            }
          : { team: '', suit: '', value: 0 },
        teamAScore: rs.teamA,
        teamBScore: rs.teamB,
        capot: rs.capot,
      })),
      durationSeconds: Math.floor(
        (Date.now() - state.createdAt) / 1000,
      ),
    });

    return this.historyRepo.save(entry);
  }

  async getPlayerHistory(
    playerId: string,
    limit = 20,
  ): Promise<GameHistory[]> {
    // Search in both teamA and teamB JSON arrays
    return this.historyRepo
      .createQueryBuilder('gh')
      .where(
        `gh."teamA"::text LIKE :pid OR gh."teamB"::text LIKE :pid`,
        { pid: `%${playerId}%` },
      )
      .orderBy('gh.playedAt', 'DESC')
      .take(limit)
      .getMany();
  }
}
