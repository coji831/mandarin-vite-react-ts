/**
 * @file scripts/seed-words.js
 * @description Standalone CSV word import script
 *
 * Usage: node scripts/seed-words.js [csv-file-path]
 * If no CSV file is provided, reads from stdin.
 *
 * Imports vocabulary words from a CSV file into the database.
 * CSV format: simplified, traditional, pinyin, english, hskLevel
 */

import { prisma } from "../src/shared/infrastructure/database/client.js";
import { parseCsvText } from "../src/shared/infrastructure/parsers/CsvParser.js";
import { createLogger } from "../src/shared/utils/logger.js";
import fs from "fs";

const logger = createLogger("SeedWords");

/**
 * Parse and validate a word row from CSV
 * @param {object} row - CSV row
 * @param {number} index - Row index for error reporting
 * @returns {object|null} Validated word data or null if invalid
 */
function parseWordRow(row, index) {
  const simplified = (row.simplified || "").trim();
  const pinyin = (row.pinyin || "").trim();
  const english = (row.english || "").trim();

  if (!simplified || !pinyin || !english) {
    logger.warn(`Skipping row ${index + 1}: missing required fields`, { row });
    return null;
  }

  return {
    id: row.id || `${simplified}_${Date.now()}_${index}`,
    simplified,
    traditional: (row.traditional || simplified).trim(),
    pinyin,
    english,
    hskLevel: row.hskLevel ? parseInt(row.hskLevel, 10) : null,
  };
}

/**
 * Seed words from CSV data into the database
 * @param {Array<object>} words - Array of word objects
 * @returns {Promise<{created: number, skipped: number}>} Import results
 */
async function seedWords(words) {
  let created = 0;
  let skipped = 0;

  for (const word of words) {
    try {
      await prisma.vocabularyWord.upsert({
        where: { id: word.id },
        update: {
          simplified: word.simplified,
          traditional: word.traditional,
          pinyin: word.pinyin,
          english: word.english,
        },
        create: {
          id: word.id,
          simplified: word.simplified,
          traditional: word.traditional,
          pinyin: word.pinyin,
          english: word.english,
        },
      });
      created++;
    } catch (err) {
      logger.error(`Failed to upsert word ${word.id}`, { error: err.message });
      skipped++;
    }
  }

  return { created, skipped };
}

/**
 * Main entry point
 */
async function main() {
  const csvPath = process.argv[2];

  let csvText;
  if (csvPath) {
    csvText = fs.readFileSync(csvPath, "utf-8");
  } else {
    // Read from stdin
    csvText = fs.readFileSync("/dev/stdin", "utf-8");
  }

  const rows = parseCsvText(csvText);
  const words = rows.map(parseWordRow).filter(Boolean);

  logger.info(`Parsed ${words.length} valid words from ${rows.length} rows`);

  const result = await seedWords(words);

  logger.info(`Seed complete: ${result.created} created, ${result.skipped} skipped`);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  logger.error("Seed failed", { error: err.message });
  prisma.$disconnect().catch(() => {});
  process.exit(1);
});
