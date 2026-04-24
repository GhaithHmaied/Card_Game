import 'dotenv/config';
import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { GameModule } from './game/game.module';
import { ChatModule } from './chat/chat.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { HistoryModule } from './history/history.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        if (config.get<string>('DEV_LITE') === 'true') {
          return {
            type: 'better-sqlite3',
            database: join(process.cwd(), 'dev.sqlite'),
            autoLoadEntities: true,
            synchronize: true,
          };
        }
        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST') ?? 'localhost',
          port: Number(config.get('DB_PORT') ?? 5432),
          username: config.get<string>('DB_USERNAME') ?? 'coinche',
          password: config.get<string>('DB_PASSWORD') ?? 'coinche_secret',
          database: config.get<string>('DB_NAME') ?? 'coinche_db',
          autoLoadEntities: true,
          synchronize: config.get('NODE_ENV') !== 'production',
        };
      },
    }),

    // Feature modules
    RedisModule,
    QueueModule.forRoot(process.env.DEV_LITE === 'true'),
    AuthModule,
    UsersModule,
    RoomsModule,
    GameModule,
    ChatModule,
    HistoryModule,
    GatewayModule,
  ],
})
export class AppModule {}
