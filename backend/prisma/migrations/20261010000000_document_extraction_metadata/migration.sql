ALTER TABLE "Lesson"
  ADD COLUMN "documentText" TEXT,
  ADD COLUMN "documentHash" TEXT,
  ADD COLUMN "extractionStatus" TEXT,
  ADD COLUMN "extractionErrorCode" TEXT,
  ADD COLUMN "extractionTruncated" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sourceRevision" INTEGER NOT NULL DEFAULT 0;
