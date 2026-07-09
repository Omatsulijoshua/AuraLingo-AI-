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

    let finalDiscountPercent = discountPercent;
    
    // Check if the user was referred AND this is their first paid subscription payment
    const student = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referredById: true },
    });
    if (student?.referredById) {
      const completedPayments = await this.prisma.payment.count({
        where: { userId, status: 'SUCCESSFUL' },
      });
      if (completedPayments === 0) {
        // Fetch dynamic discount percentage setting from AppSettings
        const discountSetting = await this.prisma.appSettings.findUnique({
          where: { key: 'referral_discount_percentage' },
        });
        const refDiscountVal = discountSetting ? Number(discountSetting.value) : 30;
        finalDiscountPercent = Math.max(finalDiscountPercent, refDiscountVal);
      }
    }

    const originalPrice = Number(plan.price);
    const finalAmount = originalPrice - (originalPrice * finalDiscountPercent) / 100;

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

      // Credit 10% commission if user has a referrer
      const subscriber = await tx.user.findUnique({
        where: { id: userId },
        select: { referredById: true },
      });
      if (subscriber?.referredById && finalAmount > 0) {
        const commission = finalAmount * 0.10;
        await tx.user.update({
          where: { id: subscriber.referredById },
          data: { referralBalance: { increment: commission } },
        });
      }

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
  async checkUserPlanLimit(
    userId: string,
    actionType: 'LESSON' | 'PRACTICE' | 'MOCK_TEST' | 'AI_WRITING' | 'AI_SPEAKING',
    mode?: string,
  ): Promise<boolean> {
    const activeSub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
    });

    if (!activeSub) return false; // No subscription means no access at all

    // Check expiration (especially for 7-day trials)
    if (activeSub.endDate && new Date() > new Date(activeSub.endDate)) {
      return false;
    }

    const plan = activeSub.plan;

    // Custom limits for TRIAL plan: 1 Practice mode and 1 Exam mode a day
    if (plan.code === 'TRIAL' && actionType === 'PRACTICE') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const targetMode = mode === 'EXAM' ? 'EXAM' : 'PRACTICE';

      const dailyCount = await this.prisma.userAnswer.count({
        where: {
          userId,
          mode: targetMode,
          createdAt: { gte: startOfDay },
        },
      });
      return dailyCount < 1;
    }

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

  async getPaymentInfo() {
    const setting = await this.prisma.appSettings.findUnique({
      where: { key: 'manual_bank_payment_details' },
    });
    if (!setting) {
      return {
        accountName: 'Joshua toritseju omatsuli',
        bankName: 'Opay',
        accountNumber: '8158075936',
      };
    }
    return JSON.parse(setting.value);
  }
}
