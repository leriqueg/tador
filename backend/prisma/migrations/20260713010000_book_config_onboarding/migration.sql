-- AlterTable
ALTER TABLE "book_configs" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'hogar';
ALTER TABLE "book_configs" ADD COLUMN "timeZone" TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE "book_configs" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
