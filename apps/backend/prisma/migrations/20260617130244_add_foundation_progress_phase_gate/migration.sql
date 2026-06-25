-- CreateTable
CREATE TABLE "FoundationProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoundationProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhaseGate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentPhase" INTEGER NOT NULL DEFAULT 1,
    "phase1Passed" BOOLEAN NOT NULL DEFAULT false,
    "phase2Passed" BOOLEAN NOT NULL DEFAULT false,
    "phase3Passed" BOOLEAN NOT NULL DEFAULT false,
    "phase4Unlocked" BOOLEAN NOT NULL DEFAULT false,
    "gateCriteria" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhaseGate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FoundationProgress_userId_idx" ON "FoundationProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FoundationProgress_userId_sectionId_key" ON "FoundationProgress"("userId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "PhaseGate_userId_key" ON "PhaseGate"("userId");

-- CreateIndex
CREATE INDEX "PhaseGate_userId_idx" ON "PhaseGate"("userId");
