-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN     "passageId" TEXT;

-- CreateTable
CREATE TABLE "StrokeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "glyph" TEXT,
    "order" INTEGER NOT NULL,
    "strokeCount" INTEGER NOT NULL DEFAULT 1,
    "exampleChars" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrokeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrokeExtendedType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "glyph" TEXT,
    "baseCategoryId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrokeExtendedType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrokeOrderRule" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "examples" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrokeOrderRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrokeCategoryOrderRule" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrokeCategoryOrderRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StrokeExtendedType_baseCategoryId_idx" ON "StrokeExtendedType"("baseCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "StrokeOrderRule_number_key" ON "StrokeOrderRule"("number");

-- CreateIndex
CREATE INDEX "StrokeCategoryOrderRule_categoryId_idx" ON "StrokeCategoryOrderRule"("categoryId");

-- CreateIndex
CREATE INDEX "StrokeCategoryOrderRule_ruleId_idx" ON "StrokeCategoryOrderRule"("ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "StrokeCategoryOrderRule_categoryId_ruleId_key" ON "StrokeCategoryOrderRule"("categoryId", "ruleId");

-- AddForeignKey
ALTER TABLE "StrokeExtendedType" ADD CONSTRAINT "StrokeExtendedType_baseCategoryId_fkey" FOREIGN KEY ("baseCategoryId") REFERENCES "StrokeCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrokeCategoryOrderRule" ADD CONSTRAINT "StrokeCategoryOrderRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "StrokeCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrokeCategoryOrderRule" ADD CONSTRAINT "StrokeCategoryOrderRule_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "StrokeOrderRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
