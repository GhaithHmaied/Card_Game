import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('game_history')
export class GameHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roomCode: string;

  @Column({ type: 'simple-json' })
  teamA: { id: string; username: string }[];

  @Column({ type: 'simple-json' })
  teamB: { id: string; username: string }[];

  @Column()
  teamAScore: number;

  @Column()
  teamBScore: number;

  @Column()
  winner: 'teamA' | 'teamB';

  @Column()
  totalRounds: number;

  @Column({ type: 'simple-json' })
  roundDetails: {
    contract: { team: string; suit: string; value: number };
    teamAScore: number;
    teamBScore: number;
    capot: boolean;
  }[];

  @Column({ default: 0 })
  durationSeconds: number;

  @CreateDateColumn()
  playedAt: Date;
}
