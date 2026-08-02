/**
 * @file apps/backend/scripts/database/unlock-phase3.ts
 * @description Unlock Phase 3 (Graded Readers, Phonetic Foundations) for a user.
 *
 * Idempotent: uses prisma.phaseGate.upsert — safe to run multiple times.
 *
 * Usage:
 *   npx tsx scripts/database/unlock-phase3.ts
 *   USER_EMAIL="user@example.com" npx tsx scripts/database/unlock-phase3.ts
 */

import { prisma } from "../client.js";
import { loadEnv } from "../utils.js";

async function main(): Promise<void> {
  loadEnv();

  const targetEmail = process.env.USER_EMAIL || "test@example.com";

  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
  });

  if (!user) {
    console.error(`User not found: ${targetEmail}`);
    process.exit(1);
  }

  const phaseGate = await prisma.phaseGate.upsert({
    where: { userId: user.id },
    update: {
      currentPhase: 3,
      phase1Passed: true,
      phase2Passed: true,
      gateCriteria: "quiz",
    },
    create: {
      userId: user.id,
      currentPhase: 3,
      phase1Passed: true,
      phase2Passed: true,
      phase3Passed: false,
      phase4Unlocked: false,
      gateCriteria: "quiz",
    },
  });

  console.log(`✅ Phase 3 unlocked for ${user.email} (userId: ${user.id})`);
  console.log(`   currentPhase:   ${phaseGate.currentPhase}`);
  console.log(`   phase1Passed:   ${phaseGate.phase1Passed}`);
  console.log(`   phase2Passed:   ${phaseGate.phase2Passed}`);
  console.log(`   gateCriteria:   ${phaseGate.gateCriteria}`);
}

main()
  .catch((e: unknown) => {
    console.error("Failed to unlock Phase 3:", e instanceof Error ? e.message : String(e));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
