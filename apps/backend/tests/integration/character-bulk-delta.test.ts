/**
 * @file apps/backend/tests/integration/character-bulk-delta.test.ts
 * @description DB-backed integration test for the Character BULK raw-SQL path
 * (Phase 4). Exercises the real `INSERT ... ON CONFLICT ... DO UPDATE ...
 * WHERE "Character"."content_hash" IS DISTINCT FROM EXCLUDED."content_hash"`
 * upsert against PostgreSQL — including the `::jsonb` (readings) and `::text[]`
 * (commonWords) serialization — on a 2,000-row slice of REAL characters.
 *
 * A low `bulkThreshold` forces the bulk path at slice scale. Never mutates the
 * JSON; the slice keeps valid hashes afterward (canonical data).
 *
 * Requires a reachable, SEEDED test database. Run via:
 *   cd apps/backend && npm run test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { prisma } from "../../src/shared/infrastructure/database/client.js";
import { checkDatabase, disconnectDatabase } from "./helpers/db.js";
import {
  syncTable,
  mapCharacterRows,
  computeContentHash,
  characterCfg,
  type Phase2Character,
  type SyncTableConfig,
} from "../../prisma/sync-helpers.js";

const db = await checkDatabase();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHARS_FILE = path.resolve(__dirname, "../../../../content/seed/phase2/characters.json");

const silentLog = (): void => undefined;

/** Force the bulk path at 2,000-row slice scale. */
const bulkCfg: SyncTableConfig = { ...characterCfg, bulkThreshold: 500 };

function loadCharacters(): Phase2Character[] {
  return JSON.parse(fs.readFileSync(CHARS_FILE, "utf-8")) as Phase2Character[];
}

describe.skipIf(!db.available)("Character bulk path (hash-gated, integration)", () => {
  const all = loadCharacters();
  const slice = all.slice(0, 2_000);
  const payloads = mapCharacterRows(slice);
  const SLICE_IDS = payloads.map((r) => r.id as string);
  let logs: string[] = [];

  beforeAll(async () => {
    // Deterministic baseline: null out the slice hashes so the first sync is a
    // full NULL-hash reconcile through the bulk path.
    await prisma.character.updateMany({
      where: { id: { in: SLICE_IDS } },
      data: { content_hash: null },
    });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("first sync backfills all 2,000 rows through the bulk raw-SQL path (no version bump on NULL reconcile)", async () => {
    logs = [];
    const result = await syncTable(prisma, bulkCfg, payloads, { log: (m) => logs.push(m) });

    // Bulk path reports the real-write total as `updated`.
    expect(result.updated).toBe(slice.length);
    expect(result.inserted).toBe(0);
    expect(logs.some((l) => l.includes("bulk wrote"))).toBe(true);

    // Spot-check DB rows: content matches payload, hash stamped, version NOT bumped.
    const sample = await prisma.character.findUnique({ where: { id: SLICE_IDS[0] } });
    expect(sample).not.toBeNull();
    expect(sample!.glyph).toBe(payloads[0].glyph);
    expect(sample!.content_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(sample!.content_version).toBe(1);
    const readings = sample!.readings as unknown as Array<{ pinyin: string; tone: number }>;
    expect(Array.isArray(readings)).toBe(true);
    expect(readings.length).toBe((payloads[0].readings as unknown[]).length);
  });

  it("re-sync with identical payload → 0 writes (steady state at bulk scale)", async () => {
    logs = [];
    const result = await syncTable(prisma, bulkCfg, payloads, { log: (m) => logs.push(m) });
    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.reconciled).toBe(0);
    expect(result.unchanged).toBe(slice.length);
    expect(logs.some((l) => l.includes("bulk wrote"))).toBe(false);
  });

  it("hash stays stable across a no-op re-sync (stored hash equals computed hash)", async () => {
    const sample = await prisma.character.findUnique({ where: { id: SLICE_IDS[0] } });
    // Recompute the expected hash over the exact hashFields the sync uses.
    const picked: Record<string, unknown> = {};
    for (const f of characterCfg.hashFields) {
      if (f in payloads[0]) picked[f] = payloads[0][f];
    }
    expect(sample!.content_hash).toBe(computeContentHash(picked));
  });

  it("edit-propagates regression at bulk scale: doctored row updates + bumps content_version to 2; unchanged rows untouched", async () => {
    // Doctor ONE row in-memory — the real JSON is never mutated. We change only
    // `readings` (a jsonb hash field — no unique constraint): `glyph` is
    // `@unique` in the Character schema, so changing it would collide with a
    // seeded row. A changed `readings` still flips the content_hash and drives
    // the same bulk DO UPDATE + version-bump path the review targets.
    const doctored = payloads.map((p) => ({ ...p, readings: [...(p.readings as unknown[])] }));
    const changedId = SLICE_IDS[0];
    doctored[0] = {
      ...doctored[0],
      readings: [{ pinyin: "hao", tone: 3, type: "simplified", meaning: "good" }],
    };
    // Routing keys on the DELTA size, not table size, so force the bulk path for
    // a 1-row edit with a zero threshold (bulkCfg's 500 would take the per-row path).
    const editBulkCfg: SyncTableConfig = { ...bulkCfg, bulkThreshold: 0 };

    // Snapshot the changed row + an unchanged neighbour BEFORE the sync.
    const beforeChanged = await prisma.character.findUnique({ where: { id: changedId } });
    const beforeNeighbour = await prisma.character.findUnique({ where: { id: SLICE_IDS[1] } });
    const neighbourVersion = beforeNeighbour!.content_version;
    const neighbourUpdatedAt = beforeNeighbour!.updatedAt;

    const result = await syncTable(prisma, editBulkCfg, doctored, { log: silentLog });
    // Bulk path reports the real-write total as `updated` — exactly the 1 doctored row.
    expect(result.updated).toBe(1);
    expect(result.unchanged).toBe(slice.length - 1);
    expect(result.inserted).toBe(0);
    expect(result.reconciled).toBe(0);

    // The doctored row was updated through the real bulk ON CONFLICT ... DO UPDATE
    // ... WHERE IS DISTINCT FROM path AND content_version bumped +1 (1 → 2).
    const afterChanged = await prisma.character.findUnique({ where: { id: changedId } });
    const afterReadings = afterChanged!.readings as unknown as Array<{
      pinyin: string;
      tone: number;
    }>;
    expect(afterReadings).toEqual([
      { pinyin: "hao", tone: 3, type: "simplified", meaning: "good" },
    ]);
    expect(afterChanged!.content_version).toBe(2);
    expect(afterChanged!.content_hash).toMatch(/^[0-9a-f]{64}$/);

    // Unchanged rows keep version + updatedAt untouched (WHERE IS DISTINCT FROM skipped them).
    const afterNeighbour = await prisma.character.findUnique({ where: { id: SLICE_IDS[1] } });
    expect(afterNeighbour!.content_version).toBe(neighbourVersion);
    expect(afterNeighbour!.updatedAt.getTime()).toBe(neighbourUpdatedAt.getTime());

    // Restore the doctored row so the slice stays canonical (content matches the JSON).
    const picked: Record<string, unknown> = {};
    for (const f of characterCfg.hashFields) {
      if (f in payloads[0]) picked[f] = payloads[0][f];
    }
    await prisma.character.update({
      where: { id: changedId },
      data: {
        readings: payloads[0].readings as object,
        content_version: 1,
        content_hash: computeContentHash(picked),
      },
    });
  });
});
