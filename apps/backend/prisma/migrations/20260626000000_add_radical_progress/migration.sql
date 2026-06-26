-- CreateTable: RadicalProgress
-- Tracks which radicals users have memorized and recognition levels.
CREATE TABLE "RadicalProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "radicalId" TEXT NOT NULL,
    "memorized" BOOLEAN NOT NULL DEFAULT false,
    "recognitionLevel" INTEGER NOT NULL DEFAULT 0,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadicalProgress_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint: one progress record per user per radical
CREATE UNIQUE INDEX "RadicalProgress_userId_radicalId_key" ON "RadicalProgress"("userId", "radicalId");

-- Create index for efficient user-scoped queries
CREATE INDEX "RadicalProgress_userId_idx" ON "RadicalProgress"("userId");
