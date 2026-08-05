/**
 * @file apps/backend/tests/integration/derived-delta.test.ts
 * @description DB-backed integration tests for the Bucket-B derived-recompute
 * path (`syncDerived` + `SeedCheckpoint`). Uses PhoneticClusterMember — the
 * smallest derived table (254 rows) — and feeds the REAL file payloads, so a
 * rebuild is FK-safe and always restores canonical data.
 *
 * Flow: first-run rebuild + checkpoint → identical payload skips (0 writes) →
 * changed payload rebuilds → afterAll restores the canonical payload and
 * removes the checkpoint.
 *
 * Requires a reachable, SEEDED test database (see helpers/db.ts). Run via:
 *   cd apps/backend && npm run test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { prisma } from "../../src/shared/infrastructure/database/client.js";
import { checkDatabase, disconnectDatabase } from "./helpers/db.js";
import { syncDerived, type SyncRow } from "../../prisma/sync-helpers.js";

const db = await checkDatabase();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PCM_FILE = path.resolve(
  __dirname,
  "../../../../content/seed/phase2/phonetic-cluster-members.json",
);
const LABEL = "PhoneticClusterMember";
const cfg = { label: LABEL, prismaModel: "phoneticClusterMember" as const };

const silentLog = (): void => undefined;

function loadPhoneticClusterMembers(): SyncRow[] {
  return JSON.parse(fs.readFileSync(PCM_FILE, "utf-8")) as SyncRow[];
}

describe.skipIf(!db.available)("Derived rebuild — Bucket-B (integration)", () => {
  const realRows = loadPhoneticClusterMembers();

  beforeAll(async () => {
    await prisma.seedCheckpoint.deleteMany({ where: { id: LABEL } });
    // Guarantee real rows exist before we start diffing against them.
    if ((await prisma.phoneticClusterMember.count()) === 0) {
      await syncDerived(prisma, cfg, realRows, { log: silentLog });
    }
  });

  afterAll(async () => {
    try {
      // Restore canonical data (also updates the checkpoint hash back to real).
      await syncDerived(prisma, cfg, realRows, { log: silentLog });
    } finally {
      await prisma.seedCheckpoint.deleteMany({ where: { id: LABEL } });
      await disconnectDatabase();
    }
  });

  it("first run rebuilds (deleteMany + createMany) and stamps a SeedCheckpoint", async () => {
    await prisma.seedCheckpoint.deleteMany({ where: { id: LABEL } });
    const result = await syncDerived(prisma, cfg, realRows, { log: silentLog });
    expect(result.skipped).toBe(false);
    expect(result.writes).toBe(realRows.length);

    const count = await prisma.phoneticClusterMember.count();
    expect(count).toBe(realRows.length);

    const cp = await prisma.seedCheckpoint.findUnique({ where: { id: LABEL } });
    expect(cp).not.toBeNull();
    expect(cp!.rowCount).toBe(realRows.length);
    expect(cp!.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("identical payload → 0 writes (checkpoint survives re-run)", async () => {
    const result = await syncDerived(prisma, cfg, realRows, { log: silentLog });
    expect(result.skipped).toBe(true);
    expect(result.writes).toBe(0);
    const count = await prisma.phoneticClusterMember.count();
    expect(count).toBe(realRows.length);

    // Checkpoint still present + unchanged.
    const cp = await prisma.seedCheckpoint.findUnique({ where: { id: LABEL } });
    expect(cp).not.toBeNull();
    expect(cp!.rowCount).toBe(realRows.length);
  });

  it("empty payload with a populated checkpoint → SKIPS (C1 guard: no deleteMany, no rowCount:0 stamp)", async () => {
    // Precondition: the table is populated and the checkpoint records it.
    expect(await prisma.phoneticClusterMember.count()).toBe(realRows.length);

    const result = await syncDerived(prisma, cfg, [], { log: silentLog });
    expect(result.skipped).toBe(true);
    expect(result.writes).toBe(0);

    // Table is untouched — no deleteMany on a populated derived table.
    expect(await prisma.phoneticClusterMember.count()).toBe(realRows.length);

    // Checkpoint keeps its real row count — no rowCount:0 stamp.
    const cp = await prisma.seedCheckpoint.findUnique({ where: { id: LABEL } });
    expect(cp).not.toBeNull();
    expect(cp!.rowCount).toBe(realRows.length);
  });

  it("changed payload → rebuild happens (stale rows removed, checkpoint updated)", async () => {
    const doctored = realRows.map((r) => ({
      ...r,
      sequenceOrder: Number(r.sequenceOrder) + 100,
    }));
    const result = await syncDerived(prisma, cfg, doctored, { log: silentLog });
    expect(result.skipped).toBe(false);
    expect(result.writes).toBe(doctored.length);

    const count = await prisma.phoneticClusterMember.count();
    expect(count).toBe(doctored.length);
    const sample = await prisma.phoneticClusterMember.findFirst();
    expect(sample).not.toBeNull();

    const cp = await prisma.seedCheckpoint.findUnique({ where: { id: LABEL } });
    expect(cp).not.toBeNull();
    expect(cp!.rowCount).toBe(doctored.length);
  });
});
