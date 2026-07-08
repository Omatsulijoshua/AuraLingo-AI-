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
          select: { id: true, name: true, email: true, createdAt: true },
        },
        withdrawals: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      referralBalance: user.referralBalance,
      isReferralVerified: user.isReferralVerified,
      bankName: user.referralBankName,
      accountNumber: user.referralAccountNumber,
      accountName: user.referralAccountName,
      totalReferralsCount: user.referrals.length,
      referralsList: user.referrals,
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

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.isReferralVerified) {
      throw new BadRequestException('Referral account must be verified before requesting withdrawal');
    }

    if (user.referralBalance < amount) {
      throw new BadRequestException('Insufficient referral balance');
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
          status: 'PENDING',
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
