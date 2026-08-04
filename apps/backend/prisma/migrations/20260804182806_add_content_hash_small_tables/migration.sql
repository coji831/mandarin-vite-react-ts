-- AlterTable
ALTER TABLE "CharacterRadical" ADD COLUMN     "content_hash" CHAR(64);

-- AlterTable
ALTER TABLE "Component" ADD COLUMN     "content_hash" CHAR(64);

-- AlterTable
ALTER TABLE "MeasureWord" ADD COLUMN     "content_hash" CHAR(64);

-- AlterTable
ALTER TABLE "MeasureWordWord" ADD COLUMN     "content_hash" CHAR(64);

-- AlterTable
ALTER TABLE "Passage" ADD COLUMN     "content_hash" CHAR(64);

-- AlterTable
ALTER TABLE "PinyinPhoneme" ADD COLUMN     "content_hash" CHAR(64);

-- AlterTable
ALTER TABLE "PinyinSyllable" ADD COLUMN     "content_hash" CHAR(64);

-- AlterTable
ALTER TABLE "Radical" ADD COLUMN     "content_hash" CHAR(64);

-- AlterTable
ALTER TABLE "StrokeCategory" ADD COLUMN     "content_hash" CHAR(64);

-- AlterTable
ALTER TABLE "StrokeCategoryOrderRule" ADD COLUMN     "content_hash" CHAR(64);

-- AlterTable
ALTER TABLE "StrokeExtendedType" ADD COLUMN     "content_hash" CHAR(64);

-- AlterTable
ALTER TABLE "StrokeOrderRule" ADD COLUMN     "content_hash" CHAR(64);

-- AlterTable
ALTER TABLE "Tone" ADD COLUMN     "content_hash" CHAR(64);

-- AlterTable
ALTER TABLE "TonePair" ADD COLUMN     "content_hash" CHAR(64);

-- AlterTable
ALTER TABLE "ToneRule" ADD COLUMN     "content_hash" CHAR(64);

-- AlterTable
ALTER TABLE "phonetic_clusters" ADD COLUMN     "content_hash" CHAR(64);
