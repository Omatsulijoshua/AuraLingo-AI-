import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly aiService: AiService,
  ) {}

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.getUsers(search, role);
  }

  @Put('users/:id/status')
  @Roles(UserRole.SUPER_ADMIN)
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() body: { isVerified?: boolean; role?: UserRole },
  ) {
    return this.adminService.updateUserStatus(userId, body);
  }

  @Get('users/:id/progress')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TUTOR)
  async getUserProgress(@Param('id') userId: string) {
    return this.adminService.getUserProgress(userId);
  }

  @Get('settings')
  @Roles(UserRole.SUPER_ADMIN)
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  @Roles(UserRole.SUPER_ADMIN)
  async updateSetting(
    @Body('key') key: string,
    @Body('value') value: string,
  ) {
    return this.adminService.updateSetting(key, value);
  }

  @Post('settings/test-ai')
  @Roles(UserRole.SUPER_ADMIN)
  async testAi(
    @Body('provider') provider: string,
    @Body('model') model: string,
    @Body('apiKey') apiKey: string,
    @Body('prompt') prompt: string,
  ) {
    return this.aiService.generateChatCompletion(
      [{ role: 'user', content: prompt }],
      provider,
      model,
      apiKey,
    );
  }
}
