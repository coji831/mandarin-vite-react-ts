/**
 * Import Character Decomposition Data from Make Me a Hanzi
 * =========================================================
 *
 * Parses Make Me a Hanzi (MIT-licensed) decomposition JSON and populates
 * the CharacterRadical Prisma table by mapping radical glyphs to rad_XXXX
 * IDs from content/radicals/*.json.
 *
 * Source commit (pinned): 1c5c6e6f5b6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c
 * https://github.com/skishore/makemeahanzi
 *
 * Data file expected at: ../../data/make-me-a-hanzi/decompositions.json
 * (when run from apps/backend/)
 *
 * Usage:
 *   npm run db:import-decomposition
 *   # or from project root:
 *   npm run db:import-decomposition --workspace=@mandarin/backend
 */

import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import { resolve } from "path";
import { readFileSync, readdirSync, existsSync } from "fs";

const { PrismaClient } = prismaPkg;

// ── Paths ──────────────────────────────────────────────────────────────────
// When run from apps/backend/, cwd is apps/backend/
const CWD = process.cwd();
const DOTENV_PATH = resolve(CWD, "../../.env.local");
const RADICALS_DIR = resolve(CWD, "../../content/radicals");
const DATA_FILE = resolve(CWD, "../../data/make-me-a-hanzi/decompositions.json");

dotenv.config({ path: DOTENV_PATH });

// ── Prisma Client ─────────────────────────────────────────────────────────
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── Types ──────────────────────────────────────────────────────────────────
/** @typedef {{ character: string; radicals: string[] }} DecompositionEntry */

/** @typedef {{ id: string; glyph: string; alternate_glyphs?: string[] }} RadicalEntry */

// ── Glyph-to-ID Map Builder ────────────────────────────────────────────────

/**
 * Build a dynamic glyph-to-radical-ID map from content/radicals/*.json.
 * Matches on both `glyph` and each entry in `alternate_glyphs`.
 *
 * @returns {{ glyphToId: Record<string, string>, totalRadicals: number }}
 */
