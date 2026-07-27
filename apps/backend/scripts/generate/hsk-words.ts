/**
 * @file apps/backend/scripts/generate/hsk-words.ts
 * @description Phase 1 extractor: reads HSK 3.0 Word List CSV and writes
 *   raw data to content/seed/phase1/hsk-words.json.
 *
 * No enrichment, no DB writes, no ID resolution.
 * Idempotent: always overwrites output.
 *
 * Run: cd apps/backend && npx tsx scripts/generate/hsk-words.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import { writeJsonAtomic, ensureDir } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("gen:hsk-words");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CSV_PATH = path.join(PROJECT_ROOT, "data", "HSK-3.0-Word-List.csv");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase1");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "hsk-words.json");

// ── Types ──

interface HskWordEntry {
  hskLevel: number;
  hskNo: number;
  simplified: string;
  hanziAlt: string;
  usage: string;
}

// ── CSV Parsing ──

/**
 * Parse a single HSK level value.
 * Handles single-level ("1", "6") and banded ("7-9") values.
 * Returns the lowest level in the band.
 */
function parseHskLevel(raw: string | undefined): number {
  if (!raw || typeof raw !== "string") return 0;
  const trimmed = raw.trim();
  const match = trimmed.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Parse the HSK CSV into structured rows.
 * Skips the header line (first row where col 3 === "Hanzi").
 */
function parseCsvRows(): HskWordEntry[] {
  logger.info(`Reading HSK CSV from ${CSV_PATH}`);

  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`HSK CSV not found at ${CSV_PATH}`);
  }

  const raw = fs.readFileSync(CSV_PATH, "utf-8");
  const records: string[][] = parse(raw, {
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
  });

  const rows: HskWordEntry[] = [];
  for (const cols of records) {
    // Skip header row
    if (cols[3] === "Hanzi") continue;

    const hskLevelRaw = (cols[0] || "").trim();
    const hskNoRaw = (cols[1] || "").trim();
    const hanzi = (cols[3] || "").trim();
    const hanziAlt = (cols[4] || "").trim();
    const usage = (cols[5] || "").trim();

    // Skip rows with empty hanzi
    if (!hanzi) continue;

    const hskLevel = parseHskLevel(hskLevelRaw);
    const hskNo = parseInt(hskNoRaw, 10) || 0;

    rows.push({ hskLevel, hskNo, simplified: hanzi, hanziAlt, usage });
  }

  return rows;
}

// ── Main ──

function main(): void {
  logger.info("=== Phase 1: Extract HSK Words ===");

  // Parse CSV
  const rows = parseCsvRows();
  logger.info(`Parsed ${rows.length} word entries from CSV`);

  // Ensure output directory
  ensureDir(OUTPUT_DIR);

  // Write output
  writeJsonAtomic(OUTPUT_PATH, rows);
  logger.info(`Wrote ${rows.length} entries to ${OUTPUT_PATH}`);

  logger.info("Done.");
}

main();
