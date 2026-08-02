/**
 * @file apps/backend/scripts/enrich/build-character-radicals.ts
 * @description Enrich 6: Map characters to their Kangxi radicals with
 *   decomposition type.
 *
 * Reads:
 *   - content/seed/phase1/mmah-entries.json — has radical and etymology.type fields
 *   - content/seed/phase2/characters.json (from Enrich 1)
 *   - content/radicals/radicals.json (existing — 20 radicals with alternateGlyphs)
 *
 * Writes: content/seed/phase2/character-radicals.json
 *
 * Idempotent: pure JSON-to-JSON transform.
 *
 * Run: cd apps/backend && npx tsx scripts/enrich/build-character-radicals.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("enrich:char-radicals");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const PHASE1_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase1");
const PHASE2_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase2");
const RADICALS_PATH = path.join(PROJECT_ROOT, "content", "radicals", "radicals.json");

// ── Types ──

interface MmahEntry {
  character: string;
  definition?: string;
  pinyin?: string[];
  decomposition?: string;
  etymology?: {
    type?: string;
    hint?: string;
    phonetic?: string;
    semantic?: string;
  };
  radical?: string;
  matches?: Array<Array<number> | null>;
}

interface RadicalEntry {
  id: string;
  glyph: string;
  alternateGlyphs: string[];
  [key: string]: unknown;
}

interface CharacterRadicalRecord {
  characterGlyph: string;
  characterId: string;
  radicalId: string;
  decompositionType: string | null;
}

// ── Main ──

async function main(): Promise<void> {
  logger.info("📦 Build Character Radicals (Enrich 6)");
  logger.info("══════════════════════════════════════\n");

  // ── Load inputs ──

  logger.info("Loading inputs...");

  const mmahEntries: MmahEntry[] = JSON.parse(
    fs.readFileSync(path.join(PHASE1_DIR, "mmah-entries.json"), "utf-8"),
  );
  logger.info(`  📄 MMAH entries: ${mmahEntries.length}`);

  const phase2CharsPath = path.join(PHASE2_DIR, "characters.json");
  if (!fs.existsSync(phase2CharsPath)) {
    logger.error(
      "  ❌ Phase 2 characters.json not found — run Enrich 1 first",
      new Error("Missing characters.json"),
    );
    process.exit(1);
  }
  const characters: Array<{ id: string; glyph: string }> = JSON.parse(
    fs.readFileSync(phase2CharsPath, "utf-8"),
  );
  logger.info(`  📄 Characters: ${characters.length}`);

  if (!fs.existsSync(RADICALS_PATH)) {
    logger.error(
      `  ❌ Radicals file not found: ${RADICALS_PATH}`,
      new Error("Missing radicals.json"),
    );
    process.exit(1);
  }
  const radicals: RadicalEntry[] = JSON.parse(fs.readFileSync(RADICALS_PATH, "utf-8"));
  logger.info(`  📄 Radicals: ${radicals.length}`);

  // ── Build lookup maps ──

  // Radical glyph → ID (including alternateGlyphs)
  const radicalGlyphToId = new Map<string, string>();
  for (const radical of radicals) {
    if (!radical.id || !radical.glyph) continue;
    radicalGlyphToId.set(radical.glyph, radical.id);
    for (const alt of radical.alternateGlyphs || []) {
      if (!radicalGlyphToId.has(alt)) {
        radicalGlyphToId.set(alt, radical.id);
      }
    }
  }
  logger.info(`  📄 Radical glyph→ID: ${radicalGlyphToId.size} mappings`);

  // Character glyph → ID
  const charGlyphToId = new Map<string, string>();
  for (const ch of characters) {
    charGlyphToId.set(ch.glyph, ch.id);
  }
  logger.info(`  📄 Character glyph→ID: ${charGlyphToId.size} entries`);

  // ── Build character-radical records ──

  logger.info("Building character-radical records...");

  const records: CharacterRadicalRecord[] = [];
  const dedupSet = new Set<string>(); // "characterId_radicalId" dedup

  let radicalMatched = 0;
  let radicalUnmatched = 0;
  let skippedNoRadical = 0;

  for (const mmah of mmahEntries) {
    const glyph = mmah.character;
    if (!glyph) continue;

    const charId = charGlyphToId.get(glyph);
    if (!charId) continue; // Character not in our set

    const radicalGlyph = mmah.radical;
    if (!radicalGlyph) {
      skippedNoRadical++;
      continue;
    }

    const radicalId = radicalGlyphToId.get(radicalGlyph);
    if (!radicalId) {
      radicalUnmatched++;
      continue;
    }

    // Infer decomposition type
    let decompositionType: string | null = null;
    const etymologyType = mmah.etymology?.type?.toLowerCase();

    if (etymologyType === "pictophonetic") {
      // The radical is the semantic component
      decompositionType = "semantic";
    } else if (etymologyType === "ideographic" || etymologyType === "compound_ideograph") {
      // Could be remaining or semantic
      decompositionType = "remaining";
    } else if (etymologyType === "pictographic") {
      // Single component
      decompositionType = null;
    }

    const dedupKey = `${charId}_${radicalId}`;
    if (dedupSet.has(dedupKey)) continue;
    dedupSet.add(dedupKey);

    records.push({
      characterGlyph: glyph,
      characterId: charId,
      radicalId,
      decompositionType,
    });

    radicalMatched++;
  }

  // Sort for deterministic output
  records.sort((a, b) => {
    if (a.characterId !== b.characterId) return a.characterId.localeCompare(b.characterId);
    return a.radicalId.localeCompare(b.radicalId);
  });

  // ── Write output ──

  ensureDir(PHASE2_DIR);
  const outputPath = path.join(PHASE2_DIR, "character-radicals.json");
  writeJsonAtomic(outputPath, records);
  logger.info(`  ✅ Written ${records.length} records to ${outputPath}`);

  // ── Summary ──

  const uniqueChars = new Set(records.map((r) => r.characterId)).size;
  const withSemantic = records.filter((r) => r.decompositionType === "semantic").length;
  const withRemaining = records.filter((r) => r.decompositionType === "remaining").length;
  const withNullType = records.filter((r) => r.decompositionType === null).length;

  logger.info("\n═══════════════════════════════════════════");
  logger.info("  ✅ Character Radicals Complete");
  logger.info("═══════════════════════════════════════════\n");
  logger.info(`  Total records: ${records.length}`);
  logger.info(`  Unique characters: ${uniqueChars}`);
  logger.info(
    `  Decomposition: semantic=${withSemantic}, remaining=${withRemaining}, null=${withNullType}`,
  );
  logger.info(`  Radicals matched: ${radicalMatched}`);
  logger.info(`  Radicals unmatched: ${radicalUnmatched}`);
  logger.info(`  Characters w/o radical field: ${skippedNoRadical}`);
  logger.info("");
}

main().catch((e: Error) => {
  logger.error(`❌ Failed: ${e.message}`, e);
  process.exit(1);
});
