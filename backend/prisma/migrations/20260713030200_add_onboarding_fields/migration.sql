-- AlterTable
ALTER TABLE "User" ADD COLUMN "currentLevel" TEXT;
ALTER TABLE "User" ADD COLUMN "weaknesses" TEXT[];
ALTER TABLE "User" ADD COLUMN "studyTimeCommitment" TEXT;
ALTER TABLE "User" ADD COLUMN "testDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "hasBookedTest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "preferredLanguage" TEXT NOT NULL DEFAULT 'EN';
