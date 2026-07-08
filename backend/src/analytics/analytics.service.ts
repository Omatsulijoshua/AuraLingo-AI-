import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AiService } from '../admin/ai.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

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

  async getProgressReport(userId: string) {
    const stats = await this.getUserStats(userId);
    const mockAttempts = await this.prisma.userMockAttempt.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { startedAt: 'asc' },
    });

    const mockSummary = mockAttempts.map((att) => ({
      startedAt: att.startedAt,
      score: att.overallBandEstimate,
      listening: att.listeningScore,
      reading: att.readingScore,
      writing: att.writingScore,
      speaking: att.speakingScore,
    }));

    const prompt = `You are an IELTS tutor analyzing a student's performance logs.
    Student Target Band: ${stats.user.targetBand}
    Weekly Lessons Completed: ${stats.lessonsCompletedCount}
    Mock Exams Taken: ${mockSummary.length}
    Exam Scores History (first to latest): ${JSON.stringify(mockSummary)}
    Weak Question Types identified: ${JSON.stringify(stats.weakQuestionTypes)}
    
    Write a highly detailed, 4-paragraph student report in Markdown format:
    1. Overall Assessment: State clearly if there is an **improvement or not** based on comparison between early mock scores and recent mock scores. If there are no mock exams yet, base it on lessons/practices.
    2. Strength areas: What sections they excel in.
    3. Weakness focus: What sections and specific question types (e.g. MCQ, TFNG) they need to focus on.
    4. Strategic Study Action Plan: Tailored schedule recommending how many practice hours and lessons they should take this week to hit their target band of ${stats.user.targetBand}.`;

    try {
      const aiResponse = await this.aiService.generateChatCompletion([
        { role: 'user', content: prompt },
      ]);
      return { report: aiResponse.text };
    } catch (err) {
      return {
        report: `### Progress Report (Fallback)
* Overall Band Estimate: Band ${stats.overallBandEstimate || '6.5'}
* Target Band: Band ${stats.user.targetBand}
* Completed Lessons: ${stats.lessonsCompletedCount}

Keep practicing to generate detailed AI progress insights!`,
      };
    }
  }
}
