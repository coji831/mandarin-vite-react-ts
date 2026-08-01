/**
 * @file apps/backend/tests/integration/helpers/db.ts
 * @description Shared helpers for DB-backed integration tests.
 *
 * Integration tests exercise Service + Repository + real Prisma against a
 * database. They require a reachable, SEEDED database — the assertions in
 * `tests/integration/**` expect the canonical Phase 2 seed data (see
 * `scripts/verify/verify-seed-counts.ts` for the exact counts).
 *
 * ⚠️  NEVER point these tests at the dev/prod database. Configure a dedicated
 * TEST database via `DATABASE_URL` (e.g. in a `.env.test` or CI secret) before
 * running `npm run test:integration`.
 *
 * Usage pattern: top-level `const db = await checkDatabase();` then
 * `describe.skipIf(!db.available)("...", ...)`. When the DB is unreachable the
 * suite is skipped instead of hard-failing, so environments without a
 * database degrade gracefully (the default `npm test` already excludes
 * `tests/integration/**`).
 */

import { prisma } from "../../../src/shared/infrastructure/database/client.js";

export interface DbStatus {
  available: boolean;
  error?: string;
}

/** Probe the DB with `SELECT 1`. Returns a status instead of throwing. */
export async function checkDatabase(): Promise<DbStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { available: true };
  } catch (err) {
    return { available: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Disconnect the shared Prisma client after a suite finishes. */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
