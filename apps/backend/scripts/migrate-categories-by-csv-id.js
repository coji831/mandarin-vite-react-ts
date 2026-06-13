/**
 * Category & WordCategory Migration Script (Using CSV IDs)
 *
 * Migrates thematic categories and word-category relationships using CSV "No" field.
 *
 * Key Change: Links words by their CSV "No" field (1-500) instead of hash
 * Benefits: Direct mapping shows exactly which word numbers are missing
 *
 * Prerequisites:
 * - VocabularyWords must be migrated with CSV IDs (run migrate-vocabulary-by-csv-id.js first)
 * - Database connection configured in .env.local
 *
 * Usage: node scripts/migrate-categories-by-csv-id.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import prisma from "../src/shared/infrastructure/database/client.js";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), "../../.env.local") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const THEMATIC_DIR = path.resolve(
  __dirname,
  "../../frontend/public/data/vocabulary/hsk3.0/band1/thematic",
);

// Thematic categories to migrate
const THEMATIC_CATEGORIES = [
  {
    file: "daily-communication.csv",
    name: "daily-communication",
    description: "Daily communication phrases and expressions",
    displayOrder: 0,
  },
  {
    file: "people-relationships.csv",
    name: "people-relationships",
    description: "People, family, and relationships",
    displayOrder: 1,
  },
  {
    file: "food-dining.csv",
    name: "food-dining",
    description: "Food, dining, and cooking",
    displayOrder: 2,
  },
  {
    file: "places-transportation.csv",
    name: "places-transportation",
    description: "Places, locations, and transportation",
    displayOrder: 3,
  },
  {
    file: "daily-activities.csv",
    name: "daily-activities",
    description: "Daily activities and routines",
    displayOrder: 4,
  },
  {
    file: "descriptions-qualities.csv",
    name: "descriptions-qualities",
    description: "Descriptions, qualities, and adjectives",
    displayOrder: 5,
  },
  {
    file: "school-learning.csv",
    name: "school-learning",
    description: "School, learning, and education",
    displayOrder: 6,
  },
];

// Simple logger
const logger = {
  info: (msg) => console.log(`[CategoryMigration] ${msg}`),
  warn: (msg) => console.warn(`[CategoryMigration] ⚠️  ${msg}`),
  error: (msg) => console.error(`[CategoryMigration] ❌ ${msg}`),
};

/**
 * Parse CSV text into array of objects
 */
