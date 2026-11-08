-- CreateTable
CREATE TABLE "DemoSeedDataset" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "manifest" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoSeedDataset_pkey" PRIMARY KEY ("id")
);
