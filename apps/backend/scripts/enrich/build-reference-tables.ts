/**
 * @file apps/backend/scripts/enrich/build-reference-tables.ts
 * @description Enrich: Convert legacy reference data into Phase 2 seed files.
 *
 * Moves the last file-based runtime reference datasets into the canonical
 * content/seed/phase2/ pipeline so they can be bulk-loaded into the new
 * reference tables (Radical, Tone, PinyinPhoneme, TonePair, ToneRule) by
 * prisma/seed.ts. After this conversion, nothing under content/radicals/,
 * content/tones/, content/pinyin/ or content/references/tone-reference.json
 * is read at runtime — the seed files are the single source of truth.
 *
 * Reads:
 *   - content/radicals/radicals.json            → writes phase2/radicals.json
 *       (normalizes nameChinese: "" → null)
 *   - content/tones/tones.json                  → writes phase2/tones.json
 *   - content/pinyin/pinyin.json                → writes phase2/pinyin-phonemes.json
 *       (rows already carry phonemeType; initials have no ipa/description on finals)
 *   - content/references/tone-reference.json    → writes phase2/tone-pairs.json
 *       + phase2/tone-rules.json (toneRules.examples stays nested as Json)
 *
 * Idempotent: pure JSON-to-JSON transform — safe to re-run.
 *
 * Run: cd apps/backend && npx tsx scripts/enrich/build-reference-tables.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("enrich:reference-tables");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const PHASE2_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase2");

const RADICALS_SRC = path.join(PROJECT_ROOT, "content", "radicals", "radicals.json");
const TONES_SRC = path.join(PROJECT_ROOT, "content", "tones", "tones.json");
const PINYIN_SRC = path.join(PROJECT_ROOT, "content", "pinyin", "pinyin.json");
const TONE_REFERENCE_SRC = path.join(PROJECT_ROOT, "content", "references", "tone-reference.json");

// ── Types ──

interface RadicalEntry {
  id: string;
  glyph: string;
  alternateGlyphs: string[];
  namePinyin: string;
  nameChinese: string | null;
  meaning: string;
  strokeCount: number;
  isRecommended: boolean;
  kangxiIndex: number | null;
  etymology: string | null;
  frequencyRank: number | null;
  notes: string | null;
  isAlsoCharacter: boolean | null;
  variants: unknown;
}

interface ToneEntry {
  id: string;
  number: number;
  name: string;
  mark: string;
  contour: number[];
  pitchDescription: string;
  exampleSyllable: string | null;
  exampleCharacter: string | null;
  color: string | null;
  pronunciationGuide: string | null;
  commonIssues: string | null;
}

interface PinyinPhonemeEntry {
  id: string;
  pinyin: string;
  phonemeType: string;
  type: string | null;
  category: string | null;
  ipa: string | null;
  description: string | null;
  mouthPosition: string | null;
  voiced: boolean | null;
  aspirated: boolean | null;
  toneVariants: unknown;
  pronunciationGuide: string | null;
  commonIssues: string | null;
}

interface TonePairEntry {
  id: string;
  chinese: string;
  dictionaryPinyin: string;
  spokenPinyin: string;
  rule: string;
  pattern: string;
}

interface ToneRuleEntry {
  id: string;
  title: string;
  rule: string;
  examples: unknown[];
}

// ── Main ──

async function main(): Promise<void> {
  logger.info("📦 Build Reference Tables (WS1 — all-in-DB)");
  logger.info("═══════════════════════════════════════════\n");

  ensureDir(PHASE2_DIR);

  // ── 1. Radicals ──
  logger.info("Converting radicals → phase2/radicals.json ...");
  const radicals: RadicalEntry[] = JSON.parse(fs.readFileSync(RADICALS_SRC, "utf-8"));
  const normalizedRadicals = radicals.map((r) => ({
    ...r,
    // DB model nameChinese is String? — normalize empty string to null
    nameChinese: r.nameChinese && r.nameChinese.length > 0 ? r.nameChinese : null,
  }));
  writeJsonAtomic(path.join(PHASE2_DIR, "radicals.json"), normalizedRadicals);
  logger.info(`  ✅ ${normalizedRadicals.length} radicals (nameChinese "" → null normalized)`);

  // ── 2. Tones ──
  logger.info("Converting tones → phase2/tones.json ...");
  const tones: ToneEntry[] = JSON.parse(fs.readFileSync(TONES_SRC, "utf-8"));
  writeJsonAtomic(path.join(PHASE2_DIR, "tones.json"), tones);
  logger.info(`  ✅ ${tones.length} tones`);

  // ── 3. Pinyin phonemes ──
  logger.info("Converting pinyin → phase2/pinyin-phonemes.json ...");
  const phonemes: PinyinPhonemeEntry[] = JSON.parse(fs.readFileSync(PINYIN_SRC, "utf-8"));
  writeJsonAtomic(path.join(PHASE2_DIR, "pinyin-phonemes.json"), phonemes);
  const initials = phonemes.filter((p) => p.phonemeType === "initial").length;
  const finals = phonemes.filter((p) => p.phonemeType === "final").length;
  logger.info(`  ✅ ${phonemes.length} phonemes (${initials} initials, ${finals} finals)`);

  // ── 4. Tone reference (tone pairs + tone rules) ──
  logger.info("Converting tone-reference → phase2/tone-pairs.json + tone-rules.json ...");
  const toneReference: { tonePairs: TonePairEntry[]; toneRules: ToneRuleEntry[] } = JSON.parse(
    fs.readFileSync(TONE_REFERENCE_SRC, "utf-8"),
  );
  writeJsonAtomic(path.join(PHASE2_DIR, "tone-pairs.json"), toneReference.tonePairs);
  writeJsonAtomic(path.join(PHASE2_DIR, "tone-rules.json"), toneReference.toneRules);
  logger.info(
    `  ✅ ${toneReference.tonePairs.length} tone pairs, ${toneReference.toneRules.length} tone rules`,
  );

  // ── Summary ──
  logger.info("\n═══════════════════════════════════════════");
  logger.info("  ✅ Reference Tables Complete");
  logger.info("═══════════════════════════════════════════\n");
  logger.info("  Output (content/seed/phase2/):");
  logger.info("    radicals.json         — Radical table");
  logger.info("    tones.json            — Tone table");
  logger.info("    pinyin-phonemes.json  — PinyinPhoneme table");
  logger.info("    tone-pairs.json       — TonePair table");
  logger.info("    tone-rules.json       — ToneRule table");
  logger.info("");
}

main().catch((e: Error) => {
  logger.error(`❌ Failed: ${e.message}`, e);
  process.exit(1);
});
