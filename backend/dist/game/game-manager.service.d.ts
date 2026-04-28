import { RedisService } from '../redis/redis.service';
import { QueueService } from '../queue/queue.service';
import { RoomsService } from '../rooms/rooms.service';
import { DeckService } from './engine/deck.service';
import { BiddingService } from './engine/bidding.service';
import { TrickService } from './engine/trick.service';
import { ScoreService } from './engine/score.service';
import { ValidationService } from './engine/validation.service';
import { GameState, Trick, Contract, PlayCardPayload, PlaceBidPayload } from '../common/types';
export declare class GameManagerService {
    private readonly redisService;
    private readonly queueService;
    private readonly roomsService;
    private readonly deckService;
    private readonly biddingService;
    private readonly trickService;
    private readonly scoreService;
    private readonly validationService;
    private readonly logger;
    constructor(redisService: RedisService, queueService: QueueService, roomsService: RoomsService, deckService: DeckService, biddingService: BiddingService, trickService: TrickService, scoreService: ScoreService, validationService: ValidationService);
    startGame(roomId: string): Promise<GameState>;
    private dealCards;
    processBid(gameId: string, payload: PlaceBidPayload, playerId: string): Promise<{
        state: GameState;
        biddingOver: boolean;
        allPassed: boolean;
        contract: Contract | null;
    }>;
    playCard(gameId: string, payload: PlayCardPayload, playerId: string): Promise<{
        state: GameState;
        trickComplete: boolean;
        roundComplete: boolean;
        gameOver: boolean;
        lastCompletedTrick?: Trick;
    }>;
    handleReconnect(playerId: string, gameId: string): Promise<GameState | null>;
    handleDisconnect(playerId: string, gameId: string, gracePeriodMs: number): Promise<void>;
    getState(gameId: string): Promise<GameState>;
    getPlayerView(state: GameState, playerId: string): any;
    private saveState;
    private assertPhase;
    private assertTurn;
    private nextSeat;
}
