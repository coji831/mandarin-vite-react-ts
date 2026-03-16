/**
 * Check migration progress
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';

const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local from workspace root
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

async function checkProgress() {
  console.log('📊 Checking migration progress...\n');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const listCount = await prisma.vocabularyList.count();
    const wordCount = await prisma.vocabularyWord.count();
    const categoryCount = await prisma.category.count();
    const wordListLinks = await prisma.wordList.count();
    const wordCategoryLinks = await prisma.wordCategory.count();
    
    console.log(`📚 VocabularyLists: ${listCount}`);
    console.log(`📝 VocabularyWords: ${wordCount}`);
    console.log(`🏷️  Categories: ${categoryCount}`);
    console.log(`🔗 WordList links: ${wordListLinks}`);
    console.log(`🔗 WordCategory links: ${wordCategoryLinks}`);
    
    if (wordCount > 0) {
      const sampleWords = await prisma.vocabularyWord.findMany({ take: 3 });
      console.log(`\n📖 Sample words:`);
      sampleWords.forEach(w => {
        console.log(`   ${w.simplified} (${w.pinyin}) - ${w.english}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkProgress();
