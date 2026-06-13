import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;

// Load .env.local from root (same as backend config)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", "..", ".env.local");
dotenv.config({ path: envPath });

console.log("Loading DATABASE_URL from:", envPath);
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✓ loaded" : "✗ missing");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testConnection() {
  try {
    console.log("Testing connection to Supabase PostgreSQL...");
    await prisma.$connect();
    console.log("✅ Connection successful!");

    const result = await prisma.$queryRaw`SELECT current_database(), version()`;
    console.log("Database info:", result);
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    console.error("Full error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testConnection();
