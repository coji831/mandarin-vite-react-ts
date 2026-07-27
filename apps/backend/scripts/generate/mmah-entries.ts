/**
 * @file apps/backend/scripts/generate/mmah-entries.ts
 * @description Phase 1 extractor: reads Make Me a Hanzi dictionary.txt (JSONL)
 *   and writes raw entries to content/seed/phase1/mmah-entries.json.
 *
 * Keeps the full raw MMAH entry structure with no transformation.
 * Streams the JSONL file line by line (~9,500 lines, ~600KB).
 *
 * No enrichment, no DB writes, no ID resolution.
 * Idempotent: always overwrites output.
 *
 * Run: cd apps/backend && npx tsx scripts/generate/mmah-entries.ts
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("gen:mmah");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const DATA_FILE = path.join(PROJECT_ROOT, "data", "make-me-a-hanzi", "dictionary.txt");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase1");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "mmah-entries.json");

// ── Types ──

interface MmahEtymology {
  type?: string;
  hint?: string;
  phonetic?: string;
  semantic?: string;
}

interface MmahEntry {
  character: string;
  definition?: string;
  pinyin?: string[];
  decomposition?: string;
  etymology?: MmahEtymology;
  radical?: string;
  matches?: Array<number[] | null>;
  [key: string]: unknown; // Allow any other fields the source may have
}

// ── Main ──

async function main(): Promise<void> {
  logger.info("=== Phase 1: Extract Make Me a Hanzi Entries ===");

  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(
      `MMAH data file not found at ${DATA_FILE}\n` +
        "Download from: https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt\n" +
        "And place at: data/make-me-a-hanzi/dictionary.txt",
    );
  }

  // Stream and parse JSONL
  const fileStream = fs.createReadStream(DATA_FILE, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const entries: MmahEntry[] = [];
  let totalLines = 0;
  let parseErrors = 0;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    totalLines++;

    try {
      const entry: MmahEntry = JSON.parse(trimmed);
      entries.push(entry);
    } catch {
      parseErrors++;
    }

    // Log progress every 2,000 entries
    if (entries.length % 2000 === 0) {
      logger.info(`  ... parsed ${entries.length} entries so far`);
    }
  }

  logger.info(`Total lines: ${totalLines}`);
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
