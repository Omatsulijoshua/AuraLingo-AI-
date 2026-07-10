import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReferralsService {
  constructor(private prisma: PrismaService) {}

  // --- STATS ---
  async getReferralStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrals: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            createdAt: true,
            payments: {
              where: { status: 'SUCCESSFUL' },
              select: { id: true },
            },
          },
        },
        withdrawals: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const unpaidCount = user.referrals.filter(r => r.payments.length === 0).length;

    const rewardSetting = await this.prisma.appSettings.findUnique({
      where: { key: 'referral_reward_naira' },
    });
    const defaultReward = rewardSetting ? Number(rewardSetting.value) : 1000.0;

    const lockedBalance = unpaidCount * defaultReward;
    const withdrawableBalance = Math.max(0, user.referralBalance - lockedBalance);

    const referralsFormatted = user.referrals.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      createdAt: r.createdAt,
      isPaidUser: r.payments.length > 0,
    }));

    return {
      referralBalance: user.referralBalance,
      withdrawableBalance,
      lockedBalance,
      unpaidReferralsCount: unpaidCount,
      isReferralVerified: user.isReferralVerified,
      bankName: user.referralBankName,
      accountNumber: user.referralAccountNumber,
      accountName: user.referralAccountName,
      totalReferralsCount: user.referrals.length,
      referralsList: referralsFormatted,
      withdrawalsHistory: user.withdrawals,
    };
  }

  // --- VERIFY BILLING BANK DETAILS ---
  async verifyReferralAccount(
    userId: string,
    bankName: string,
    accountNumber: string,
    accountName: string,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        referralBankName: bankName,
        referralAccountNumber: accountNumber,
        referralAccountName: accountName,
        isReferralVerified: true, // Auto-verify upon submission
      },
    });
  }

  // --- WITHDRAW REQUEST ---
  async requestWithdrawal(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Withdrawal amount must be greater than zero');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrals: {
          include: {
            payments: {
              where: { status: 'SUCCESSFUL' },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    if (!user.isReferralVerified) {
      throw new BadRequestException('Referral account must be verified before requesting withdrawal');
    }

    const unpaidCount = user.referrals.filter(r => r.payments.length === 0).length;

    const rewardSetting = await this.prisma.appSettings.findUnique({
      where: { key: 'referral_reward_naira' },
    });
    const defaultReward = rewardSetting ? Number(rewardSetting.value) : 1000.0;

    const lockedBalance = unpaidCount * defaultReward;
    const withdrawableBalance = Math.max(0, user.referralBalance - lockedBalance);

    if (withdrawableBalance < amount) {
      throw new BadRequestException(
        `Insufficient withdrawable balance. You have ₦${lockedBalance} pending because ${unpaidCount} of your referred users have not subscribed to a paid plan yet.`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Deduct balance
      await tx.user.update({
        where: { id: userId },
        data: { referralBalance: { decrement: amount } },
      });

      // Create withdrawal log
      return tx.referralWithdrawal.create({
        data: {
          userId,
          amount,
          status: 'PROCESSING',
        },
      });
    });
  }

  // --- TUTORS: ADD STUDENT DIRECTLY BY STUDENT ID ---
  async addStudentDirectly(tutorId: string, studentId: string) {
    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    if (student.referredById) {
      throw new BadRequestException('This student is already linked to a referrer/tutor');
    }

    return this.prisma.user.update({
      where: { id: studentId },
      data: {
        referredById: tutorId,
      },
    });
  }
}
