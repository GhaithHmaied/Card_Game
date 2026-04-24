import { Bid, Contract, GameState } from '../../common/types';
export declare class BiddingService {
    getHighestBid(bids: Bid[]): Bid | null;
    isValidBid(bid: Bid, state: GameState): boolean;
    isBiddingOver(bids: Bid[]): {
        over: boolean;
        allPassed: boolean;
    };
    buildContract(bids: Bid[], state: GameState): Contract | null;
    private getLastNonPassBid;
    private getPlayerTeam;
}
