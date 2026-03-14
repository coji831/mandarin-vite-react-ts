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
  await prisma.quizSessionAnswer.deleteMany({});
  await prisma.quizSessionQuestion.deleteMany({});
  await prisma.quizSessionSummary.deleteMany({});
  await prisma.quizSession.deleteMany({});
  console.log("Cleared quiz tables");
} finally {
  await prisma.$disconnect();
  await pool.end();
}
