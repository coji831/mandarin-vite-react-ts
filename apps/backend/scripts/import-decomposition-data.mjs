/**
 * Import Character Decomposition Data from Make Me a Hanzi
 * =========================================================
 *
 * Parses Make Me a Hanzi (MIT-licensed) dictionary.txt (line-delimited JSON)
 * and populates the CharacterRadical Prisma table by mapping radical glyphs
 * to rad_XXXX IDs from content/radicals/*.json.
 *
 * The dictionary.txt file contains one JSON object per line, with fields:
 *   character, decomposition (IDS), etymology, radical, pinyin, definition
 *
 * Source commit (pinned): bddc96d
 * https://github.com/skishore/makemeahanzi
 *
 * Data file expected at: ../../data/make-me-a-hanzi/dictionary.txt
 * (when run from apps/backend/)
 *
 * Download:
 *   https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt
 *
 * Usage:
 *   npm run db:import-decomposition
 *   # or from project root:
 *   npm run db:import-decomposition --workspace=@mandarin/backend
 */

import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import { resolve } from "path";
import { readFileSync, readdirSync, existsSync } from "fs";

const { PrismaClient } = prismaPkg;

// ── Paths ──────────────────────────────────────────────────────────────────
// When run from apps/backend/, cwd is apps/backend/
const CWD = process.cwd();
const DOTENV_PATH = resolve(CWD, "../../.env.local");
const RADICALS_DIR = resolve(CWD, "../../content/radicals");
const DATA_FILE = resolve(CWD, "../../data/make-me-a-hanzi/dictionary.txt");

dotenv.config({ path: DOTENV_PATH });

// ── Prisma Client ─────────────────────────────────────────────────────────
// Pass connection string directly — creating a custom pg.Pool conflicts with
// Prisma's internal connection management (matching backend client.ts pattern).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ── IDS Operators ──────────────────────────────────────────────────────────
// Ideograph Description Characters that structure IDS strings.
// These are NOT component characters — skip them during parsing.
const IDS_OPERATORS = new Set([
  "\u2FF0", // ⿰ Left to right
  "\u2FF1", // ⿱ Above to below
  "\u2FF2", // ⿲ Left to middle and right
  "\u2FF3", // ⿳ Above to middle and below
  "\u2FF4", // ⿴ Full surround
  "\u2FF5", // ⿵ Surround from above
  "\u2FF6", // ⿶ Surround from below
  "\u2FF7", // ⿷ Surround from left
  "\u2FF8", // ⿸ Surround from upper left
  "\u2FF9", // ⿹ Surround from upper right
  "\u2FFA", // ⿺ Surround from lower left
  "\u2FFB", // ⿻ Overlaid
  "\uFF1F", // ？ Unknown component
]);

// ── Types ──────────────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   character: string;
 *   definition: string;
 *   pinyin: string;
 *   decomposition: string;
 *   etymology?: {
 *     type: string;
 *     phonetic?: string;
 *     semantic?: string;
 *     hint?: string;
 *   };
 *   radical: string;
 *   matches: string[];
 * }} DictionaryEntry
 */

/** @typedef {{ id: string; glyph: string; alternate_glyphs?: string[] }} RadicalEntry */

// ── IDS Parsing ────────────────────────────────────────────────────────────

/**
 * Extract component characters from an Ideograph Description Sequence (IDS).
 * Skips IDS operators and unknown (？) markers; returns unique characters.
 *
 * @param {string} ids - The IDS string (e.g. "\u2FF0\u2ECA\u5404")
 * @returns {Set<string>} Set of component glyph characters
 */
function extractComponentsFromIDS(ids) {
  const components = new Set();

  for (const char of ids) {
    if (!IDS_OPERATORS.has(char)) {
      components.add(char);
    }
  }

  return components;
}

/**
 * Collect all component glyphs for a dictionary entry using multiple sources:
 *   1. IDS decomposition parsing
 *   2. etymology.phonetic (pictophonetic phonetic component)
 *   3. etymology.semantic (pictophonetic semantic component)
 *   4. radical field (Unicode primary radical)
 *
 * @param {DictionaryEntry} entry
 * @returns {string[]} Deduplicated array of component glyphs
 */
function collectComponentGlyphs(entry) {
  const glyphs = new Set();

  // 1. Extract from IDS decomposition
  if (entry.decomposition) {
    const idsComponents = extractComponentsFromIDS(entry.decomposition);
    for (const g of idsComponents) {
      glyphs.add(g);
    }
  }

  // 2. Etymology phonetic/semantic
  if (entry.etymology) {
    if (entry.etymology.phonetic) {
      glyphs.add(entry.etymology.phonetic);
    }
    if (entry.etymology.semantic) {
      glyphs.add(entry.etymology.semantic);
    }
  }

  // 3. Primary radical
  if (entry.radical) {
    glyphs.add(entry.radical);
  }

  return [...glyphs];
}

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
      console.warn(`  \u26A0  Skipping invalid radical file: ${file} (missing id or glyph)`);
      continue;
    }

    // Map primary glyph
    glyphToId[radical.glyph] = radical.id;
    totalRadicals++;

    // Map alternate glyphs (e.g. "\u4EBA" for rad_0009 glyph "\u4EBB")
    const alternates = radical.alternate_glyphs ?? [];
    for (const altGlyph of alternates) {
      if (glyphToId[altGlyph] && glyphToId[altGlyph] !== radical.id) {
        console.warn(
          `  \u26A0  Glyph "${altGlyph}" already mapped to ${glyphToId[altGlyph]}, ` +
            `skipping duplicate from ${radical.id}`,
        );
        continue;
      }
      glyphToId[altGlyph] = radical.id;
    }
  }

  return { glyphToId, totalRadicals };
}

