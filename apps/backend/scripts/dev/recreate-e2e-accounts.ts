/**
 * @file apps/backend/scripts/dev/recreate-e2e-accounts.ts
 * @description Recreate the Epic 21 E2E test accounts after a DB flush+reseed.
 *
 * The seed only creates test@example.com / demo@example.com. The e2e accounts
 * created during E2E runs are wiped by `prisma migrate reset`, so this script
 * recreates them (with the progress needed to keep future E2E batches viable):
 *
 *   - e2e.guest@example.com  — guest (logged-out browser), user row only
 *   - e2e.b1signup@example.com — signup-flow test account, user row only
 *   - e2e.gate@example.com   — Phase 2 gate state (phase1Passed: true)
 *   - e2e.user@example.com   — Phase 4 account + bookmark on passage 我的学校 (p_00001)
 *
 * All accounts use password `P@ssw0rd!`.
 *
 * Idempotent: upserts users and phase gates; bookmark upserted on the unique
 * (userId, passageId).
 *
 * Run: cd apps/backend && npx tsx scripts/dev/recreate-e2e-accounts.ts
 */
import bcrypt from "bcrypt";
import { prisma } from "../../src/shared/infrastructure/database/client.js";

const PASSWORD = "P@ssw0rd!";

async function upsertUser(email: string, displayName: string) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: await bcrypt.hash(PASSWORD, 10),
      displayName,
    },
  });
}

async function main() {
  console.log("Recreating E2E accounts...");

  // 1. Guest (logged-out browser — user row only)
  await upsertUser("e2e.guest@example.com", "E2E Guest");
  console.log("  ✅ e2e.guest@example.com (user only)");

  // 2. Signup-flow test account (user row only)
  await upsertUser("e2e.b1signup@example.com", "E2E B1 Signup");
  console.log("  ✅ e2e.b1signup@example.com (user only)");

  // 3. Phase-2 gate account (phase1Passed: true)
  const gateUser = await upsertUser("e2e.gate@example.com", "E2E Gate");
  await prisma.phaseGate.upsert({
    where: { userId: gateUser.id },
    update: { currentPhase: 2, phase1Passed: true, gateCriteria: "quiz" },
    create: {
      userId: gateUser.id,
      currentPhase: 2,
      phase1Passed: true,
      phase2Passed: false,
      phase3Passed: false,
      phase4Unlocked: false,
      gateCriteria: "quiz",
    },
  });
  console.log(`  ✅ e2e.gate@example.com (phase=2, phase1Passed=true)`);

  // 4. Phase-4 account + bookmark on 我的学校 (p_00001)
  const userAccount = await upsertUser("e2e.user@example.com", "E2E User");
  await prisma.phaseGate.upsert({
    where: { userId: userAccount.id },
    update: {
      currentPhase: 4,
      phase1Passed: true,
      phase2Passed: true,
      phase3Passed: true,
      phase4Unlocked: true,
      gateCriteria: "quiz",
    },
    create: {
      userId: userAccount.id,
      currentPhase: 4,
      phase1Passed: true,
      phase2Passed: true,
      phase3Passed: true,
      phase4Unlocked: true,
      gateCriteria: "quiz",
    },
  });
  const passage = await prisma.passage.findUnique({ where: { id: "p_00001" } });
  if (!passage) {
    throw new Error("Passage p_00001 (我的学校) not found after reseed");
  }
  await prisma.bookmark.upsert({
    where: { userId_passageId: { userId: userAccount.id, passageId: "p_00001" } },
    update: {},
    create: { userId: userAccount.id, passageId: "p_00001" },
  });
  console.log(
    `  ✅ e2e.user@example.com (phase=4, phase4Unlocked=true, bookmark=${passage.title} p_00001)`,
  );

  // 5. Confirm seed users exist
  for (const email of ["test@example.com", "demo@example.com"]) {
    const exists = await prisma.user.findUnique({ where: { email } });
    console.log(`  ${exists ? "✅" : "❌"} seed user ${email} ${exists ? "" : "MISSING"}`);
  }

  await prisma.$disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error("ERR", e);
  process.exit(1);
});
