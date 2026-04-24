"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const uuid_1 = require("uuid");
const redis_service_1 = require("../redis/redis.service");
const types_1 = require("../common/types");
let RoomsService = class RoomsService {
    constructor(redisService) {
        this.redisService = redisService;
    }
    async createRoom(hostId, hostUsername) {
        const roomId = (0, uuid_1.v4)();
        const code = this.generateRoomCode();
        const room = {
            id: roomId,
            code,
            hostId,
            status: types_1.RoomStatus.Waiting,
            players: [
                { id: hostId, username: hostUsername, seat: 0, ready: false },
            ],
            createdAt: Date.now(),
        };
        await this.redisService.setRoomState(roomId, room);
        await this.redisService.setRoomCode(code, roomId);
        await this.redisService.setPlayerRoom(hostId, roomId);
        return room;
    }
    async joinRoom(roomId, playerId, username) {
        const room = await this.redisService.getRoomState(roomId);
        if (!room)
            throw new common_1.NotFoundException('Room not found');
        if (room.status !== types_1.RoomStatus.Waiting) {
            throw new common_1.BadRequestException('Room is not accepting players');
        }
        const existing = room.players.find((p) => p.id === playerId);
        if (existing)
            return room;
        if (room.players.length >= 4) {
            throw new common_1.BadRequestException('Room is full');
        }
        const takenSeats = new Set(room.players.map((p) => p.seat));
        const availableSeat = [0, 1, 2, 3].find((s) => !takenSeats.has(s));
        room.players.push({
            id: playerId,
            username,
            seat: availableSeat,
            ready: false,
        });
        if (room.players.length === 4) {
            room.status = types_1.RoomStatus.Full;
        }
        await this.redisService.setRoomState(roomId, room);
        await this.redisService.setPlayerRoom(playerId, roomId);
        return room;
    }
    async joinByCode(code, playerId, username) {
        const roomId = await this.redisService.getRoomByCode(code);
        if (!roomId)
            throw new common_1.NotFoundException('Invalid room code');
        return this.joinRoom(roomId, playerId, username);
    }
    async leaveRoom(roomId, playerId) {
        const room = await this.redisService.getRoomState(roomId);
        if (!room)
            return null;
        room.players = room.players.filter((p) => p.id !== playerId);
        if (room.players.length === 0) {
            await this.redisService.deleteRoomState(roomId);
            return null;
        }
        if (playerId === room.hostId) {
            room.hostId = room.players[0].id;
        }
        room.status = types_1.RoomStatus.Waiting;
        await this.redisService.setRoomState(roomId, room);
        return room;
    }
    async setReady(roomId, playerId, ready) {
        const room = await this.redisService.getRoomState(roomId);
        if (!room)
            throw new common_1.NotFoundException('Room not found');
        const player = room.players.find((p) => p.id === playerId);
        if (!player)
            throw new common_1.BadRequestException('Not in this room');
        player.ready = ready;
        await this.redisService.setRoomState(roomId, room);
        return room;
    }
    async getRoom(roomId) {
        return this.redisService.getRoomState(roomId);
    }
    async allPlayersReady(roomId) {
        const room = await this.redisService.getRoomState(roomId);
        if (!room || room.players.length !== 4)
            return false;
        return room.players.every((p) => p.ready);
    }
    async markPlaying(roomId) {
        const room = await this.redisService.getRoomState(roomId);
        if (room) {
            room.status = types_1.RoomStatus.Playing;
            await this.redisService.setRoomState(roomId, room);
        }
    }
    generateRoomCode() {
        return (0, crypto_1.randomBytes)(4)
            .toString('base64url')
            .substring(0, 6)
            .toUpperCase();
    }
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], RoomsService);
//# sourceMappingURL=rooms.service.js.map