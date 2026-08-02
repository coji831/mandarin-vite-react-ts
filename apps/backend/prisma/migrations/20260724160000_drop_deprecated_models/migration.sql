-- Phase C: Drop deprecated models
-- Progress was already renamed to Progress_old and dropped (0 records migrated)
-- VocabularyWord, Category, VocabularyList, WordCategory, WordList, ContentItem, PinyinCombination

-- DropForeignKey
ALTER TABLE "VocabularyList" DROP CONSTRAINT IF EXISTS "VocabularyList_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "WordCategory" DROP CONSTRAINT IF EXISTS "WordCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "WordCategory" DROP CONSTRAINT IF EXISTS "WordCategory_wordId_fkey";

-- DropForeignKey
ALTER TABLE "WordList" DROP CONSTRAINT IF EXISTS "WordList_listId_fkey";

-- DropForeignKey
ALTER TABLE "WordList" DROP CONSTRAINT IF EXISTS "WordList_wordId_fkey";

-- DropTable
DROP TABLE IF EXISTS "Category" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "ContentItem" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "PinyinCombination" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "VocabularyList" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "VocabularyWord" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "WordCategory" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "WordList" CASCADE;
