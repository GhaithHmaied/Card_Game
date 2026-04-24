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
exports.HistoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const game_history_entity_1 = require("./game-history.entity");
let HistoryService = class HistoryService {
    constructor(historyRepo) {
        this.historyRepo = historyRepo;
    }
    async saveGame(state) {
        const winner = state.gameScore.teamA >= state.targetScore ? 'teamA' : 'teamB';
        const entry = this.historyRepo.create({
            roomCode: state.roomId,
            teamA: state.players
                .filter((p) => p.team === 'teamA')
                .map((p) => ({ id: p.id, username: p.username })),
            teamB: state.players
                .filter((p) => p.team === 'teamB')
                .map((p) => ({ id: p.id, username: p.username })),
            teamAScore: state.gameScore.teamA,
            teamBScore: state.gameScore.teamB,
            winner: winner,
            totalRounds: state.roundScores.length,
            roundDetails: state.roundScores.map((rs, i) => ({
                contract: state.contract
                    ? {
                        team: state.contract.team,
                        suit: state.contract.suit,
                        value: state.contract.value,
                    }
                    : { team: '', suit: '', value: 0 },
                teamAScore: rs.teamA,
                teamBScore: rs.teamB,
                capot: rs.capot,
            })),
            durationSeconds: Math.floor((Date.now() - state.createdAt) / 1000),
        });
        return this.historyRepo.save(entry);
    }
    async getPlayerHistory(playerId, limit = 20) {
        return this.historyRepo
            .createQueryBuilder('gh')
            .where(`gh."teamA"::text LIKE :pid OR gh."teamB"::text LIKE :pid`, { pid: `%${playerId}%` })
            .orderBy('gh.playedAt', 'DESC')
            .take(limit)
            .getMany();
    }
};
exports.HistoryService = HistoryService;
exports.HistoryService = HistoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(game_history_entity_1.GameHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], HistoryService);
//# sourceMappingURL=history.service.js.map