import { GameState, RoundScore } from '../../common/types';
import { TrickService } from './trick.service';
export declare class ScoreService {
    private readonly trickService;
    constructor(trickService: TrickService);
    calculateRoundScore(state: GameState): RoundScore;
    private detectBelote;
}
