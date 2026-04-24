import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HistoryService } from './history.service';

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async getMyHistory(@Request() req: any, @Query('limit') limit?: string) {
    const parsedLimit = limit ? Math.min(parseInt(limit, 10), 50) : 20;
    return this.historyService.getPlayerHistory(req.user.sub, parsedLimit);
  }
}
