"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NoopQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoopQueueService = void 0;
const common_1 = require("@nestjs/common");
let NoopQueueService = NoopQueueService_1 = class NoopQueueService {
    constructor() {
        this.log = new common_1.Logger(NoopQueueService_1.name);
    }
    onModuleInit() {
        this.log.warn('DEV_LITE: RabbitMQ disabled (queue events are dropped).');
    }
    emit(_pattern, _data) { }
    publishGameEvent(_eventType, _payload) { }
};
exports.NoopQueueService = NoopQueueService;
exports.NoopQueueService = NoopQueueService = NoopQueueService_1 = __decorate([
    (0, common_1.Injectable)()
], NoopQueueService);
//# sourceMappingURL=noop-queue.service.js.map