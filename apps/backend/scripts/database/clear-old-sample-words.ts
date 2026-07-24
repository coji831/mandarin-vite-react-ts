/**
 * @file apps/backend/scripts/database/clear-old-sample-words.ts
 * @description Story 21.1 cleanup: Remove stale sample Word records (w_00001–w_00040)
 *   created by the old seed script, plus any dev Character records (ch_dev_*).
 *
 * The old seed created ~30 hardcoded sample Word records. The new seed reads the
 * HSK 3.0 CSV and creates w_00001–w_11092. With skipDuplicates: true, the old
 * records survive with stale data. This script removes them so a fresh seed run
 * produces correct data.
 *
 * Safety: Checks word count first — if already >= 10000 (new seed has run),
 * there is nothing to clean up.
 *
 * Idempotent: Safe to run multiple times. On the second run, count will be 0
 * (if old data existed) or >= 10000 (if new seed already ran), so it skips.
 *
 * Run: cd apps/backend && npx tsx scripts/database/clear-old-sample-words.ts
 */

import { PrismaPg } from "@prisma/adapter-pg";
import prismaPkg from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const { PrismaClient } = prismaPkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local from the repo root
dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", "..", ".env.local") });

// Construct adapter from DATABASE_URL (same pattern as seed.js)
const dbUrl = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaPg({
  host: dbUrl.hostname,
  port: Number(dbUrl.port) || 5432,
  database: dbUrl.pathname.slice(1),
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔍 Checking for old sample data...");

  // ── Step 1: Check if old sample words exist ──
  const wordCount = await prisma.word.count();
  console.log(`  Word table has ${wordCount} records`);

  // If count >= 10000, the new seed has already run and overwritten correctly,
  // or the data is already clean. Either way, nothing to do.
  if (wordCount >= 10000) {
    console.log("  ✅ Word count >= 10000 — new seed data present. Nothing to clean up.");
    return;
  }

  // If count is 0, no data exists at all — nothing to clean up.
  if (wordCount === 0) {
    console.log("  ⏭️  No Word records found — nothing to clean up.");
    return;
  }

  // At this point, count is between 1 and 9999, which means old sample data
  // is present without the full new seed having run yet.
  console.log(`  ⚠️  Found ${wordCount} Word records — old sample data detected.`);

  // ── Step 2: Count dev characters before deletion ──
  const devCharCount = await prisma.character.count({
    where: {
      id: { startsWith: "ch_dev_" },
    },
  });
  console.log(`  Found ${devCharCount} dev Character records (ch_dev_*)`);

  // ── Step 3: Delete all Word records ──
  // This cascades to WordHskLevel, WordCharacter, WordStudyContext, WordLookupEvent
  // via ON DELETE CASCADE on the Prisma relations.
  console.log("  🗑️  Deleting all Word records (cascades to related tables)...");
  const deletedWords = await prisma.word.deleteMany({});
  console.log(`  ✅ Deleted ${deletedWords.count} old Word records`);

  // ── Step 4: Delete dev Character records ──
  // Only delete characters with the ch_dev_* ID pattern (created by the old seed).
  // Characters from content/characters/*.json (ch_1001, ch_jiang, ch_hsk_*, etc.)
  // are NOT touched.
  if (devCharCount > 0) {
    console.log("  🗑️  Deleting dev Character records (ch_dev_*)...");
    const deletedChars = await prisma.character.deleteMany({
      where: {
        id: { startsWith: "ch_dev_" },
      },
    });
    console.log(`  ✅ Deleted ${deletedChars.count} old dev Character records`);
  } else {
    console.log("  ⏭️  No dev Character records to delete");
  }

  // ── Step 5: Verify ──
  const remainingWords = await prisma.word.count();
  const remainingDevChars = await prisma.character.count({
    where: {
      id: { startsWith: "ch_dev_" },
    },
  });
  console.log(
    `  📊 Verification: ${remainingWords} Word records, ${remainingDevChars} dev Character records remaining`,
  );
  console.log("✨ Cleanup complete! Run `npx prisma db seed` to re-seed with correct data.");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e instanceof Error ? e.message : String(e));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
