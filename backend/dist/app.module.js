"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
require("dotenv/config");
const path_1 = require("path");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const rooms_module_1 = require("./rooms/rooms.module");
const game_module_1 = require("./game/game.module");
const chat_module_1 = require("./chat/chat.module");
const redis_module_1 = require("./redis/redis.module");
const queue_module_1 = require("./queue/queue.module");
const history_module_1 = require("./history/history.module");
const gateway_module_1 = require("./gateway/gateway.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    if (config.get('DEV_LITE') === 'true') {
                        return {
                            type: 'better-sqlite3',
                            database: (0, path_1.join)(process.cwd(), 'dev.sqlite'),
                            autoLoadEntities: true,
                            synchronize: true,
                        };
                    }
                    return {
                        type: 'postgres',
                        host: config.get('DB_HOST') ?? 'localhost',
                        port: Number(config.get('DB_PORT') ?? 5432),
                        username: config.get('DB_USERNAME') ?? 'coinche',
                        password: config.get('DB_PASSWORD') ?? 'coinche_secret',
                        database: config.get('DB_NAME') ?? 'coinche_db',
                        autoLoadEntities: true,
                        synchronize: config.get('NODE_ENV') !== 'production',
                    };
                },
            }),
            redis_module_1.RedisModule,
            queue_module_1.QueueModule.forRoot(process.env.DEV_LITE === 'true'),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            rooms_module_1.RoomsModule,
            game_module_1.GameModule,
            chat_module_1.ChatModule,
            history_module_1.HistoryModule,
            gateway_module_1.GatewayModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map