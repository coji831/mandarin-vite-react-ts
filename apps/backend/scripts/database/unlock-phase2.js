/**
 * Unlock Phase 2 for Test User
 * Run: node scripts/database/unlock-phase2.js
 *
 * Prerequisites:
 *   - cd apps/backend
 *   - node scripts/database/unlock-phase2.js
 *
 * Or from monorepo root:
 *   node apps/backend/scripts/database/unlock-phase2.js
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
    console.error("Test user not found (test@example.com)");
    process.exit(1);
  }

  const phaseGate = await prisma.phaseGate.upsert({
    where: { userId: user.id },
    update: {
      currentPhase: 2,
      phase1Passed: true,
      gateCriteria: "quiz",
    },
    create: {
      userId: user.id,
      currentPhase: 2,
      phase1Passed: true,
      phase2Passed: false,
      phase3Passed: false,
      phase4Unlocked: false,
      gateCriteria: "quiz",
    },
  });

  console.log(`✅ Phase 2 unlocked for ${user.email} (userId: ${user.id})`);
  console.log(`   currentPhase:   ${phaseGate.currentPhase}`);
  console.log(`   phase1Passed:   ${phaseGate.phase1Passed}`);
  console.log(`   gateCriteria:   ${phaseGate.gateCriteria}`);
}

main()
  .catch((e) => {
    console.error("Failed to unlock Phase 2:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
