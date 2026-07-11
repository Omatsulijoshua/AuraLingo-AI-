import { Injectable, NotFoundException, BadRequestException, ConflictException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class SubscriptionService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    console.log('[SubscriptionService] Synchronizing subscription plans...');
    try {
      // 1. Clean up old subscription plans that are not FREE, BASIC, PRO, or PREMIUM
      await this.prisma.subscription.deleteMany({
        where: {
          plan: {
            code: {
              notIn: ['FREE', 'BASIC', 'PRO', 'PREMIUM'],
            },
          },
        },
      });
      await this.prisma.subscriptionPlan.deleteMany({
        where: {
          code: {
            notIn: ['FREE', 'BASIC', 'PRO', 'PREMIUM'],
          },
        },
      });

      // 2. Define target plans matching the third image
      const plans = [
        {
          name: 'Free Starter',
          code: 'FREE',
          price: 0.0,
          interval: 'MONTHLY' as const,
          features: ['5 Practice Questions / Day', '1 Full Mock Test', 'Basic progress analytics', 'Community FAQ Support'],
          limitLessons: 5,
          limitDailyPractice: 5,
          limitMockTests: 1,
          hasAiWriting: false,
          hasAiSpeaking: false,
          hasTutorReview: false,
        },
        {
          name: 'Basic Preparation',
          code: 'BASIC',
          price: 15000.00,
          interval: 'MONTHLY' as const,
          features: ['20 Practice Questions / Day', '3 Full Mock Tests', 'Unlimited lessons access', 'Email Support'],
          limitLessons: -1,
          limitDailyPractice: 20,
          limitMockTests: 3,
          hasAiWriting: false,
          hasAiSpeaking: false,
          hasTutorReview: false,
        },
        {
          name: 'Pro AI Intensive',
          code: 'PRO',
          price: 35000.00,
          interval: 'MONTHLY' as const,
          features: ['Unlimited Practice & Lessons', 'Unlimited Mock Tests', 'AI Writing corrections', 'AI Speaking evaluations', 'Priority Support'],
          limitLessons: -1,
          limitDailyPractice: -1,
          limitMockTests: -1,
          hasAiWriting: true,
          hasAiSpeaking: true,
          hasTutorReview: false,
        },
        {
          name: 'Premium Tutor',
          code: 'PREMIUM',
          price: 75000.00,
          interval: 'MONTHLY' as const,
          features: ['Everything in Pro AI', '1-on-1 Tutor feedback', 'Personalized Study Plans', 'Completion Certificates'],
          limitLessons: -1,
          limitDailyPractice: -1,
          limitMockTests: -1,
          hasAiWriting: true,
          hasAiSpeaking: true,
          hasTutorReview: true,
        },
      ];

      // 3. Upsert them in the database
      for (const plan of plans) {
        await this.prisma.subscriptionPlan.upsert({
          where: { code: plan.code },
          update: {
            name: plan.name,
            price: plan.price,
            features: plan.features,
            limitLessons: plan.limitLessons,
            limitDailyPractice: plan.limitDailyPractice,
            limitMockTests: plan.limitMockTests,
            hasAiWriting: plan.hasAiWriting,
            hasAiSpeaking: plan.hasAiSpeaking,
            hasTutorReview: plan.hasTutorReview,
          },
          create: plan,
        });
      }
      console.log('[SubscriptionService] Subscription plans synchronized successfully.');
    } catch (err) {
      console.error('[SubscriptionService] Failed to synchronize subscription plans:', err);
    }
  }

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
          currency: 'NGN',
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
        // Fetch dynamic commission settings
        const typeSetting = await tx.appSettings.findUnique({
          where: { key: 'referral_commission_type' },
        });
        const commissionType = typeSetting ? typeSetting.value : 'FLAT';

        const valueSetting = await tx.appSettings.findUnique({
          where: { key: 'referral_commission_value' },
        });
        const commissionValue = valueSetting ? Number(valueSetting.value) : 1000.0;

        let rewardAmount = 0;
        if (commissionType === 'FLAT') {
          rewardAmount = commissionValue;
        } else if (commissionType === 'PERCENT') {
          rewardAmount = (finalAmount * commissionValue) / 100;
        }

        if (rewardAmount > 0) {
          await tx.user.update({
            where: { id: subscriber.referredById },
            data: { referralBalance: { increment: rewardAmount } },
          });
        }
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

  async createManualPaymentRequest(studentId: string, planId: string, receiptUrl: string) {
    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student account not found');

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    const ref = `MANUAL_REQ:${plan.id}:${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return this.prisma.payment.create({
      data: {
        userId: studentId,
        amount: plan.price,
        provider: 'MANUAL',
        providerReference: ref,
        status: 'PENDING',
        receiptUrl,
      },
    });
  }

  async approveManualPayment(adminId: string, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment record not found');
    if (payment.status !== 'PENDING') throw new BadRequestException('Payment is not pending');

    const parts = payment.providerReference.split(':');
    if (parts[0] !== 'MANUAL_REQ') throw new BadRequestException('Invalid manual payment request');
    const planId = parts[1];

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Requested subscription plan not found');

    return this.prisma.$transaction(async (tx) => {
      // Deactivate old active subscriptions
      await tx.subscription.updateMany({
        where: { userId: payment.userId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });

      // 30 days
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const subscription = await tx.subscription.create({
        data: {
          userId: payment.userId,
          planId: plan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate,
          autoRenew: false,
        },
      });

      // Update payment record to successful
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'SUCCESSFUL',
          subscriptionId: subscription.id,
        },
      });

      // Audit log admin action
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'MANUAL_APPROVE',
          target: `User ID: ${payment.userId}, Plan: ${plan.code}`,
          details: `Approved manual payment of ${payment.amount} NGN for student ID ${payment.userId} and activated plan ${plan.name}`,
        },
      });

      return updatedPayment;
    });
  }

  async getPendingManualPayments() {
    return this.prisma.payment.findMany({
      where: {
        provider: 'MANUAL',
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllManualPayments() {
    return this.prisma.payment.findMany({
      where: {
        provider: 'MANUAL',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
