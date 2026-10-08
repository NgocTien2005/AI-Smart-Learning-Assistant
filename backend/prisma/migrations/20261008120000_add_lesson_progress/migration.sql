CREATE TABLE "LessonProgress" (
    "userId" INTEGER NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("userId", "lessonId")
);

ALTER TABLE "LessonProgress"
ADD CONSTRAINT "LessonProgress_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LessonProgress"
ADD CONSTRAINT "LessonProgress_lessonId_fkey"
FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "LessonProgress_lessonId_idx" ON "LessonProgress"("lessonId");

