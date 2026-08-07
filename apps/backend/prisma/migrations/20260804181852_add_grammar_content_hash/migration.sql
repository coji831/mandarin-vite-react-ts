-- AlterTable
ALTER TABLE "GrammarExample" ADD COLUMN     "content_hash" CHAR(64);

-- AlterTable
ALTER TABLE "GrammarPattern" ADD COLUMN     "content_hash" CHAR(64);

-- AlterTable
ALTER TABLE "GrammarPatternRelation" ADD COLUMN     "content_hash" CHAR(64);
