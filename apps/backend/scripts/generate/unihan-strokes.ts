/**
 * @file apps/backend/scripts/generate/unihan-strokes.ts
 * @description Phase 1 extractor: downloads/extracts Unihan_IRGSources.txt,
 *   parses kTotalStrokes for each CJK character, and writes a character→strokeCount
 *   map to content/seed/phase1/unihan-strokes.json.
 *
 * Includes ALL characters from Unihan (not just our 2,971). Phase 2 will filter.
 * Caches the downloaded zip and extracted text in data/unihan-cache/.
 *
 * No enrichment, no DB writes, no ID resolution.
 * Idempotent: uses cache to avoid re-downloading.
 *
 * Run: cd apps/backend && npx tsx scripts/generate/unihan-strokes.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("gen:unihan");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CACHE_DIR = path.join(PROJECT_ROOT, "data", "unihan-cache");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase1");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "unihan-strokes.json");

// ── Unihan Data Source ──

const UNIHAN_ZIP_URL = "https://unicode.org/Public/UCD/latest/ucd/Unihan.zip";

const CACHE_ZIP = path.join(CACHE_DIR, "Unihan.zip");
const CACHE_FILE = path.join(CACHE_DIR, "Unihan_IRGSources.txt");

// ── Fetch or Load Cached ──

async function fetchUnihanData(): Promise<string> {
  // Check cache first
  if (fs.existsSync(CACHE_FILE)) {
    const cached = fs.readFileSync(CACHE_FILE, "utf-8");
    const lineCount = cached.split("\n").length;
    logger.info(`Using cached IRGSources (${lineCount} lines)`);
    return cached;
  }

  ensureDir(CACHE_DIR);

  // Download the zip file if not cached
  if (!fs.existsSync(CACHE_ZIP)) {
    logger.info(`Downloading Unihan.zip from ${UNIHAN_ZIP_URL}...`);
    const response = await fetch(UNIHAN_ZIP_URL);
    if (!response.ok) {
      throw new Error(`Failed to download Unihan.zip: ${response.status} ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(CACHE_ZIP, buffer);
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(1);
    logger.info(`Downloaded ${sizeMB} MB to ${CACHE_ZIP}`);
  } else {
    logger.info(`Using cached zip: ${CACHE_ZIP}`);
  }

  // Extract Unihan_IRGSources.txt from the zip
  logger.info("Extracting Unihan_IRGSources.txt from zip...");
  const AdmZip = (await import("adm-zip")).default;
  const zip = new AdmZip(CACHE_ZIP);
  const entry = zip.getEntry("Unihan_IRGSources.txt");
  if (!entry) {
    throw new Error("Unihan_IRGSources.txt not found in zip archive");
  }
  const text = entry.getData().toString("utf-8");
  const sizeKB = (text.length / 1024).toFixed(0);
  logger.info(`Extracted ${sizeKB} KB`);

  // Cache the extracted text
  fs.writeFileSync(CACHE_FILE, text, "utf-8");
  logger.info(`Cached extracted text to ${CACHE_FILE}`);

  return text;
}

// ── Parse kTotalStrokes ──

function parseStrokeCounts(unihanText: string): Record<string, number> {
  const strokeMap: Record<string, number> = {};
  const lines = unihanText.split("\n");

  // Format: U+4E00\tkTotalStrokes\t5
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const parts = line.split("\t");
    if (parts.length < 3) continue;

    const [codePoint, field, value] = parts;
    if (field !== "kTotalStrokes") continue;

    // Parse code point: "U+4E00"
    const hexStr = codePoint.trim();
    if (!hexStr.startsWith("U+")) continue;

    const codePointInt = parseInt(hexStr.substring(2), 16);
    if (isNaN(codePointInt)) continue;

    const glyph = String.fromCodePoint(codePointInt);

    const strokeCount = parseInt(value.trim(), 10);
    if (isNaN(strokeCount) || strokeCount < 1 || strokeCount > 64) continue;

    strokeMap[glyph] = strokeCount;
  }

  return strokeMap;
}

// ── Main ──

async function main(): Promise<void> {
  logger.info("=== Phase 1: Extract Unihan Stroke Counts ===");

  // Fetch Unihan data (cached)
  const unihanText = await fetchUnihanData();
  const strokeMap = parseStrokeCounts(unihanText);
  const entryCount = Object.keys(strokeMap).length;
  logger.info(`Parsed ${entryCount} stroke count entries from Unihan`);

  if (entryCount === 0) {
    throw new Error("No stroke count data parsed. Aborting.");
  }

  // Ensure output directory
  ensureDir(OUTPUT_DIR);

  // Write output
  writeJsonAtomic(OUTPUT_PATH, strokeMap);
  logger.info(`Wrote ${entryCount} entries to ${OUTPUT_PATH}`);

  logger.info("Done.");
}

main().catch((err: Error) => {
  logger.error(err.message);
  process.exit(1);
});
