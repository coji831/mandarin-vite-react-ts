import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), "../../.env.local") });

const poolerUrl = process.env.DATABASE_URL;
// Direct (non-pooler) endpoint — Neon pooler doesn't work with Prisma driver adapters
const directUrl = poolerUrl.replace("-pooler", "");

console.log("Testing Prisma connection with adapter-pg...\n");

// Test 1: Pooler URL
console.log("=== Test 1: Pooler URL ===");
try {
  const pool1 = new pg.Pool({ connectionString: poolerUrl });
  const adapter1 = new PrismaPg(pool1);
  const prisma1 = new PrismaClient({ adapter: adapter1, datasourceUrl: poolerUrl });
  await prisma1.$connect();
  const r1 = await prisma1.$queryRaw`SELECT 1 as ok`;
  console.log("Pooler URL works:", r1);
  await prisma1.$disconnect();
} catch (err) {
  console.error("Pooler URL error:", err.code || "N/A");
  if (err.code !== "ECONNREFUSED") console.error("  Full:", err.message?.slice(0, 200));
}

// Test 2: Direct URL (non-pooler)
console.log("\n=== Test 2: Direct URL (non-pooler) ===");
try {
  const pool2 = new pg.Pool({ connectionString: directUrl });
  const adapter2 = new PrismaPg(pool2);
  const prisma2 = new PrismaClient({ adapter: adapter2, datasourceUrl: directUrl });
  await prisma2.$connect();
  const r2 = await prisma2.$queryRaw`SELECT 1 as ok`;
  console.log("Direct URL works:", r2);
  await prisma2.$disconnect();
} catch (err) {
  console.error("Direct URL error:", err.code || "N/A");
  if (err.code !== "ECONNREFUSED") console.error("  Full:", err.message?.slice(0, 200));
}

// Test 3: pg.Pool directly (baseline)
console.log("\n=== Test 3: pg.Pool direct (baseline) ===");
try {
  const pool3 = new pg.Pool({ connectionString: poolerUrl });
  const r3 = await pool3.query("SELECT 1 as ok");
  console.log("pg.Pool works:", r3.rows);
  await pool3.end();
} catch (err) {
  console.error("pg.Pool error:", err.code || "N/A");
}
