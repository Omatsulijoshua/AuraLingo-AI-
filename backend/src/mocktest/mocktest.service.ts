import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SubmitSectionDto } from './dto/submit-section.dto';
import { ExamType } from '@prisma/client';

@Injectable()
export class MockTestService {
  constructor(private prisma: PrismaService) {}

  // --- CREATE TEST ---
  async createMockTest(data: {
    title: string;
    examType: ExamType;
    duration: number;
    sections: {
      moduleId: string;
      title: string;
      order: number;
      readingPassageId?: string;
      listeningAudioId?: string;
      instructions: string;
    }[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const mockTest = await tx.mockTest.create({
        data: {
          title: data.title,
          examType: data.examType,
          duration: data.duration,
          active: true,
        },
      });

      for (const sec of data.sections) {
        await tx.mockTestSection.create({
          data: {
            mockTestId: mockTest.id,
            moduleId: sec.moduleId,
            title: sec.title,
            order: sec.order,
            readingPassageId: sec.readingPassageId || null,
            listeningAudioId: sec.listeningAudioId || null,
            instructions: sec.instructions,
          },
        });
      }

      return mockTest;
    });
  }

  // --- DELETE TEST ---
  async deleteMockTest(id: string) {
    return this.prisma.mockTest.delete({
      where: { id },
    });
  }

  // --- LIST TESTS ---
  async getMockTests() {
    return this.prisma.mockTest.findMany({
      where: { active: true },
      include: {
        sections: {
          select: { id: true, title: true, order: true },
        },
      },
    });
  }

  // --- START ATTEMPT ---
  async startMockTest(userId: string, mockTestId: string, customDuration?: number) {
    const mockTest = await this.prisma.mockTest.findUnique({
      where: { id: mockTestId },
      include: { sections: { orderBy: { order: 'asc' } } },
    });

    if (!mockTest || !mockTest.active) {
      throw new NotFoundException('Mock test not found or inactive');
    }

    if (mockTest.sections.length === 0) {
      throw new BadRequestException('This mock test has no sections configured');
    }

    const attempt = await this.prisma.userMockAttempt.create({
      data: {
        userId,
        mockTestId,
        startedAt: new Date(),
        status: 'IN_PROGRESS',
        customDuration: customDuration || null,
      },
    });

    // Get the first section questions
    const firstSection = mockTest.sections[0];
    const questions = await this.getSectionQuestions(firstSection);

    return {
      attemptId: attempt.id,
      mockTestTitle: mockTest.title,
      totalDurationMinutes: customDuration || mockTest.duration,
      firstSection: {
        id: firstSection.id,
        title: firstSection.title,
        order: firstSection.order,
        instructions: firstSection.instructions,
        questions,
      },
    };
  }

  // --- SUBMIT SECTION ---
  async submitSection(userId: string, attemptId: string, dto: SubmitSectionDto) {
    const attempt = await this.prisma.userMockAttempt.findUnique({
      where: { id: attemptId },
      include: { mockTest: { include: { sections: { orderBy: { order: 'asc' } } } } },
    });

    if (!attempt || attempt.userId !== userId) {
      throw new NotFoundException('Mock test attempt not found');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException('This attempt is already finalized');
    }

    // Check if total test duration has expired
    const elapsedMinutes = (Date.now() - new Date(attempt.startedAt).getTime()) / (60 * 1000);
    const durationLimit = attempt.customDuration || attempt.mockTest.duration;
    if (elapsedMinutes > durationLimit + 5) { // 5 mins grace period
      return this.finalizeMockAttempt(attemptId);
    }

    const sections = attempt.mockTest.sections;
    const currentSectionIndex = sections.findIndex((s) => s.id === dto.sectionId);
    if (currentSectionIndex === -1) {
      throw new BadRequestException('Invalid section ID for this mock test');
    }

    // Save student answers for the section
    await this.prisma.$transaction(async (tx) => {
      for (const ans of dto.answers) {
        const question = await tx.practiceQuestion.findUnique({
          where: { id: ans.questionId },
          include: { options: true, answers: true },
        });

        if (question) {
          let isCorrect = false;
          if (question.questionType === 'MULTIPLE_CHOICE') {
            const correctOpt = question.options.find((o) => o.isCorrect);
            const correctLetter = correctOpt ? correctOpt.optionLetter || correctOpt.optionText : '';
            isCorrect = ans.answerText.trim().toUpperCase() === correctLetter.toUpperCase();
          } else {
            const correctAns = question.answers[0];
            if (correctAns) {
              const choices = [
                correctAns.correctText.toLowerCase().trim(),
                ...(correctAns.acceptableTexts || []).map((t) => t.toLowerCase().trim()),
              ];
              isCorrect = choices.includes(ans.answerText.toLowerCase().trim());
            }
          }

          // Create UserAnswer linked to UserMockAttempt
          await tx.userAnswer.create({
            data: {
              attemptId,
              userId,
              questionId: ans.questionId,
              answerText: ans.answerText,
              isCorrect,
            },
          });
        }
      }
    });

    // Check if there is a next section
    if (currentSectionIndex < sections.length - 1) {
      const nextSection = sections[currentSectionIndex + 1];
      const questions = await this.getSectionQuestions(nextSection);

      return {
        finished: false,
        nextSection: {
          id: nextSection.id,
          title: nextSection.title,
          order: nextSection.order,
          instructions: nextSection.instructions,
          questions,
        },
      };
    } else {
      // Completed all sections -> Finalize the attempt
      return this.finalizeMockAttempt(attemptId);
    }
  }

