import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateWritingSubmissionDto } from './dto/create-writing-submission.dto';
import { TutorFeedbackDto } from './dto/tutor-feedback.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';
import { Difficulty } from '@prisma/client';
import { AiService } from '../admin/ai.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private subscriptionService: SubscriptionService,
  ) {}

  // --- MODULES ---
  async getModules() {
    return this.prisma.module.findMany({
      include: {
        lessons: true,
      },
    });
  }

  // --- PASSAGES (READING) ---
  async createReadingPassage(title: string, text: string, difficulty: Difficulty) {
    return this.prisma.readingPassage.create({
      data: { title, text, difficulty },
    });
  }

  async getReadingPassages() {
    return this.prisma.readingPassage.findMany();
  }

  // --- AUDIOS (LISTENING) ---
  async createListeningAudio(title: string, audioUrl: string, transcript: string, duration: number, difficulty: Difficulty) {
    return this.prisma.listeningAudio.create({
      data: { title, audioUrl, transcript, duration, difficulty },
    });
  }

  async getListeningAudios() {
    return this.prisma.listeningAudio.findMany();
  }

  // --- LESSONS ---
  async createLesson(dto: CreateLessonDto) {
    const module = await this.prisma.module.findUnique({ where: { id: dto.moduleId } });
    if (!module) throw new NotFoundException('Module not found');

    return this.prisma.lesson.create({
      data: {
        title: dto.title,
        content: dto.content,
        videoUrl: dto.videoUrl,
        pdfUrl: dto.pdfUrl,
        moduleId: dto.moduleId,
        difficulty: dto.difficulty,
      },
    });
  }

  async getLessons(moduleId?: string, difficulty?: Difficulty) {
    const where: any = {};
    if (moduleId) where.moduleId = moduleId;
    if (difficulty) where.difficulty = difficulty;

    return this.prisma.lesson.findMany({
      where,
      include: { module: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- QUESTIONS ---
  async createQuestion(dto: CreateQuestionDto) {
    const module = await this.prisma.module.findUnique({ where: { id: dto.moduleId } });
    if (!module) throw new NotFoundException('Module not found');

    return this.prisma.$transaction(async (tx) => {
      const question = await tx.practiceQuestion.create({
        data: {
          moduleId: dto.moduleId,
          readingPassageId: dto.readingPassageId,
          listeningAudioId: dto.listeningAudioId,
          questionType: dto.questionType,
          difficulty: dto.difficulty,
          instruction: dto.instruction,
          questionText: dto.questionText,
          explanation: dto.explanation,
        },
      });

      // Create options if provided
      if (dto.options && dto.options.length > 0) {
        await tx.questionOption.createMany({
          data: dto.options.map((opt) => ({
            questionId: question.id,
            optionText: opt.optionText,
            optionLetter: opt.optionLetter,
            isCorrect: opt.isCorrect,
          })),
        });
      }

      // Create answers if provided
      if (dto.answers && dto.answers.length > 0) {
        await tx.answer.createMany({
          data: dto.answers.map((ans) => ({
            questionId: question.id,
            correctText: ans.correctText,
            acceptableTexts: ans.acceptableTexts || [],
          })),
        });
      }

      return tx.practiceQuestion.findUnique({
        where: { id: question.id },
        include: { options: true, answers: true },
      });
    });
  }

  async getQuestions(moduleId?: string, difficulty?: Difficulty) {
    const where: any = {};
    if (moduleId) where.moduleId = moduleId;
    if (difficulty) where.difficulty = difficulty;

    return this.prisma.practiceQuestion.findMany({
      where,
      include: {
        options: true,
        answers: true,
        module: true,
        readingPassage: true,
        listeningAudio: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitAnswer(userId: string, questionId: string, answerText: string, mode?: string) {
    const question = await this.prisma.practiceQuestion.findUnique({
      where: { id: questionId },
      include: { options: true, answers: true, module: true },
    });
    if (!question) throw new NotFoundException('Practice question not found');

    const canSubmit = await this.subscriptionService.checkUserPlanLimit(userId, 'PRACTICE', mode);
    if (!canSubmit) {
      throw new BadRequestException('Daily attempt limit exceeded on your current plan. Upgrade to unlock unlimited practice and exam modes!');
    }

    let isCorrect = false;
    let correctAnswerStr = '';

    // 1. Evaluate correctness
    if (question.questionType === 'MULTIPLE_CHOICE') {
      const correctOpt = question.options.find((o) => o.isCorrect);
      correctAnswerStr = correctOpt ? correctOpt.optionLetter || correctOpt.optionText : '';
      isCorrect = answerText.trim().toUpperCase() === correctAnswerStr.toUpperCase();
    } else {
      // Find matches in answers keys
      const ansKey = question.answers[0];
      if (ansKey) {
        correctAnswerStr = ansKey.correctText;
        const choices = [ansKey.correctText.toLowerCase().trim(), ...(ansKey.acceptableTexts || []).map((t) => t.toLowerCase().trim())];
        isCorrect = choices.includes(answerText.toLowerCase().trim());
      }
    }

    const currentMode = mode || 'PRACTICE';
    let explanationText = question.explanation;

    // 2. Generate AI Explanation if enabled (only in PRACTICE mode!)
    if (currentMode === 'PRACTICE') {
      const aiEnabledSetting = await this.prisma.appSettings.findUnique({ where: { key: 'ai_enabled' } });
      if (aiEnabledSetting && aiEnabledSetting.value === 'true') {
        try {
          const aiResponse = await this.aiService.generateChatCompletion([
            {
              role: 'user',
              content: `Explain this IELTS practice question marking:
Module: ${question.module.name}
Question Type: ${question.questionType}
Instruction: ${question.instruction}
Question Text: ${question.questionText}
Correct Answer: ${correctAnswerStr}
Student Answer: ${answerText}
Is Correct: ${isCorrect}

Provide a short, 3-paragraph explanation:
1. Why the correct answer is correct.
2. Why the student's answer was correct or wrong.
3. A test-taking strategy for this question type.`,
            },
          ]);
          explanationText = aiResponse.text;
        } catch (err) {
          console.warn('[AI_EXPLAIN_ERROR] Falling back to database explanation:', err);
        }
      }
    } else {
      // In EXAM mode, suppress correct explanations during the exam
      explanationText = 'Answers and explanations are hidden during exam mode.';
    }

    // 3. Log user answer
    const userAnswer = await this.prisma.userAnswer.create({
      data: {
        userId,
        questionId,
        answerText,
        isCorrect,
        feedback: explanationText,
        mode: currentMode,
      },
    });

    // 4. Update student progress history stats
    const stats = await this.prisma.progressStats.findUnique({ where: { userId } });
    if (stats) {
      const historyKey = `${question.module.name.toLowerCase()}History`; // e.g. listeningHistory
      const history = JSON.parse(JSON.stringify(stats[historyKey as keyof typeof stats] || []));
      
      history.push({
        questionId,
        isCorrect,
        submittedAt: new Date().toISOString(),
      });

      // Update weak areas if incorrect
      const weakAreas = JSON.parse(JSON.stringify(stats.weakQuestionTypes || []));
      if (!isCorrect && !weakAreas.includes(question.questionType)) {
        weakAreas.push(question.questionType);
      }

      await this.prisma.progressStats.update({
        where: { userId },
        data: {
          [historyKey]: history,
          weakQuestionTypes: weakAreas,
        },
      });
    }

    if (currentMode === 'EXAM') {
      return {
        isCorrect: null,
        correctAnswer: null,
        explanation: 'Submitted successfully in exam mode.',
        timeStrategy: null,
        userAnswer,
      };
    }

    return {
      isCorrect,
      correctAnswer: correctAnswerStr,
      explanation: explanationText,
      timeStrategy: question.timeStrategy || 'Strategy: Read instructions carefully, allocate max 1.5 minutes per question.',
      userAnswer,
    };
  }

  // --- WRITING EVALUATION SYSTEM ---
  async submitWriting(userId: string, dto: CreateWritingSubmissionDto, mode?: string) {
    let prompt: any;
    if (dto.promptId === 'CUSTOM') {
      prompt = await this.prisma.writingPrompt.create({
        data: {
          title: 'Custom Prompt (Student)',
          promptText: dto.customQuestionText || 'Custom practice topic',
          taskType: dto.customTaskType || 'TASK_2',
          examType: (dto.customExamType as any) || 'ACADEMIC',
          difficulty: 'INTERMEDIATE',
        },
      });
      dto.promptId = prompt.id;
    } else {
      prompt = await this.prisma.writingPrompt.findUnique({ where: { id: dto.promptId } });
      if (!prompt) throw new NotFoundException('Writing prompt not found');
    }

    const wordCount = dto.userText.trim().split(/\s+/).length;

    // Get system prompt from settings
    const promptSetting = await this.prisma.appSettings.findUnique({ where: { key: 'prompt_writing_eval' } });
    let systemPrompt = promptSetting?.value || 'Grade the following essay based on IELTS criteria.';

    // Interpolate values
    systemPrompt = systemPrompt
      .replace('{taskType}', prompt.taskType)
      .replace('{promptText}', prompt.promptText)
      .replace('{userText}', dto.userText);

    // Force JSON output
    systemPrompt += `\n\nCRITICAL: Return ONLY a valid JSON object. Do not include markdown code block formatting. Format:
    {
      "estimatedBand": 7.0,
      "breakdown": {
        "taskAchievement": 7.0,
        "coherenceCohesion": 7.0,
        "lexicalResource": 7.0,
        "grammarAccuracy": 7.0
      },
      "wellDone": "Your analysis of the chart trends was solid.",
      "mistakes": ["Grammar error: 'data shows' should be 'data show' on line 3"],
      "improvedAnswer": "The charts illustrate...",
      "whyBetter": "More advanced cohesion and varied vocabulary.",
      "practiceRecommendation": "Review passive voice grammar lessons."
    }`;

    let feedbackJson: any = {
      estimatedBand: 6.5,
      breakdown: { taskAchievement: 6.5, coherenceCohesion: 6.5, lexicalResource: 6.0, grammarAccuracy: 6.5 },
      wellDone: 'Good attempt. Focus on structuring paragraphs.',
      mistakes: [],
      improvedAnswer: dto.userText,
      whyBetter: 'N/A',
      practiceRecommendation: 'Practice writing more cohesive paragraphs.',
    };

    try {
      const aiResponse = await this.aiService.generateChatCompletion([
        { role: 'user', content: systemPrompt },
      ]);
      feedbackJson = JSON.parse(aiResponse.text.trim());
    } catch (err) {
      console.warn('[AI_WRITING_EVAL_ERROR] Using fallback feedback:', err);
    }

    return this.prisma.writingSubmission.create({
      data: {
        userId,
        promptId: dto.promptId,
        userText: dto.userText,
        wordCount,
        bandScoreEstimate: feedbackJson.estimatedBand,
        feedbackJson,
        mode: mode || 'PRACTICE',
      },
      include: { prompt: true },
    });
  }

  // --- SPEAKING EVALUATION SYSTEM ---
  async submitSpeaking(
    userId: string,
    promptId: string,
    audioUrl: string,
    transcription?: string,
    mode?: string,
    customQuestionText?: string,
  ) {
    let prompt: any;
    let actualPromptId = promptId;

    if (promptId === 'CUSTOM') {
      prompt = await this.prisma.speakingPrompt.create({
        data: {
          part: 2,
          topic: 'Custom Topic (Student)',
          cueCardText: customQuestionText || 'Custom practice topic description',
          followUpQuestions: [],
          difficulty: 'INTERMEDIATE',
        },
      });
      actualPromptId = prompt.id;
    } else {
      prompt = await this.prisma.speakingPrompt.findUnique({ where: { id: promptId } });
      if (!prompt) throw new NotFoundException('Speaking prompt not found');
    }

    const finalTranscription = transcription || 'This is a sample student speaking practice response. I am describing a historic building in my hometown...';

    // Get prompt template
    const promptSetting = await this.prisma.appSettings.findUnique({ where: { key: 'prompt_speaking_eval' } });
    let systemPrompt = promptSetting?.value || 'Grade the speaking response.';

    systemPrompt = systemPrompt
      .replace('{topic}', prompt.topic)
      .replace('{cueCardText}', prompt.cueCardText || '')
      .replace('{userText}', finalTranscription);

    // Force JSON output
    systemPrompt += `\n\nCRITICAL: Return ONLY a valid JSON object. Do not include markdown code block formatting. Format:
    {
      "estimatedBand": 7.0,
      "breakdown": {
        "fluencyCoherence": 7.0,
        "lexicalResource": 7.0,
        "grammarAccuracy": 7.0,
        "pronunciation": 7.0
      },
      "wellDone": "Your fluency was good and structure was cohesive.",
      "mistakes": ["Pronunciation tip: 'historic' was pronounced incorrectly"],
      "improvedAnswer": "A building I would like to describe is...",
      "whyBetter": "Uses natural collocations and better flow.",
      "practiceRecommendation": "Practice word stress in multi-syllable nouns."
    }`;

    let feedbackJson: any = {
      estimatedBand: 6.5,
      breakdown: { fluencyCoherence: 6.5, lexicalResource: 6.5, grammarAccuracy: 6.0, pronunciation: 6.5 },
      wellDone: 'Good response. Try to expand speaking details.',
      mistakes: [],
      improvedAnswer: finalTranscription,
      whyBetter: 'N/A',
      practiceRecommendation: 'Record and practice speaking without pauses.',
    };

    try {
      const aiResponse = await this.aiService.generateChatCompletion([
        { role: 'user', content: systemPrompt },
      ]);
      feedbackJson = JSON.parse(aiResponse.text.trim());
    } catch (err) {
      console.warn('[AI_SPEAKING_EVAL_ERROR] Using fallback feedback:', err);
    }

    return this.prisma.speakingSubmission.create({
      data: {
        userId,
        promptId: actualPromptId,
        audioUrl,
        transcription: finalTranscription,
        bandScoreEstimate: feedbackJson.estimatedBand,
        feedbackJson,
        mode: mode || 'PRACTICE',
      },
      include: { prompt: true },
    });
  }

  // --- FILTERED PROMPTS LISTS ---
  async getWritingPrompts(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === 'STUDENT') {
      return this.prisma.writingPrompt.findMany({
        where: { examType: user.targetExam },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.writingPrompt.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSpeakingPrompts() {
    return this.prisma.speakingPrompt.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- TUTOR PANEL SUBMISSIONS LIST & GRADE OVERRIDES ---
  async getPendingSubmissions() {
    const writing = await this.prisma.writingSubmission.findMany({
      where: { isTutorReviewed: false },
      include: { user: true, prompt: true },
    });

    const speaking = await this.prisma.speakingSubmission.findMany({
      where: { isTutorReviewed: false },
      include: { user: true, prompt: true },
    });

    return {
      writing,
      speaking,
    };
  }

  async submitTutorFeedback(
    reviewerId: string,
    submissionId: string,
    dto: TutorFeedbackDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Create tutor feedback
      const feedback = await tx.tutorFeedback.create({
        data: {
          reviewerId,
          writingSubmissionId: dto.submissionType === 'WRITING' ? submissionId : null,
          speakingSubmissionId: dto.submissionType === 'SPEAKING' ? submissionId : null,
          bandScore: dto.bandScore,
          feedbackText: dto.feedbackText,
        },
      });

      // Update submission reviewed status
      if (dto.submissionType === 'WRITING') {
        await tx.writingSubmission.update({
          where: { id: submissionId },
          data: {
            isTutorReviewed: true,
            tutorFeedbackId: feedback.id,
            bandScoreEstimate: dto.bandScore, // Tutor override
          },
        });
      } else {
        await tx.speakingSubmission.update({
          where: { id: submissionId },
          data: {
            isTutorReviewed: true,
            tutorFeedbackId: feedback.id,
            bandScoreEstimate: dto.bandScore, // Tutor override
          },
        });
      }

      return feedback;
    });
  }

  // --- ASSIGNMENTS MANAGEMENT SYSTEM ---
  async createAssignment(tutorId: string, dto: CreateAssignmentDto) {
    return this.prisma.assignment.create({
      data: {
        title: dto.title,
        description: dto.description,
        moduleId: dto.moduleId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        tutorId,
      },
    });
  }

  async getAssignments() {
    return this.prisma.assignment.findMany({
      include: {
        module: { select: { name: true } },
        tutor: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitAssignment(studentId: string, assignmentId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    return this.prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId,
        submissionText: dto.submissionText,
      },
    });
  }

  async getTutorSubmissions(tutorId: string) {
    return this.prisma.assignmentSubmission.findMany({
      where: {
        assignment: { tutorId },
      },
      include: {
        assignment: true,
        student: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async gradeAssignmentSubmission(tutorId: string, submissionId: string, dto: GradeAssignmentDto) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });

    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.assignment.tutorId !== tutorId) {
      throw new BadRequestException('You are not authorized to grade this submission');
    }

    let finalScore = dto.score || 6.5;
    let finalFeedback = dto.feedback || 'Good attempt.';

    if (dto.useAi) {
      // Call AI to grade the assignment
      try {
        const prompt = `Grade this student IELTS assignment:
        Assignment Title: ${submission.assignment.title}
        Assignment Prompt: ${submission.assignment.description}
        Student Response: ${submission.submissionText}
        
        Evaluate the writing and provide an estimated IELTS band score and detailed feedback recommendations.
        CRITICAL: Return ONLY a valid JSON string without markdown formatting. Format:
        {
          "score": 7.0,
          "feedback": "Paragraph 1: Cohesion was great... Paragraph 2: Watch out for grammar..."
        }`;

        const aiResponse = await this.aiService.generateChatCompletion([{ role: 'user', content: prompt }]);
        const parsed = JSON.parse(aiResponse.text.trim());
        finalScore = Number(parsed.score) || finalScore;
        finalFeedback = parsed.feedback || finalFeedback;
      } catch (err) {
        console.warn('[AI_GRADE_ASSIGNMENT_ERROR] Falling back to manual details:', err);
      }
    }

    return this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: finalScore,
        feedback: finalFeedback,
        gradedAt: new Date(),
      },
    });
  }
}

