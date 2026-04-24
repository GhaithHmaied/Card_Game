import { Card } from '../../common/types';
export declare class DeckService {
    createDeck(): Card[];
    shuffle(deck: Card[]): Card[];
    deal(deck: Card[]): Card[][];
    sortHand(hand: Card[]): Card[];
}
