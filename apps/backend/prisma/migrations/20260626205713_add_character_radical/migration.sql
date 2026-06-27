/*
  Warnings:

  - You are about to drop the `QuizSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuizSessionAnswer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuizSessionQuestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuizSessionSummary` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "QuizSession" DROP CONSTRAINT "QuizSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "QuizSessionAnswer" DROP CONSTRAINT "QuizSessionAnswer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "QuizSessionAnswer" DROP CONSTRAINT "QuizSessionAnswer_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "QuizSessionQuestion" DROP CONSTRAINT "QuizSessionQuestion_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "QuizSessionSummary" DROP CONSTRAINT "QuizSessionSummary_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "QuizSessionSummary" DROP CONSTRAINT "QuizSessionSummary_userId_fkey";

-- DropTable
DROP TABLE "QuizSession";

-- DropTable
DROP TABLE "QuizSessionAnswer";

-- DropTable
DROP TABLE "QuizSessionQuestion";

-- DropTable
DROP TABLE "QuizSessionSummary";

-- CreateTable
CREATE TABLE "CharacterRadical" (
    "id" SERIAL NOT NULL,
    "characterGlyph" TEXT NOT NULL,
    "radicalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterRadical_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CharacterRadical_characterGlyph_idx" ON "CharacterRadical"("characterGlyph");

-- CreateIndex
CREATE INDEX "CharacterRadical_radicalId_idx" ON "CharacterRadical"("radicalId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterRadical_characterGlyph_radicalId_key" ON "CharacterRadical"("characterGlyph", "radicalId");
