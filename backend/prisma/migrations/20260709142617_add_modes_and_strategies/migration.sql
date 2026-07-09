-- AlterTable
ALTER TABLE "PracticeQuestion" ADD COLUMN     "timeStrategy" TEXT;

-- AlterTable
ALTER TABLE "SpeakingSubmission" ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'PRACTICE';

-- AlterTable
ALTER TABLE "UserAnswer" ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'PRACTICE';

-- AlterTable
ALTER TABLE "UserMockAttempt" ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'EXAM';

-- AlterTable
ALTER TABLE "WritingSubmission" ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'PRACTICE';
