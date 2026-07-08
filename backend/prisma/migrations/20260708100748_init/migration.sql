-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'TUTOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('ACADEMIC', 'GENERAL');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ModuleName" AS ENUM ('LISTENING', 'READING', 'WRITING', 'SPEAKING');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'FILL_IN_THE_BLANK', 'MATCHING', 'TRUE_FALSE_NOT_GIVEN', 'YES_NO_NOT_GIVEN', 'SHORT_ANSWER', 'DRAG_AND_DROP');

-- CreateEnum
CREATE TYPE "SubscriptionInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESSFUL', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYSTACK', 'FLUTTERWAVE', 'MANUAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('REMINDER', 'FEEDBACK', 'EXPIRY', 'NEW_LESSON', 'PAYMENT', 'ANNOUNCEMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "targetExam" "ExamType" NOT NULL DEFAULT 'ACADEMIC',
    "targetBand" DOUBLE PRECISION NOT NULL DEFAULT 7.0,
    "studyStreak" INTEGER NOT NULL DEFAULT 0,
    "streakLastUpdated" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "resetToken" TEXT,
    "resetTokenExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "interval" "SubscriptionInterval" NOT NULL DEFAULT 'MONTHLY',
    "features" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "limitLessons" INTEGER NOT NULL DEFAULT -1,
    "limitDailyPractice" INTEGER NOT NULL DEFAULT -1,
    "limitMockTests" INTEGER NOT NULL DEFAULT -1,
    "hasAiWriting" BOOLEAN NOT NULL DEFAULT false,
    "hasAiSpeaking" BOOLEAN NOT NULL DEFAULT false,
    "hasTutorReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "provider" "PaymentProvider" NOT NULL,
    "providerReference" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "couponId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiryDate" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "name" "ModuleName" NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "videoUrl" TEXT,
    "pdfUrl" TEXT,
    "moduleId" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'INTERMEDIATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingPassage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'INTERMEDIATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingPassage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListeningAudio" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'INTERMEDIATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListeningAudio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeQuestion" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "readingPassageId" TEXT,
    "listeningAudioId" TEXT,
    "questionType" "QuestionType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'INTERMEDIATE',
    "instruction" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,
    "optionLetter" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "correctText" TEXT NOT NULL,
    "acceptableTexts" TEXT[],

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WritingPrompt" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "examType" "ExamType" NOT NULL,
    "taskType" TEXT NOT NULL,
    "imageUrl" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'INTERMEDIATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WritingPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakingPrompt" (
    "id" TEXT NOT NULL,
    "part" INTEGER NOT NULL,
    "cueCardText" TEXT,
    "followUpQuestions" TEXT[],
    "topic" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'INTERMEDIATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeakingPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockTest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "examType" "ExamType" NOT NULL,
    "duration" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MockTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockTestSection" (
    "id" TEXT NOT NULL,
    "mockTestId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "readingPassageId" TEXT,
    "listeningAudioId" TEXT,
    "instructions" TEXT NOT NULL,

    CONSTRAINT "MockTestSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMockAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mockTestId" TEXT NOT NULL,
    "overallBandEstimate" DOUBLE PRECISION,
    "listeningScore" DOUBLE PRECISION,
    "readingScore" DOUBLE PRECISION,
    "writingScore" DOUBLE PRECISION,
    "speakingScore" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "reportPdfUrl" TEXT,

    CONSTRAINT "UserMockAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "bandScoreEstimate" DOUBLE PRECISION,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WritingSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "userText" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "bandScoreEstimate" DOUBLE PRECISION,
    "feedbackJson" JSONB,
    "isTutorReviewed" BOOLEAN NOT NULL DEFAULT false,
    "tutorFeedbackId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WritingSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakingSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "transcription" TEXT NOT NULL,
    "bandScoreEstimate" DOUBLE PRECISION,
    "feedbackJson" JSONB,
    "isTutorReviewed" BOOLEAN NOT NULL DEFAULT false,
    "tutorFeedbackId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpeakingSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorFeedback" (
    "id" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "writingSubmissionId" TEXT,
    "speakingSubmissionId" TEXT,
    "bandScore" DOUBLE PRECISION NOT NULL,
    "feedbackText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallBandEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "listeningHistory" JSONB NOT NULL DEFAULT '[]',
    "readingHistory" JSONB NOT NULL DEFAULT '[]',
    "writingHistory" JSONB NOT NULL DEFAULT '[]',
    "speakingHistory" JSONB NOT NULL DEFAULT '[]',
    "timeSpentStudying" INTEGER NOT NULL DEFAULT 0,
    "lessonsCompletedCount" INTEGER NOT NULL DEFAULT 0,
    "mockTestsCompletedCount" INTEGER NOT NULL DEFAULT 0,
    "weakQuestionTypes" JSONB NOT NULL DEFAULT '[]',
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "ipAddress" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerReference_key" ON "Payment"("providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Module_name_key" ON "Module"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WritingSubmission_tutorFeedbackId_key" ON "WritingSubmission"("tutorFeedbackId");

-- CreateIndex
CREATE UNIQUE INDEX "SpeakingSubmission_tutorFeedbackId_key" ON "SpeakingSubmission"("tutorFeedbackId");

-- CreateIndex
CREATE UNIQUE INDEX "TutorFeedback_writingSubmissionId_key" ON "TutorFeedback"("writingSubmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "TutorFeedback_speakingSubmissionId_key" ON "TutorFeedback"("speakingSubmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressStats_userId_key" ON "ProgressStats"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_key_key" ON "AppSettings"("key");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeQuestion" ADD CONSTRAINT "PracticeQuestion_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeQuestion" ADD CONSTRAINT "PracticeQuestion_readingPassageId_fkey" FOREIGN KEY ("readingPassageId") REFERENCES "ReadingPassage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeQuestion" ADD CONSTRAINT "PracticeQuestion_listeningAudioId_fkey" FOREIGN KEY ("listeningAudioId") REFERENCES "ListeningAudio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PracticeQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PracticeQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockTestSection" ADD CONSTRAINT "MockTestSection_mockTestId_fkey" FOREIGN KEY ("mockTestId") REFERENCES "MockTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockTestSection" ADD CONSTRAINT "MockTestSection_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockTestSection" ADD CONSTRAINT "MockTestSection_readingPassageId_fkey" FOREIGN KEY ("readingPassageId") REFERENCES "ReadingPassage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockTestSection" ADD CONSTRAINT "MockTestSection_listeningAudioId_fkey" FOREIGN KEY ("listeningAudioId") REFERENCES "ListeningAudio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMockAttempt" ADD CONSTRAINT "UserMockAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMockAttempt" ADD CONSTRAINT "UserMockAttempt_mockTestId_fkey" FOREIGN KEY ("mockTestId") REFERENCES "MockTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "UserMockAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PracticeQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingSubmission" ADD CONSTRAINT "WritingSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingSubmission" ADD CONSTRAINT "WritingSubmission_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "WritingPrompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingSubmission" ADD CONSTRAINT "SpeakingSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingSubmission" ADD CONSTRAINT "SpeakingSubmission_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "SpeakingPrompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorFeedback" ADD CONSTRAINT "TutorFeedback_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorFeedback" ADD CONSTRAINT "TutorFeedback_writingSubmissionId_fkey" FOREIGN KEY ("writingSubmissionId") REFERENCES "WritingSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorFeedback" ADD CONSTRAINT "TutorFeedback_speakingSubmissionId_fkey" FOREIGN KEY ("speakingSubmissionId") REFERENCES "SpeakingSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressStats" ADD CONSTRAINT "ProgressStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
