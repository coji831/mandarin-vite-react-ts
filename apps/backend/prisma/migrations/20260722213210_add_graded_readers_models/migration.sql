-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "content_version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "metadata" JSONB;

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordHskLevel" (
    "wordId" TEXT NOT NULL,
    "hskLevel" INTEGER NOT NULL,
    "hskVersion" TEXT,

    CONSTRAINT "WordHskLevel_pkey" PRIMARY KEY ("wordId")
);

-- CreateTable
CREATE TABLE "CharacterHskLevel" (
    "characterId" TEXT NOT NULL,
    "hskLevel" INTEGER NOT NULL,

    CONSTRAINT "CharacterHskLevel_pkey" PRIMARY KEY ("characterId")
);

-- CreateTable
CREATE TABLE "WordCharacter" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,

    CONSTRAINT "WordCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterReading" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "tone" INTEGER NOT NULL,
    "type" TEXT,
    "commonality" INTEGER,

    CONSTRAINT "CharacterReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "content_version" INTEGER NOT NULL DEFAULT 1,
    "studyCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nextReview" TIMESTAMP(3),
    "currentDelay" INTEGER,
    "lapseCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CharacterProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordStudyContext" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "studiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordStudyContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "content_version" INTEGER NOT NULL DEFAULT 1,
    "rating" TEXT NOT NULL,
    "source" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordLookupEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "passageId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordLookupEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passage" (
    "id" TEXT NOT NULL,
    "hskLevel" INTEGER NOT NULL,
    "passageIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "knownWordRatio" DOUBLE PRECISION NOT NULL,
    "targetHskLevel" INTEGER NOT NULL,
    "generatedById" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Passage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passageId" TEXT NOT NULL,
    "currentSentence" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passageId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WordHskLevel_hskLevel_idx" ON "WordHskLevel"("hskLevel");

-- CreateIndex
CREATE INDEX "CharacterHskLevel_hskLevel_idx" ON "CharacterHskLevel"("hskLevel");

-- CreateIndex
CREATE INDEX "WordCharacter_characterId_idx" ON "WordCharacter"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "WordCharacter_wordId_characterId_key" ON "WordCharacter"("wordId", "characterId");

-- CreateIndex
CREATE INDEX "CharacterReading_characterId_idx" ON "CharacterReading"("characterId");

-- CreateIndex
CREATE INDEX "CharacterProgress_userId_idx" ON "CharacterProgress"("userId");

-- CreateIndex
CREATE INDEX "CharacterProgress_characterId_idx" ON "CharacterProgress"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterProgress_userId_characterId_key" ON "CharacterProgress"("userId", "characterId");

-- CreateIndex
CREATE INDEX "WordStudyContext_userId_characterId_idx" ON "WordStudyContext"("userId", "characterId");

-- CreateIndex
CREATE INDEX "ReviewLog_userId_itemType_timestamp_idx" ON "ReviewLog"("userId", "itemType", "timestamp");

-- CreateIndex
CREATE INDEX "WordLookupEvent_userId_idx" ON "WordLookupEvent"("userId");

-- CreateIndex
CREATE INDEX "WordLookupEvent_sessionId_idx" ON "WordLookupEvent"("sessionId");

-- CreateIndex
CREATE INDEX "WordLookupEvent_wordId_idx" ON "WordLookupEvent"("wordId");

-- CreateIndex
CREATE INDEX "WordLookupEvent_timestamp_idx" ON "WordLookupEvent"("timestamp");

-- CreateIndex
CREATE INDEX "Passage_hskLevel_idx" ON "Passage"("hskLevel");

-- CreateIndex
CREATE INDEX "Passage_lastAccessedAt_idx" ON "Passage"("lastAccessedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Passage_hskLevel_passageIndex_key" ON "Passage"("hskLevel", "passageIndex");

-- CreateIndex
CREATE INDEX "ReadingSession_userId_idx" ON "ReadingSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingSession_userId_passageId_key" ON "ReadingSession"("userId", "passageId");

-- CreateIndex
CREATE INDEX "Bookmark_userId_idx" ON "Bookmark"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_passageId_key" ON "Bookmark"("userId", "passageId");

-- CreateIndex
CREATE INDEX "Character_strokeCount_idx" ON "Character"("strokeCount");

-- AddForeignKey
ALTER TABLE "WordHskLevel" ADD CONSTRAINT "WordHskLevel_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterHskLevel" ADD CONSTRAINT "CharacterHskLevel_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordCharacter" ADD CONSTRAINT "WordCharacter_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordCharacter" ADD CONSTRAINT "WordCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterReading" ADD CONSTRAINT "CharacterReading_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterProgress" ADD CONSTRAINT "CharacterProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterProgress" ADD CONSTRAINT "CharacterProgress_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordStudyContext" ADD CONSTRAINT "WordStudyContext_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordStudyContext" ADD CONSTRAINT "WordStudyContext_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordStudyContext" ADD CONSTRAINT "WordStudyContext_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordLookupEvent" ADD CONSTRAINT "WordLookupEvent_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordLookupEvent" ADD CONSTRAINT "WordLookupEvent_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
