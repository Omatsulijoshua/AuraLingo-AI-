import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async createNotification(userId: string, title: string, message: string, type: NotificationType) {
    return this.prisma.notification.create({
      data: { userId, title, message, type },
    });
  }

  async triggerStreakWarning(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Check if user has study activity today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const answeredToday = await this.prisma.userAnswer.count({
      where: {
        userId,
        createdAt: { gte: startOfDay },
      },
    });

    if (answeredToday === 0 && user.studyStreak > 0) {
      return this.createNotification(
        userId,
        '🔥 Study Streak Warning!',
        `Your study streak of ${user.studyStreak} days is at risk! Complete a quick practice question today to maintain your streak!`,
        NotificationType.REMINDER,
      );
    }

    return { message: 'Streak safe: user already practiced today or streak is 0.' };
  }
}
