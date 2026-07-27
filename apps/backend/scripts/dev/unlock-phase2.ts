/**
 * @file apps/backend/scripts/database/unlock-phase2.ts
 * @description Unlock Phase 2 for the test user (test@example.com).
 *
 * Uses the shared Prisma client and env loader from the scripts infrastructure.
 * Idempotent: calling it again just updates the phase gate to Phase 2.
 *
 * Prerequisites:
 *   - .env.local at the monorepo root with DATABASE_URL
 *   - A user with email test@example.com exists in the database
 *
 * Run: cd apps/backend && npx tsx scripts/database/unlock-phase2.ts
 */

import { prisma } from "../client.js";
import { loadEnv } from "../utils.js";

async function main(): Promise<void> {
  loadEnv();

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
  .catch((e: unknown) => {
    console.error("Failed to unlock Phase 2:", e instanceof Error ? e.message : String(e));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