// ── Dictionary Entry Validation ────────────────────────────────────────────

/**
 * Validate that a parsed dictionary entry has the required fields.
 *
 * @param {unknown} entry
 * @returns {entry is DictionaryEntry}
 */
function validateDictionaryEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  const e = /** @type {Record<string, unknown>} */ (entry);

  if (typeof e.character !== "string" || e.character.length === 0) {
    return false;
  }

  if (typeof e.decomposition !== "string") {
    return false;
  }

  return true;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("  Character Decomposition Data Import");
  console.log("=".repeat(60));

  // 1. Build glyph map from radical JSON files
  console.log("\n\uD83D\uDCC2 Building radical glyph map...");
  const { glyphToId, totalRadicals } = buildGlyphMap();
  console.log(
    `  Loaded ${totalRadicals} radical files, ${Object.keys(glyphToId).length} glyph mappings`,
  );

  // 2. Check data file exists
  console.log(`\n\uD83D\uDCC4 Reading decomposition data...`);
  if (!existsSync(DATA_FILE)) {
    console.error(`  FATAL: Data file not found: ${DATA_FILE}`);
    console.error(`  Download dictionary.txt from:`);
    console.error(
      `  https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt`,
    );
    console.error(`  And place at: data/make-me-a-hanzi/dictionary.txt`);
    process.exit(1);
  }

  // 3. Read and parse line-delimited JSON
  const fileContent = readFileSync(DATA_FILE, "utf-8");
  const lines = fileContent.split("\n").filter((line) => line.trim().length > 0);
  console.log(`  Found ${lines.length} lines in dictionary.txt`);

  // 4. Process each line
  console.log(`\n\uD83D\uDD04 Processing decompositions...`);
  let totalEntries = 0;
  let parseErrors = 0;
  let skippedUnknownDecomposition = 0;
  /** @type {Array<{ glyph: string; character: string }>} */
  const unmappedRadicals = [];
  /** @type {Array<{ characterGlyph: string; radicalId: string }>} */
  const records = [];

  for (const line of lines) {
    // Parse JSON
    /** @type {unknown} */
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      parseErrors++;
      continue;
    }

    // Validate
    if (!validateDictionaryEntry(entry)) {
      parseErrors++;
      continue;
    }

    // Skip if decomposition starts with "\uFF1F" (unknown)
    if (entry.decomposition.startsWith("\uFF1F")) {
      skippedUnknownDecomposition++;
      continue;
    }

    totalEntries++;

    // Collect component glyphs from IDS, etymology, and radical
    const componentGlyphs = collectComponentGlyphs(entry);

    if (componentGlyphs.length === 0) {
      skippedUnknownDecomposition++;
      continue;
    }

    // Collect each mapped component record
    for (const glyph of componentGlyphs) {
      const radicalId = glyphToId[glyph];

      if (!radicalId) {
        unmappedRadicals.push({ glyph, character: entry.character });
        continue;
      }

      records.push({ characterGlyph: entry.character, radicalId });
    }

    // Progress every 500 characters
    if (totalEntries % 500 === 0) {
      console.log(`  Progress: ${totalEntries} characters parsed`);
    }
  }

  // 5. Batch insert all records (using createMany with skipDuplicates for performance)
  console.log(`\n\uD83D\uDCDA Inserting ${records.length} radical links in batches...`);
  const BATCH_SIZE = 500;
  let totalUpserted = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await prisma.characterRadical.createMany({
      data: batch,
      skipDuplicates: true,
    });
    totalUpserted += batch.length;
    console.log(`  Inserted batch ${Math.min(i + BATCH_SIZE, records.length)}/${records.length}`);
  }

  // 5. Summary
  console.log("\n" + "=".repeat(60));
  console.log("  Import Summary");
  console.log("=".repeat(60));
  console.log(`  Total lines in file:          ${lines.length}`);
  console.log(`  Characters processed:          ${totalEntries}`);
  console.log(`  Parse errors:                  ${parseErrors}`);
  console.log(`  Skipped (unknown decomps):     ${skippedUnknownDecomposition}`);
  console.log(`  Total radical links upserted:  ${totalUpserted}`);

  if (unmappedRadicals.length > 0) {
    console.log(`\n  \u26A0  Unmapped radicals: ${unmappedRadicals.length}`);

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
      const examples =
        chars.length <= 5
          ? chars.join(", ")
          : `${chars.slice(0, 5).join(", ")}, ... (${chars.length} total)`;
      console.log(
        `    "${glyph}" (U+${glyph.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}) \u2192 ${examples}`,
      );
    }
  } else {
    console.log(`\n  \u2705 All radicals mapped successfully!`);
  }

  console.log("\n\u2705 Import complete.");
}

// ── Execute ────────────────────────────────────────────────────────────────

try {
  await main();
} catch (err) {
  console.error(`\n\u274C Import failed: ${err.message}`);
  if (err.code) console.error(`  Error code: ${err.code}`);
  if (err.meta) console.error(`  Error meta:`, JSON.stringify(err.meta, null, 2));
  // Full error object
  console.error(`  Full error:`, err);
  console.error(err.stack);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
