-- AlterTable
ALTER TABLE "PhaseGate" ADD COLUMN     "phase1Retention" DOUBLE PRECISION,
ADD COLUMN     "phase2Retention" DOUBLE PRECISION,
ADD COLUMN     "phase3Retention" DOUBLE PRECISION,
ADD COLUMN     "placedPhase" INTEGER,
ADD COLUMN     "qualificationScore" INTEGER;

-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN     "phase" INTEGER;
