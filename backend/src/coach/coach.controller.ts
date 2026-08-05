import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CoachService, OnboardDto, ConversationTurnDto } from './coach.service';

@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Get('profile/:userId')
  async getProfile(@Param('userId') userId: string) {
    return this.coachService.getProfile(userId);
  }

  @Post('onboard/:userId')
  async onboard(@Param('userId') userId: string, @Body() dto: OnboardDto) {
    return this.coachService.saveProfile(userId, dto);
  }

  @Post('turn/:userId')
  async processTurn(@Param('userId') userId: string, @Body() dto: ConversationTurnDto) {
    return this.coachService.processTurn(userId, dto);
  }
}
