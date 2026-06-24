-- AlterTable: Add display/storage fields to ReviewItem
ALTER TABLE "ReviewItem" ADD COLUMN     "back" TEXT;
ALTER TABLE "ReviewItem" ADD COLUMN     "category" TEXT;
ALTER TABLE "ReviewItem" ADD COLUMN     "character" TEXT;
ALTER TABLE "ReviewItem" ADD COLUMN     "correctTone" INTEGER;
ALTER TABLE "ReviewItem" ADD COLUMN     "front" TEXT;
ALTER TABLE "ReviewItem" ADD COLUMN     "meaning" TEXT;
ALTER TABLE "ReviewItem" ADD COLUMN     "pinyinPlain" TEXT;
