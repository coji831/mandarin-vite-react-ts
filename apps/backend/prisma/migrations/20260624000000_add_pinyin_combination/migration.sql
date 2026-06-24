-- CreateTable: PinyinCombination
-- Maps pinyin initials × finals × tones to syllables and characters
CREATE TABLE "PinyinCombination" (
    "id" TEXT NOT NULL,
    "initialId" TEXT NOT NULL,
    "finalId" TEXT NOT NULL,
    "tone" INTEGER NOT NULL,
    "syllable" TEXT NOT NULL,
    "character" TEXT,
    "meaning" TEXT,

    CONSTRAINT "PinyinCombination_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PinyinCombination_initialId_finalId_tone_key" ON "PinyinCombination"("initialId", "finalId", "tone");

-- CreateIndex
CREATE INDEX "PinyinCombination_syllable_idx" ON "PinyinCombination"("syllable");

-- CreateIndex
CREATE INDEX "PinyinCombination_initialId_idx" ON "PinyinCombination"("initialId");

-- CreateIndex
CREATE INDEX "PinyinCombination_finalId_idx" ON "PinyinCombination"("finalId");
