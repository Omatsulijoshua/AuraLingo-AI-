import { Controller, Get, Put, Post, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  async getNotifications(@Req() req: any) {
    return this.notificationService.getUserNotifications(req.user.sub);
  }

  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Put(':id/read')
  async markRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationService.markAsRead(req.user.sub, id);
  }

  @Roles(UserRole.STUDENT)
  @Post('test-streak')
  async testStreak(@Req() req: any) {
    return this.notificationService.triggerStreakWarning(req.user.sub);
  }
}
