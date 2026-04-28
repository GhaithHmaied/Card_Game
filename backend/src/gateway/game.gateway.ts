import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { RoomsService } from '../rooms/rooms.service';
import { GameManagerService } from '../game/game-manager.service';
import { ChatService } from '../chat/chat.service';
import { RedisService } from '../redis/redis.service';
import {
  ClientEvent,
  ServerEvent,
  JoinRoomPayload,
  PlaceBidPayload,
  PlayCardPayload,
  SendChatPayload,
} from '../common/types';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(
    private readonly authService: AuthService,
    private readonly roomsService: RoomsService,
    private readonly gameManager: GameManagerService,
    private readonly chatService: ChatService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  // ================================================================
  // CONNECTION LIFECYCLE
  // ================================================================

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.authService.validateWsToken(token);
      client.data = { userId: payload.sub, username: payload.username };

      await this.redisService.setPlayerSocket(payload.sub, client.id);

      // Check for reconnection
      const roomId = await this.redisService.getPlayerRoom(payload.sub);
      if (roomId) {
        client.join(roomId);
        this.logger.log(`Player ${payload.username} reconnected to room ${roomId}`);

        // Try to restore game state
        const room = await this.roomsService.getRoom(roomId);
        if (room) {
          // Find active game for this room
          const state = await this.findGameByRoom(roomId);
          if (state) {
            const reconnected = await this.gameManager.handleReconnect(
              payload.sub,
              state.id,
            );
            if (reconnected) {
              const view = this.gameManager.getPlayerView(reconnected, payload.sub);
              client.emit(ServerEvent.PlayerReconnected, view);
              client.to(roomId).emit(ServerEvent.PlayerReconnected, {
                playerId: payload.sub,
                username: payload.username,
              });
            }
          }
        }
      }

      this.logger.log(`Client connected: ${payload.username} (${client.id})`);
    } catch (error) {
      this.logger.warn(`Auth failed for ${client.id}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (!userId) return;

    this.logger.log(`Client disconnected: ${client.data.username} (${client.id})`);

    const roomId = await this.redisService.getPlayerRoom(userId);
    if (roomId) {
      const state = await this.findGameByRoom(roomId);
      if (state) {
        const gracePeriod = this.configService.get(
          'DISCONNECT_GRACE_PERIOD_MS',
          30000,
        );
        await this.gameManager.handleDisconnect(userId, state.id, gracePeriod);

        this.server.to(roomId).emit(ServerEvent.PlayerDisconnected, {
          playerId: userId,
          username: client.data.username,
          gracePeriodMs: gracePeriod,
        });
      }
    }
  }

  // ================================================================
  // ROOM EVENTS
  // ================================================================

  @SubscribeMessage(ClientEvent.JoinRoom)
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    const { userId, username } = client.data;

    try {
      const room = await this.roomsService.joinRoom(
        payload.roomId,
        userId,
        username,
      );

      client.join(payload.roomId);
      await this.redisService.setPlayerRoom(userId, payload.roomId);

      this.server.to(payload.roomId).emit(ServerEvent.RoomUpdate, room);

      this.logger.log(`${username} joined room ${payload.roomId}`);
      return { success: true, room };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage(ClientEvent.LeaveRoom)
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    const { userId } = client.data;

    const room = await this.roomsService.leaveRoom(payload.roomId, userId);
    client.leave(payload.roomId);

    if (room) {
      this.server.to(payload.roomId).emit(ServerEvent.RoomUpdate, room);
    }

    return { success: true };
  }

  @SubscribeMessage(ClientEvent.Ready)
  async handleReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; ready: boolean },
  ) {
    const { userId } = client.data;

    try {
      const room = await this.roomsService.setReady(
        payload.roomId,
        userId,
        payload.ready,
      );

      this.server.to(payload.roomId).emit(ServerEvent.RoomUpdate, room);

      // Check if all ready — start the game
      const allReady = await this.roomsService.allPlayersReady(payload.roomId);
      if (allReady) {
        const gameState = await this.gameManager.startGame(payload.roomId);
        await this.redisService.setRoomState(
          `game:room:${payload.roomId}`,
          gameState.id as any,
        );

        // Send each player their own view (hand hidden from others)
        for (const player of gameState.players) {
          const socketId = await this.redisService.getPlayerSocket(player.id);
          if (socketId) {
            const view = this.gameManager.getPlayerView(gameState, player.id);
            this.server.to(socketId).emit(ServerEvent.CardsDealt, view);
          }
        }

        this.server.to(payload.roomId).emit(ServerEvent.GameStarted, {
          gameId: gameState.id,
          phase: gameState.phase,
          currentTurn: gameState.currentTurn,
          dealer: gameState.dealer,
        });

        const firstBidder = gameState.players.find(
          (p) => p.seat === gameState.currentTurn,
        );
        if (firstBidder) {
          const sid = await this.redisService.getPlayerSocket(firstBidder.id);
          if (sid) {
            this.server.to(sid).emit(ServerEvent.YourTurn, {
              phase: gameState.phase,
            });
          }
        }
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ================================================================
  // GAME EVENTS
  // ================================================================

  @SubscribeMessage(ClientEvent.PlaceBid)
  async handleBid(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PlaceBidPayload,
  ) {
    const { userId } = client.data;

    try {
      const state = await this.findGameByRoom(payload.roomId);
      if (!state) throw new Error('No active game');

      const result = await this.gameManager.processBid(
        state.id,
        payload,
        userId,
      );

      // Broadcast bid to all players in room
      this.server.to(payload.roomId).emit(ServerEvent.BidMade, {
        playerId: userId,
        bid: payload,
        biddingOver: result.biddingOver,
        allPassed: result.allPassed,
      });

      if (result.biddingOver && !result.allPassed && result.contract) {
        this.server.to(payload.roomId).emit(ServerEvent.ContractSet, {
          contract: result.contract,
          currentTurn: result.state.currentTurn,
        });
        const firstToPlay = result.state.players.find(
          (p) => p.seat === result.state.currentTurn,
        );
        if (firstToPlay) {
          const sid = await this.redisService.getPlayerSocket(firstToPlay.id);
          if (sid) {
            const view = this.gameManager.getPlayerView(result.state, firstToPlay.id);
            this.server.to(sid).emit(ServerEvent.YourTurn, {
              phase: result.state.phase,
              hand: view.players.find((p: any) => p.id === firstToPlay.id)?.hand,
            });
          }
        }
      }

      // Notify next player of their turn (bidding continues, or re-deal)
      if (!result.biddingOver || result.allPassed) {
        const nextPlayer = result.state.players.find(
          (p) => p.seat === result.state.currentTurn,
        );
        if (nextPlayer) {
          const nextSocketId = await this.redisService.getPlayerSocket(nextPlayer.id);
          if (nextSocketId) {
            this.server.to(nextSocketId).emit(ServerEvent.YourTurn, {
              phase: result.state.phase,
            });
          }
        }
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage(ClientEvent.PlayCard)
  async handlePlayCard(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PlayCardPayload,
  ) {
    const { userId } = client.data;

    try {
      const state = await this.findGameByRoom(payload.roomId);
      if (!state) throw new Error('No active game');

      const result = await this.gameManager.playCard(
        state.id,
        payload,
        userId,
      );

      // Broadcast card played to all
      this.server.to(payload.roomId).emit(ServerEvent.CardPlayed, {
        playerId: userId,
        card: payload.card,
        currentTurn: result.state.currentTurn,
      });

      if (result.trickComplete && result.lastCompletedTrick) {
        const lastTrick = result.lastCompletedTrick;
        this.server.to(payload.roomId).emit(ServerEvent.TrickWon, {
          winnerId: lastTrick.winnerId,
          winnerTeam: lastTrick.winnerTeam,
          trickCards: lastTrick.cards,
        });
      }

      if (result.roundComplete) {
        const lastRound =
          result.state.roundScores[result.state.roundScores.length - 1];
        this.server.to(payload.roomId).emit(ServerEvent.RoundComplete, {
          roundScore: lastRound,
          gameScore: result.state.gameScore,
        });

        if (!result.gameOver) {
          for (const player of result.state.players) {
            const socketId = await this.redisService.getPlayerSocket(player.id);
            if (socketId) {
              const view = this.gameManager.getPlayerView(result.state, player.id);
              this.server.to(socketId).emit(ServerEvent.CardsDealt, view);
            }
          }
          const firstBidder = result.state.players.find(
            (p) => p.seat === result.state.currentTurn,
          );
          if (firstBidder) {
            const sid = await this.redisService.getPlayerSocket(firstBidder.id);
            if (sid) {
              const view = this.gameManager.getPlayerView(
                result.state,
                firstBidder.id,
              );
              this.server.to(sid).emit(ServerEvent.YourTurn, {
                phase: result.state.phase,
                hand: view.players.find((p: any) => p.id === firstBidder.id)
                  ?.hand,
              });
            }
          }
        }
      }

      if (result.gameOver) {
        const winner =
          result.state.gameScore.teamA >= result.state.targetScore
            ? 'teamA'
            : 'teamB';
        this.server.to(payload.roomId).emit(ServerEvent.GameOver, {
          winner,
          finalScore: result.state.gameScore,
          roundScores: result.state.roundScores,
        });
      }

      // Notify next player
      if (!result.roundComplete && !result.gameOver) {
        const nextPlayer = result.state.players.find(
          (p) => p.seat === result.state.currentTurn,
        );
        if (nextPlayer) {
          const nextSocketId = await this.redisService.getPlayerSocket(nextPlayer.id);
          if (nextSocketId) {
            const view = this.gameManager.getPlayerView(result.state, nextPlayer.id);
            this.server.to(nextSocketId).emit(ServerEvent.YourTurn, {
              phase: result.state.phase,
              hand: view.players.find((p: any) => p.id === nextPlayer.id)?.hand,
              legalPlays: undefined, // client can compute from rules
            });
          }
        }
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ================================================================
  // CHAT
  // ================================================================

  @SubscribeMessage(ClientEvent.SendChat)
  async handleChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendChatPayload,
  ) {
    const { userId, username } = client.data;
    const sanitized = this.chatService.sanitize(payload.message);

    if (!sanitized) return { success: false, error: 'Empty message' };

    this.server.to(payload.roomId).emit(ServerEvent.ChatMessage, {
      playerId: userId,
      username,
      message: sanitized,
      timestamp: Date.now(),
    });

    return { success: true };
  }

  // ================================================================
  // HELPERS
  // ================================================================

  private async findGameByRoom(roomId: string): Promise<any | null> {
    const gameIdRaw = await this.redisService.getRoomState(`game:room:${roomId}`);
    if (!gameIdRaw || typeof gameIdRaw !== 'string') return null;
    return this.redisService.getGameState(gameIdRaw);
  }
}
