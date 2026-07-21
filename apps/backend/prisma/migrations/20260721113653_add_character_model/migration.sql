-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "glyph" TEXT NOT NULL,
    "traditional" TEXT,
    "strokeCount" INTEGER NOT NULL,
    "hskLevel" INTEGER,
    "frequencyRank" INTEGER,
    "definition" TEXT,
    "readings" JSONB NOT NULL DEFAULT '[]',
    "etymology" TEXT,
    "commonWords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Character_glyph_key" ON "Character"("glyph");

-- CreateIndex
CREATE INDEX "Character_glyph_idx" ON "Character"("glyph");

-- CreateIndex
CREATE INDEX "Character_hskLevel_idx" ON "Character"("hskLevel");
