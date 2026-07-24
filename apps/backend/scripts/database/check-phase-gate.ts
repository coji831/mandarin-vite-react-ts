/**
 * @file apps/backend/scripts/database/check-phase-gate.ts
 * @description Check Phase Gate status for test@example.com.
 *   Verifies the test user exists and inspects their PhaseGate record.
 *
 * Run: cd apps/backend && npx tsx scripts/database/check-phase-gate.ts
 */

import { prisma } from "../client.js";
import { loadEnv } from "../utils.js";

async function main() {
  loadEnv();

  const user = await prisma.user.findUnique({
    where: { email: "test@example.com" },
  });

  if (!user) {
    console.log("❌ Test user not found (test@example.com)");
    return;
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
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
