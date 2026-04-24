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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const redis_constants_1 = require("./redis.constants");
let RedisService = class RedisService {
    constructor(redis) {
        this.redis = redis;
    }
    async getGameState(gameId) {
        const data = await this.redis.get(`game:${gameId}`);
        return data ? JSON.parse(data) : null;
    }
    async setGameState(gameId, state) {
        await this.redis.set(`game:${gameId}`, JSON.stringify(state), 'EX', 7200);
    }
    async deleteGameState(gameId) {
        await this.redis.del(`game:${gameId}`);
    }
    async getRoomState(roomId) {
        const data = await this.redis.get(`room:${roomId}`);
        return data ? JSON.parse(data) : null;
    }
    async setRoomState(roomId, state) {
        await this.redis.set(`room:${roomId}`, JSON.stringify(state), 'EX', 3600);
    }
    async deleteRoomState(roomId) {
        await this.redis.del(`room:${roomId}`);
    }
    async getRoomByCode(code) {
        return this.redis.get(`room:code:${code}`);
    }
    async setRoomCode(code, roomId) {
        await this.redis.set(`room:code:${code}`, roomId, 'EX', 3600);
    }
    async setPlayerSocket(playerId, socketId) {
        await this.redis.set(`player:socket:${playerId}`, socketId, 'EX', 7200);
    }
    async getPlayerSocket(playerId) {
        return this.redis.get(`player:socket:${playerId}`);
    }
    async setPlayerRoom(playerId, roomId) {
        await this.redis.set(`player:room:${playerId}`, roomId, 'EX', 7200);
    }
    async getPlayerRoom(playerId) {
        return this.redis.get(`player:room:${playerId}`);
    }
    async setDisconnectTimer(playerId, ttlMs) {
        await this.redis.set(`player:disconnect:${playerId}`, Date.now().toString(), 'PX', ttlMs);
    }
    async getDisconnectTimer(playerId) {
        return this.redis.get(`player:disconnect:${playerId}`);
    }
    async clearDisconnectTimer(playerId) {
        await this.redis.del(`player:disconnect:${playerId}`);
    }
    async publish(channel, message) {
        await this.redis.publish(channel, message);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(redis_constants_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [ioredis_1.default])
], RedisService);
//# sourceMappingURL=redis.service.js.map