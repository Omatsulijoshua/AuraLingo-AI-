import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('stats')
  async getStats(@Req() req: any) {
    return this.referralsService.getReferralStats(req.user.sub);
  }

  @Post('verify')
  async verifyBilling(
    @Req() req: any,
    @Body('bankName') bankName: string,
    @Body('accountNumber') accountNumber: string,
    @Body('accountName') accountName: string,
  ) {
    return this.referralsService.verifyReferralAccount(
      req.user.sub,
      bankName,
      accountNumber,
      accountName,
    );
  }

  @Post('withdraw')
  async requestWithdrawal(
    @Req() req: any,
    @Body('amount') amount: number,
  ) {
    return this.referralsService.requestWithdrawal(req.user.sub, amount);
  }

  @Roles(UserRole.TUTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('tutors/add-student')
  async addStudent(
    @Req() req: any,
    @Body('studentId') studentId: string,
  ) {
    return this.referralsService.addStudentDirectly(req.user.sub, studentId);
  }
}