  // --- TIME SYNC ---
  async syncTime(attemptId: string) {
    const attempt = await this.prisma.userMockAttempt.findUnique({
      where: { id: attemptId },
      include: { mockTest: true },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');

    const totalSeconds = (attempt.customDuration || attempt.mockTest.duration) * 60;
    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
    const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

    return { remainingSeconds };
  }

  // --- GET QUESTIONS FOR SECTION HELPER ---
  private async getSectionQuestions(section: any) {
    if (section.readingPassageId) {
      return this.prisma.practiceQuestion.findMany({
        where: { readingPassageId: section.readingPassageId },
        include: { options: true },
      });
    }

    if (section.listeningAudioId) {
      return this.prisma.practiceQuestion.findMany({
        where: { listeningAudioId: section.listeningAudioId },
        include: { options: true },
      });
    }

    // Default fallback to questions matching the module ID
    return this.prisma.practiceQuestion.findMany({
      where: { moduleId: section.moduleId },
      include: { options: true },
      take: 10,
    });
  }

  // --- FINALIZE TIMED MOCK TEST ---
  private async finalizeMockAttempt(attemptId: string) {
    const attempt = await this.prisma.userMockAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: {
          include: { question: { include: { module: true } } },
        },
      },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');

    // Filter answers by Listening and Reading
    const listeningAnswers = attempt.answers.filter((a) => a.question.module.name === 'LISTENING');
    const readingAnswers = attempt.answers.filter((a) => a.question.module.name === 'READING');

    const listeningCorrect = listeningAnswers.filter((a) => a.isCorrect).length;
    const readingCorrect = readingAnswers.filter((a) => a.isCorrect).length;

    // Convert correct counts to band scores (simplification out of 10 max questions for seeded test)
    const calculateSectionBand = (correct: number, total: number) => {
      if (total === 0) return 6.0;
      const pct = correct / total;
      if (pct >= 0.9) return 9.0;
      if (pct >= 0.8) return 8.0;
      if (pct >= 0.7) return 7.0;
      if (pct >= 0.6) return 6.0;
      if (pct >= 0.5) return 5.5;
      if (pct >= 0.4) return 5.0;
      return 4.5;
    };

    const listeningScore = calculateSectionBand(listeningCorrect, listeningAnswers.length);
    const readingScore = calculateSectionBand(readingCorrect, readingAnswers.length);
    const writingScore = 6.5; // Mock/AI graded average
    const speakingScore = 6.5;

    const overallBandEstimate = (listeningScore + readingScore + writingScore + speakingScore) / 4;

    const finishedAttempt = await this.prisma.userMockAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        listeningScore,
        readingScore,
        writingScore,
        speakingScore,
        overallBandEstimate,
      },
    });

    // Update student progress stats
    await this.prisma.progressStats.update({
      where: { userId: attempt.userId },
      data: {
        mockTestsCompletedCount: { increment: 1 },
        overallBandEstimate,
      },
    });

    return {
      finished: true,
      overallBandScore: overallBandEstimate,
      attempt: finishedAttempt,
    };
  }
}
