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
import { seedPinyinCombinations } from "./seeds/seed-pinyin-combinations.js";
import { seedCharacterRadicals } from "./seeds/seed-character-radicals.js";

const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...");

  // Only create test users in non-production environments
  if (process.env.NODE_ENV !== "production") {
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
  } else {
    console.log("⏭️ Skipping test user creation (production)");
  }

  // Skip vocabulary creation - 500 words already migrated from CSV
  // Check if vocabulary exists
  const vocabCount = await prisma.vocabularyWord.count();
  console.log(`📚 Found ${vocabCount} vocabulary words in database`);

  // Seed pinyin combinations
  await seedPinyinCombinations(prisma);

  // Seed character-radical mappings
  await seedCharacterRadicals(prisma);

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
