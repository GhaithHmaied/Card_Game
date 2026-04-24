import Redis from 'ioredis';
import { GameState, RoomState } from '../common/types';
export declare class RedisService {
    private readonly redis;
    constructor(redis: Redis);
    getGameState(gameId: string): Promise<GameState | null>;
    setGameState(gameId: string, state: GameState): Promise<void>;
    deleteGameState(gameId: string): Promise<void>;
    getRoomState(roomId: string): Promise<RoomState | null>;
    setRoomState(roomId: string, state: RoomState): Promise<void>;
    deleteRoomState(roomId: string): Promise<void>;
    getRoomByCode(code: string): Promise<string | null>;
    setRoomCode(code: string, roomId: string): Promise<void>;
    setPlayerSocket(playerId: string, socketId: string): Promise<void>;
    getPlayerSocket(playerId: string): Promise<string | null>;
    setPlayerRoom(playerId: string, roomId: string): Promise<void>;
    getPlayerRoom(playerId: string): Promise<string | null>;
    setDisconnectTimer(playerId: string, ttlMs: number): Promise<void>;
    getDisconnectTimer(playerId: string): Promise<string | null>;
    clearDisconnectTimer(playerId: string): Promise<void>;
    publish(channel: string, message: string): Promise<void>;
}
