/**
 * Clean All Vocabulary Data Script
 * 
 * Deletes all vocabulary-related data from the database in the correct order
 * to respect foreign key constraints.
 * 
 * Usage: node scripts/clean-all-vocabulary.js
 */

import dotenv from 'dotenv';
import path from 'path';
import prisma from '../src/infrastructure/database/client.js';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });

const logger = {
  info: (msg) => console.log(`[CleanVocab] ${msg}`),
  warn: (msg) => console.warn(`[CleanVocab] ⚠️  ${msg}`),
  error: (msg) => console.error(`[CleanVocab] ❌ ${msg}`)
};

async function cleanVocabularyData() {
  try {
    logger.info('🧹 Starting vocabulary data cleanup...\n');
    
    // Step 1: Delete WordCategory junction table (no FK dependencies)
    logger.info('Deleting WordCategory links...');
    const wordCategoryResult = await prisma.wordCategory.deleteMany({});
    logger.info(`✓ Deleted ${wordCategoryResult.count} WordCategory records\n`);
    
    // Step 2: Delete WordList junction table (no FK dependencies)
    logger.info('Deleting WordList links...');
    const wordListResult = await prisma.wordList.deleteMany({});
    logger.info(`✓ Deleted ${wordListResult.count} WordList records\n`);
    
    // Step 3: Delete Categories (referenced by WordCategory)
    logger.info('Deleting Categories...');
    const categoryResult = await prisma.category.deleteMany({});
    logger.info(`✓ Deleted ${categoryResult.count} Category records\n`);
    
    // Step 4: Delete VocabularyWords (referenced by WordCategory and WordList)
    logger.info('Deleting VocabularyWords...');
    const vocabWordResult = await prisma.vocabularyWord.deleteMany({});
    logger.info(`✓ Deleted ${vocabWordResult.count} VocabularyWord records\n`);
    
    // Step 5: Delete VocabularyLists (referenced by WordList)
    logger.info('Deleting VocabularyLists...');
    const vocabListResult = await prisma.vocabularyList.deleteMany({});
    logger.info(`✓ Deleted ${vocabListResult.count} VocabularyList records\n`);
    
    // Summary
    logger.info('✅ All vocabulary data cleaned successfully!\n');
    logger.info('📊 Records deleted:');
    logger.info(`   WordCategory links: ${wordCategoryResult.count}`);
    logger.info(`   WordList links: ${wordListResult.count}`);
    logger.info(`   Categories: ${categoryResult.count}`);
    logger.info(`   VocabularyWords: ${vocabWordResult.count}`);
    logger.info(`   VocabularyLists: ${vocabListResult.count}`);
    
  } catch (error) {
    logger.error(`Cleanup failed: ${error.message}`);
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanVocabularyData()
  .then(() => {
    logger.info('\n👋 Done!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('\n💥 Cleanup failed with error:');
    console.error(error);
    process.exit(1);
  });
