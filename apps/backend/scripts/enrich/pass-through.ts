/**
 * @file apps/backend/scripts/enrich/pass-through.ts
 * @description Copy-through scripts for Phase 1 files that pass through to
 *   Phase 2 with minimal transformation (adding IDs).
 *
 * Reads & Writes:
 *   - content/seed/phase1/pinyin-syllables.json → phase2/pinyin-syllables.json (+IDs)
 *   - content/seed/phase1/demo-passages.json  → phase2/demo-passages.json (+IDs)
 *   - Empty placeholder files for deferred tables
 *
 * Idempotent: pure JSON-to-JSON transform.
 *
 * Run: cd apps/backend && npx tsx scripts/enrich/pass-through.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("enrich:pass-through");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const PHASE1_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase1");
const PHASE2_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase2");

// ── Types ──

interface PinyinSyllableEntry {
  initial: string;
  final: string;
  tone: number;
  syllable: string;
  syllablePretty: string;
}

interface PinyinSyllableRecord {
  id: string;
  initial: string;
  final: string;
  tone: number;
  syllable: string;
  syllablePretty: string;
}

interface DemoPassageSentence {
  text: string;
  words: string[];
}

interface DemoPassageContent {
  sentences: DemoPassageSentence[];
}

interface DemoPassageEntry {
  title: string;
  hskLevel: number;
  content: DemoPassageContent;
  metadata: {
    wordCount: number;
    uniqueChars: number;
  };
}

interface DemoPassageRecord {
  id: string;
  title: string;
  hskLevel: number;
  content: DemoPassageContent;
  metadata: {
    wordCount: number;
    uniqueChars: number;
  };
}

// ── Pinyin Syllable ──

function processPinyinSyllables(): number {
  logger.info("Processing pinyin-syllables...");

  const inputPath = path.join(PHASE1_DIR, "pinyin-syllables.json");
  if (!fs.existsSync(inputPath)) {
    logger.warn("  ⚠️ pinyin-syllables.json not found, skipping");
    return 0;
  }

  const entries: PinyinSyllableEntry[] = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  const records: PinyinSyllableRecord[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    records.push({
      id: `ps_${String(i + 1).padStart(5, "0")}`,
      initial: entry.initial,
      final: entry.final,
      tone: entry.tone,
      syllable: entry.syllable,
      syllablePretty: entry.syllablePretty,
    });
  }

  const outputPath = path.join(PHASE2_DIR, "pinyin-syllables.json");
  writeJsonAtomic(outputPath, records);
  logger.info(`  ✅ Written ${records.length} pinyin syllables`);
  return records.length;
}

// ── Demo Passages ──

function processDemoPassages(): number {
  logger.info("Processing demo-passages...");

  const inputPath = path.join(PHASE1_DIR, "demo-passages.json");
  if (!fs.existsSync(inputPath)) {
    logger.warn("  ⚠️ demo-passages.json not found, skipping");
    return 0;
  }

  const entries: DemoPassageEntry[] = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  const records: DemoPassageRecord[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    records.push({
      id: `p_${String(i + 1).padStart(5, "0")}`,
      title: entry.title,
      hskLevel: entry.hskLevel,
      content: entry.content,
      metadata: entry.metadata,
    });
  }

  const outputPath = path.join(PHASE2_DIR, "demo-passages.json");
  writeJsonAtomic(outputPath, records);
  logger.info(`  ✅ Written ${records.length} demo passages`);
  return records.length;
}

// ── Placeholder files ──

function createPlaceholders(): void {
  logger.info("Creating placeholder files for deferred tables...");

  const componentEntriesPath = path.join(PHASE2_DIR, "component-entries.json");
  if (!fs.existsSync(componentEntriesPath)) {
    writeJsonAtomic(componentEntriesPath, []);
    logger.info("  ✅ Created component-entries.json (empty)");
  } else {
    logger.info("  ⏭️ component-entries.json already exists, skipping");
  }

  const charComponentsPath = path.join(PHASE2_DIR, "character-components.json");
  if (!fs.existsSync(charComponentsPath)) {
    writeJsonAtomic(charComponentsPath, []);
    logger.info("  ✅ Created character-components.json (empty)");
  } else {
    logger.info("  ⏭️ character-components.json already exists, skipping");
  }
}

// ── Main ──

async function main(): Promise<void> {
  logger.info("📦 Pass-Through & Placeholder Files");
  logger.info("════════════════════════════════════\n");

  ensureDir(PHASE2_DIR);

  const pinyinCount = processPinyinSyllables();
  const passageCount = processDemoPassages();
  createPlaceholders();

  logger.info("\n═══════════════════════════════════════════");
  logger.info("  ✅ Pass-Through Complete");
  logger.info("═══════════════════════════════════════════\n");
  logger.info(`  Pinyin syllables: ${pinyinCount}`);
  logger.info(`  Demo passages: ${passageCount}`);
  logger.info("  Placeholder files: component-entries.json, character-components.json");
  logger.info("");
}

main().catch((e: Error) => {
  logger.error(`❌ Failed: ${e.message}`, e);
  process.exit(1);
});
