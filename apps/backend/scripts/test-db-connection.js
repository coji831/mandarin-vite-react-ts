/**
 * Quick script to test database connection and Prisma Client
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";

const { PrismaClient } = prismaPkg;
const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local from workspace root
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

async function testConnection() {
  console.log("Testing database connection...");
  console.log("📌 Using DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 60) + "...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Test simple query
    const userCount = await prisma.user.count();
    console.log(`✓ Connected! Found ${userCount} users`);

    // Test VocabularyList query
    const lists = await prisma.vocabularyList.findMany();
    console.log(`✓ Found ${lists.length} vocabulary lists`);

    // Try creating a test list
    await prisma.vocabularyList.upsert({
      where: { id: "test-list" },
      update: { name: "Test List Updated" },
      create: {
        id: "test-list",
        name: "Test List",
        description: "Test description",
        difficulty: "beginner",
        isPublic: true,
      },
    });
    console.log("✓ Successfully created/updated test list");

    // Clean up test list
    await prisma.vocabularyList.delete({ where: { id: "test-list" } });
    console.log("✓ Cleaned up test list");

    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testConnection();
