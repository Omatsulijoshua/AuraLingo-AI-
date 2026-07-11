import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AiService } from './ai.service';

@Injectable()
export class AutoSpinService {
  private readonly logger = new Logger(AutoSpinService.name);

  private progress = {
    status: 'IDLE' as 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED',
    percent: 0,
    currentStep: '',
    error: null as string | null,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  getProgress() {
    return this.progress;
  }

  resetProgress() {
    this.progress = {
      status: 'IDLE',
      percent: 0,
      currentStep: '',
      error: null,
    };
  }

  async runSpin() {
    if (this.progress.status === 'RUNNING') {
      return;
    }

    this.progress = {
      status: 'RUNNING',
      percent: 0,
      currentStep: 'Initializing AI Generation...',
      error: null,
    };

    // Common IELTS themes
    const themes = [
      'Education and Learning',
      'Technology and Digitalization',
      'Environmental Conservation and Climate Change',
      'Travel and Tourism',
      'Health, Fitness and Medicine',
      'Work, Employment and Business',
      'Family relationships and Social Structures',
      'Arts, Culture and Literature',
      'Science, Innovation and Discovery',
      'Urbanization and Modern Cities',
    ];

    const theme = themes[Math.floor(Math.random() * themes.length)];

    // Fetch Listening & Reading modules
    const listeningMod = await this.prisma.module.findFirst({ where: { name: 'LISTENING' } });
    const readingMod = await this.prisma.module.findFirst({ where: { name: 'READING' } });

    // Step 1: Listening questions (15%)
    try {
      this.progress.currentStep = `Generating Listening Practice Questions on theme: ${theme}...`;
      this.progress.percent = 5;
      if (listeningMod) {
        const prompt = `You are an expert IELTS Question Generator. Generate exactly 3 IELTS practice questions for the module "Listening" on the theme "${theme}".
Difficulty: INTERMEDIATE. Return a valid JSON array of objects. Do not include markdown code block syntax (like \`\`\`json). Output raw JSON.
Each object must match this schema:
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
        const questions = JSON.parse(jsonText);
        for (const q of questions) {
          await this.prisma.practiceQuestion.create({
            data: {
              moduleId: listeningMod.id,
              questionType: q.questionType,
              instruction: q.instruction,
              questionText: q.questionText,
              explanation: q.explanation,
              difficulty: 'INTERMEDIATE',
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
          });
        }
      }
      this.progress.percent = 15;
    } catch (err: any) {
      this.logger.error('AutoSpin Listening generation failed:', err);
    }

    // Step 2: Reading questions (33%)
    try {
      this.progress.currentStep = `Generating Reading Practice Questions on theme: ${theme}...`;
      this.progress.percent = 20;
      if (readingMod) {
        const prompt = `You are an expert IELTS Question Generator. Generate exactly 3 IELTS practice questions for the module "Reading" on the theme "${theme}".
Difficulty: INTERMEDIATE. Return a valid JSON array of objects. Do not include markdown code block syntax (like \`\`\`json). Output raw JSON.
Each object must match this schema:
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
        const questions = JSON.parse(jsonText);
        for (const q of questions) {
          await this.prisma.practiceQuestion.create({
            data: {
              moduleId: readingMod.id,
              questionType: q.questionType,
              instruction: q.instruction,
              questionText: q.questionText,
              explanation: q.explanation,
              difficulty: 'INTERMEDIATE',
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
          });
        }
      }
      this.progress.percent = 33;
    } catch (err: any) {
      this.logger.error('AutoSpin Reading generation failed:', err);
    }

    // Step 3: Writing Essays (50%)
    try {
      this.progress.currentStep = `Generating Writing Essays Prompts on theme: ${theme}...`;
      this.progress.percent = 40;
      const prompt = `You are an expert IELTS Writing Generator. Generate exactly 4 IELTS Writing Task 2 Essay prompts (agree/disagree, discuss both views, advantage/disadvantage) on the theme "${theme}".
Return a valid JSON array of objects. Do not include markdown code block syntax (like \`\`\`json). Output raw JSON.
Each object must match this schema:
{
  "title": "Short descriptive title of essay",
  "promptText": "Detailed instructions stating the essay question prompt"
}`;
      const aiResponse = await this.aiService.generateChatCompletion([{ role: 'user', content: prompt }]);
      const jsonText = aiResponse.text.replace(/^```json/, '').replace(/```$/, '').trim();
      const prompts = JSON.parse(jsonText);
      for (const p of prompts) {
        await this.prisma.writingPrompt.create({
          data: {
            title: p.title,
            promptText: p.promptText,
            examType: 'ACADEMIC',
            taskType: 'TASK_2',
            difficulty: 'INTERMEDIATE',
          },
        });
      }
      this.progress.percent = 50;
    } catch (err: any) {
      this.logger.error('AutoSpin Writing Essays generation failed:', err);
    }

    // Step 4: Writing Reports (TASK 1 Academic) (66%)
    try {
      this.progress.currentStep = `Generating Writing Reports (Academic Task 1) Prompts on theme: ${theme}...`;
      this.progress.percent = 58;
      const prompt = `You are an expert IELTS Writing Generator. Generate exactly 3 IELTS Writing Task 1 Academic (Report description of chart/graph/map/diagram) prompts on the theme "${theme}".
Return a valid JSON array of objects. Do not include markdown code block syntax (like \`\`\`json). Output raw JSON.
Each object must match this schema:
{
  "title": "Short descriptive title of chart",
  "promptText": "Detailed instructions asking the student to summarize the key features of the visual chart"
}`;
      const aiResponse = await this.aiService.generateChatCompletion([{ role: 'user', content: prompt }]);
      const jsonText = aiResponse.text.replace(/^```json/, '').replace(/```$/, '').trim();
      const prompts = JSON.parse(jsonText);
      for (const p of prompts) {
        await this.prisma.writingPrompt.create({
          data: {
            title: p.title,
            promptText: p.promptText,
            examType: 'ACADEMIC',
            taskType: 'TASK_1',
            difficulty: 'INTERMEDIATE',
          },
        });
      }
      this.progress.percent = 66;
    } catch (err: any) {
      this.logger.error('AutoSpin Writing Reports generation failed:', err);
    }

    // Step 5: Writing Letters (TASK 1 General) (83%)
    try {
      this.progress.currentStep = `Generating Writing Letters (General Task 1) Prompts on theme: ${theme}...`;
      this.progress.percent = 75;
      const prompt = `You are an expert IELTS Writing Generator. Generate exactly 3 IELTS Writing Task 1 General (Letter description requesting details, complaining or thanking) prompts on the theme "${theme}".
Return a valid JSON array of objects. Do not include markdown code block syntax (like \`\`\`json). Output raw JSON.
Each object must match this schema:
{
  "title": "Short descriptive title of letter request",
  "promptText": "Detailed instructions outlining bullet points the student must include in their formal/informal letter response"
}`;
      const aiResponse = await this.aiService.generateChatCompletion([{ role: 'user', content: prompt }]);
      const jsonText = aiResponse.text.replace(/^```json/, '').replace(/```$/, '').trim();
      const prompts = JSON.parse(jsonText);
      for (const p of prompts) {
        await this.prisma.writingPrompt.create({
          data: {
            title: p.title,
            promptText: p.promptText,
            examType: 'GENERAL',
            taskType: 'TASK_1',
            difficulty: 'INTERMEDIATE',
          },
        });
      }
      this.progress.percent = 83;
    } catch (err: any) {
      this.logger.error('AutoSpin Writing Letters generation failed:', err);
    }

    // Step 6: Speaking cue cards (100%)
    try {
      this.progress.currentStep = `Generating Speaking Module Cue Cards on theme: ${theme}...`;
      this.progress.percent = 92;
      const prompt = `You are an expert IELTS Speaking Generator. Generate exactly 4 IELTS Speaking Part 2 Cue Cards prompts on the theme "${theme}".
Return a valid JSON array of objects. Do not include markdown code block syntax (like \`\`\`json). Output raw JSON.
Each object must match this schema:
{
  "topic": "Descriptive short title of cue card",
  "cueCardText": "Describe a place, object or person context outline",
  "followUpQuestions": ["List of 3 follow up questions for Part 3 based on this cue card"]
}`;
      const aiResponse = await this.aiService.generateChatCompletion([{ role: 'user', content: prompt }]);
      const jsonText = aiResponse.text.replace(/^```json/, '').replace(/```$/, '').trim();
      const prompts = JSON.parse(jsonText);
      for (const p of prompts) {
        await this.prisma.speakingPrompt.create({
          data: {
            part: 2,
            topic: p.topic,
            cueCardText: p.cueCardText,
            followUpQuestions: p.followUpQuestions || [],
            difficulty: 'INTERMEDIATE',
          },
        });
      }
      this.progress = {
        status: 'COMPLETED',
        percent: 100,
        currentStep: 'Successfully generated IELTS questions across all modules!',
        error: null,
      };
    } catch (err: any) {
      this.logger.error('AutoSpin Speaking Cue Cards generation failed:', err);
      this.progress = {
        status: 'FAILED',
        percent: 100,
        currentStep: 'Error generating Speaking module cue cards.',
        error: err.message || 'AutoSpin process encountered an error.',
      };
    }
  }
}
