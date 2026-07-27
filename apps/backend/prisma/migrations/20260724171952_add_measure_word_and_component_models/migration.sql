/*
  Warnings:

  - You are about to drop the `Progress` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Progress" DROP CONSTRAINT "Progress_userId_fkey";

-- DropTable
DROP TABLE "Progress";

-- CreateTable
CREATE TABLE "MeasureWord" (
    "id" TEXT NOT NULL,
    "simplified" TEXT NOT NULL,
    "pinyin" TEXT,
    "meaning" TEXT,
    "category" TEXT,
    "usageNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeasureWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasureWordWord" (
    "id" TEXT NOT NULL,
    "measureWordId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "exampleSentence" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MeasureWordWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Component" (
    "id" TEXT NOT NULL,
    "glyph" TEXT NOT NULL,
    "meaning" TEXT,
    "type" TEXT,
    "variantOf" TEXT,
    "strokes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterComponent" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "position" TEXT,
    "function" TEXT,

    CONSTRAINT "CharacterComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeasureWord_simplified_key" ON "MeasureWord"("simplified");

-- CreateIndex
CREATE INDEX "MeasureWord_category_idx" ON "MeasureWord"("category");

-- CreateIndex
CREATE INDEX "MeasureWordWord_wordId_idx" ON "MeasureWordWord"("wordId");

-- CreateIndex
CREATE INDEX "MeasureWordWord_measureWordId_idx" ON "MeasureWordWord"("measureWordId");

-- CreateIndex
CREATE UNIQUE INDEX "MeasureWordWord_measureWordId_wordId_key" ON "MeasureWordWord"("measureWordId", "wordId");

-- CreateIndex
CREATE UNIQUE INDEX "Component_glyph_key" ON "Component"("glyph");

-- CreateIndex
CREATE INDEX "Component_type_idx" ON "Component"("type");

-- CreateIndex
CREATE INDEX "Component_variantOf_idx" ON "Component"("variantOf");

-- CreateIndex
CREATE INDEX "CharacterComponent_characterId_idx" ON "CharacterComponent"("characterId");

-- CreateIndex
CREATE INDEX "CharacterComponent_componentId_idx" ON "CharacterComponent"("componentId");

-- CreateIndex
CREATE INDEX "CharacterComponent_function_idx" ON "CharacterComponent"("function");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterComponent_characterId_componentId_key" ON "CharacterComponent"("characterId", "componentId");

-- AddForeignKey
ALTER TABLE "MeasureWordWord" ADD CONSTRAINT "MeasureWordWord_measureWordId_fkey" FOREIGN KEY ("measureWordId") REFERENCES "MeasureWord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasureWordWord" ADD CONSTRAINT "MeasureWordWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterComponent" ADD CONSTRAINT "CharacterComponent_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterComponent" ADD CONSTRAINT "CharacterComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
