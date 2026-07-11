import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, NotFoundException, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, NotificationType } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AutoSpinService } from './autospin.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    private readonly autoSpinService: AutoSpinService,
  ) {}

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getStats(@Query('month') month?: string) {
    return this.adminService.getDashboardStats(month);
  }

  @Get('users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.getUsers(search, role);
  }

  @Put('users/:id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() body: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(userId, body);
  }

  @Get('users/:id/progress')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TUTOR)
  async getUserProgress(@Param('id') userId: string) {
    return this.adminService.getUserProgress(userId);
  }

  @Get('settings')
  @Roles(UserRole.SUPER_ADMIN)
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  @Roles(UserRole.SUPER_ADMIN)
  async updateSetting(
    @Body('key') key: string,
    @Body('value') value: string,
  ) {
    return this.adminService.updateSetting(key, value);
  }

  @Post('settings/test-ai')
  @Roles(UserRole.SUPER_ADMIN)
  async testAi(
    @Body('provider') provider: string,
    @Body('model') model: string,
    @Body('apiKey') apiKey: string,
    @Body('prompt') prompt: string,
  ) {
    return this.aiService.generateChatCompletion(
      [{ role: 'user', content: prompt }],
      provider,
      model,
      apiKey,
    );
  }

  @Post('ai/generate-questions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async generateQuestions(
    @Body('moduleId') moduleId: string,
    @Body('theme') theme: string,
    @Body('count') count: number,
    @Body('difficulty') difficulty: string,
  ) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });
    if (!module) throw new NotFoundException('IELTS Module not found');

    const prompt = `You are an expert IELTS Question Generator. Generate exactly ${count} IELTS practice questions for the module "${module.name}" on the theme "${theme}".
The questions must be of difficulty level "${difficulty}".
Output a valid JSON array of objects. Do not include markdown code block syntax (like \`\`\`json). Output raw JSON.
Each object in the array must match this schema:
{
  "questionType": "MULTIPLE_CHOICE", // or "FILL_IN_THE_BLANK"
  "instruction": "string describing the test instruction",
  "questionText": "the actual question text with blanks if applicable",
  "explanation": "detailed grammatical/lexical explanation of the correct answer",
  "options": [
    { "optionText": "option label", "optionLetter": "A", "isCorrect": true },
    { "optionText": "option label", "optionLetter": "B", "isCorrect": false }
  ],
  "answers": [
    { "correctText": "the exact string matches" }
  ]
}`;

    try {
      const aiResponse = await this.aiService.generateChatCompletion([
        { role: 'user', content: prompt }
      ]);

      const responseText = aiResponse.text.trim();
      const jsonText = responseText.replace(/^```json/, '').replace(/```$/, '').trim();
      const questions = JSON.parse(jsonText);

      const createdQuestions = [];

      for (const q of questions) {
        const item = await this.prisma.practiceQuestion.create({
          data: {
            moduleId: module.id,
            questionType: q.questionType,
            difficulty: difficulty as any,
            instruction: q.instruction,
            questionText: q.questionText,
            explanation: q.explanation,
            options: q.options ? {
              createMany: {
                data: q.options.map((opt: any) => ({
                  optionText: opt.optionText,
                  optionLetter: opt.optionLetter || '',
                  isCorrect: !!opt.isCorrect,
                })),
              }
            } : undefined,
            answers: q.answers ? {
              createMany: {
                data: q.answers.map((ans: any) => ({
                  correctText: ans.correctText,
                  acceptableTexts: ans.acceptableTexts || [],
                })),
              }
            } : undefined,
          },
          include: { options: true, answers: true },
        });
        createdQuestions.push(item);
      }

      return {
        success: true,
        message: `Successfully generated and inserted ${createdQuestions.length} practice questions.`,
        questions: createdQuestions,
      };
    } catch (err: any) {
      throw new BadRequestException(`AI Generation failed: ${err.message}`);
    }
  }

  @Get('payouts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getPayouts(
    @Query('searchTerm') searchTerm?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getPayouts(searchTerm, startDate, endDate);
  }

  @Put('payouts/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updatePayout(
    @Param('id') id: string,
    @Body('status') status: 'PROCESSED' | 'FAILED',
    @Body('transactionSlipUrl') transactionSlipUrl?: string,
  ) {
    return this.adminService.updatePayoutStatus(id, status, transactionSlipUrl);
  }

  @Post('upload')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STUDENT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req: any, file: any, callback: any) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  )
  async uploadFile(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded');
    const serverUrl = process.env.SERVER_URL || 'https://bandup-ielts.onrender.com';
    return {
      url: `${serverUrl}/uploads/${file.filename}`,
    };
  }

  @Get('unattended-counts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getUnattendedCounts() {
    return this.adminService.getUnattendedCounts();
  }

  @Post('questions/manual')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async createManualQuestion(@Body() body: any) {
    const { moduleId, questionType, instruction, questionText, explanation, options, answers } = body;
    if (!moduleId || !questionType || !instruction || !questionText || !explanation) {
      throw new BadRequestException('Required fields missing');
    }
    return this.prisma.practiceQuestion.create({
      data: {
        moduleId,
        questionType,
        instruction,
        questionText,
        explanation,
        options: options ? {
          createMany: {
            data: options.map((opt: any) => ({
              optionText: opt.optionText,
              optionLetter: opt.optionLetter || '',
              isCorrect: !!opt.isCorrect,
            })),
          }
        } : undefined,
        answers: answers ? {
          createMany: {
            data: answers.map((ans: any) => ({
              correctText: ans.correctText,
              acceptableTexts: ans.acceptableTexts || [],
            })),
          }
        } : undefined,
      },
      include: { options: true, answers: true },
    });
  }

  @Post('writing-prompts/manual')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async createManualWritingPrompt(@Body() body: any) {
    const { title, promptText, examType, taskType } = body;
    if (!title || !promptText || !examType || !taskType) {
      throw new BadRequestException('Required fields missing');
    }
    return this.prisma.writingPrompt.create({
      data: {
        title,
        promptText,
        examType,
        taskType,
        difficulty: 'INTERMEDIATE',
      },
    });
  }

  @Post('speaking-prompts/manual')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async createManualSpeakingPrompt(@Body() body: any) {
    const { topic, cueCardText, followUpQuestions } = body;
    if (!topic || !cueCardText) {
      throw new BadRequestException('Required fields missing');
    }
    return this.prisma.speakingPrompt.create({
      data: {
        part: 2,
        topic,
        cueCardText,
        followUpQuestions: followUpQuestions || [],
        difficulty: 'INTERMEDIATE',
      },
    });
  }

  @Get('questions/all')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAllPracticeQuestions() {
    const questions = await this.prisma.practiceQuestion.findMany({
      include: { module: true },
      orderBy: { createdAt: 'desc' },
    });
    const writing = await this.prisma.writingPrompt.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const speaking = await this.prisma.speakingPrompt.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const modules = await this.prisma.module.findMany();
    return {
      questions,
      writing,
      speaking,
      modules,
    };
  }

  @Delete('questions/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async deleteQuestion(@Param('id') id: string) {
    return this.prisma.practiceQuestion.delete({ where: { id } });
  }

  @Delete('writing-prompts/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async deleteWritingPrompt(@Param('id') id: string) {
    return this.prisma.writingPrompt.delete({ where: { id } });
  }

  @Delete('speaking-prompts/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async deleteSpeakingPrompt(@Param('id') id: string) {
    return this.prisma.speakingPrompt.delete({ where: { id } });
  }

  @Post('ai/generate-single')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async generateSingleAiQuestion(
    @Body('type') type: 'listening' | 'reading' | 'writing_report' | 'writing_letter' | 'writing_essay' | 'speaking',
    @Body('theme') theme: string,
  ) {
    if (!type || !theme) {
      throw new BadRequestException('Type and theme are required');
    }

    const aiEnabledSetting = await this.prisma.appSettings.findUnique({
      where: { key: 'ai_enabled' },
    });
    if (!aiEnabledSetting || aiEnabledSetting.value !== 'true') {
      throw new BadRequestException('AI features are globally disabled in settings.');
    }

    try {
      if (type === 'listening' || type === 'reading') {
        const moduleName = type === 'listening' ? 'LISTENING' : 'READING';
        const mod = await this.prisma.module.findFirst({ where: { name: moduleName as any } });
        if (!mod) throw new NotFoundException(`${moduleName} module not found`);

        const prompt = `You are an expert IELTS Question Generator. Generate exactly 1 IELTS practice question for the module "${moduleName}" on the theme "${theme}".
Difficulty: INTERMEDIATE. Return a valid JSON object matching this schema. Do not include markdown code block syntax (like \`\`\`json). Output raw JSON.
{
  "questionType": "MULTIPLE_CHOICE", // or "FILL_IN_THE_BLANK"
  "instruction": "string describing the test instruction",
  "questionText": "the actual question text with blanks if applicable",
  "explanation": "detailed explanation of the correct answer",
  "options": [
    { "optionText": "option label", "optionLetter": "A", "isCorrect": true },
    { "optionText": "option label", "optionLetter": "B", "isCorrect": false }
  ],
  "answers": [
    { "correctText": "the exact string matches" }
  ]
}`;
        const aiResponse = await this.aiService.generateChatCompletion([{ role: 'user', content: prompt }]);
        const jsonText = aiResponse.text.replace(/^```json/, '').replace(/```$/, '').trim();
        const q = JSON.parse(jsonText);
        return this.prisma.practiceQuestion.create({
          data: {
            moduleId: mod.id,
            questionType: q.questionType,
            instruction: q.instruction,
            questionText: q.questionText,
            explanation: q.explanation,
            options: q.options ? {
              createMany: {
                data: q.options.map((opt: any) => ({
                  optionText: opt.optionText,
                  optionLetter: opt.optionLetter || '',
                  isCorrect: !!opt.isCorrect,
                })),
              }
            } : undefined,
            answers: q.answers ? {
              createMany: {
                data: q.answers.map((ans: any) => ({
                  correctText: ans.correctText,
                  acceptableTexts: ans.acceptableTexts || [],
                })),
              }
            } : undefined,
          },
          include: { options: true, answers: true },
        });
      } else if (type === 'writing_report' || type === 'writing_letter' || type === 'writing_essay') {
        const taskType = (type === 'writing_report' || type === 'writing_letter') ? 'TASK_1' : 'TASK_2';
        const examType = type === 'writing_report' ? 'ACADEMIC' : (type === 'writing_letter' ? 'GENERAL' : 'ACADEMIC');
        const descType = type === 'writing_report' ? 'Academic Task 1 Report description' : (type === 'writing_letter' ? 'General Task 1 Letter request' : 'Task 2 Essay');

        const prompt = `You are an expert IELTS Writing Generator. Generate exactly 1 IELTS Writing ${descType} prompt on the theme "${theme}".
Return a valid JSON object matching this schema. Do not include markdown code block syntax (like \`\`\`json). Output raw JSON.
{
  "title": "Short descriptive title",
  "promptText": "Detailed instructions for the student response"
}`;
        const aiResponse = await this.aiService.generateChatCompletion([{ role: 'user', content: prompt }]);
        const jsonText = aiResponse.text.replace(/^```json/, '').replace(/```$/, '').trim();
        const p = JSON.parse(jsonText);
        return this.prisma.writingPrompt.create({
          data: {
            title: p.title,
            promptText: p.promptText,
            examType,
            taskType,
            difficulty: 'INTERMEDIATE',
          },
        });
      } else if (type === 'speaking') {
        const prompt = `You are an expert IELTS Speaking Generator. Generate exactly 1 IELTS Speaking Part 2 Cue Card prompt on the theme "${theme}".
Return a valid JSON object matching this schema. Do not include markdown code block syntax (like \`\`\`json). Output raw JSON.
{
  "topic": "Descriptive short title",
  "cueCardText": "Describe a place, object or person context outline",
  "followUpQuestions": ["List of 3 follow up questions for Part 3 based on this cue card"]
}`;
        const aiResponse = await this.aiService.generateChatCompletion([{ role: 'user', content: prompt }]);
        const jsonText = aiResponse.text.replace(/^```json/, '').replace(/```$/, '').trim();
        const p = JSON.parse(jsonText);
        return this.prisma.speakingPrompt.create({
          data: {
            part: 2,
            topic: p.topic,
            cueCardText: p.cueCardText,
            followUpQuestions: p.followUpQuestions || [],
            difficulty: 'INTERMEDIATE',
          },
        });
      }
    } catch (err: any) {
      throw new BadRequestException(`AI Generation failed: ${err.message}`);
    }
  }

  @Post('broadcast-notification')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async broadcastNotification(
    @Body('title') title: string,
    @Body('message') message: string,
    @Body('targetRole') targetRole: UserRole | 'ALL',
    @Body('type') type: NotificationType,
  ) {
    if (!title || !message || !type) {
      throw new BadRequestException('Title, message, and type are required');
    }
    return this.adminService.sendBroadcastNotification({
      title,
      message,
      targetRole,
      type,
    });
  }

  @Post('ai/auto-spin')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async triggerAutoSpin(
    @Body('difficulty') difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    @Body('listeningCount') listeningCount?: number,
    @Body('readingCount') readingCount?: number,
    @Body('essaysCount') essaysCount?: number,
    @Body('reportsCount') reportsCount?: number,
    @Body('lettersCount') lettersCount?: number,
    @Body('speakingCount') speakingCount?: number,
  ) {
    this.autoSpinService.runSpin({
      difficulty,
      listeningCount,
      readingCount,
      essaysCount,
      reportsCount,
      lettersCount,
      speakingCount,
    }).catch((err) => {
      console.error('AutoSpin background execution failed:', err);
    });
    return { message: 'AutoSpin generation started in the background.' };
  }

  @Get('ai/auto-spin/progress')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAutoSpinProgress() {
    return this.autoSpinService.getProgress();
  }
}
