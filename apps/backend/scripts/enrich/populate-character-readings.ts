/**
 * @file apps/backend/scripts/database/populate-character-readings.ts
 * @description Migrate polyphone data from Character.readings JSON field
 *   into the CharacterReading model table.
 *
 * For each Character with a non-empty readings JSON array, creates
 * CharacterReading records. The first reading per character is marked
 * as type "primary" (by order in the JSON array).
 *
 * Idempotent: skips characters that already have CharacterReading records.
 *
 * Run: cd apps/backend && npx tsx scripts/database/populate-character-readings.ts
 */

import { prisma } from "../client.js";

const BATCH_SIZE = 500;

interface ReadingEntry {
  pinyin: string;
  tone: number;
  type: string | null;
  meaning?: string | null;
}

async function main(): Promise<void> {
  console.log("📖 Migrating polyphone data to CharacterReading model...");
  console.log("══════════════════════════════════════════════════════\n");

  // ── Step 1: Find characters with existing CharacterReading records ──

  console.log("🔍 Checking existing CharacterReading records...");

  const existingReadingChars = await prisma.characterReading.findMany({
    select: { characterId: true },
    distinct: ["characterId"],
  });
  const alreadyMigrated = new Set(existingReadingChars.map((r) => r.characterId));
  console.log(`  Found ${alreadyMigrated.size} characters with existing readings`);

  // ── Step 2: Fetch all characters with non-empty readings JSON ──

  console.log("📖 Fetching characters with polyphone data...");

  const allChars = await prisma.character.findMany({
    select: { id: true, glyph: true, readings: true },
  });

  console.log(`  Total characters in DB: ${allChars.length}`);

  // Filter to characters with non-empty readings AND no existing CharacterReading records
  const charsToProcess = allChars.filter((c) => {
    const readings = c.readings as ReadingEntry[];
    return readings && readings.length > 0 && !alreadyMigrated.has(c.id);
  });

  console.log(`  Characters to process (new): ${charsToProcess.length}`);

  if (charsToProcess.length === 0) {
    console.log("\n  ⏭️  Nothing to do — all characters already have readings.");
    return;
  }

  // ── Step 3: Build CharacterReading records ──

  console.log("📝 Building CharacterReading records...");

  interface ReadingRecord {
    characterId: string;
    pinyin: string;
    tone: number;
    type: string | null;
  }

  const allRecords: ReadingRecord[] = [];

  for (const char of charsToProcess) {
    const readings = char.readings as ReadingEntry[];
    if (!readings || readings.length === 0) continue;

    for (let i = 0; i < readings.length; i++) {
      const r = readings[i];
      allRecords.push({
        characterId: char.id,
        pinyin: r.pinyin || "",
        tone: r.tone || 0,
        // Use the type from JSON, or infer from position
        type: r.type || (i === 0 ? "primary" : "secondary"),
      });
    }
  }

  console.log(`  Total reading records to create: ${allRecords.length}`);

  // ── Step 4: Batch insert ──

  console.log("💾 Inserting CharacterReading records...");

  let inserted = 0;
  for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
    const batch = allRecords.slice(i, i + BATCH_SIZE);
    await prisma.characterReading.createMany({
      data: batch,
      skipDuplicates: true,
    });
    inserted += batch.length;

    if (inserted % 1000 === 0 || inserted === allRecords.length) {
      console.log(`  Progress: ${inserted}/${allRecords.length} records inserted`);
    }
  }

  // ── Summary ──

  const totalCount = await prisma.characterReading.count();
  const polyphoneChars = await prisma.characterReading.groupBy({
    by: ["characterId"],
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } },
  });

  console.log("\n══════════════════════════════════════════════");
  console.log("  ✅ CharacterReading Migration Complete");
  console.log("══════════════════════════════════════════════\n");
  console.log(`  Total CharacterReading records: ${totalCount}`);
  console.log(`  Newly inserted: ${inserted}`);
  console.log(`  Characters with polyphones (>1 reading): ${polyphoneChars.length}`);
  console.log("");
}

main()
  .catch((e: Error) => {
    console.error("❌ Failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
