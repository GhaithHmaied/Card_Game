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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
let UsersService = class UsersService {
    constructor(usersRepo) {
        this.usersRepo = usersRepo;
    }
    async findById(id) {
        return this.usersRepo.findOneBy({ id });
    }
    async findByEmail(email) {
        return this.usersRepo.findOneBy({ email });
    }
    async findByUsername(username) {
        return this.usersRepo.findOneBy({ username });
    }
    async create(data) {
        const user = this.usersRepo.create(data);
        return this.usersRepo.save(user);
    }
    async incrementStats(userId, won) {
        await this.usersRepo.increment({ id: userId }, 'gamesPlayed', 1);
        if (won) {
            await this.usersRepo.increment({ id: userId }, 'gamesWon', 1);
        }
    }
    async getLeaderboard(limit = 20) {
        return this.usersRepo.find({
            order: { rating: 'DESC' },
            take: limit,
            select: ['id', 'username', 'rating', 'gamesPlayed', 'gamesWon'],
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map