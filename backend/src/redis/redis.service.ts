import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { GameState, RoomState } from '../common/types';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  // ---- Game State ----

  async getGameState(gameId: string): Promise<GameState | null> {
    const data = await this.redis.get(`game:${gameId}`);
    return data ? JSON.parse(data) : null;
  }

  async setGameState(gameId: string, state: GameState): Promise<void> {
    await this.redis.set(
      `game:${gameId}`,
      JSON.stringify(state),
      'EX',
      7200, // 2 hour TTL
    );
  }

  async deleteGameState(gameId: string): Promise<void> {
    await this.redis.del(`game:${gameId}`);
  }

  // ---- Room State ----

  async getRoomState(roomId: string): Promise<RoomState | null> {
    const data = await this.redis.get(`room:${roomId}`);
    return data ? JSON.parse(data) : null;
  }

  async setRoomState(roomId: string, state: RoomState): Promise<void> {
    await this.redis.set(
      `room:${roomId}`,
      JSON.stringify(state),
      'EX',
      3600, // 1 hour TTL
    );
  }

  async deleteRoomState(roomId: string): Promise<void> {
    await this.redis.del(`room:${roomId}`);
  }

  async getRoomByCode(code: string): Promise<string | null> {
    return this.redis.get(`room:code:${code}`);
  }

  async setRoomCode(code: string, roomId: string): Promise<void> {
    await this.redis.set(`room:code:${code}`, roomId, 'EX', 3600);
  }

  // ---- Player Session Mapping ----

  async setPlayerSocket(playerId: string, socketId: string): Promise<void> {
    await this.redis.set(`player:socket:${playerId}`, socketId, 'EX', 7200);
  }

  async getPlayerSocket(playerId: string): Promise<string | null> {
    return this.redis.get(`player:socket:${playerId}`);
  }

  async setPlayerRoom(playerId: string, roomId: string): Promise<void> {
    await this.redis.set(`player:room:${playerId}`, roomId, 'EX', 7200);
  }

  async getPlayerRoom(playerId: string): Promise<string | null> {
    return this.redis.get(`player:room:${playerId}`);
  }

  // ---- Disconnect Grace Timer ----

  async setDisconnectTimer(playerId: string, ttlMs: number): Promise<void> {
    await this.redis.set(
      `player:disconnect:${playerId}`,
      Date.now().toString(),
      'PX',
      ttlMs,
    );
  }

  async getDisconnectTimer(playerId: string): Promise<string | null> {
    return this.redis.get(`player:disconnect:${playerId}`);
  }

  async clearDisconnectTimer(playerId: string): Promise<void> {
    await this.redis.del(`player:disconnect:${playerId}`);
  }

  // ---- Pub/Sub ----

  async publish(channel: string, message: string): Promise<void> {
    await this.redis.publish(channel, message);
  }
}
