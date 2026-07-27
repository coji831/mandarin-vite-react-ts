/*
  Warnings:

  - A unique constraint covering the columns `[characterId,radicalId]` on the table `CharacterRadical` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "classification" TEXT,
ADD COLUMN     "phoneticComponentId" TEXT;

-- AlterTable
ALTER TABLE "CharacterRadical" ADD COLUMN     "characterId" TEXT,
ADD COLUMN     "decompositionType" TEXT;

-- CreateTable
CREATE TABLE "PinyinSyllable" (
    "id" TEXT NOT NULL,
    "initial" TEXT,
    "final" TEXT,
    "tone" INTEGER NOT NULL,
    "syllable" TEXT NOT NULL,
    "syllablePretty" TEXT NOT NULL,
    "isStandard" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PinyinSyllable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PinyinCharacterMapping" (
    "id" TEXT NOT NULL,
    "pinyinSyllableId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "readingType" TEXT NOT NULL DEFAULT 'primary',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PinyinCharacterMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PinyinSyllable_syllable_idx" ON "PinyinSyllable"("syllable");

-- CreateIndex
CREATE UNIQUE INDEX "PinyinSyllable_initial_final_tone_key" ON "PinyinSyllable"("initial", "final", "tone");

-- CreateIndex
CREATE INDEX "PinyinCharacterMapping_characterId_idx" ON "PinyinCharacterMapping"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "PinyinCharacterMapping_pinyinSyllableId_characterId_reading_key" ON "PinyinCharacterMapping"("pinyinSyllableId", "characterId", "readingType");

-- CreateIndex
CREATE INDEX "Character_classification_idx" ON "Character"("classification");

-- CreateIndex
CREATE INDEX "Character_phoneticComponentId_idx" ON "Character"("phoneticComponentId");

-- CreateIndex
CREATE INDEX "CharacterRadical_characterId_idx" ON "CharacterRadical"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterRadical_characterId_radicalId_key" ON "CharacterRadical"("characterId", "radicalId");

-- AddForeignKey
ALTER TABLE "CharacterRadical" ADD CONSTRAINT "CharacterRadical_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_phoneticComponentId_fkey" FOREIGN KEY ("phoneticComponentId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinyinCharacterMapping" ADD CONSTRAINT "PinyinCharacterMapping_pinyinSyllableId_fkey" FOREIGN KEY ("pinyinSyllableId") REFERENCES "PinyinSyllable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinyinCharacterMapping" ADD CONSTRAINT "PinyinCharacterMapping_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
