import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { RoomsService } from '../rooms/rooms.service';
import { GameManagerService } from '../game/game-manager.service';
import { ChatService } from '../chat/chat.service';
import { RedisService } from '../redis/redis.service';
import { JoinRoomPayload, PlaceBidPayload, PlayCardPayload, SendChatPayload } from '../common/types';
export declare class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly authService;
    private readonly roomsService;
    private readonly gameManager;
    private readonly chatService;
    private readonly redisService;
    private readonly configService;
    server: Server;
    private readonly logger;
    constructor(authService: AuthService, roomsService: RoomsService, gameManager: GameManagerService, chatService: ChatService, redisService: RedisService, configService: ConfigService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleJoinRoom(client: Socket, payload: JoinRoomPayload): Promise<{
        success: boolean;
        room: import("../common/types").RoomState;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        room?: undefined;
    }>;
    handleLeaveRoom(client: Socket, payload: JoinRoomPayload): Promise<{
        success: boolean;
    }>;
    handleReady(client: Socket, payload: {
        roomId: string;
        ready: boolean;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleBid(client: Socket, payload: PlaceBidPayload): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handlePlayCard(client: Socket, payload: PlayCardPayload): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleChat(client: Socket, payload: SendChatPayload): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    private findGameByRoom;
}
