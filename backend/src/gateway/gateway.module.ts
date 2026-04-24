import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RoomsModule } from '../rooms/rooms.module';
import { GameModule } from '../game/game.module';
import { ChatModule } from '../chat/chat.module';
import { GameGateway } from './game.gateway';

@Module({
  imports: [AuthModule, RoomsModule, GameModule, ChatModule],
  providers: [GameGateway],
})
export class GatewayModule {}
