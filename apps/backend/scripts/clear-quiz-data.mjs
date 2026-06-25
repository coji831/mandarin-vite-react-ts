import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), "../../.env.local") });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

try {
  // Old SRS quiz models removed in Epic 18 cleanup — this script is preserved
  // for future use if new quiz models need cleanup
  console.log("No old quiz tables to clear (removed in Epic 18)");
} finally {
  await prisma.$disconnect();
  await pool.end();
}
