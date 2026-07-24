/**
 * @file apps/backend/scripts/database/cleanup-deprecated.ts
 * @description Phase C cleanup: Drop deprecated tables after data migration is verified.
 *
 * Drops: VocabularyWord, VocabularyList, WordList, WordCategory, Category, ContentItem
 * Safety: Only runs after confirming data migration is complete.
 *
 * Run: cd apps/backend && npx tsx scripts/database/cleanup-deprecated.ts
 */

import { prisma } from "../client.js";
import { loadEnv } from "../utils.js";

const DEPRECATED_TABLES = [
  "ContentItem",
  "VocabularyWord",
  "VocabularyList",
  "WordList",
  "WordCategory",
  "Category",
];

async function main() {
  loadEnv();
  console.log("🧹 Starting Phase C cleanup — dropping deprecated tables...");
  console.log("  ⚠️  This is destructive! Verify migration is complete first.");

  // Safety check 1: Verify Progress_old exists (migration was run)
  const progressOldResult = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
    `SELECT tablename FROM pg_catalog.pg_tables WHERE tablename = 'Progress_old'`,
  );

  if (progressOldResult.length === 0) {
    console.error("  ❌ Progress_old not found — run migrate-progress.ts first!");
    process.exit(1);
  }
  console.log("  ✅ Safety check 1: Progress_old table exists");

  // Safety check 2: Verify new tables have data (CharacterProgress exists)
  const charProgressCount = await prisma.characterProgress.count();
  console.log(`  📊 CharacterProgress has ${charProgressCount} records`);

  if (charProgressCount === 0) {
    console.warn("  ⚠️  CharacterProgress is empty — data migration may not have run!");
    console.warn("  Stopping cleanup. Run migrate-progress.ts first.");
    process.exit(1);
  }
  console.log("  ✅ Safety check 2: CharacterProgress has data");

  // Safety check 3: Check if frontend HSK CSV exists
  const frontendHskCsvPath = "apps/frontend/public/data/vocabulary/hsk3.0/band1";
  try {
    const fs = await import("fs");
    const path = await import("path");
    const resolvedPath = path.resolve(process.cwd(), frontendHskCsvPath);
    if (fs.existsSync(resolvedPath)) {
      console.log(`  📁 Found HSK CSV at ${frontendHskCsvPath} — consider removing manually`);
    } else {
      console.log("  ✅ No stale HSK CSV found");
    }
  } catch {
    // Ignore — path may not exist
  }

  // Drop deprecated tables in reverse dependency order
  for (const table of DEPRECATED_TABLES) {
    try {
      // Check if table exists
      const exists = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
        `SELECT tablename FROM pg_catalog.pg_tables WHERE tablename = $1`,
        table,
      );

      if (exists.length === 0) {
        console.log(`  ⏭️  ${table} does not exist — skipping`);
        continue;
      }

      // Count rows before dropping
      const count = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*)::bigint as count FROM "${table}"`,
      );
      const rowCount = count[0]?.count ?? BigInt(0);

      // Drop the table
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}" CASCADE`);
      console.log(`  ✅ Dropped ${table} (had ${rowCount} rows)`);
    } catch (err) {
      console.error(`  ❌ Failed to drop ${table}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log("\n🎉 Phase C cleanup complete!");
  console.log("  💡 Reminder: Run 'prisma migrate dev' to sync the Prisma schema.");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
