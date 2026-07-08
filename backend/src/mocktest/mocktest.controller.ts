import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { MockTestService } from './mocktest.service';
import { SubmitSectionDto } from './dto/submit-section.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mock-tests')
export class MockTestController {
  constructor(private readonly mockTestService: MockTestService) {}

  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  async getMockTests() {
    return this.mockTestService.getMockTests();
  }

  @Roles(UserRole.STUDENT)
  @Post(':id/start')
  async startMockTest(
    @Req() req: any,
    @Param('id') id: string,
    @Body('customDuration') customDuration?: number,
  ) {
    return this.mockTestService.startMockTest(req.user.sub, id, customDuration);
  }

  @Roles(UserRole.STUDENT)
  @Post('attempts/:id/submit-section')
  async submitSection(
    @Req() req: any,
    @Param('id') attemptId: string,
    @Body() dto: SubmitSectionDto,
  ) {
    return this.mockTestService.submitSection(req.user.sub, attemptId, dto);
  }

  @Roles(UserRole.STUDENT)
  @Get('attempts/:id/time-sync')
  async timeSync(@Param('id') attemptId: string) {
    return this.mockTestService.syncTime(attemptId);
  }
}
