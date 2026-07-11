import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SubscribeDto } from './dto/subscribe.dto';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  async getPlans() {
    return this.subscriptionService.getActivePlans();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('validate-coupon')
  async validateCoupon(@Body('code') code: string) {
    return this.subscriptionService.validateCoupon(code);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @Post('subscribe')
  async subscribe(@Req() req: any, @Body() dto: SubscribeDto) {
    return this.subscriptionService.subscribeUser(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('manual-activate')
  async manualActivate(
    @Req() req: any,
    @Body('studentId') studentId: string,
    @Body('planId') planId: string,
    @Body('note') note?: string,
  ) {
    return this.subscriptionService.activateManualSubscription(
      req.user.sub,
      studentId,
      planId,
      note,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @Post('manual-request')
  async manualRequest(
    @Req() req: any,
    @Body('planId') planId: string,
    @Body('receiptUrl') receiptUrl: string,
  ) {
    return this.subscriptionService.createManualPaymentRequest(
      req.user.sub,
      planId,
      receiptUrl,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('manual-approve')
  async manualApprove(
    @Req() req: any,
    @Body('paymentId') paymentId: string,
  ) {
    return this.subscriptionService.approveManualPayment(
      req.user.sub,
      paymentId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('pending-manual')
  async getPendingManual() {
    return this.subscriptionService.getPendingManualPayments();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('all-manual')
  async getAllManual() {
    return this.subscriptionService.getAllManualPayments();
  }

  @Get('payment-info')
  async getPaymentInfo() {
    return this.subscriptionService.getPaymentInfo();
  }
}
