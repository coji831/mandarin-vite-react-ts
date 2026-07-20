-- CreateTable
CREATE TABLE "MnemonicStory" (
    "id" TEXT NOT NULL,
    "characterGlyph" TEXT NOT NULL,
    "userId" TEXT,
    "story" TEXT NOT NULL,
    "radicalIds" JSONB NOT NULL DEFAULT '[]',
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isPictograph" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MnemonicStory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MnemonicStory_characterGlyph_idx" ON "MnemonicStory"("characterGlyph");

-- CreateIndex
CREATE INDEX "MnemonicStory_userId_idx" ON "MnemonicStory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MnemonicStory_characterGlyph_userId_key" ON "MnemonicStory"("characterGlyph", "userId");
