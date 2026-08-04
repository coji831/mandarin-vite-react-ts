/**
 * @file apps/backend/tests/integration/word-delta.test.ts
 * @description DB-backed integration test for the Word hash-gated delta sync
 * (Phase 3). Feeds a small slice of REAL word rows to `syncTable(wordCfg, ...)`
 * (never mutates the JSON): NULL-hash backfill → edit propagates → idempotent
 * 0-writes → restore canonical content in afterAll.
 *
 * Word has no `content_version` column, so an edit updates the content + hash
 * WITHOUT a version bump (hash-only diff).
 *
 * Requires a reachable, SEEDED test database. Run via:
 *   cd apps/backend && npm run test:integration
 */
import { describe, it, expect, afterAll } from "vitest";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { prisma } from "../../src/shared/infrastructure/database/client.js";
import { checkDatabase, disconnectDatabase } from "./helpers/db.js";
import { syncTable, mapWordRows, wordCfg, type SyncRow } from "../../prisma/sync-helpers.js";

const db = await checkDatabase();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORDS_FILE = path.resolve(__dirname, "../../../../content/seed/phase2/words.json");

const silentLog = (): void => undefined;

function loadWords(): Array<{ id: string } & Record<string, unknown>> {
  return JSON.parse(fs.readFileSync(WORDS_FILE, "utf-8")) as Array<
    {
      id: string;
    } & Record<string, unknown>
  >;
}

describe.skipIf(!db.available)("Word delta sync (hash-gated, integration)", () => {
  const all = loadWords();
  const slice = all.slice(0, 3); // pick 3 canonical word rows
  const realRows: SyncRow[] = mapWordRows(slice as any);
  const SLICE_IDS = realRows.map((r) => r.id as string);

  afterAll(async () => {
    try {
      // Restore canonical word content.
      await syncTable(prisma, wordCfg, realRows, { log: silentLog });
    } finally {
      await disconnectDatabase();
    }
  });

  it("first sync backfills NULL hashes on the slice (reconcile, no version column)", async () => {
    // Deterministic baseline: null out the slice hashes.
    await prisma.word.updateMany({
      where: { id: { in: SLICE_IDS } },
      data: { content_hash: null },
    });

    const result = await syncTable(prisma, wordCfg, realRows, { log: silentLog });
    expect(result.reconciled).toBe(slice.length);
    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(0);

    const sample = await prisma.word.findUnique({ where: { id: SLICE_IDS[0] } });
    expect(sample).not.toBeNull();
    expect(sample!.content_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("edit-propagates: a changed Word field reaches the DB (hash updated, no version column)", async () => {
    const doctored = realRows.map((r, i) =>
      i === 0 ? { ...r, meaning: "DELTA TEST EDITED MEANING" } : r,
    );
    const result = await syncTable(prisma, wordCfg, doctored, { log: silentLog });
    expect(result.updated).toBe(1);
    expect(result.reconciled).toBe(0);

    const edited = await prisma.word.findUnique({ where: { id: SLICE_IDS[0] } });
    expect(edited!.meaning).toBe("DELTA TEST EDITED MEANING");
    expect(edited!.content_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("idempotency: re-syncing the doctored payload writes 0 rows", async () => {
    const doctored = realRows.map((r, i) =>
      i === 0 ? { ...r, meaning: "DELTA TEST EDITED MEANING" } : r,
    );
    const result = await syncTable(prisma, wordCfg, doctored, { log: silentLog });
    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.reconciled).toBe(0);
    expect(result.unchanged).toBe(slice.length);
  });
});
