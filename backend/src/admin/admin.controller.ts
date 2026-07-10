import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getStats() {
    return this.adminService.getDashboardStats();
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
  @Roles(UserRole.SUPER_ADMIN)
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() body: { isVerified?: boolean; role?: UserRole },
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
  async getPayouts() {
    return this.adminService.getPayouts();
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
}
