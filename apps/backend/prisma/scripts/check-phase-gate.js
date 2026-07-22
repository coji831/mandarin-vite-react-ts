/**
 * Check Phase Gate status for test@example.com
 * Run: node prisma/scripts/check-phase-gate.js (from apps/backend)
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../../.env.local") });
import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const { PrismaClient } = prismaPkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "test@example.com" },
  });

  if (!user) {
    console.log("❌ Test user not found (test@example.com)");
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  }

  console.log(`✅ Test user found: ${user.email} (id: ${user.id})`);

  const phaseGate = await prisma.phaseGate.findUnique({
    where: { userId: user.id },
  });

  if (phaseGate) {
    console.log(`\n📋 PhaseGate record:`);
    console.log(`   currentPhase:   ${phaseGate.currentPhase}`);
    console.log(`   phase1Passed:   ${phaseGate.phase1Passed}`);
    console.log(`   phase2Passed:   ${phaseGate.phase2Passed}`);
    console.log(`   phase3Passed:   ${phaseGate.phase3Passed}`);
    console.log(`   gateCriteria:   ${phaseGate.gateCriteria}`);
    console.log(`   createdAt:      ${phaseGate.createdAt}`);
  } else {
    console.log("\n❌ No PhaseGate record found for test@example.com");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
