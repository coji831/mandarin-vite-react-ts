-- Reviewed migration (Epic 24-11 / Story 24-11): ADDITIVE-ONLY — new enum
-- (`SrsState`) + new table (`SrsCardState`) + reserved pgvector column.
-- NO `ReviewItem` column is dropped, renamed, or re-typed; `ReviewItem` stays
-- fully live until the epic-28/34 destructive cleanup.
--
-- `CREATE EXTENSION IF NOT EXISTS vector` is a REQUIRED precondition for the
-- reserved `"vector" vector` column below — Prisma cannot emit extension
-- creation for `Unsupported("vector")` columns, and pgvector is NOT enabled on
-- the target database (verified: `pg_extension` has no `vector` row). This is
-- the canonical Prisma + pgvector pattern; the statement is idempotent and the
-- column stays EMPTY (FV14 hedge) until RAG-1.
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "SrsState" AS ENUM ('New', 'Learning', 'Review', 'Relearning');

-- CreateTable
CREATE TABLE "SrsCardState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "state" "SrsState" NOT NULL DEFAULT 'New',
    "studyCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "lastReviewed" TIMESTAMP(3),
    "nextReview" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "phaseId" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT NOT NULL DEFAULT 'viewed',
    "vector" vector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SrsCardState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SrsCardState_userId_nextReview_idx" ON "SrsCardState"("userId", "nextReview");

-- CreateIndex
CREATE INDEX "SrsCardState_userId_phaseId_idx" ON "SrsCardState"("userId", "phaseId");

-- CreateIndex
CREATE INDEX "SrsCardState_userId_source_idx" ON "SrsCardState"("userId", "source");

-- CreateIndex
CREATE UNIQUE INDEX "SrsCardState_userId_itemType_itemId_key" ON "SrsCardState"("userId", "itemType", "itemId");
