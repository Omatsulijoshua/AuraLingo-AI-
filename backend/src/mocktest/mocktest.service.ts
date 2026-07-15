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
  async startMockTest(
    userId: string,
    mockTestId: string,
    customDuration?: number,
    mode?: string,
    difficulty?: string,
    aiAssist?: boolean,
  ) {
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

    // Custom Mode Encoding: e.g. PRACTICE_DIFF:BEGINNER_AI:TRUE
    let modeString = mode || 'EXAM';
    if (modeString === 'PRACTICE') {
      const diff = difficulty || 'INTERMEDIATE';
      const assist = aiAssist === true ? 'TRUE' : 'FALSE';
      modeString = `PRACTICE_DIFF:${diff}_AI:${assist}`;
    }

    const attempt = await this.prisma.userMockAttempt.create({
      data: {
        userId,
        mockTestId,
        startedAt: new Date(),
        status: 'IN_PROGRESS',
        customDuration: customDuration || null,
        mode: modeString,
      },
    });

    return this.prisma.userMockAttempt.findUnique({
      where: { id: attempt.id },
      include: {
        mockTest: {
          include: {
            sections: {
              include: {
                readingPassage: true,
                listeningAudio: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  }

  // --- GET ATTEMPT DETAILS WITH CORRECTIONS ---
  async getMockAttemptDetails(userId: string, attemptId: string) {
    const attempt = await this.prisma.userMockAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        mockTest: {
          include: {
            sections: {
              include: {
                readingPassage: true,
                listeningAudio: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
                answers: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Mock test attempt not found');
    }

    return attempt;
  }

  // --- REAL-TIME AI ASSIST ---
  async getAiAssist(userId: string, attemptId: string, sectionId: string, query: string) {
    const attempt = await this.prisma.userMockAttempt.findUnique({
      where: { id: attemptId },
      include: { mockTest: { include: { sections: true } } },
    });

    if (!attempt || attempt.userId !== userId) {
      throw new NotFoundException('Attempt not found');
    }

    const section = attempt.mockTest.sections.find((s) => s.id === sectionId);
    if (!section) {
      throw new BadRequestException('Section not found in this mock test');
    }

    let tip = '';
    let suggestion = '';
    const sectionTitle = section.title;

    if (query === 'brainstorm') {
      if (sectionTitle.toLowerCase().includes('listening')) {
        tip = "Listen for key synonyms and paraphrase. In library conversations, numbers and names are frequently spelled out.";
        suggestion = "Brainstorming keywords: 'Library Card', 'Borrow limit', 'Late fee', 'Reference section'. Expect options to use synonyms like 'due date' instead of 'return date'.";
      } else if (sectionTitle.toLowerCase().includes('reading')) {
        tip = "Identify key terms in the passage. Architecture evolution texts usually compare time periods (e.g., '19th century' vs 'modern era').";
        suggestion = "Brainstorming keywords: 'Structural integrity', 'Eco-friendly', 'Material innovation'. Scan the text specifically for nouns and dates to match the questions.";
      } else {
        tip = "Try structured paragraphing: Intro, Body paragraph 1 with main arguments, Body paragraph 2 with contrast, and Conclusion.";
        suggestion = "Brainstorming keywords: 'Pragmatic skills', 'Academic learning', 'Vocational training'. Outline your response before typing.";
      }
    } else if (query === 'tackle') {
      if (sectionTitle.toLowerCase().includes('listening')) {
        tip = "Read the instructions carefully. If it says 'NO MORE THAN TWO WORDS', writing three is marked incorrect regardless of content.";
        suggestion = "Tackling strategy: 1. Underline key nouns in questions. 2. Predict the missing part of speech (noun, verb, number). 3. Listen actively for transition words like 'However' or 'On the other hand'.";
      } else {
        tip = "Do not read word-for-word. Scan for headings, topic sentences, and unique terms.";
        suggestion = "Tackling strategy: 1. Read the questions first. 2. Use skimming to locate the relevant paragraph. 3. Read the surrounding sentences intensively to check for qualifiers (e.g., 'only', 'all', 'rarely').";
      }
    } else if (query === 'weakness') {
      tip = "Analyze your previous mistakes. If you struggle with spelling, double check your text input for typos before submitting.";
      suggestion = "Improvement guidelines: Focus on matching grammar structures. If a blank requires an adjective, ensure your word is in adjective form. Build your academic vocabulary daily.";
    } else if (query === 'time') {
      tip = "Time management is crucial for a high band score.";
      suggestion = "Pacing advice: Spend no more than 20 minutes per passage or section. If you get stuck on a question, guess, move on, and flag it to return to later.";
    } else {
      tip = `Response to "${query}"`;
      suggestion = `To tackle this question, pay attention to context clues in the instructions. For ${sectionTitle}, focus on grammatical accuracy and sentence coherence. Keep practicing to build confidence!`;
    }

    return {
      tip,
      suggestion,
      timestamp: new Date(),
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
    const isSingleTextResponse = dto.answers.some(a => a.questionId === 'section_responses');

    await this.prisma.$transaction(async (tx) => {
      const sectionObj = await tx.mockTestSection.findUnique({
        where: { id: dto.sectionId }
      });
      if (!sectionObj) return;

      const questions = await this.getSectionQuestions(sectionObj);

      if (isSingleTextResponse) {
        const textAns = dto.answers.find(a => a.questionId === 'section_responses')?.answerText || '';
        const lines = textAns.split('\n');

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const qIndex = i + 1;
          const matchLine = lines.find(line => {
            const trimmed = line.trim();
            return trimmed.startsWith(`${qIndex}.`) || 
                   trimmed.startsWith(`${qIndex})`) || 
                   trimmed.startsWith(`${qIndex} `) || 
                   trimmed.toLowerCase().startsWith(`q${qIndex}:`);
          });

          let studentAnswer = '';
          if (matchLine) {
            studentAnswer = matchLine.replace(/^.*?(\d+[\.\)\s]|q\d+:)\s*/i, '').trim();
          } else if (lines[i]) {
            studentAnswer = lines[i].trim();
          }

          if (studentAnswer) {
            let isCorrect = false;
            if (q.questionType === 'MULTIPLE_CHOICE') {
              const correctOpt = q.options.find((o) => o.isCorrect);
              const correctLetter = correctOpt ? correctOpt.optionLetter || correctOpt.optionText : '';
              isCorrect = studentAnswer.trim().toUpperCase() === correctLetter.toUpperCase();
            } else {
              const correctAns = await tx.answer.findFirst({ where: { questionId: q.id } });
              if (correctAns) {
                const choices = [
                  correctAns.correctText.toLowerCase().trim(),
                  ...(correctAns.acceptableTexts || []).map((t) => t.toLowerCase().trim()),
                ];
                isCorrect = choices.includes(studentAnswer.toLowerCase().trim());
              }
            }

            await tx.userAnswer.create({
              data: {
                attemptId,
                userId,
                questionId: q.id,
                answerText: studentAnswer,
                isCorrect,
              },
            });
          }
        }
      } else {
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
