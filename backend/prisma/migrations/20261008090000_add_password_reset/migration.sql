-- AlterTable
ALTER TABLE "User"
ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "passwordResetTokenHash" TEXT,
ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN "passwordResetRequestedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetTokenHash_key" ON "User"("passwordResetTokenHash");
