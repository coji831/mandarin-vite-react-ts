-- AlterTable
ALTER TABLE "FoundationProgress" ADD COLUMN     "firstViewedAt" TIMESTAMP(3),
ADD COLUMN     "viewedCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "RadicalProgress" ADD COLUMN     "firstViewedAt" TIMESTAMP(3),
ADD COLUMN     "viewedCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ReviewItem" ADD COLUMN     "firstViewedAt" TIMESTAMP(3),
ADD COLUMN     "lastViewedAt" TIMESTAMP(3),
ADD COLUMN     "phaseId" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'viewed',
ADD COLUMN     "viewedCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "phaseId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentItem_phaseId_idx" ON "ContentItem"("phaseId");

-- CreateIndex
CREATE INDEX "ContentItem_contentType_idx" ON "ContentItem"("contentType");

-- CreateIndex
CREATE INDEX "ContentItem_phaseId_contentType_idx" ON "ContentItem"("phaseId", "contentType");

-- CreateIndex
CREATE UNIQUE INDEX "ContentItem_contentType_contentId_key" ON "ContentItem"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "ReviewItem_userId_phaseId_idx" ON "ReviewItem"("userId", "phaseId");

-- CreateIndex
CREATE INDEX "ReviewItem_userId_source_idx" ON "ReviewItem"("userId", "source");
