"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var QueueModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const config_2 = require("@nestjs/config");
const queue_service_1 = require("./queue.service");
const queue_constants_1 = require("./queue.constants");
const noop_queue_service_1 = require("./noop-queue.service");
let QueueModule = QueueModule_1 = class QueueModule {
    static forRoot(lite) {
        if (lite) {
            return {
                module: QueueModule_1,
                providers: [{ provide: queue_service_1.QueueService, useClass: noop_queue_service_1.NoopQueueService }],
                exports: [queue_service_1.QueueService],
            };
        }
        return {
            module: QueueModule_1,
            imports: [
                config_2.ConfigModule,
                microservices_1.ClientsModule.registerAsync([
                    {
                        name: queue_constants_1.RABBITMQ_CLIENT,
                        inject: [config_1.ConfigService],
                        useFactory: (config) => ({
                            transport: microservices_1.Transport.RMQ,
                            options: {
                                urls: [
                                    config.get('RABBITMQ_URL') ??
                                        'amqp://guest:guest@localhost:5672',
                                ],
                                queue: 'coinche_game_events',
                                queueOptions: { durable: true },
                            },
                        }),
                    },
                ]),
            ],
            providers: [queue_service_1.QueueService],
            exports: [queue_service_1.QueueService],
        };
    }
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = QueueModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], QueueModule);
//# sourceMappingURL=queue.module.js.map