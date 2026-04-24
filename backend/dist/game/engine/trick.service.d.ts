import { Card, Suit, Trick, TrickCard, TeamId, GameState } from '../../common/types';
export declare class TrickService {
    private readonly TRUMP_POINTS;
    private readonly NON_TRUMP_POINTS;
    private readonly TRUMP_ORDER;
    private readonly NON_TRUMP_ORDER;
    resolveTrick(trick: Trick, trumpSuit: Suit): TrickCard;
    trickPoints(trick: Trick, trumpSuit: Suit): number;
    cardPoints(card: Card, trumpSuit: Suit): number;
    private beats;
    hasBelote(hand: Card[], trumpSuit: Suit): boolean;
    getWinnerTeam(winnerId: string, state: GameState): TeamId;
    getCurrentTrickWinner(trick: Trick, trumpSuit: Suit): TrickCard | null;
    getHighestTrumpInTrick(trick: Trick, trumpSuit: Suit): Card | null;
}
