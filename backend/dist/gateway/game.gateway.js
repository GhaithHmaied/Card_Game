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
var GameGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("../auth/auth.service");
const rooms_service_1 = require("../rooms/rooms.service");
const game_manager_service_1 = require("../game/game-manager.service");
const chat_service_1 = require("../chat/chat.service");
const redis_service_1 = require("../redis/redis.service");
const types_1 = require("../common/types");
let GameGateway = GameGateway_1 = class GameGateway {
    constructor(authService, roomsService, gameManager, chatService, redisService, configService) {
        this.authService = authService;
        this.roomsService = roomsService;
        this.gameManager = gameManager;
        this.chatService = chatService;
        this.redisService = redisService;
        this.configService = configService;
        this.logger = new common_1.Logger(GameGateway_1.name);
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.split(' ')[1];
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = await this.authService.validateWsToken(token);
            client.data = { userId: payload.sub, username: payload.username };
            await this.redisService.setPlayerSocket(payload.sub, client.id);
            const roomId = await this.redisService.getPlayerRoom(payload.sub);
            if (roomId) {
                client.join(roomId);
                this.logger.log(`Player ${payload.username} reconnected to room ${roomId}`);
                const room = await this.roomsService.getRoom(roomId);
                if (room) {
                    const state = await this.findGameByRoom(roomId);
                    if (state) {
                        const reconnected = await this.gameManager.handleReconnect(payload.sub, state.id);
                        if (reconnected) {
                            const view = this.gameManager.getPlayerView(reconnected, payload.sub);
                            client.emit(types_1.ServerEvent.PlayerReconnected, view);
                            client.to(roomId).emit(types_1.ServerEvent.PlayerReconnected, {
                                playerId: payload.sub,
                                username: payload.username,
                            });
                        }
                    }
                }
            }
            this.logger.log(`Client connected: ${payload.username} (${client.id})`);
        }
        catch (error) {
            this.logger.warn(`Auth failed for ${client.id}`);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        const userId = client.data?.userId;
        if (!userId)
            return;
        this.logger.log(`Client disconnected: ${client.data.username} (${client.id})`);
        const roomId = await this.redisService.getPlayerRoom(userId);
        if (roomId) {
            const state = await this.findGameByRoom(roomId);
            if (state) {
                const gracePeriod = this.configService.get('DISCONNECT_GRACE_PERIOD_MS', 30000);
                await this.gameManager.handleDisconnect(userId, state.id, gracePeriod);
                this.server.to(roomId).emit(types_1.ServerEvent.PlayerDisconnected, {
                    playerId: userId,
                    username: client.data.username,
                    gracePeriodMs: gracePeriod,
                });
            }
        }
    }
    async handleJoinRoom(client, payload) {
        const { userId, username } = client.data;
        try {
            const room = await this.roomsService.joinRoom(payload.roomId, userId, username);
            client.join(payload.roomId);
            await this.redisService.setPlayerRoom(userId, payload.roomId);
            this.server.to(payload.roomId).emit(types_1.ServerEvent.RoomUpdate, room);
            this.logger.log(`${username} joined room ${payload.roomId}`);
            return { success: true, room };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleLeaveRoom(client, payload) {
        const { userId } = client.data;
        const room = await this.roomsService.leaveRoom(payload.roomId, userId);
        client.leave(payload.roomId);
        if (room) {
            this.server.to(payload.roomId).emit(types_1.ServerEvent.RoomUpdate, room);
        }
        return { success: true };
    }
    async handleReady(client, payload) {
        const { userId } = client.data;
        try {
            const room = await this.roomsService.setReady(payload.roomId, userId, payload.ready);
            this.server.to(payload.roomId).emit(types_1.ServerEvent.RoomUpdate, room);
            const allReady = await this.roomsService.allPlayersReady(payload.roomId);
            if (allReady) {
                const gameState = await this.gameManager.startGame(payload.roomId);
                await this.redisService.setRoomState(`game:room:${payload.roomId}`, gameState.id);
                for (const player of gameState.players) {
                    const socketId = await this.redisService.getPlayerSocket(player.id);
                    if (socketId) {
                        const view = this.gameManager.getPlayerView(gameState, player.id);
                        this.server.to(socketId).emit(types_1.ServerEvent.CardsDealt, view);
                    }
                }
                this.server.to(payload.roomId).emit(types_1.ServerEvent.GameStarted, {
                    gameId: gameState.id,
                    phase: gameState.phase,
                    currentTurn: gameState.currentTurn,
                    dealer: gameState.dealer,
                });
                const firstBidder = gameState.players.find((p) => p.seat === gameState.currentTurn);
                if (firstBidder) {
                    const sid = await this.redisService.getPlayerSocket(firstBidder.id);
                    if (sid) {
                        this.server.to(sid).emit(types_1.ServerEvent.YourTurn, {
                            phase: gameState.phase,
                        });
                    }
                }
            }
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleBid(client, payload) {
        const { userId } = client.data;
        try {
            const state = await this.findGameByRoom(payload.roomId);
            if (!state)
                throw new Error('No active game');
            const result = await this.gameManager.processBid(state.id, payload, userId);
            this.server.to(payload.roomId).emit(types_1.ServerEvent.BidMade, {
                playerId: userId,
                bid: payload,
                biddingOver: result.biddingOver,
                allPassed: result.allPassed,
            });
            if (result.biddingOver && !result.allPassed && result.contract) {
                this.server.to(payload.roomId).emit(types_1.ServerEvent.ContractSet, {
                    contract: result.contract,
                    currentTurn: result.state.currentTurn,
                });
                const firstToPlay = result.state.players.find((p) => p.seat === result.state.currentTurn);
                if (firstToPlay) {
                    const sid = await this.redisService.getPlayerSocket(firstToPlay.id);
                    if (sid) {
                        const view = this.gameManager.getPlayerView(result.state, firstToPlay.id);
                        this.server.to(sid).emit(types_1.ServerEvent.YourTurn, {
                            phase: result.state.phase,
                            hand: view.players.find((p) => p.id === firstToPlay.id)?.hand,
                        });
                    }
                }
            }
            if (!result.biddingOver || result.allPassed) {
                const nextPlayer = result.state.players.find((p) => p.seat === result.state.currentTurn);
                if (nextPlayer) {
                    const nextSocketId = await this.redisService.getPlayerSocket(nextPlayer.id);
                    if (nextSocketId) {
                        this.server.to(nextSocketId).emit(types_1.ServerEvent.YourTurn, {
                            phase: result.state.phase,
                        });
                    }
                }
            }
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handlePlayCard(client, payload) {
        const { userId } = client.data;
        try {
            const state = await this.findGameByRoom(payload.roomId);
            if (!state)
                throw new Error('No active game');
            const result = await this.gameManager.playCard(state.id, payload, userId);
            this.server.to(payload.roomId).emit(types_1.ServerEvent.CardPlayed, {
                playerId: userId,
                card: payload.card,
                currentTurn: result.state.currentTurn,
            });
            if (result.trickComplete && result.lastCompletedTrick) {
                const lastTrick = result.lastCompletedTrick;
                this.server.to(payload.roomId).emit(types_1.ServerEvent.TrickWon, {
                    winnerId: lastTrick.winnerId,
                    winnerTeam: lastTrick.winnerTeam,
                    trickCards: lastTrick.cards,
                });
            }
            if (result.roundComplete) {
                const lastRound = result.state.roundScores[result.state.roundScores.length - 1];
                this.server.to(payload.roomId).emit(types_1.ServerEvent.RoundComplete, {
                    roundScore: lastRound,
                    gameScore: result.state.gameScore,
                });
                if (!result.gameOver) {
                    for (const player of result.state.players) {
                        const socketId = await this.redisService.getPlayerSocket(player.id);
                        if (socketId) {
                            const view = this.gameManager.getPlayerView(result.state, player.id);
                            this.server.to(socketId).emit(types_1.ServerEvent.CardsDealt, view);
                        }
                    }
                    const firstBidder = result.state.players.find((p) => p.seat === result.state.currentTurn);
                    if (firstBidder) {
                        const sid = await this.redisService.getPlayerSocket(firstBidder.id);
                        if (sid) {
                            const view = this.gameManager.getPlayerView(result.state, firstBidder.id);
                            this.server.to(sid).emit(types_1.ServerEvent.YourTurn, {
                                phase: result.state.phase,
                                hand: view.players.find((p) => p.id === firstBidder.id)
                                    ?.hand,
                            });
                        }
                    }
                }
            }
            if (result.gameOver) {
                const winner = result.state.gameScore.teamA >= result.state.targetScore
                    ? 'teamA'
                    : 'teamB';
                this.server.to(payload.roomId).emit(types_1.ServerEvent.GameOver, {
                    winner,
                    finalScore: result.state.gameScore,
                    roundScores: result.state.roundScores,
                });
            }
            if (!result.roundComplete && !result.gameOver) {
                const nextPlayer = result.state.players.find((p) => p.seat === result.state.currentTurn);
                if (nextPlayer) {
                    const nextSocketId = await this.redisService.getPlayerSocket(nextPlayer.id);
                    if (nextSocketId) {
                        const view = this.gameManager.getPlayerView(result.state, nextPlayer.id);
                        this.server.to(nextSocketId).emit(types_1.ServerEvent.YourTurn, {
                            phase: result.state.phase,
                            hand: view.players.find((p) => p.id === nextPlayer.id)?.hand,
                            legalPlays: undefined,
                        });
                    }
                }
            }
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleChat(client, payload) {
        const { userId, username } = client.data;
        const sanitized = this.chatService.sanitize(payload.message);
        if (!sanitized)
            return { success: false, error: 'Empty message' };
        this.server.to(payload.roomId).emit(types_1.ServerEvent.ChatMessage, {
            playerId: userId,
            username,
            message: sanitized,
            timestamp: Date.now(),
        });
        return { success: true };
    }
    async findGameByRoom(roomId) {
        const gameIdRaw = await this.redisService.getRoomState(`game:room:${roomId}`);
        if (!gameIdRaw || typeof gameIdRaw !== 'string')
            return null;
        return this.redisService.getGameState(gameIdRaw);
    }
};
exports.GameGateway = GameGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GameGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)(types_1.ClientEvent.JoinRoom),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(types_1.ClientEvent.LeaveRoom),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(types_1.ClientEvent.Ready),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleReady", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(types_1.ClientEvent.PlaceBid),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleBid", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(types_1.ClientEvent.PlayCard),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handlePlayCard", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(types_1.ClientEvent.SendChat),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleChat", null);
exports.GameGateway = GameGateway = GameGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*', credentials: true },
        namespace: '/game',
    }),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        rooms_service_1.RoomsService,
        game_manager_service_1.GameManagerService,
        chat_service_1.ChatService,
        redis_service_1.RedisService,
        config_1.ConfigService])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map