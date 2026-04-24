import { Module } from '@nestjs/common';
import { RoomsModule } from '../rooms/rooms.module';
import { GameManagerService } from './game-manager.service';
import { DeckService } from './engine/deck.service';
import { BiddingService } from './engine/bidding.service';
import { TrickService } from './engine/trick.service';
import { ScoreService } from './engine/score.service';
import { ValidationService } from './engine/validation.service';

@Module({
  imports: [RoomsModule],
  providers: [
    GameManagerService,
    DeckService,
    BiddingService,
    TrickService,
    ScoreService,
    ValidationService,
  ],
  exports: [GameManagerService],
})
export class GameModule {}
