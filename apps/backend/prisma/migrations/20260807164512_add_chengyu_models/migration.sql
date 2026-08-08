-- CreateTable
CREATE TABLE "Chengyu" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "chengyu" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "literalMeaning" TEXT NOT NULL,
    "figurativeMeaning" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "storySource" TEXT NOT NULL,
    "era" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "content_version" INTEGER NOT NULL DEFAULT 1,
    "content_hash" CHAR(64),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chengyu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChengyuExample" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "chengyuContentId" TEXT NOT NULL,
    "chinese" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "segments" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "content_version" INTEGER NOT NULL DEFAULT 1,
    "content_hash" CHAR(64),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChengyuExample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChengyuRelation" (
    "id" TEXT NOT NULL,
    "fromChengyuContentId" TEXT NOT NULL,
    "toChengyuContentId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL DEFAULT 'RELATED',
    "content_version" INTEGER NOT NULL DEFAULT 1,
    "content_hash" CHAR(64),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChengyuRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chengyu_content_id_key" ON "Chengyu"("content_id");

-- CreateIndex
CREATE INDEX "Chengyu_theme_idx" ON "Chengyu"("theme");

-- CreateIndex
CREATE INDEX "Chengyu_era_idx" ON "Chengyu"("era");

-- CreateIndex
CREATE INDEX "Chengyu_sortOrder_idx" ON "Chengyu"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ChengyuExample_content_id_key" ON "ChengyuExample"("content_id");

-- CreateIndex
CREATE INDEX "ChengyuExample_chengyuContentId_idx" ON "ChengyuExample"("chengyuContentId");

-- CreateIndex
CREATE INDEX "ChengyuRelation_toChengyuContentId_idx" ON "ChengyuRelation"("toChengyuContentId");

-- CreateIndex
CREATE UNIQUE INDEX "ChengyuRelation_fromChengyuContentId_toChengyuContentId_key" ON "ChengyuRelation"("fromChengyuContentId", "toChengyuContentId");

-- AddForeignKey
ALTER TABLE "ChengyuExample" ADD CONSTRAINT "ChengyuExample_chengyuContentId_fkey" FOREIGN KEY ("chengyuContentId") REFERENCES "Chengyu"("content_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChengyuRelation" ADD CONSTRAINT "ChengyuRelation_fromChengyuContentId_fkey" FOREIGN KEY ("fromChengyuContentId") REFERENCES "Chengyu"("content_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChengyuRelation" ADD CONSTRAINT "ChengyuRelation_toChengyuContentId_fkey" FOREIGN KEY ("toChengyuContentId") REFERENCES "Chengyu"("content_id") ON DELETE CASCADE ON UPDATE CASCADE;
