-- Add course and lesson fields required by the LMS workflows.
ALTER TABLE "Course"
ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Lesson"
ADD COLUMN "content" TEXT,
ADD COLUMN "documentName" TEXT,
ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "documentUrl" DROP NOT NULL;

-- Course-owned data is removed together so API deletes cannot leave orphan rows.
ALTER TABLE "Course" DROP CONSTRAINT "Course_instructorId_fkey";
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_userId_fkey";
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_courseId_fkey";
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_courseId_fkey";
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_userId_fkey";
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_lessonId_fkey";

ALTER TABLE "Course" ADD CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
