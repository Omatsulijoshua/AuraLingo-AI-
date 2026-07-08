import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getUserStats(userId: string) {
    const stats = await this.prisma.progressStats.findUnique({
      where: { userId },
      include: { user: { select: { name: true, targetExam: true, targetBand: true, studyStreak: true } } },
    });

    if (!stats) {
      // Create default stats row if missing
      return this.prisma.progressStats.create({
        data: {
          userId,
        },
        include: { user: { select: { name: true, targetExam: true, targetBand: true, studyStreak: true } } },
      });
    }

    return stats;
  }

  async incrementStudyTime(userId: string, minutes: number) {
    const stats = await this.prisma.progressStats.findUnique({ where: { userId } });
    if (!stats) {
      return this.prisma.progressStats.create({
        data: { userId, timeSpentStudying: minutes },
      });
    }

    return this.prisma.progressStats.update({
      where: { userId },
      data: {
        timeSpentStudying: { increment: minutes },
      },
    });
  }

  async getWeakAreasBreakdown(userId: string) {
    const stats = await this.getUserStats(userId);
    const weakTypes = JSON.parse(JSON.stringify(stats.weakQuestionTypes || []));

    // Construct detailed descriptive names and practice recommendations
    return weakTypes.map((type: string) => {
      let desc = 'Requires reviewing matching question types.';
      let lessonRec = 'Review reading strategy guides.';
      if (type === 'MULTIPLE_CHOICE') {
        desc = 'Failing to eliminate incorrect options under timed pressure.';
        lessonRec = 'Lesson 3: Advanced MCQ Elimination.';
      } else if (type === 'FILL_IN_THE_BLANK') {
        desc = 'Spelling errors and grammar agreement mismatch.';
        lessonRec = 'Lesson 5: Grammar Agreement in Summaries.';
      } else if (type === 'TRUE_FALSE_NOT_GIVEN') {
        desc = 'Confusing False with Not Given (lack of direct textual evidence).';
        lessonRec = 'Lesson 12: Identifying Not Given constraints.';
      }

      return {
        questionType: type,
        description: desc,
        recommendedLesson: lessonRec,
      };
    });
  }
}
