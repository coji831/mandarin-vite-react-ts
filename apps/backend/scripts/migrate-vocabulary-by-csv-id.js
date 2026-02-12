/**
 * @file apps/backend/scripts/migrate-vocabulary-by-csv-id.js
 * @description Vocabulary words migration using CSV "No" field as primary key
 * Story 15-2 Phase 1: Database migration with CSV IDs for easy tracking
 *
 * Key Change: Uses CSV's "No" field (1-500) directly as VocabularyWord.id
 * Benefits: Direct mapping, easy debugging, transparent word references
 *
 * Data source: hsk3.0-band1-001-100.csv through hsk3.0-band1-401-500.csv
 */

import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createLogger } from "../src/utils/logger.js";
import { parseCsvText } from "../src/infrastructure/parsers/CsvParser.js";

const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createLogger("VocabMigration");

// Load .env.local from workspace root
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

// Path to vocabulary data
const DATA_DIR = path.resolve(__dirname, "../../../apps/frontend/public/data/vocabulary");
const HSK_BAND1_DIR = path.join(DATA_DIR, "hsk3.0/band1");

// Canonical batch CSV files (500 unique words, no overlaps)
const BATCH_FILES = [
  "hsk3.0-band1-001-100.csv",
  "hsk3.0-band1-101-200.csv",
  "hsk3.0-band1-201-300.csv",
  "hsk3.0-band1-301-400.csv",
  "hsk3.0-band1-401-500.csv",
];

/**
 * Load words from batch CSV (uses No field from CSV)
 */
function loadWordsFromCSV(csvFilename) {
  const fullPath = path.join(HSK_BAND1_DIR, csvFilename);
  if (!fs.existsSync(fullPath)) {
    logger.warn(`⚠️  File not found: ${csvFilename}`);
    return [];
  }

  const csvText = fs.readFileSync(fullPath, "utf-8");
  const rows = parseCsvText(csvText, {
    relax_column_count: true,
  });

  // Map CSV columns to database fields, using "No" as ID
  const words = rows
    .map((row) => ({
      id: row.No || row.no, // CSV's "No" field as primary key
      pinyin: row.Pinyin || row.pinyin || "",
      simplified: row.Chinese || row.simplified || "",
      traditional: row.Traditional || row.traditional || "",
      english: row.English || row.english || "",
    }))
    .filter((word) => word.id && word.pinyin && word.simplified);

  return words;
}

/**
 * Main migration function
 */
async function migrateVocabulary() {
  logger.info("🚀 Starting vocabulary migration using CSV IDs...");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const stats = {
    lists: 0,
    words: 0,
    wordListLinks: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Step 1: Create VocabularyList
    logger.info("📚 Creating VocabularyList record...");

    const list = await prisma.vocabularyList.upsert({
      where: { id: "hsk3-band1" },
      update: {},
      create: {
        id: "hsk3-band1",
        name: "HSK 3.0 Band 1",
        description: "HSK 3.0 Band 1 - First 500 words",
        difficulty: "beginner",
        isPublic: true,
      },
    });
    stats.lists = 1;
    logger.info(`✓ Created list: ${list.name} (${list.id})\n`);

    // Step 2: Load and insert words from batch CSV files
    logger.info("📝 Loading words from canonical batch CSV files...");

    const allWords = [];
    let sortOrder = 0;

    for (const csvFile of BATCH_FILES) {
      logger.info(`  Loading ${csvFile}...`);
      const words = loadWordsFromCSV(csvFile);

      for (const word of words) {
        try {
          // Upsert VocabularyWord using CSV's "No" as ID
          await prisma.vocabularyWord.upsert({
            where: { id: word.id },
            update: {
              traditional: word.traditional,
              simplified: word.simplified,
              pinyin: word.pinyin,
              english: word.english,
            },
            create: {
              id: word.id, // Use CSV's "No" field directly
              traditional: word.traditional,
              simplified: word.simplified,
              pinyin: word.pinyin,
              english: word.english,
              exampleSentence: null,
              audioUrl: null,
            },
          });
          stats.words++;
          allWords.push(word);

          // Create WordList junction record
          await prisma.wordList.upsert({
            where: {
              wordId_listId: {
                wordId: word.id,
                listId: "hsk3-band1",
              },
            },
            update: { sortOrder },
            create: {
              wordId: word.id,
              listId: "hsk3-band1",
              sortOrder,
            },
          });
          stats.wordListLinks++;
          sortOrder++;
        } catch (err) {
          logger.error(`❌ Failed to process word: ${JSON.stringify(word)}`);
          logger.error(`   Error: ${err.message}`);
          stats.errors.push({ type: "word", word, error: err.message });
        }
      }

      logger.info(`  ✓ Loaded ${words.length} words`);
    }

    logger.info(`\n✓ Total words migrated: ${allWords.length}`);

    // Step 3: Validate Progress records
    logger.info("🔍 Validating Progress records...");
    const allWordIds = allWords.map((w) => w.id);

    if (allWordIds.length > 0) {
      const orphanedProgress = await prisma.progress.findMany({
        where: {
          wordId: {
            notIn: allWordIds,
          },
        },
      });

      if (orphanedProgress.length > 0) {
        logger.warn(`⚠️  Found ${orphanedProgress.length} Progress records with orphaned wordIds`);
        orphanedProgress.slice(0, 5).forEach((p) => {
          logger.warn(`   userId: ${p.userId}, wordId: ${p.wordId}`);
        });
      } else {
        logger.info("✓ No orphaned Progress records found");
      }
    }

    // Final Report
    logger.info("✅ Vocabulary migration completed!");
    logger.info("📊 Statistics:");
    logger.info(`   Lists created: ${stats.lists}`);
    logger.info(`   Words created: ${stats.words}`);
    logger.info(`   WordList links: ${stats.wordListLinks}`);
    logger.info(`   Skipped: ${stats.skipped}`);
    logger.info(`   Errors: ${stats.errors.length}`);
    logger.info("");
    logger.info('ℹ️  Run "npm run migrate:categories" to create thematic categories');

    if (stats.errors.length > 0) {
      logger.warn("⚠️  Errors encountered:");
      stats.errors.slice(0, 10).forEach((e) => {
        logger.warn(`   ${e.type}: ${JSON.stringify(e)}`);
      });
      if (stats.errors.length > 10) {
        logger.warn(`   ... and ${stats.errors.length - 10} more errors`);
      }
    }
  } catch (error) {
    logger.error(`❌ Fatal migration error: ${error.message}`);
    logger.error(error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run migration
migrateVocabulary()
  .then(() => {
    logger.info("🎉 Migration script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`❌ Migration script failed: ${error.message}`);
    process.exit(1);
  });
