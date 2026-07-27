/**
 * @file apps/backend/scripts/database/generate-character-enrichment.ts
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
 * Run standalone: npx tsx scripts/database/generate-character-enrichment.ts (from apps/backend)
 * Or via seed:   imported as part of prisma/seed.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic } from "../utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, "..", "..", "..", "..", "content");
const CHARS_DIR = path.join(CONTENT_DIR, "characters");
const OUTPUT_FILE = path.join(CHARS_DIR, "characters.json");

/** Shape of a reading entry inside a character JSON file. */
interface CharacterReading {
  type?: string;
  core_meaning?: string | null;
  [key: string]: unknown;
}

/** Shape of the metadata object inside a character JSON file. */
interface CharacterMetadata {
  etymology?: string | null;
  frequency_rank?: number | null;
  common_words?: string[];
  radical_ids?: string[];
  [key: string]: unknown;
}

/** Shape of a parsed character JSON file. */
interface CharacterFile {
  id?: string;
  traditional?: string | null;
  readings?: CharacterReading[];
  metadata?: CharacterMetadata;
  [key: string]: unknown;
}

/** Shape of a single entry in the output aggregate. */
interface CharacterEnrichmentEntry {
  traditional: string | null;
  definition: string | null;
  etymology: string | null;
  frequencyRank: number | null;
  commonWords: string[];
  radicalIds: string[];
}

/** Shape of the output aggregate file. */
interface CharactersEnrichmentOutput {
  version: number;
  updated_at: string;
  characters: Record<string, CharacterEnrichmentEntry>;
}

/**
 * Extract the primary reading's core_meaning as the definition.
 * Falls back to the first reading's core_meaning, then null.
 */
function extractDefinition(readings: CharacterReading[] | undefined): string | null {
  if (!Array.isArray(readings) || readings.length === 0) return null;
  const primary = readings.find((r) => r.type === "primary");
  return (primary || readings[0]).core_meaning ?? null;
}

/**
 * Generate the character enrichment aggregate file.
 * Accepts prisma for API consistency with seed.js, but does not use it
 * (enrichment is purely from file reads).
 */
export async function generateCharacterEnrichment(_prisma: unknown): Promise<void> {
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
  const characters: Record<string, CharacterEnrichmentEntry> = {};

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(CHARS_DIR, file), "utf-8")) as CharacterFile;
    const meta = raw.metadata || {};
    const charId = raw.id || file.replace(".json", "");
    const definition = extractDefinition(raw.readings);

    characters[charId] = {
      traditional: raw.traditional ?? null,
      definition,
      etymology: meta.etymology ?? null,
      frequencyRank: meta.frequency_rank ?? null,
      commonWords: Array.isArray(meta.common_words) ? meta.common_words : [],
      radicalIds: Array.isArray(meta.radical_ids) ? meta.radical_ids : [],
    };
  }

  // ── 3. Write aggregate file (atomic) ──
  const output: CharactersEnrichmentOutput = {
    version: 1,
    updated_at: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    characters,
  };

  writeJsonAtomic(OUTPUT_FILE, output);
  console.log(`  ✅ Wrote characters.json (${Object.keys(characters).length} characters enriched)`);
}

// ── Standalone entry point ──────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("📦 Generating character enrichment aggregate...");
  await generateCharacterEnrichment(null);
  console.log("🎉 Done!");
}

// Allow standalone execution: npx tsx scripts/database/generate-character-enrichment.ts
const isStandalone =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isStandalone) {
  main().catch((e: Error) => {
    console.error("❌ Failed:", e.message);
    process.exit(1);
  });
}
