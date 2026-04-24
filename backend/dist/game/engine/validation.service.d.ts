import { Card, Suit, GameState, Trick } from '../../common/types';
import { TrickService } from './trick.service';
export declare class ValidationService {
    private readonly trickService;
    constructor(trickService: TrickService);
    getLegalPlays(hand: Card[], trick: Trick, trumpSuit: Suit, playerId: string, state: GameState): Card[];
    isLegalPlay(card: Card, hand: Card[], trick: Trick, trumpSuit: Suit, playerId: string, state: GameState): boolean;
    private handleTrumpLead;
    private handleCantFollow;
    private isPartnerWinning;
    private getHigherTrumps;
}
