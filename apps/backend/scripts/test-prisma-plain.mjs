import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), "../../.env.local") });

// Test Prisma WITHOUT the driver adapter
const prisma = new PrismaClient();

try {
  await prisma.$connect();
  console.log("Connected without adapter!");
  const r = await prisma.$queryRaw`SELECT 1 as ok`;
  console.log("Query result:", r);
  await prisma.$disconnect();
} catch (err) {
  console.error("Error without adapter:", err.code || "N/A");
  console.error("Message:", err.message?.slice(0, 300));
}
