import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  // --- PLANS ---
  async getActivePlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    });
  }

  // --- COUPONS ---
  async validateCoupon(code: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.active) {
      throw new NotFoundException('Coupon code not found or is inactive');
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      throw new BadRequestException('Coupon code has expired');
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon code usage limit exceeded');
    }

    return coupon;
  }

  // --- SUBSCRIBE (PAYMENT SUCCESSFUL OR MANUALLY TRIGGERED) ---
  async subscribeUser(userId: string, dto: SubscribeDto) {
    // 1. Check if payment reference already processed
    const existingPayment = await this.prisma.payment.findUnique({
      where: { providerReference: dto.paymentReference },
    });
    if (existingPayment) {
      throw new ConflictException('Payment transaction reference has already been processed');
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan || !plan.active) {
      throw new NotFoundException('Selected subscription plan not found');
    }

    // 2. Validate coupon and calculate price
    let discountPercent = 0;
    let couponId: string | undefined;

    if (dto.couponCode) {
      try {
        const coupon = await this.validateCoupon(dto.couponCode);
        discountPercent = coupon.discountPercent;
        couponId = coupon.id;
      } catch (err: any) {
        throw new BadRequestException(`Coupon error: ${err.message}`);
      }
    }

    const originalPrice = Number(plan.price);
    const finalAmount = originalPrice - (originalPrice * discountPercent) / 100;

    // 3. Process in a database transaction
    return this.prisma.$transaction(async (tx) => {
      // Deactivate all existing subscriptions
      await tx.subscription.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });

      // Calculate end date based on interval
      const durationDays = plan.interval === 'YEARLY' ? 365 : 30;
      const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      // Create new subscription
      const subscription = await tx.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate,
          autoRenew: true,
        },
      });

      // Log payment record
      await tx.payment.create({
        data: {
          userId,
          subscriptionId: subscription.id,
          amount: finalAmount,
          currency: 'USD',
          provider: dto.paymentProvider,
          providerReference: dto.paymentReference,
          status: 'SUCCESSFUL',
          couponId,
        },
      });

      // Increment coupon count
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } },
        });
      }

      return subscription;
    });
  }

  // --- ADMIN MANUAL SUBSCRIPTION ACTIVATION ---
  async activateManualSubscription(adminId: string, studentId: string, planId: string, note?: string) {
    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student account not found');

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    return this.prisma.$transaction(async (tx) => {
      // Deactivate old active subscriptions
      await tx.subscription.updateMany({
        where: { userId: studentId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });

      // Far end date
      const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

      const subscription = await tx.subscription.create({
        data: {
          userId: studentId,
          planId: plan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate,
          autoRenew: false,
        },
      });

      // Log manual payment reference
      const ref = `MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await tx.payment.create({
        data: {
          userId: studentId,
          subscriptionId: subscription.id,
          amount: plan.price,
          provider: 'MANUAL',
          providerReference: ref,
          status: 'SUCCESSFUL',
        },
      });

      // Audit log admin action
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'MANUAL_SUBSCRIBE',
          target: `User ID: ${studentId}, Plan: ${plan.code}`,
          details: note || 'Manual activation bypass',
        },
      });

      return subscription;
    });
  }

  // --- PLAN LIMITS VALIDATION UTILITY ---
  async checkUserPlanLimit(userId: string, actionType: 'LESSON' | 'PRACTICE' | 'MOCK_TEST' | 'AI_WRITING' | 'AI_SPEAKING'): Promise<boolean> {
    const activeSub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
    });

    if (!activeSub) return false; // No subscription means no access at all
    const plan = activeSub.plan;

    // Check specific capabilities
    if (actionType === 'AI_WRITING') return plan.hasAiWriting;
    if (actionType === 'AI_SPEAKING') return plan.hasAiSpeaking;

    // Retrieve stats
    const stats = await this.prisma.progressStats.findUnique({ where: { userId } });
    if (!stats) return true; // Fail-safe: allow if stats row is missing

    if (actionType === 'LESSON') {
      if (plan.limitLessons === -1) return true;
      return stats.lessonsCompletedCount < plan.limitLessons;
    }

    if (actionType === 'MOCK_TEST') {
      if (plan.limitMockTests === -1) return true;
      return stats.mockTestsCompletedCount < plan.limitMockTests;
    }

    if (actionType === 'PRACTICE') {
      if (plan.limitDailyPractice === -1) return true;
      
      // Calculate practice count completed today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayAnswers = await this.prisma.userAnswer.count({
        where: {
          userId,
          createdAt: { gte: startOfDay },
        },
      });

      return todayAnswers < plan.limitDailyPractice;
    }

    return false;
  }
}