function parseCsvText(csvText) {
  const lines = csvText.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Load words from a thematic CSV file
 * Returns array with CSV's "No" field for direct word lookup
 */
function loadThematicWords(filename) {
  const filePath = path.join(THEMATIC_DIR, filename);

  if (!fs.existsSync(filePath)) {
    logger.warn(`File not found: ${filename}`);
    return [];
  }

  const csvText = fs.readFileSync(filePath, "utf-8");
  const rows = parseCsvText(csvText);

  return rows
    .map((row) => ({
      id: row.No || row.no, // CSV's "No" field - use as wordId
      pinyin: row.Pinyin || row.pinyin || "",
      simplified: row.Chinese || row.simplified || "",
      traditional: row.Traditional || row.traditional || "",
      english: row.English || row.english || "",
    }))
    .filter((word) => word.id); // Only need ID for linking
}

/**
 * Main migration function
 */
async function migrateCategories() {
  const stats = {
    categoriesCreated: 0,
    totalLinks: 0,
    linksByCategory: {},
    orphanedReferences: 0,
    orphanedDetails: [],
  };

  try {
    logger.info("🚀 Starting category migration using CSV IDs...");

    // Verify vocabulary words exist
    const wordCount = await prisma.vocabularyWord.count();
    logger.info(`✓ Found ${wordCount} vocabulary words in database`);

    if (wordCount === 0) {
      logger.error("No vocabulary words found! Run migrate-vocabulary-by-csv-id.js first.");
      throw new Error("Vocabulary words not migrated");
    }

    // Get all vocabulary word IDs for validation
    logger.info("📝 Loading vocabulary word IDs...");
    const allWords = await prisma.vocabularyWord.findMany({
      select: { id: true, simplified: true, pinyin: true },
    });
    const wordIdSet = new Set(allWords.map((w) => w.id));
    logger.info(`✓ Loaded ${wordIdSet.size} word IDs (range: 1-500 expected)\n`);

    // Show ID range
    const wordIds = Array.from(wordIdSet)
      .map((id) => parseInt(id))
      .sort((a, b) => a - b);
    logger.info(`  ID range in database: ${wordIds[0]} to ${wordIds[wordIds.length - 1]}\n`);

    // Migrate each category
    logger.info("🏷️  Creating categories and linking words...");

    for (const categoryDef of THEMATIC_CATEGORIES) {
      const { file, name, description, displayOrder } = categoryDef;

      logger.info(`\n  Processing: ${name}...`);

      // Load thematic words (with CSV IDs)
      const thematicWords = loadThematicWords(file);
      logger.info(`    Loaded ${thematicWords.length} word references from ${file}`);

      // Create or get category
      const category = await prisma.category.upsert({
        where: { name },
        update: { description, displayOrder },
        create: { name, description, displayOrder },
      });

      stats.categoriesCreated++;
      logger.info(`    ✓ Category ready: ${name}`);

      // Prepare word-category links using CSV IDs directly
      const linksToCreate = [];
      const orphanedInThisCategory = [];

      for (const word of thematicWords) {
        const wordId = word.id; // Use CSV's "No" field directly

        if (wordIdSet.has(wordId)) {
          linksToCreate.push({
            wordId,
            categoryId: category.id,
          });
        } else {
          orphanedInThisCategory.push({
            id: wordId,
            simplified: word.simplified,
            pinyin: word.pinyin,
            english: word.english,
          });
        }
      }

      // Batch insert links
      if (linksToCreate.length > 0) {
        const result = await prisma.wordCategory.createMany({
          data: linksToCreate,
          skipDuplicates: true,
        });

        stats.totalLinks += result.count;
        stats.linksByCategory[name] = result.count;
        logger.info(`    ✓ Linked ${result.count} words to ${name}`);
      }

      if (orphanedInThisCategory.length > 0) {
        stats.orphanedReferences += orphanedInThisCategory.length;
        stats.orphanedDetails.push({
          category: name,
          count: orphanedInThisCategory.length,
          samples: orphanedInThisCategory.slice(0, 5),
        });
        logger.warn(
          `    Missing ${orphanedInThisCategory.length} word IDs (not in vocabulary 1-500)`,
        );

        // Show sample missing IDs
        const sampleIds = orphanedInThisCategory
          .slice(0, 5)
          .map((w) => `#${w.id}`)
          .join(", ");
        logger.warn(`    Sample missing IDs: ${sampleIds}`);
      }
    }

    // Final validation
    logger.info("\n🔍 Validating migration...");

    const finalStats = {
      categories: await prisma.category.count(),
      wordCategoryLinks: await prisma.wordCategory.count(),
    };

    logger.info(`\n✅ Category migration completed!`);
    logger.info(`\n📊 Migration Summary:`);
    logger.info(`   Categories processed: ${stats.categoriesCreated}`);
    logger.info(`   Total word-category links created: ${stats.totalLinks}`);
    logger.info(
      `   Orphaned references (word IDs not in 1-500 range): ${stats.orphanedReferences}`,
    );
    logger.info(`\n📈 Database State:`);
    logger.info(`   Total categories: ${finalStats.categories}`);
    logger.info(`   Total word-category links: ${finalStats.wordCategoryLinks}`);
    logger.info(`\n🔗 Links per category:`);

    for (const [catName, count] of Object.entries(stats.linksByCategory)) {
      logger.info(`   ${catName}: ${count} links`);
    }

    // Show orphaned details for debugging
    if (stats.orphanedDetails.length > 0) {
      logger.info(`\n📋 Orphaned word IDs by category (for debugging):`);
      stats.orphanedDetails.forEach((detail) => {
        logger.info(`\n   ${detail.category}: ${detail.count} missing`);
        detail.samples.forEach((w) => {
          logger.info(`     #${w.id}: ${w.simplified} (${w.pinyin})`);
        });
      });
      logger.info(`\n💡 These word IDs exist in thematic CSVs but not in batch CSVs 1-500.`);
      logger.info(
        `   This is expected if thematic files reference words from other HSK bands/levels.`,
      );
    }
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateCategories()
  .then(() => {
    logger.info("\n👋 Done!");
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`\n💥 Migration failed with error:`);
    console.error(error);
    process.exit(1);
  });
