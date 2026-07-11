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

  private extractJson(text: string): string {
    const startArr = text.indexOf('[');
    const startObj = text.indexOf('{');
    
    let start = -1;
    let end = -1;
    
    if (startArr !== -1 && (startObj === -1 || startArr < startObj)) {
      start = startArr;
      end = text.lastIndexOf(']');
    } else if (startObj !== -1) {
      start = startObj;
      end = text.lastIndexOf('}');
    }
    
    if (start === -1 || end === -1 || end < start) {
      return text.replace(/^```json/, '').replace(/```$/, '').trim();
    }
    
    return text.substring(start, end + 1).trim();
  }

  async runSpin(config: {
    difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    listeningCount?: number;
    readingCount?: number;
    essaysCount?: number;
    reportsCount?: number;
    lettersCount?: number;
    speakingCount?: number;
  }) {
    if (this.progress.status === 'RUNNING') {
      return;
    }

    const difficulty = config.difficulty || 'INTERMEDIATE';
    const listeningCount = config.listeningCount !== undefined ? config.listeningCount : 3;
    const readingCount = config.readingCount !== undefined ? config.readingCount : 3;
    const essaysCount = config.essaysCount !== undefined ? config.essaysCount : 4;
    const reportsCount = config.reportsCount !== undefined ? config.reportsCount : 3;
    const lettersCount = config.lettersCount !== undefined ? config.lettersCount : 3;
    const speakingCount = config.speakingCount !== undefined ? config.speakingCount : 4;

    this.progress = {
      status: 'RUNNING',
      percent: 0,
      currentStep: 'Initializing Pro AI Generation...',
      error: null,
    };

    // Construct active steps list
    const activeSteps: Array<{ name: string; action: () => Promise<void> }> = [];

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

    // Fetch or create modules defensively
    let listeningMod = await this.prisma.module.findFirst({ where: { name: 'LISTENING' } });
    if (!listeningMod) {
      listeningMod = await this.prisma.module.create({ data: { name: 'LISTENING' } });
    }
    let readingMod = await this.prisma.module.findFirst({ where: { name: 'READING' } });
    if (!readingMod) {
      readingMod = await this.prisma.module.create({ data: { name: 'READING' } });
    }

    // 1. Listening Questions Step
    if (listeningCount > 0 && listeningMod) {
      activeSteps.push({
        name: `Generating ${listeningCount} Listening Practice Questions (${difficulty}) on theme: ${theme}`,
        action: async () => {
          const prompt = `You are an expert IELTS Question Generator. Generate exactly ${listeningCount} IELTS practice questions for the module "Listening" on the theme "${theme}".
Difficulty: ${difficulty}. Return a valid JSON array of objects. Do not include markdown code block syntax (like \`\`\`json). Output raw JSON.
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
          const jsonText = this.extractJson(aiResponse.text);
          const questions = JSON.parse(jsonText);
          for (const q of questions) {
            await this.prisma.practiceQuestion.create({
              data: {
                moduleId: listeningMod.id,
                questionType: q.questionType,
                instruction: q.instruction,
                questionText: q.questionText,
                explanation: q.explanation,
                difficulty: difficulty,
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
      });
    }

    // 2. Reading Questions Step
    if (readingCount > 0 && readingMod) {
      activeSteps.push({
        name: `Generating ${readingCount} Reading Practice Questions (${difficulty}) on theme: ${theme}`,
        action: async () => {
          const prompt = `You are an expert IELTS Question Generator. Generate exactly ${readingCount} IELTS practice questions for the module "Reading" on the theme "${theme}".
Difficulty: ${difficulty}. Return a valid JSON array of objects. Do not include markdown code block syntax (like \`\`\`json). Output raw JSON.
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
          const jsonText = this.extractJson(aiResponse.text);
          const questions = JSON.parse(jsonText);
          for (const q of questions) {
            await this.prisma.practiceQuestion.create({
              data: {
                moduleId: readingMod.id,
                questionType: q.questionType,
                instruction: q.instruction,
                questionText: q.questionText,
                explanation: q.explanation,
                difficulty: difficulty,
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
      });
    }

    // 3. Writing Essays Step
    if (essaysCount > 0) {
      activeSteps.push({
        name: `Generating ${essaysCount} Writing Task 2 Essay prompts (${difficulty}) on theme: ${theme}`,
        action: async () => {
          const prompt = `You are an expert IELTS Writing Generator. Generate exactly ${essaysCount} IELTS Writing Task 2 Essay prompts (agree/disagree, discuss both views, advantage/disadvantage) on the theme "${theme}".
Difficulty: ${difficulty}. Return a valid JSON array of objects. Do not include markdown code block syntax (like \`\`\`json). Output raw JSON.
Each object must match this schema:
{
  "title": "Short descriptive title of essay",
  "promptText": "Detailed instructions stating the essay question prompt"
}`;
          const aiResponse = await this.aiService.generateChatCompletion([{ role: 'user', content: prompt }]);
          const jsonText = this.extractJson(aiResponse.text);
          const prompts = JSON.parse(jsonText);
          for (const p of prompts) {
            await this.prisma.writingPrompt.create({
              data: {
                title: p.title,
                promptText: p.promptText,
                examType: 'ACADEMIC',
                taskType: 'TASK_2',
                difficulty: difficulty,
              },
            });
          }
        }
      });
    }

    // 4. Writing Reports Step
    if (reportsCount > 0) {
      activeSteps.push({
        name: `Generating ${reportsCount} Writing Task 1 Academic Reports (${difficulty}) on theme: ${theme}`,
        action: async () => {
          const prompt = `You are an expert IELTS Writing Generator. Generate exactly ${reportsCount} IELTS Writing Task 1 Academic (Report description of chart/graph/map/diagram) prompts on the theme "${theme}".
Difficulty: ${difficulty}. Return a valid JSON array of objects. Do not include markdown code block syntax (like \`\`\`json). Output raw JSON.
Each object must match this schema:
{
  "title": "Short descriptive title of chart",
  "promptText": "Detailed instructions asking the student to summarize the key features of the visual chart"
}`;
          const aiResponse = await this.aiService.generateChatCompletion([{ role: 'user', content: prompt }]);
          const jsonText = this.extractJson(aiResponse.text);
          const prompts = JSON.parse(jsonText);
          for (const p of prompts) {
            await this.prisma.writingPrompt.create({
              data: {
                title: p.title,
                promptText: p.promptText,
                examType: 'ACADEMIC',
                taskType: 'TASK_1',
                difficulty: difficulty,
              },
            });
          }
        }
      });
    }

    // 5. Writing Letters Step
    if (lettersCount > 0) {
      activeSteps.push({
        name: `Generating ${lettersCount} Writing Task 1 General Letters (${difficulty}) on theme: ${theme}`,
        action: async () => {
          const prompt = `You are an expert IELTS Writing Generator. Generate exactly ${lettersCount} IELTS Writing Task 1 General (Letter description requesting details, complaining or thanking) prompts on the theme "${theme}".
Difficulty: ${difficulty}. Return a valid JSON array of objects. Do not include markdown code block syntax (like \`\`\`json). Output raw JSON.
Each object must match this schema:
{
  "title": "Short descriptive title of letter request",
  "promptText": "Detailed instructions outlining bullet points the student must include in their formal/informal letter response"
}`;
          const aiResponse = await this.aiService.generateChatCompletion([{ role: 'user', content: prompt }]);
          const jsonText = this.extractJson(aiResponse.text);
          const prompts = JSON.parse(jsonText);
          for (const p of prompts) {
            await this.prisma.writingPrompt.create({
              data: {
                title: p.title,
                promptText: p.promptText,
                examType: 'GENERAL',
                taskType: 'TASK_1',
                difficulty: difficulty,
              },
            });
          }
        }
      });
    }

    // 6. Speaking Step
    if (speakingCount > 0) {
      activeSteps.push({
        name: `Generating ${speakingCount} Speaking Cue Cards (${difficulty}) on theme: ${theme}`,
        action: async () => {
          const prompt = `You are an expert IELTS Speaking Generator. Generate exactly ${speakingCount} IELTS Speaking Part 2 Cue Cards prompts on the theme "${theme}".
Difficulty: ${difficulty}. Return a valid JSON array of objects. Do not include markdown code block syntax (like \`\`\`json). Output raw JSON.
Each object must match this schema:
{
  "topic": "Descriptive short title of cue card",
  "cueCardText": "Describe a place, object or person context outline",
  "followUpQuestions": ["List of 3 follow up questions for Part 3 based on this cue card"]
}`;
          const aiResponse = await this.aiService.generateChatCompletion([{ role: 'user', content: prompt }]);
          const jsonText = this.extractJson(aiResponse.text);
          const prompts = JSON.parse(jsonText);
          for (const p of prompts) {
            await this.prisma.speakingPrompt.create({
              data: {
                part: 2,
                topic: p.topic,
                cueCardText: p.cueCardText,
                followUpQuestions: p.followUpQuestions || [],
                difficulty: difficulty,
              },
            });
          }
        }
      });
    }

    // Execute steps and update progress bar
    if (activeSteps.length === 0) {
      this.progress = {
        status: 'COMPLETED',
        percent: 100,
        currentStep: 'Completed. No sections selected for generation.',
        error: null,
      };
      return;
    }

    let completedSteps = 0;
    for (const step of activeSteps) {
      try {
        this.progress.currentStep = step.name;
        this.progress.percent = Math.round((completedSteps / activeSteps.length) * 100);
        await step.action();
        completedSteps++;
      } catch (err: any) {
        this.logger.error(`Error executing generation step [${step.name}]:`, err);
      }
    }

    if (completedSteps === 0) {
      this.progress = {
        status: 'FAILED',
        percent: 0,
        currentStep: 'Failed to generate any questions. Check active AI key configurations.',
        error: 'All generation steps failed. Please verify that your active provider key is valid in settings.',
      };
    } else {
      this.progress = {
        status: 'COMPLETED',
        percent: 100,
        currentStep: `Successfully generated and inserted questions across ${completedSteps}/${activeSteps.length} sections!`,
        error: null,
      };
    }
  }
}
