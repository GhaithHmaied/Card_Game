import { Repository } from 'typeorm';
import { GameHistory } from './game-history.entity';
import { GameState } from '../common/types';
export declare class HistoryService {
    private readonly historyRepo;
    constructor(historyRepo: Repository<GameHistory>);
    saveGame(state: GameState): Promise<GameHistory>;
    getPlayerHistory(playerId: string, limit?: number): Promise<GameHistory[]>;
}
