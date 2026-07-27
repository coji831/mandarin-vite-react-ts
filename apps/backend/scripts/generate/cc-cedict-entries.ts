/**
 * @file apps/backend/scripts/generate/cc-cedict-entries.ts
 * @description Phase 1 extractor: reads CC-CEDICT dictionary file and writes
 *   raw parsed entries to content/seed/phase1/cc-cedict-entries.json.
 *
 * Filters to entries where simplified contains at least one CJK character.
 * Keeps pinyinRaw as numbered pinyin (no tone mark conversion — that's Phase 2).
 *
 * No enrichment, no DB writes, no ID resolution.
 * Idempotent: always overwrites output.
 *
 * Run: cd apps/backend && npx tsx scripts/generate/cc-cedict-entries.ts
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("gen:cc-cedict");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const DATA_FILE = path.join(PROJECT_ROOT, "data", "CC-CEDICT", "cedict_1_0_ts_utf-8_mdbg.txt");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase1");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "cc-cedict-entries.json");

// ── Types ──

interface CedictEntry {
  traditional: string;
  simplified: string;
  pinyinRaw: string;
  pinyinNumbered: string;
  definitions: string[];
}

// ── Constants ──

// Regex: /^(?<trad>\S+)\s+(?<simp>\S+)\s+\[(?<pinyin>[^\]]+)\]\s+\/(?<defs>.*)\/$/
const CEDICT_LINE_RE = /^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.*)\/$/;

// CJK Unified Ideographs range: U+4E00..U+9FFF
// Also include CJK Extension A: U+3400..U+4DBF
const CJK_RE = /[\u3400-\u9FFF]/;

// ── Parser ──

/**
 * Parse a single line of CC-CEDICT data.
 * Returns null for comment lines (#) or unparseable lines.
 */
function parseCedictLine(line: string): CedictEntry | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const match = trimmed.match(CEDICT_LINE_RE);
  if (!match) return null;

  const [, traditional, simplified, pinyinRaw, defsStr] = match;

  // Split definitions by "/" separator
  const definitions = defsStr.split("/").filter((d) => d.trim().length > 0);

  return {
    traditional,
    simplified,
    pinyinRaw,
    pinyinNumbered: pinyinRaw,
    definitions,
  };
}

/**
 * Check if a string contains at least one CJK character.
 */
function hasCjk(s: string): boolean {
  return CJK_RE.test(s);
}

// ── Main ──

async function main(): Promise<void> {
  logger.info("=== Phase 1: Extract CC-CEDICT Entries ===");

  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`CC-CEDICT data file not found at ${DATA_FILE}`);
  }

  // Stream and parse lines
  const fileStream = fs.createReadStream(DATA_FILE, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const entries: CedictEntry[] = [];
  let totalLines = 0;
  let skippedComments = 0;
  let skippedNonCjk = 0;
  let parseErrors = 0;

  for await (const line of rl) {
    totalLines++;

    const entry = parseCedictLine(line);
    if (!entry) {
      if (line.trim().startsWith("#")) {
        skippedComments++;
      } else {
        parseErrors++;
      }
      continue;
    }

    // Filter to entries where simplified contains at least one CJK character
    if (!hasCjk(entry.simplified)) {
      skippedNonCjk++;
      continue;
    }

    entries.push(entry);

    // Log progress every 20,000 entries
    if (entries.length % 20000 === 0) {
      logger.info(`  ... parsed ${entries.length} entries so far`);
    }
  }

  logger.info(`Total lines: ${totalLines}`);
  logger.info(`Skipped comments: ${skippedComments}`);
  logger.info(`Skipped non-CJK: ${skippedNonCjk}`);
  logger.info(`Parse errors: ${parseErrors}`);
  logger.info(`Valid entries: ${entries.length}`);

  // Ensure output directory
  ensureDir(OUTPUT_DIR);

  // Write output
  writeJsonAtomic(OUTPUT_PATH, entries);
  logger.info(`Wrote ${entries.length} entries to ${OUTPUT_PATH}`);

  logger.info("Done.");
}

main().catch((err: Error) => {
  logger.error(err.message);
  process.exit(1);
});
