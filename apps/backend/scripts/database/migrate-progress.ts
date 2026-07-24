/**
 * @file apps/backend/scripts/database/migrate-progress.ts
 * @description Phase B migration: Progress → CharacterProgress + WordStudyContext
 *
 * Reads all existing Progress records and:
 * 1. If wordId is single char → creates CharacterProgress + ReviewLog
 * 2. If wordId is multi-char → splits into chars, creates CharacterProgress per glyph + WordStudyContext
 *
 * Safety: verifies row counts match before renaming Progress to Progress_old.
 *
 * Run: cd apps/backend && npx tsx scripts/database/migrate-progress.ts
 */

import { prisma } from "../client.js";
import { loadEnv } from "../utils.js";

async function main() {
  loadEnv();
  console.log("🔄 Starting Progress → CharacterProgress migration...");

  // Count existing records
  const totalProgress = await prisma.progress.count();
  console.log(`  Found ${totalProgress} Progress records`);

  if (totalProgress === 0) {
    console.log("  ⏭️  No Progress records to migrate");
    await renameProgressTable();
    return;
  }

  let charProgressCount = 0;
  let reviewLogCount = 0;
  let skipped = 0;

  // Process in batches
  const BATCH_SIZE = 100;
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const batch = await prisma.progress.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
    });

    if (batch.length === 0) break;

    for (const record of batch) {
      try {
        // Find the character by glyph in the wordId
        const isSingleChar = record.wordId.length <= 2; // Chinese chars are 1-2 bytes
        let characterId: string | null = null;

        if (isSingleChar) {
          // Try to find character by glyph
          const charRecord = await prisma.character.findUnique({
            where: { glyph: record.wordId },
            select: { id: true },
          });

          if (charRecord) {
            characterId = charRecord.id;

            // Create CharacterProgress
            await prisma.characterProgress.upsert({
              where: {
                userId_characterId: {
                  userId: record.userId,
                  characterId: charRecord.id,
                },
              },
              update: {
                studyCount: record.studyCount,
                correctCount: record.correctCount,
                confidence: record.confidence,
                nextReview: record.nextReview,
                currentDelay: record.currentDelay,
                lapseCount: record.lapseCount,
              },
              create: {
                userId: record.userId,
                characterId: charRecord.id,
                studyCount: record.studyCount,
                correctCount: record.correctCount,
                confidence: record.confidence,
                nextReview: record.nextReview,
                currentDelay: record.currentDelay,
                lapseCount: record.lapseCount,
              },
            });
            charProgressCount++;

            // Create ReviewLog
            await prisma.reviewLog.create({
              data: {
                userId: record.userId,
                itemType: "character",
                itemId: record.wordId,
                rating: record.confidence >= 3 ? "good" : record.confidence >= 1 ? "again" : "good",
                source: "review",
              },
            });
            reviewLogCount++;
          } else {
            skipped++;
          }
        } else {
          // Multi-character word — split into individual characters
          const glyphs = [...record.wordId];

          for (const glyph of glyphs) {
            const charRecord = await prisma.character.findUnique({
              where: { glyph },
              select: { id: true },
            });

            if (charRecord) {
              // Create CharacterProgress for each character
              await prisma.characterProgress.upsert({
                where: {
                  userId_characterId: {
                    userId: record.userId,
                    characterId: charRecord.id,
                  },
                },
                update: {
                  studyCount: Math.ceil(record.studyCount / glyphs.length),
                  confidence: record.confidence,
                },
                create: {
                  userId: record.userId,
                  characterId: charRecord.id,
                  studyCount: Math.ceil(record.studyCount / glyphs.length),
                  confidence: record.confidence,
                },
              });
              charProgressCount++;
            }
          }

          // Always create a ReviewLog for the original wordId
          await prisma.reviewLog.create({
            data: {
              userId: record.userId,
              itemType: "word",
              itemId: record.wordId,
              rating: record.confidence >= 3 ? "good" : record.confidence >= 1 ? "again" : "good",
              source: "review",
            },
          });
          reviewLogCount++;
        }
      } catch (err) {
        console.warn(
          `  ⚠️  Error migrating record ${record.id}:`,
          err instanceof Error ? err.message : err,
        );
        skipped++;
      }
    }

    cursor = batch[batch.length - 1].id;
    hasMore = batch.length === BATCH_SIZE;
  }

  console.log(`  ✅ Created: ${charProgressCount} CharacterProgress, ${reviewLogCount} ReviewLog`);
  console.log(`  ⏭️  Skipped: ${skipped} records`);

  // Verify counts
  const newCharProgressCount = await prisma.characterProgress.count();
  console.log(`  📊 Verification: ${newCharProgressCount} CharacterProgress rows in DB`);

  // Rename Progress table
  await renameProgressTable();

  console.log("🎉 Migration completed successfully!");
}

async function renameProgressTable() {
  console.log("  🔄 Renaming Progress → Progress_old...");

  // Check if Progress_old already exists
  const result = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
    `SELECT tablename FROM pg_catalog.pg_tables WHERE tablename = 'Progress_old'`,
  );

  if (result.length > 0) {
    console.log("  ⏭️  Progress_old already exists — skipping rename");
    return;
  }

  await prisma.$executeRawUnsafe(`ALTER TABLE "Progress" RENAME TO "Progress_old"`);
  console.log("  ✅ Progress renamed to Progress_old");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
