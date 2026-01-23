/**
 * @file apps/backend/prisma/seed.js
 * @description Database seed script for development and testing
 *
 * Populates the database with:
 * - Test users with hashed passwords
 * - Sample vocabulary words from HSK1-2 levels
 * - Initial progress records for testing
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
import bcrypt from "bcrypt";

const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...");

  // Create test users
  const testUser = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      passwordHash: await bcrypt.hash("Test1234!", 10),
      displayName: "Test User",
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      passwordHash: await bcrypt.hash("Demo1234!", 10),
      displayName: "Demo User",
    },
  });

  console.log("✅ Created test users");

  // Seed vocabulary words
  const vocabularyWords = [
    {
      traditional: "你好",
      simplified: "你好",
      pinyin: "nǐ hǎo",
      english: "hello",
      level: "HSK1",
      category: "Greetings",
    },
    {
      traditional: "謝謝",
      simplified: "谢谢",
      pinyin: "xiè xiè",
      english: "thank you",
      level: "HSK1",
      category: "Greetings",
    },
    {
      traditional: "再見",
      simplified: "再见",
      pinyin: "zài jiàn",
      english: "goodbye",
      level: "HSK1",
      category: "Greetings",
    },
    {
      traditional: "是",
      simplified: "是",
      pinyin: "shì",
      english: "to be",
      level: "HSK1",
      category: "Verbs",
    },
    {
      traditional: "不",
      simplified: "不",
      pinyin: "bù",
      english: "no / not",
      level: "HSK1",
      category: "Grammar",
    },
  ];

  // Create vocabulary words (PostgreSQL supports skipDuplicates in createMany)
  await prisma.vocabularyWord.createMany({
    data: vocabularyWords,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${vocabularyWords.length} vocabulary words`);

  // Create sample progress for test user
  const words = await prisma.vocabularyWord.findMany({ take: 3 });

  for (const word of words) {
    await prisma.progress.upsert({
      where: {
        userId_wordId: {
          userId: testUser.id,
          wordId: word.id,
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        wordId: word.id,
        studyCount: 1,
        correctCount: 0,
        confidence: 0.5,
        nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      },
    });
  }

  console.log("✅ Created sample progress records");
  console.log("🎉 Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
