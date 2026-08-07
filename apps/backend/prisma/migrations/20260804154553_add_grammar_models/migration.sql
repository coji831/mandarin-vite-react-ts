-- CreateTable
CREATE TABLE "GrammarPattern" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "structure" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "phase" INTEGER NOT NULL,
    "hskLevel" INTEGER,
    "sortOrder" INTEGER NOT NULL,
    "content_version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrammarPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarExample" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "patternContentId" TEXT NOT NULL,
    "chinese" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "segments" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "content_version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrammarExample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarPatternRelation" (
    "id" TEXT NOT NULL,
    "fromPatternContentId" TEXT NOT NULL,
    "toPatternContentId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL DEFAULT 'RELATED',
    "content_version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrammarPatternRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GrammarPattern_content_id_key" ON "GrammarPattern"("content_id");

-- CreateIndex
CREATE INDEX "GrammarPattern_phase_idx" ON "GrammarPattern"("phase");

-- CreateIndex
CREATE INDEX "GrammarPattern_hskLevel_idx" ON "GrammarPattern"("hskLevel");

-- CreateIndex
CREATE INDEX "GrammarPattern_sortOrder_idx" ON "GrammarPattern"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "GrammarExample_content_id_key" ON "GrammarExample"("content_id");

-- CreateIndex
CREATE INDEX "GrammarExample_patternContentId_idx" ON "GrammarExample"("patternContentId");

-- CreateIndex
CREATE INDEX "GrammarPatternRelation_toPatternContentId_idx" ON "GrammarPatternRelation"("toPatternContentId");

-- CreateIndex
CREATE UNIQUE INDEX "GrammarPatternRelation_fromPatternContentId_toPatternConten_key" ON "GrammarPatternRelation"("fromPatternContentId", "toPatternContentId");

-- AddForeignKey
ALTER TABLE "GrammarExample" ADD CONSTRAINT "GrammarExample_patternContentId_fkey" FOREIGN KEY ("patternContentId") REFERENCES "GrammarPattern"("content_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammarPatternRelation" ADD CONSTRAINT "GrammarPatternRelation_fromPatternContentId_fkey" FOREIGN KEY ("fromPatternContentId") REFERENCES "GrammarPattern"("content_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammarPatternRelation" ADD CONSTRAINT "GrammarPatternRelation_toPatternContentId_fkey" FOREIGN KEY ("toPatternContentId") REFERENCES "GrammarPattern"("content_id") ON DELETE CASCADE ON UPDATE CASCADE;
