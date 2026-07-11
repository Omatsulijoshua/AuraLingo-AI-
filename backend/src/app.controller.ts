import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
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
        activeSettings: settings.filter(s => s.key === 'ai_enabled' || s.key === 'active_ai_provider'),
      };
    } catch (err: any) {
      return {
        status: 'ERROR',
        message: err.message || err,
      };
    }
  }
}
