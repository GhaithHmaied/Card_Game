import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoomsService } from './rooms.service';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  async create(@Request() req: any) {
    return this.roomsService.createRoom(req.user.sub, req.user.username);
  }

  @Get(':id')
  async getRoom(@Param('id') id: string) {
    return this.roomsService.getRoom(id);
  }

  @Post('join/:code')
  async joinByCode(@Param('code') code: string, @Request() req: any) {
    return this.roomsService.joinByCode(code, req.user.sub, req.user.username);
  }
}
