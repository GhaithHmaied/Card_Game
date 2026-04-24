"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameModule = void 0;
const common_1 = require("@nestjs/common");
const rooms_module_1 = require("../rooms/rooms.module");
const game_manager_service_1 = require("./game-manager.service");
const deck_service_1 = require("./engine/deck.service");
const bidding_service_1 = require("./engine/bidding.service");
const trick_service_1 = require("./engine/trick.service");
const score_service_1 = require("./engine/score.service");
const validation_service_1 = require("./engine/validation.service");
let GameModule = class GameModule {
};
exports.GameModule = GameModule;
exports.GameModule = GameModule = __decorate([
    (0, common_1.Module)({
        imports: [rooms_module_1.RoomsModule],
        providers: [
            game_manager_service_1.GameManagerService,
            deck_service_1.DeckService,
            bidding_service_1.BiddingService,
            trick_service_1.TrickService,
            score_service_1.ScoreService,
            validation_service_1.ValidationService,
        ],
        exports: [game_manager_service_1.GameManagerService],
    })
], GameModule);
//# sourceMappingURL=game.module.js.map