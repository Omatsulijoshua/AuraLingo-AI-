import { Controller, Get, Post, Body, Query, UseGuards, Param, Req } from '@nestjs/common';
import { ContentService } from './content.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateWritingSubmissionDto } from './dto/create-writing-submission.dto';
import { TutorFeedbackDto } from './dto/tutor-feedback.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, Difficulty } from '@prisma/client';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('modules')
  async getModules() {
    return this.contentService.getModules();
  }

  // --- LESSONS ---
  @Get('lessons')
  async getLessons(
    @Query('moduleId') moduleId?: string,
    @Query('difficulty') difficulty?: Difficulty,
  ) {
    return this.contentService.getLessons(moduleId, difficulty);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('lessons')
  async createLesson(@Body() dto: CreateLessonDto) {
    return this.contentService.createLesson(dto);
  }

  // --- PASSAGES ---
  @Get('passages')
  async getPassages() {
    return this.contentService.getReadingPassages();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('passages')
  async createPassage(
    @Body('title') title: string,
    @Body('text') text: string,
    @Body('difficulty') difficulty: Difficulty,
  ) {
    return this.contentService.createReadingPassage(title, text, difficulty);
  }

  // --- AUDIOS ---
  @Get('audios')
  async getAudios() {
    return this.contentService.getListeningAudios();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('audios')
  async createAudio(
    @Body('title') title: string,
    @Body('audioUrl') audioUrl: string,
    @Body('transcript') transcript: string,
    @Body('duration') duration: number,
    @Body('difficulty') difficulty: Difficulty,
  ) {
    return this.contentService.createListeningAudio(title, audioUrl, transcript, duration, difficulty);
  }

  // --- QUESTIONS ---
  @Get('questions')
  async getQuestions(
    @Query('moduleId') moduleId?: string,
    @Query('difficulty') difficulty?: Difficulty,
  ) {
    return this.contentService.getQuestions(moduleId, difficulty);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('questions')
  async createQuestion(@Body() dto: CreateQuestionDto) {
    return this.contentService.createQuestion(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @Post('questions/:id/submit')
  async submitAnswer(
    @Req() req: any,
    @Param('id') questionId: string,
    @Body('answerText') answerText: string,
  ) {
    return this.contentService.submitAnswer(req.user.sub, questionId, answerText);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @Post('writing/submit')
  async submitWriting(
    @Req() req: any,
    @Body() dto: CreateWritingSubmissionDto,
  ) {
    return this.contentService.submitWriting(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @Post('speaking/submit')
  async submitSpeaking(
    @Req() req: any,
    @Body('promptId') promptId: string,
    @Body('audioUrl') audioUrl: string,
    @Body('transcription') transcription?: string,
  ) {
    return this.contentService.submitSpeaking(req.user.sub, promptId, audioUrl, transcription);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('tutor/pending')
  async getPending() {
    return this.contentService.getPendingSubmissions();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('tutor/grade/:id')
  async gradeSubmission(
    @Req() req: any,
    @Param('id') submissionId: string,
    @Body() dto: TutorFeedbackDto,
  ) {
    return this.contentService.submitTutorFeedback(req.user.sub, submissionId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('assignments')
  async createAssignment(@Req() req: any, @Body() dto: CreateAssignmentDto) {
    return this.contentService.createAssignment(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('assignments')
  async getAssignments() {
    return this.contentService.getAssignments();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @Post('assignments/:id/submit')
  async submitAssignment(
    @Req() req: any,
    @Param('id') assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.contentService.submitAssignment(req.user.sub, assignmentId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('assignments/tutor/submissions')
  async getTutorAssignments(@Req() req: any) {
    return this.contentService.getTutorSubmissions(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('assignments/submissions/:id/grade')
  async gradeAssignment(
    @Req() req: any,
    @Param('id') submissionId: string,
    @Body() dto: GradeAssignmentDto,
  ) {
    return this.contentService.gradeAssignmentSubmission(req.user.sub, submissionId, dto);
  }
}