function buildGlyphMap() {
  /** @type {Record<string, string>} */
  const glyphToId = {};
  let totalRadicals = 0;

  if (!existsSync(RADICALS_DIR)) {
    console.error(`FATAL: Radicals directory not found: ${RADICALS_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(RADICALS_DIR).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const filePath = resolve(RADICALS_DIR, file);
    /** @type {RadicalEntry} */
    const radical = JSON.parse(readFileSync(filePath, "utf-8"));

    if (!radical.id || !radical.glyph) {
      console.warn(`  ⚠  Skipping invalid radical file: ${file} (missing id or glyph)`);
      continue;
    }

    // Map primary glyph
    glyphToId[radical.glyph] = radical.id;
    totalRadicals++;

    // Map alternate glyphs (e.g. "人" for rad_0009 glyph "亻")
    const alternates = radical.alternate_glyphs ?? [];
    for (const altGlyph of alternates) {
      if (glyphToId[altGlyph] && glyphToId[altGlyph] !== radical.id) {
        console.warn(
          `  ⚠  Glyph "${altGlyph}" already mapped to ${glyphToId[altGlyph]}, ` +
            `skipping duplicate from ${radical.id}`
        );
        continue;
      }
      glyphToId[altGlyph] = radical.id;
    }
  }

  return { glyphToId, totalRadicals };
}

// ── JSON Validation ────────────────────────────────────────────────────────

/**
 * Validate that the parsed JSON has the expected structure.
 *
 * @param {unknown} data
 * @returns {data is DecompositionEntry[]}
 */
function validateDecompositionData(data) {
  if (!Array.isArray(data)) {
    return false;
  }

  return data.every(
    (entry) =>
      entry !== null &&
      typeof entry === "object" &&
      typeof entry.character === "string" &&
      Array.isArray(entry.radicals) &&
      entry.radicals.every((r) => typeof r === "string")
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("  Character Decomposition Data Import");
  console.log("=".repeat(60));

  // 1. Build glyph map from radical JSON files
  console.log("\n📂 Building radical glyph map...");
  const { glyphToId, totalRadicals } = buildGlyphMap();
  console.log(`  Loaded ${totalRadicals} radical files, ${Object.keys(glyphToId).length} glyph mappings`);

  // 2. Check data file exists
  console.log(`\n📄 Reading decomposition data...`);
  if (!existsSync(DATA_FILE)) {
    console.error(`  FATAL: Data file not found: ${DATA_FILE}`);
    console.error(`  Download from https://github.com/skishore/makemeahanzi`);
    console.error(`  and place at: data/make-me-a-hanzi/decompositions.json`);
    process.exit(1);
  }

  // 3. Parse and validate
  let rawData;
  try {
    rawData = JSON.parse(readFileSync(DATA_FILE, "utf-8"));
  } catch (err) {
    console.error(`  FATAL: Failed to parse data file: ${err.message}`);
    process.exit(1);
  }

  if (!validateDecompositionData(rawData)) {
    console.error(
      `  FATAL: Data file has unexpected structure. Expected array of ` +
        `{ character: string, radicals: string[] }`
    );
    process.exit(1);
  }

  /** @type {DecompositionEntry[]} */
  const decompositions = rawData;
  console.log(`  Found ${decompositions.length} character decomposition entries`);

  // 4. Process each entry
  console.log(`\n🔄 Processing decompositions...`);
  let totalUpserted = 0;
  let totalEntries = 0;
  /** @type {Array<{ glyph: string; character: string }>} */
  const unmappedRadicals = [];

  for (const entry of decompositions) {
    totalEntries++;

    for (const radicalGlyph of entry.radicals) {
      const radicalId = glyphToId[radicalGlyph];

      if (!radicalId) {
        unmappedRadicals.push({ glyph: radicalGlyph, character: entry.character });
        continue;
      }

      await prisma.characterRadical.upsert({
        where: {
          characterGlyph_radicalId: {
            characterGlyph: entry.character,
            radicalId,
          },
        },
        create: {
          characterGlyph: entry.character,
          radicalId,
        },
        update: {}, // No fields to update — data is static
      });

      totalUpserted++;
    }

    if (totalEntries % 500 === 0) {
      console.log(`  Progress: ${totalEntries}/${decompositions.length} characters processed`);
    }
  }

  // 5. Summary
  console.log("\n" + "=".repeat(60));
  console.log("  Import Summary");
  console.log("=".repeat(60));
  console.log(`  Total characters processed:  ${totalEntries}`);
  console.log(`  Total radical links upserted: ${totalUpserted}`);

  if (unmappedRadicals.length > 0) {
    console.log(`\n  ⚠  Unmapped radicals: ${unmappedRadicals.length}`);

    // Group by glyph for cleaner output
    /** @type {Record<string, string[]>} */
    const glyphGroups = {};
    for (const { glyph, character } of unmappedRadicals) {
      if (!glyphGroups[glyph]) {
        glyphGroups[glyph] = [];
      }
      glyphGroups[glyph].push(character);
    }

    const sortedGlyphs = Object.keys(glyphGroups).sort();
    for (const glyph of sortedGlyphs) {
      const chars = glyphGroups[glyph];
      // Show up to 5 example characters per glyph
      const examples = chars.length <= 5 ? chars.join(", ") : `${chars.slice(0, 5).join(", ")}, ... (${chars.length} total)`;
      console.log(`    "${glyph}" (U+${glyph.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}) → ${examples}`);
    }
  } else {
    console.log(`\n  ✅ All radicals mapped successfully!`);
  }

  console.log("\n✅ Import complete.");
}

// ── Execute ────────────────────────────────────────────────────────────────

try {
  await main();
} catch (err) {
  console.error(`\n❌ Import failed: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
} finally {
  await prisma.$disconnect();
  await pool.end();
}
