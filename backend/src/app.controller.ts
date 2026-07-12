import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { ConfigService } from '@nestjs/config';
import { decrypt } from './utils/crypto';
import axios from 'axios';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('debug-db')
  async debugDb() {
    try {
      const [pqCount, wpCount, spCount, modules, settings] = await Promise.all([
        this.prisma.practiceQuestion.count(),
        this.prisma.writingPrompt.count(),
        this.prisma.speakingPrompt.count(),
        this.prisma.module.findMany(),
        this.prisma.appSettings.findMany({
          select: { key: true, value: true },
        }),
      ]);
      return {
        status: 'OK',
        counts: {
          practiceQuestions: pqCount,
          writingPrompts: wpCount,
          speakingPrompts: spCount,
        },
        modules,
        activeSettings: settings.map(s => ({
          key: s.key,
          hasValue: !!s.value && s.value.trim() !== '',
          valueLength: s.value ? s.value.length : 0,
        })).filter(s => s.key.startsWith('ai_') || s.key === 'active_ai_provider'),
      };
    } catch (err: any) {
      return {
        status: 'ERROR',
        message: err.message || err,
      };
    }
  }

  @Get('diagnose-db')
  async diagnoseDb() {
    try {
      const [plans, subscriptions, users] = await Promise.all([
        this.prisma.subscriptionPlan.findMany(),
        this.prisma.subscription.findMany({ include: { plan: true } }),
        this.prisma.user.findMany({ select: { id: true, email: true, role: true } }),
      ]);
      return {
        status: 'OK',
        plans,
        subscriptions: subscriptions.map(s => ({
          id: s.id,
          userId: s.userId,
          planCode: s.plan.code,
          status: s.status,
          endDate: s.endDate,
        })),
        users,
      };
    } catch (err: any) {
      return { status: 'ERROR', message: err.message || err };
    }
  }

  @Get('seed-mock-exam')
  async seedMockExam() {
    try {
      const listeningMod = await this.prisma.module.findFirst({ where: { name: 'LISTENING' } });
      const readingMod = await this.prisma.module.findFirst({ where: { name: 'READING' } });

      if (!listeningMod || !readingMod) {
        return { status: 'ERROR', message: 'Listening or Reading module not found. Run auto-spin first.' };
      }

      const existing = await this.prisma.mockTest.findFirst({
        where: { title: 'IELTS Complete Mock Test #1' }
      });
      if (existing) {
        await this.prisma.mockTest.delete({ where: { id: existing.id } }).catch(() => {});
      }

      const passage = await this.prisma.readingPassage.create({
        data: {
          title: 'The Evolution of Architecture',
          text: 'Architecture has evolved significantly over the past millennium. From Roman arches to modern glass skyscrapers, materials and structural techniques have driven style changes. Today, sustainable architectural designs prioritize ecological harmony alongside structural safety.',
          difficulty: 'INTERMEDIATE',
        }
      });

      const audio = await this.prisma.listeningAudio.create({
        data: {
          title: 'Section 1: Town Library Membership Conversation',
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          transcript: 'This is the transcript of the Town Library membership application process.',
          duration: 300,
          difficulty: 'BEGINNER',
        }
      });

      const mockTest = await this.prisma.mockTest.create({
        data: {
          title: 'IELTS Complete Mock Test #1',
          examType: 'ACADEMIC',
          duration: 160,
          active: true,
        }
      });

      await this.prisma.mockTestSection.createMany({
        data: [
          {
            mockTestId: mockTest.id,
            moduleId: listeningMod.id,
            title: 'Listening Section 1',
            order: 1,
            listeningAudioId: audio.id,
            instructions: 'Listen to the conversation about the town library membership and answer questions 1-10.',
          },
          {
            mockTestId: mockTest.id,
            moduleId: readingMod.id,
            title: 'Reading Section 1',
            order: 2,
            readingPassageId: passage.id,
            instructions: 'Read the passage about the Evolution of Architecture and answer questions 11-20.',
          }
        ]
      });

      // Create questions for Listening Section
      await this.prisma.practiceQuestion.createMany({
        data: [
          {
            id: 'mock-q1',
            moduleId: listeningMod.id,
            questionText: 'What is the town library membership fee for students?',
            questionType: 'FILL_IN_THE_BLANK',
            difficulty: 'BEGINNER',
            listeningAudioId: audio.id,
            instruction: 'Answer the question based on the listening track.',
            explanation: 'The conversation mentions student membership is completely free of charge.',
          },
          {
            id: 'mock-q2',
            moduleId: listeningMod.id,
            questionText: 'Where is the new town library annex located?',
            questionType: 'FILL_IN_THE_BLANK',
            difficulty: 'BEGINNER',
            listeningAudioId: audio.id,
            instruction: 'Answer the question based on the listening track.',
            explanation: 'The clerk states the new annex is located on North Street next to the park.',
          }
        ]
      });

      await this.prisma.answer.createMany({
        data: [
          {
            questionId: 'mock-q1',
            correctText: 'Free',
            acceptableTexts: ['0', 'nothing', 'no fee'],
          },
          {
            questionId: 'mock-q2',
            correctText: 'North Street',
            acceptableTexts: ['north st', 'north road'],
          }
        ]
      });

      // Create questions for Reading Section
      await this.prisma.practiceQuestion.createMany({
        data: [
          {
            id: 'mock-q3',
            moduleId: readingMod.id,
            questionText: 'Roman architecture introduced structural arches. (TRUE/FALSE/NOT GIVEN)',
            questionType: 'FILL_IN_THE_BLANK',
            difficulty: 'INTERMEDIATE',
            readingPassageId: passage.id,
            instruction: 'Decide if the statement matches the text.',
            explanation: 'The passage mentions the evolution from Roman arches, driving style changes.',
          },
          {
            id: 'mock-q4',
            moduleId: readingMod.id,
            questionText: 'Skyscrapers in the past prioritized ecological harmony. (TRUE/FALSE/NOT GIVEN)',
            questionType: 'FILL_IN_THE_BLANK',
            difficulty: 'INTERMEDIATE',
            readingPassageId: passage.id,
            instruction: 'Decide if the statement matches the text.',
            explanation: 'The text states that modern designs prioritize ecological harmony, indicating past ones did not.',
          }
        ]
      });

      await this.prisma.answer.createMany({
        data: [
          {
            questionId: 'mock-q3',
            correctText: 'True',
            acceptableTexts: ['t', 'yes'],
          },
          {
            questionId: 'mock-q4',
            correctText: 'False',
            acceptableTexts: ['f', 'no'],
          }
        ]
      });

      return { status: 'OK', message: 'Mock test seeded successfully!', mockTestId: mockTest.id };
    } catch (err: any) {
      return { status: 'ERROR', message: err.message || err };
    }
  }

  @Get('make-premium')
  async makePremium() {
    try {
      const student = await this.prisma.user.findFirst({
        where: { email: 'joshuaomatsuli02@gmail.com' }
      });
      if (!student) return { status: 'ERROR', message: 'Student user not found' };

      const premiumPlan = await this.prisma.subscriptionPlan.findFirst({
        where: { code: 'PREMIUM' }
      });
      if (!premiumPlan) return { status: 'ERROR', message: 'PREMIUM plan not found' };

      // Update or create subscription
      const sub = await this.prisma.subscription.findFirst({
        where: { userId: student.id }
      });

      if (sub) {
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: {
            planId: premiumPlan.id,
            status: 'ACTIVE',
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          }
        });
      } else {
        await this.prisma.subscription.create({
          data: {
            userId: student.id,
            planId: premiumPlan.id,
            status: 'ACTIVE',
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          }
        });
      }

      return { status: 'OK', message: 'Student upgraded to PREMIUM successfully!' };
    } catch (err: any) {
      return { status: 'ERROR', message: err.message || err };
    }
  }

  @Get('test-keys')
  async testKeys() {
    const settings = await this.prisma.appSettings.findMany();
    const getVal = (key: string) => settings.find((s) => s.key === key)?.value || '';

    const results: Record<string, any> = {};

    const testProvider = async (name: string, defaultModel: string, defaultUrl: string, keyVal: string, modelVal: string) => {
      const key = settings.find((s) => s.key === keyVal)?.value;
      if (!key) {
        results[name] = { status: 'SKIPPED', error: 'No key configured in settings' };
        return;
      }
      
      let decryptedKey = '';
      try {
        const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || '12345678901234567890123456789012';
        decryptedKey = decrypt(key, encryptionKey);
      } catch (err: any) {
        decryptedKey = key;
      }

      if (!decryptedKey) {
        results[name] = { status: 'DECRYPTION_EMPTY', error: 'Decrypted key is empty' };
        return;
      }

      const model = modelVal || defaultModel;

      try {
        const firstKey = decryptedKey.split(',')[0].trim();

        const response = await axios.post(
          `${defaultUrl}/chat/completions`,
          {
            model: model,
            messages: [{ role: 'user', content: 'Say hello!' }],
            temperature: 0.3,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${firstKey}`,
              ...(name === 'openrouter' ? {
                'HTTP-Referer': 'https://bandup-ielts.com',
                'X-Title': 'BandUp IELTS',
              } : {}),
            },
            timeout: 10000,
          },
        );

        results[name] = {
          status: 'SUCCESS',
          model,
          response: response.data.choices?.[0]?.message?.content || 'No text content returned',
        };
      } catch (err: any) {
        const errMsg = err.response?.data?.error?.message || err.message || err;
        results[name] = {
          status: 'FAILED',
          model,
          error: errMsg,
        };
      }
    };

    await testProvider('gemini', 'gemini-1.5-flash', 'https://generativelanguage.googleapis.com/v1beta/openai', 'ai_gemini_key', getVal('ai_gemini_model'));
    await testProvider('groq', 'llama-3.3-70b-versatile', 'https://api.groq.com/openai/v1', 'ai_groq_key', getVal('ai_groq_model'));
    await testProvider('nvidia', 'nvidia/llama-3.1-nemotron-70b-instruct', 'https://integrate.api.nvidia.com/v1', 'ai_nvidia_key', getVal('ai_nvidia_model'));
    await testProvider('openrouter', 'google/gemini-2.5-flash:free', 'https://openrouter.ai/api/v1', 'ai_openrouter_key', getVal('ai_openrouter_model'));

    return results;
  }
}
