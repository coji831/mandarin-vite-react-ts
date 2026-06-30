/**
 * @file apps/backend/scripts/enable-phase2.js
 * @description Enable Phase 2 for a given user by email.
 * Upserts the user's PhaseGate with currentPhase=2 and phase1Passed=true.
 *
 * Usage: node scripts/enable-phase2.js [email]
 * Default email: test@example.com
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local from workspace root
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

// Use the project's existing Prisma client
import prisma from "../src/shared/infrastructure/database/client.js";

const TARGET_EMAIL = process.argv[2] || "test@example.com";

async function enablePhase2() {
  console.log(`🔍 Looking up user: ${TARGET_EMAIL}`);

  const user = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
  });

  if (!user) {
    console.error(`❌ User not found: ${TARGET_EMAIL}`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.id} (${user.email})`);

  const phaseGate = await prisma.phaseGate.upsert({
    where: { userId: user.id },
    update: {
      currentPhase: 2,
      phase1Passed: true,
      phase2Passed: false,
      phase3Passed: false,
      phase4Unlocked: false,
    },
    create: {
      userId: user.id,
      currentPhase: 2,
      phase1Passed: true,
      phase2Passed: false,
      phase3Passed: false,
      phase4Unlocked: false,
    },
  });

  console.log(`✅ PhaseGate updated/created:`);
  console.log(`   - currentPhase:     ${phaseGate.currentPhase}`);
  console.log(`   - phase1Passed:     ${phaseGate.phase1Passed}`);
  console.log(`   - phase2Passed:     ${phaseGate.phase2Passed}`);
  console.log(`   - phase3Passed:     ${phaseGate.phase3Passed}`);
  console.log(`   - phase4Unlocked:   ${phaseGate.phase4Unlocked}`);

  await prisma.$disconnect();
  console.log(`\n🎉 Phase 2 enabled for ${TARGET_EMAIL}`);
}

enablePhase2().catch((err) => {
  console.error("❌ Script failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
