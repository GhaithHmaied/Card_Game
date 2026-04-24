import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { v4 as uuid } from 'uuid';
import { RedisService } from '../redis/redis.service';
import { RoomState, RoomStatus, SeatIndex } from '../common/types';

@Injectable()
export class RoomsService {
  constructor(private readonly redisService: RedisService) {}

  async createRoom(hostId: string, hostUsername: string): Promise<RoomState> {
    const roomId = uuid();
    const code = this.generateRoomCode();

    const room: RoomState = {
      id: roomId,
      code,
      hostId,
      status: RoomStatus.Waiting,
      players: [
        { id: hostId, username: hostUsername, seat: 0 as SeatIndex, ready: false },
      ],
      createdAt: Date.now(),
    };

    await this.redisService.setRoomState(roomId, room);
    await this.redisService.setRoomCode(code, roomId);
    await this.redisService.setPlayerRoom(hostId, roomId);

    return room;
  }

  async joinRoom(
    roomId: string,
    playerId: string,
    username: string,
  ): Promise<RoomState> {
    const room = await this.redisService.getRoomState(roomId);
    if (!room) throw new NotFoundException('Room not found');

    if (room.status !== RoomStatus.Waiting) {
      throw new BadRequestException('Room is not accepting players');
    }

    // Check if already in room
    const existing = room.players.find((p) => p.id === playerId);
    if (existing) return room;

    if (room.players.length >= 4) {
      throw new BadRequestException('Room is full');
    }

    const takenSeats = new Set(room.players.map((p) => p.seat));
    const availableSeat = ([0, 1, 2, 3] as SeatIndex[]).find(
      (s) => !takenSeats.has(s),
    )!;

    room.players.push({
      id: playerId,
      username,
      seat: availableSeat,
      ready: false,
    });

    if (room.players.length === 4) {
      room.status = RoomStatus.Full;
    }

    await this.redisService.setRoomState(roomId, room);
    await this.redisService.setPlayerRoom(playerId, roomId);

    return room;
  }

  async joinByCode(
    code: string,
    playerId: string,
    username: string,
  ): Promise<RoomState> {
    const roomId = await this.redisService.getRoomByCode(code);
    if (!roomId) throw new NotFoundException('Invalid room code');
    return this.joinRoom(roomId, playerId, username);
  }

  async leaveRoom(roomId: string, playerId: string): Promise<RoomState | null> {
    const room = await this.redisService.getRoomState(roomId);
    if (!room) return null;

    room.players = room.players.filter((p) => p.id !== playerId);

    if (room.players.length === 0) {
      await this.redisService.deleteRoomState(roomId);
      return null;
    }

    if (playerId === room.hostId) {
      room.hostId = room.players[0].id;
    }

    room.status = RoomStatus.Waiting;
    await this.redisService.setRoomState(roomId, room);
    return room;
  }

  async setReady(roomId: string, playerId: string, ready: boolean): Promise<RoomState> {
    const room = await this.redisService.getRoomState(roomId);
    if (!room) throw new NotFoundException('Room not found');

    const player = room.players.find((p) => p.id === playerId);
    if (!player) throw new BadRequestException('Not in this room');

    player.ready = ready;
    await this.redisService.setRoomState(roomId, room);
    return room;
  }

  async getRoom(roomId: string): Promise<RoomState | null> {
    return this.redisService.getRoomState(roomId);
  }

  async allPlayersReady(roomId: string): Promise<boolean> {
    const room = await this.redisService.getRoomState(roomId);
    if (!room || room.players.length !== 4) return false;
    return room.players.every((p) => p.ready);
  }

  async markPlaying(roomId: string): Promise<void> {
    const room = await this.redisService.getRoomState(roomId);
    if (room) {
      room.status = RoomStatus.Playing;
      await this.redisService.setRoomState(roomId, room);
    }
  }

  private generateRoomCode(): string {
    // 6-char alphanumeric uppercase code
    return randomBytes(4)
      .toString('base64url')
      .substring(0, 6)
      .toUpperCase();
  }
}
