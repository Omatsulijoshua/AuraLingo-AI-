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
    return this.prisma.readingPassage.findMany({
      include: {
        practiceQuestions: {
          include: {
            options: true,
            answers: true,
          },
        },
      },
    });
  }

  // --- AUDIOS (LISTENING) ---
  async createListeningAudio(title: string, audioUrl: string, transcript: string, duration: number, difficulty: Difficulty) {
    return this.prisma.listeningAudio.create({
      data: { title, audioUrl, transcript, duration, difficulty },
    });
  }

  async getListeningAudios() {
    return this.prisma.listeningAudio.findMany({
      include: {
        practiceQuestions: {
          include: {
            options: true,
            answers: true,
          },
        },
      },
    });
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

  async submitWritingExaminer(
    userId: string,
    dto: {
      promptId: string;
      userText: string;
      customQuestionText?: string;
      customTaskType?: string;
      customExamType?: string;
    },
  ) {
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

    const systemPrompt = `
You are an expert IELTS Writing Examiner. Analyze the following student essay written for the prompt below in "AI Examiner Mode".
Task Type: ${prompt.taskType}
Prompt: ${prompt.promptText}
Essay: ${dto.userText}

Analyze the essay sentence by sentence. For each sentence, determine:
1. "text": The exact text of the original sentence.
2. "strength": "STRONG" (excellent sentence), "OKAY" (grammatically correct but basic/could be more cohesive or varied), or "WEAK" (contains grammatical errors, spelling errors, or poor vocabulary).
3. "critique": A brief, constructive critique explaining why it is marked as such.
4. "rewrite": An improved version of that sentence utilizing advanced vocabulary, correct grammar, and cohesive devices.

Also provide:
1. "estimatedBand": An overall estimated band score.
2. "breakdown": Estimated band score for each of the 4 IELTS criteria: Task Achievement/Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy.
3. "coachingTip": A high-impact tip for the student's next revision draft.

CRITICAL: Return ONLY a valid JSON object matching the format below. Do not include markdown code block formatting.
{
  "estimatedBand": 6.5,
  "breakdown": {
    "taskAchievement": 6.5,
    "coherenceCohesion": 6.5,
    "lexicalResource": 6.0,
    "grammarAccuracy": 6.5
  },
  "coachingTip": "Try using more formal transition words like 'Furthermore' instead of 'Also'.",
  "sentences": [
    {
      "text": "First sentence...",
      "strength": "STRONG",
      "critique": "Great introduction showing clear stance.",
      "rewrite": "First sentence..."
    }
  ]
}
`;

    let feedbackJson: any = {
      estimatedBand: 6.0,
      breakdown: { taskAchievement: 6.0, coherenceCohesion: 6.0, lexicalResource: 6.0, grammarAccuracy: 6.0 },
      coachingTip: 'Review paragraph structures.',
      sentences: [
        {
          text: dto.userText,
          strength: 'OKAY',
          critique: 'Analyze sentence-by-sentence to see feedback.',
          rewrite: dto.userText,
        },
      ],
    };

    try {
      const aiResponse = await this.aiService.generateChatCompletion([
        { role: 'user', content: systemPrompt },
      ]);
      feedbackJson = JSON.parse(aiResponse.text.trim());
    } catch (err) {
      console.warn('[AI_WRITING_EXAMINER_ERROR] Falling back:', err);
    }

    return this.prisma.writingSubmission.create({
      data: {
        userId,
        promptId: dto.promptId,
        userText: dto.userText,
        wordCount,
        bandScoreEstimate: feedbackJson.estimatedBand,
        feedbackJson,
        mode: 'EXAMINER_DRAFT1',
      },
    });
  }

  async compareDrafts(
    userId: string,
    dto: {
      promptId: string;
      draft1Text: string;
      draft2Text: string;
    },
  ) {
    const prompt = await this.prisma.writingPrompt.findUnique({ where: { id: dto.promptId } });
    if (!prompt) throw new NotFoundException('Writing prompt not found');

    const wordCount = dto.draft2Text.trim().split(/\s+/).length;

    const systemPrompt = `
You are an expert IELTS Writing Examiner. Compare the original draft (Draft 1) and the revised draft (Draft 2) of a student's essay.
Prompt: ${prompt.promptText}
Draft 1: ${dto.draft1Text}
Draft 2: ${dto.draft2Text}

Provide a comparative analysis:
1. "draft1Band": Estimated band score of Draft 1.
2. "draft2Band": Estimated band score of Draft 2.
3. "improvement": The change in band score (e.g. 0.5, 1.0, or 0.0).
4. "lexicalImprovements": Explain how the lexical resource (vocabulary) improved in Draft 2.
5. "grammarImprovements": Explain how the grammatical range and accuracy improved in Draft 2.
6. "coherenceImprovements": Explain how coherence and cohesion improved in Draft 2.
7. "summary": A motivational summary of the overall improvement and next steps.

CRITICAL: Return ONLY a valid JSON object matching the format below. Do not include markdown code block formatting.
{
  "draft1Band": 6.0,
  "draft2Band": 7.0,
  "improvement": 1.0,
  "lexicalImprovements": "Vocabulary improved...",
  "grammarImprovements": "Grammar improved...",
  "coherenceImprovements": "Coherence improved...",
  "summary": "Excellent revision."
}
`;

    let feedbackJson: any = {
      draft1Band: 6.0,
      draft2Band: 6.5,
      improvement: 0.5,
      lexicalImprovements: 'Better vocabulary diversity.',
      grammarImprovements: 'Reduced minor grammatical errors.',
      coherenceImprovements: 'Stronger transition phrases used.',
      summary: 'Good effort revising Draft 1.',
    };

    try {
      const aiResponse = await this.aiService.generateChatCompletion([
        { role: 'user', content: systemPrompt },
      ]);
      feedbackJson = JSON.parse(aiResponse.text.trim());
    } catch (err) {
      console.warn('[AI_COMPARE_DRAFTS_ERROR] Falling back:', err);
    }

    return this.prisma.writingSubmission.create({
      data: {
        userId,
        promptId: dto.promptId,
        userText: dto.draft2Text,
        wordCount,
        bandScoreEstimate: feedbackJson.draft2Band,
        feedbackJson,
        mode: 'EXAMINER_DRAFT2',
      },
    });
  }

  async getPersonalizedSchedule(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const audios = await this.prisma.listeningAudio.findMany({ select: { id: true, title: true } });
    const passages = await this.prisma.readingPassage.findMany({ select: { id: true, title: true } });
    const writingPrompts = await this.prisma.practiceQuestion.findMany({
      where: { module: { name: 'WRITING' } },
      select: { id: true, instruction: true }
    });
    const speakingPrompts = await this.prisma.speakingPrompt.findMany({ select: { id: true, topic: true } });

    let dailyTasksCount = 2;
    if (user.studyTimeCommitment === '15m') dailyTasksCount = 1;
    else if (user.studyTimeCommitment === '30m') dailyTasksCount = 2;
    else if (user.studyTimeCommitment === '1h') dailyTasksCount = 3;
    else if (user.studyTimeCommitment === '2h+') dailyTasksCount = 4;

    const schedule = [];
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + dayIndex);

      const dayName = weekdays[targetDate.getDay()];
      const dayTasks = [];

      const prioritizedModules: string[] = [];
      if (user.weaknesses && user.weaknesses.length > 0) {
        if (user.weaknesses.includes('speaking_confidence')) prioritizedModules.push('SPEAKING');
        if (user.weaknesses.includes('writing_structure')) prioritizedModules.push('WRITING');
        if (user.weaknesses.includes('reading_speed')) prioritizedModules.push('READING');
        if (user.weaknesses.includes('listening_comprehension')) prioritizedModules.push('LISTENING');
      }

      const modulesToAssign = ['LISTENING', 'WRITING', 'READING', 'SPEAKING'];

      for (let i = 0; i < modulesToAssign.length; i++) {
        const moduleName = modulesToAssign[i];
        let taskTitle = '';
        let entityId = '';

        if (moduleName === 'LISTENING' && audios.length > 0) {
          const item = audios[dayIndex % audios.length];
          taskTitle = `Listening: ${item.title}`;
          entityId = item.id;
        } else if (moduleName === 'READING' && passages.length > 0) {
          const item = passages[dayIndex % passages.length];
          taskTitle = `Reading: ${item.title}`;
          entityId = item.id;
        } else if (moduleName === 'WRITING' && writingPrompts.length > 0) {
          const item = writingPrompts[dayIndex % writingPrompts.length];
          taskTitle = `Writing: ${item.instruction.substring(0, 40)}...`;
          entityId = item.id;
        } else if (moduleName === 'SPEAKING' && speakingPrompts.length > 0) {
          const item = speakingPrompts[dayIndex % speakingPrompts.length];
          taskTitle = `Speaking: ${item.topic}`;
          entityId = item.id;
        } else {
          taskTitle = `${moduleName} Practice Session`;
          entityId = 'practice-session';
        }

        dayTasks.push({
          id: `task-${dayIndex}-${i}-${entityId}`,
          title: taskTitle,
          module: moduleName,
          type: dayIndex === 0 ? 'Today\'s Task' : 'Upcoming',
          entityId: entityId,
          completed: false,
        });
      }

      schedule.push({
        date: targetDate.toISOString().split('T')[0],
        dayLabel: dayName,
        tasks: dayTasks,
      });
    }

    return schedule;
  }
}

