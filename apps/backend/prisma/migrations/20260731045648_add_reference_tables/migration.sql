-- CreateTable
CREATE TABLE "Radical" (
    "id" TEXT NOT NULL,
    "glyph" TEXT NOT NULL,
    "alternateGlyphs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "namePinyin" TEXT NOT NULL,
    "nameChinese" TEXT,
    "meaning" TEXT NOT NULL,
    "strokeCount" INTEGER NOT NULL,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "kangxiIndex" INTEGER,
    "etymology" TEXT,
    "frequencyRank" INTEGER,
    "notes" TEXT,
    "isAlsoCharacter" BOOLEAN,
    "variants" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Radical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tone" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "mark" TEXT NOT NULL,
    "contour" JSONB NOT NULL,
    "pitchDescription" TEXT NOT NULL,
    "exampleSyllable" TEXT,
    "exampleCharacter" TEXT,
    "color" TEXT,
    "pronunciationGuide" TEXT,
    "commonIssues" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PinyinPhoneme" (
    "id" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "phonemeType" TEXT NOT NULL,
    "type" TEXT,
    "category" TEXT,
    "ipa" TEXT,
    "description" TEXT,
    "mouthPosition" TEXT,
    "voiced" BOOLEAN,
    "aspirated" BOOLEAN,
    "toneVariants" JSONB,
    "pronunciationGuide" TEXT,
    "commonIssues" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PinyinPhoneme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TonePair" (
    "id" TEXT NOT NULL,
    "chinese" TEXT NOT NULL,
    "dictionaryPinyin" TEXT NOT NULL,
    "spokenPinyin" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TonePair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToneRule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "examples" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToneRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Radical_glyph_key" ON "Radical"("glyph");

-- CreateIndex
CREATE INDEX "Radical_kangxiIndex_idx" ON "Radical"("kangxiIndex");

-- CreateIndex
CREATE INDEX "Radical_isRecommended_idx" ON "Radical"("isRecommended");

-- CreateIndex
CREATE UNIQUE INDEX "Tone_number_key" ON "Tone"("number");

-- CreateIndex
CREATE INDEX "Tone_number_idx" ON "Tone"("number");

-- CreateIndex
CREATE INDEX "PinyinPhoneme_phonemeType_idx" ON "PinyinPhoneme"("phonemeType");

-- CreateIndex
CREATE UNIQUE INDEX "PinyinPhoneme_phonemeType_pinyin_key" ON "PinyinPhoneme"("phonemeType", "pinyin");

-- AddForeignKey
-- NOT VALID: the Radical table is populated by the seed pipeline AFTER this
-- migration, while CharacterRadical already holds rows (2,798). A validated
-- FK would fail because Radical is empty at migration time. NOT VALID skips
-- validation of pre-existing rows (future inserts are still enforced). The
-- seed guarantees every CharacterRadical.radicalId maps to one of the 20
-- curated radicals; run `ALTER TABLE "CharacterRadical" VALIDATE CONSTRAINT
-- "CharacterRadical_radicalId_fkey"` after `prisma db seed` to confirm.
ALTER TABLE "CharacterRadical" ADD CONSTRAINT "CharacterRadical_radicalId_fkey" FOREIGN KEY ("radicalId") REFERENCES "Radical"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
