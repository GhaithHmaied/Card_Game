import { RedisService } from '../redis/redis.service';
import { RoomState } from '../common/types';
export declare class RoomsService {
    private readonly redisService;
    constructor(redisService: RedisService);
    createRoom(hostId: string, hostUsername: string): Promise<RoomState>;
    joinRoom(roomId: string, playerId: string, username: string): Promise<RoomState>;
    joinByCode(code: string, playerId: string, username: string): Promise<RoomState>;
    leaveRoom(roomId: string, playerId: string): Promise<RoomState | null>;
    setReady(roomId: string, playerId: string, ready: boolean): Promise<RoomState>;
    getRoom(roomId: string): Promise<RoomState | null>;
    allPlayersReady(roomId: string): Promise<boolean>;
    markPlaying(roomId: string): Promise<void>;
    private generateRoomCode;
}
