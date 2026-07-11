import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { encrypt, decrypt } from '../utils/crypto';
import { ConfigService } from '@nestjs/config';
import { NotificationType, UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  private encryptionKey: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || '12345678901234567890123456789012';
  }

  // --- STATISTICS ---
  async getDashboardStats(monthQuery?: string) {
    let targetYear: number;
    let targetMonth: number;

    if (monthQuery && /^\d{4}-\d{2}$/.test(monthQuery)) {
      const parts = monthQuery.split('-');
      targetYear = parseInt(parts[0], 10);
      targetMonth = parseInt(parts[1], 10) - 1;
    } else {
      const now = new Date();
      targetYear = now.getFullYear();
      targetMonth = now.getMonth();
    }

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const totalUsers = await this.prisma.user.count({ where: { role: 'STUDENT' } });
    const monthNewUsers = await this.prisma.user.count({
      where: {
        role: 'STUDENT',
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const activeSubscribers = await this.prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        plan: {
          NOT: { code: 'FREE' },
        },
      },
    });
    
    const freeUsers = await this.prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        plan: { code: 'FREE' },
      },
    });

    const expiredSubscribers = await this.prisma.subscription.count({
      where: {
        status: 'EXPIRED',
      },
    });

    // Lifetime Revenue
    const lifetimePayments = await this.prisma.payment.findMany({
      where: { status: 'SUCCESSFUL' },
      select: { amount: true },
    });
    const lifetimeRevenue = lifetimePayments.reduce((acc, p) => acc + Number(p.amount), 0);

    // Selected Month Revenue
    const monthPayments = await this.prisma.payment.findMany({
      where: {
        status: 'SUCCESSFUL',
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: { amount: true },
    });
    const monthRevenue = monthPayments.reduce((acc, p) => acc + Number(p.amount), 0);

    const mockTestsTaken = await this.prisma.userMockAttempt.count();
    const writingSubmissions = await this.prisma.writingSubmission.count();
    const speakingSubmissions = await this.prisma.speakingSubmission.count();

    const users = await this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { createdAt: true },
    });

    const growthMap: Record<string, number> = {};
    users.forEach((u) => {
      const month = u.createdAt.toISOString().substring(0, 7); // YYYY-MM
      growthMap[month] = (growthMap[month] || 0) + 1;
    });

    const userGrowth = Object.entries(growthMap).map(([month, count]) => ({
      month,
      count,
    }));

    return {
      totalUsers,
      monthNewUsers,
      activeSubscribers,
      freeUsers,
      expiredSubscribers,
      lifetimeRevenue,
      monthRevenue,
      mockTestsTaken,
      writingSubmissions,
      speakingSubmissions,
      userGrowth,
      selectedMonth: `${targetYear}-${(targetMonth + 1).toString().padStart(2, '0')}`,
    };
  }

  // --- USER MANAGEMENT ---
  async getUsers(search?: string, role?: string) {
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.role = role;
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        targetExam: true,
        targetBand: true,
        studyStreak: true,
        isVerified: true,
        createdAt: true,
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserStatus(userId: string, data: { isVerified?: boolean; role?: any }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async getUserProgress(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        progressStats: true,
        mockAttempts: {
          include: { mockTest: true },
        },
        writingSubmissions: {
          include: { prompt: true },
        },
        speakingSubmissions: {
          include: { prompt: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    const { passwordHash: _, ...profile } = user;
    return profile;
  }

  // --- SETTINGS & AI CONFIGURATION ---
  async getSettings() {
    const settings = await this.prisma.appSettings.findMany();
    
    // Decrypt encrypted keys (like API keys) and mask them
    return settings.map((s) => {
      if (s.isEncrypted && s.value) {
        try {
          const decrypted = decrypt(s.value, this.encryptionKey);
          // Mask the value: show only first 4 and last 4 characters
          const masked = decrypted.length > 8
            ? `${decrypted.substring(0, 4)}...${decrypted.substring(decrypted.length - 4)}`
            : '********';
          return { ...s, value: masked, rawValue: decrypted }; // rawValue sent for testing connection, not exposed to client in settings UI
        } catch {
          return { ...s, value: 'Error decrypting' };
        }
      }
      return s;
    });
  }

  async updateSetting(key: string, value: string) {
    const setting = await this.prisma.appSettings.findUnique({ where: { key } });
    if (!setting) throw new NotFoundException(`Setting ${key} not found`);

    let finalValue = value;
    if (setting.isEncrypted && value && !value.includes('...')) {
      // Encrypt value if it's new (doesn't contain masking '...')
      finalValue = encrypt(value, this.encryptionKey);
    }

    return this.prisma.appSettings.update({
      where: { key },
      data: {
        value: finalValue,
      },
    });
  }

  // --- PAYOUTS (WITHDRAWALS) MANAGEMENT ---
  async getPayouts(searchTerm?: string, startDate?: string, endDate?: string) {
    const where: any = {};
    if (searchTerm) {
      where.user = {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ],
      };
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    return this.prisma.referralWithdrawal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            referralBankName: true,
            referralAccountNumber: true,
            referralAccountName: true,
            referrals: {
              select: {
                id: true,
                payments: {
                  where: { status: 'SUCCESSFUL' },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async updatePayoutStatus(id: string, status: 'PROCESSED' | 'FAILED', transactionSlipUrl?: string) {
    const withdrawal = await this.prisma.referralWithdrawal.findUnique({
      where: { id },
    });
    if (!withdrawal) throw new NotFoundException('Payout request not found');

    if (withdrawal.status !== 'PROCESSING') {
      throw new BadRequestException(`Payout is already completed/resolved as ${withdrawal.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // If failed/rejected, refund user's balance
      if (status === 'FAILED') {
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: { referralBalance: { increment: withdrawal.amount } },
        });
      }

      return tx.referralWithdrawal.update({
        where: { id },
        data: {
          status,
          transactionSlipUrl,
        },
      });
    });
  }

  async getUnattendedCounts() {
    const unattendedPayouts = await this.prisma.referralWithdrawal.count({
      where: { status: 'PROCESSING' },
    });
    const unattendedSubscriptions = await this.prisma.payment.count({
      where: {
        provider: 'MANUAL',
        status: 'PENDING',
      },
    });
    return {
      unattendedPayouts,
      unattendedSubscriptions,
    };
  }

  async sendBroadcastNotification(data: {
    title: string;
    message: string;
    targetRole?: UserRole | 'ALL';
    type: NotificationType;
  }) {
    const users = await this.prisma.user.findMany({
      where: data.targetRole && data.targetRole !== 'ALL'
        ? { role: data.targetRole as UserRole }
        : {},
      select: { id: true },
    });

    const notificationsData = users.map((u) => ({
      userId: u.id,
      title: data.title,
      message: data.message,
      type: data.type,
    }));

    if (notificationsData.length > 0) {
      await this.prisma.notification.createMany({
        data: notificationsData,
      });
    }

    return {
      success: true,
      message: `Broadcasted notification to ${users.length} users.`,
    };
  }
}
