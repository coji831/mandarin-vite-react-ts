-- AlterTable: Add new columns (simplified is nullable initially; will be made NOT NULL after seed populates data)
ALTER TABLE "Word" ADD COLUMN     "frequencyRank" INTEGER,
ADD COLUMN     "hskLevel" INTEGER,
ADD COLUMN     "meaning" TEXT,
ADD COLUMN     "pinyin" TEXT,
ADD COLUMN     "simplified" TEXT,
ADD COLUMN     "wordClass" TEXT;

-- CreateIndex
CREATE INDEX "Word_simplified_idx" ON "Word"("simplified");

-- CreateIndex
CREATE INDEX "Word_hskLevel_idx" ON "Word"("hskLevel");

-- CreateIndex
CREATE INDEX "Word_frequencyRank_idx" ON "Word"("frequencyRank");
