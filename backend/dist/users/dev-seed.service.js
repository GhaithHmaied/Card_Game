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
var DevSeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevSeedService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const users_service_1 = require("./users.service");
let DevSeedService = DevSeedService_1 = class DevSeedService {
    constructor(config, usersService) {
        this.config = config;
        this.usersService = usersService;
        this.logger = new common_1.Logger(DevSeedService_1.name);
    }
    async onApplicationBootstrap() {
        if (this.config.get('DEV_LITE') !== 'true')
            return;
        const email = this.config.get('SEED_TEST_EMAIL') ?? 'test@coinche.local';
        const username = this.config.get('SEED_TEST_USERNAME') ?? 'testplayer';
        const password = this.config.get('SEED_TEST_PASSWORD') ?? 'testtest123';
        if ((await this.usersService.findByEmail(email)) ||
            (await this.usersService.findByUsername(username))) {
            return;
        }
        const passwordHash = await bcrypt.hash(password, 12);
        await this.usersService.create({ username, email, passwordHash });
        this.logger.log(`DEV_LITE test user created — email: ${email}  password: ${password}`);
    }
};
exports.DevSeedService = DevSeedService;
exports.DevSeedService = DevSeedService = DevSeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        users_service_1.UsersService])
], DevSeedService);
//# sourceMappingURL=dev-seed.service.js.map