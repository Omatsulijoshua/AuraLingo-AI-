import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('stats')
  async getStats(@Req() req: any) {
    return this.analyticsService.getUserStats(req.user.sub);
  }

  @Roles(UserRole.STUDENT)
  @Post('study-time')
  async logStudyTime(
    @Req() req: any,
    @Body('minutes') minutes: number,
  ) {
    return this.analyticsService.incrementStudyTime(req.user.sub, minutes);
  }

  @Roles(UserRole.STUDENT)
  @Get('weak-areas')
  async getWeakAreas(@Req() req: any) {
    return this.analyticsService.getWeakAreasBreakdown(req.user.sub);
  }

  @Roles(UserRole.STUDENT)
  @Get('progress-report')
  async getProgressReport(@Req() req: any) {
    return this.analyticsService.getProgressReport(req.user.sub);
  }

  @Roles(UserRole.STUDENT)
  @Get('history')
  async getHistory(@Req() req: any) {
    return this.analyticsService.getHistoryByMode(req.user.sub);
  }
}
