/**
 * @file apps/backend/scripts/database/generate-character-enrichment.js
 * @description Generate content/characters/characters.json — a read-only aggregate
 *   cache of enrichment fields from individual character JSON files.
 *
 * Reads ALL ch_*.json files from content/characters/ and produces a single
 * aggregate file with enriched metadata (traditional, definition, etymology,
 * frequencyRank, commonWords, radicalIds). These are fields that enhance the
 * DB Character model but are not stored in it.
 *
 * Safe to re-run (idempotent). Uses atomic write (temp file → rename).
 *
 * Run standalone: node scripts/database/generate-character-enrichment.js (from apps/backend)
 * Or via seed:   imported as part of prisma/seed.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, "..", "..", "..", "..", "content");
const CHARS_DIR = path.join(CONTENT_DIR, "characters");
const OUTPUT_FILE = path.join(CHARS_DIR, "characters.json");

/**
 * Extract the primary reading's core_meaning as the definition.
 * Falls back to the first reading's core_meaning, then null.
 */
function extractDefinition(readings) {
  if (!Array.isArray(readings) || readings.length === 0) return null;
  const primary = readings.find((r) => r.type === "primary");
  return (primary || readings[0]).core_meaning || null;
}

/**
 * Write a JSON file atomically using temp-file-then-rename.
 */
function writeJsonAtomic(filePath, data) {
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmpPath, filePath);
}

/**
 * Generate the character enrichment aggregate file.
 * Accepts prisma for API consistency with seed.js, but does not use it
 * (enrichment is purely from file reads).
 */
export async function generateCharacterEnrichment(_prisma) {
  // ── 1. Discover character files ──
  const files = fs
    .readdirSync(CHARS_DIR)
    .filter((f) => f.startsWith("ch_") && f.endsWith(".json"))
    .sort();

  if (files.length === 0) {
    console.log("  ⏭️  No character files found — skipping enrichment");
    return;
  }

  console.log(`  📖 Reading ${files.length} character files for enrichment...`);

  // ── 2. Build enrichment aggregate ──
  const characters = {};

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(CHARS_DIR, file), "utf-8"));
    const meta = raw.metadata || {};
    const charId = raw.id || file.replace(".json", "");
    const definition = extractDefinition(raw.readings);

    characters[charId] = {
      traditional: raw.traditional || null,
      definition,
      etymology: meta.etymology || null,
      frequencyRank: meta.frequency_rank ?? null,
      commonWords: Array.isArray(meta.common_words) ? meta.common_words : [],
      radicalIds: Array.isArray(meta.radical_ids) ? meta.radical_ids : [],
    };
  }

  // ── 3. Write aggregate file (atomic) ──
  const output = {
    version: 1,
    updated_at: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    characters,
  };

  writeJsonAtomic(OUTPUT_FILE, output);
  console.log(`  ✅ Wrote characters.json (${Object.keys(characters).length} characters enriched)`);
}

// ── Standalone entry point ──────────────────────────────────────────────────

async function main() {
  console.log("📦 Generating character enrichment aggregate...");
  await generateCharacterEnrichment(null);
  console.log("🎉 Done!");
}

// Allow standalone execution: node scripts/database/generate-character-enrichment.js
const isStandalone =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isStandalone) {
  main().catch((e) => {
    console.error("❌ Failed:", e.message);
    process.exit(1);
  });
}
