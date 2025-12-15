import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;

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
