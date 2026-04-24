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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreService = void 0;
const common_1 = require("@nestjs/common");
const trick_service_1 = require("./trick.service");
let ScoreService = class ScoreService {
    constructor(trickService) {
        this.trickService = trickService;
    }
    calculateRoundScore(state) {
        const contract = state.contract;
        const trumpSuit = contract.suit;
        let teamACardPoints = 0;
        let teamBCardPoints = 0;
        let teamATricks = 0;
        let teamBTricks = 0;
        for (const trick of state.completedTricks) {
            const points = this.trickService.trickPoints(trick, trumpSuit);
            if (trick.winnerTeam === 'teamA') {
                teamACardPoints += points;
                teamATricks++;
            }
            else {
                teamBCardPoints += points;
                teamBTricks++;
            }
        }
        const lastTrick = state.completedTricks[state.completedTricks.length - 1];
        if (lastTrick.winnerTeam === 'teamA') {
            teamACardPoints += 10;
        }
        else {
            teamBCardPoints += 10;
        }
        const capotTeam = teamATricks === 8 ? 'teamA' : teamBTricks === 8 ? 'teamB' : null;
        const isCapot = capotTeam !== null;
        if (isCapot) {
            if (capotTeam === 'teamA') {
                teamACardPoints = 252;
                teamBCardPoints = 0;
            }
            else {
                teamBCardPoints = 252;
                teamACardPoints = 0;
            }
        }
        const beloteTeam = this.detectBelote(state, trumpSuit);
        const contractTeamPoints = contract.team === 'teamA' ? teamACardPoints : teamBCardPoints;
        const defendingTeamPoints = contract.team === 'teamA' ? teamBCardPoints : teamACardPoints;
        const contractFulfilled = contractTeamPoints >= contract.value;
        let multiplier = 1;
        if (contract.coinched)
            multiplier = 2;
        if (contract.surcoinched)
            multiplier = 4;
        let teamAScore;
        let teamBScore;
        if (contractFulfilled) {
            if (contract.team === 'teamA') {
                teamAScore = (teamACardPoints + contract.value) * multiplier;
                teamBScore = teamBCardPoints;
            }
            else {
                teamBScore = (teamBCardPoints + contract.value) * multiplier;
                teamAScore = teamACardPoints;
            }
        }
        else {
            if (contract.team === 'teamA') {
                teamAScore = 0;
                teamBScore = (160 + contract.value) * multiplier;
            }
            else {
                teamBScore = 0;
                teamAScore = (160 + contract.value) * multiplier;
            }
        }
        if (beloteTeam === 'teamA')
            teamAScore += 20;
        if (beloteTeam === 'teamB')
            teamBScore += 20;
        return {
            teamA: teamAScore,
            teamB: teamBScore,
            beloteTeam: beloteTeam ?? undefined,
            capot: isCapot,
            contractFulfilled,
        };
    }
    detectBelote(state, trumpSuit) {
        for (const player of state.players) {
            const playedCards = state.completedTricks.flatMap((t) => t.cards.filter((tc) => tc.playerId === player.id).map((tc) => tc.card));
            const allCards = [...player.hand, ...playedCards];
            if (this.trickService.hasBelote(allCards, trumpSuit)) {
                return player.team;
            }
        }
        return null;
    }
};
exports.ScoreService = ScoreService;
exports.ScoreService = ScoreService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [trick_service_1.TrickService])
], ScoreService);
//# sourceMappingURL=score.service.js.map