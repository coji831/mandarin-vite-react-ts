/**
 * @file apps/backend/prisma/__tests__/sync-helpers.test.ts
 * @description Unit tests for the hash-gated delta-sync helpers (no DB).
 *
 * Covers:
 *   - canonicalStringify / computeContentHash determinism (key-order-insensitive,
 *     arrays order-sensitive, Json stability).
 *   - syncTable classifier: insert / update / unchanged / NULL-reconcile
 *     (no version bump) / version-bump-only-on-real-change / removed(log-only).
 *   - Composite-key serialize + uniqueWhere (CharacterRadical, GrammarPatternRelation,
 *     MeasureWordWord).
 *   - Threshold routing: ≤ threshold → Prisma path; > threshold → bulk raw SQL
 *     (asserts the generated SQL contains `IS DISTINCT FROM`).
 *   - syncDerived checkpoint gating: changed payload → rebuild; identical → 0 writes.
 *
 * Run via: cd apps/backend && npx vitest run prisma/__tests__/sync-helpers.test.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  canonicalStringify,
  computeContentHash,
  syncTable,
  syncDerived,
  syncChengyu,
  mapChengyuRows,
  singleKey,
  compositeKey,
  buildBulkUpsertQuery,
  type SyncTableConfig,
} from "../sync-helpers.js";

// ── Fake DB helpers ────────────────────────────────────────────────────────

interface FakeDb {
  db: any;
  model: any;
  calls: { createMany: any[]; update: any[]; deleteMany: any[]; executeRaw: any[] };
}

function createFakeDb(existingRows: Array<Record<string, unknown>>, modelName: string): FakeDb {
  const calls = {
    createMany: [] as any[],
    update: [] as any[],
    deleteMany: [] as any[],
    executeRaw: [] as any[],
  };
  const model = {
    findMany: vi.fn().mockResolvedValue(existingRows),
    createMany: vi.fn().mockImplementation(async (args: any) => {
      calls.createMany.push(args);
      return { count: args.data.length };
    }),
    update: vi.fn().mockImplementation(async (args: any) => {
      calls.update.push(args);
      return { ...args.data };
    }),
    deleteMany: vi.fn().mockImplementation(async (args: any) => {
      calls.deleteMany.push(args);
      return { count: 1 };
    }),
  };
  const db = {
    $transaction: vi.fn().mockImplementation(async (ops: any[]) => {
      const results = [];
      for (const op of ops) results.push(await op);
      return results;
    }),
    $executeRaw: vi.fn().mockImplementation(async (query: any) => {
      calls.executeRaw.push(query);
      return 1;
    }),
    seedCheckpoint: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({}),
    },
    [modelName]: model,
  };
  return { db, model, calls };
}

const smallCfg: SyncTableConfig = {
  label: "Tone",
  prismaModel: "tone",
  keySpec: singleKey("id"),
  hashFields: ["name", "number"],
  hasVersion: false,
  chunkSize: { create: 500, update: 100 },
};

const versionedCfg: SyncTableConfig = {
  label: "GrammarPattern",
  prismaModel: "grammarPattern",
  keySpec: singleKey("content_id"),
  hashFields: ["name", "structure"],
  hasVersion: true,
  txMode: "interactive",
};

// ── canonicalStringify / computeContentHash ────────────────────────────────

describe("canonicalStringify / computeContentHash", () => {
  it("returns a 64-char hex hash and is deterministic for identical input", () => {
    const h1 = computeContentHash({ name: "把", phase: 2 });
    const h2 = computeContentHash({ name: "把", phase: 2 });
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
    expect(h2).toBe(h1);
  });

  it("is key-order-insensitive", () => {
    const a = canonicalStringify({ name: "把", phase: 2, meta: { family: "x", b: 1 } });
    const b = canonicalStringify({ phase: 2, meta: { b: 1, family: "x" }, name: "把" });
    expect(a).toBe(b);
    expect(computeContentHash({ a: 1, b: 2 })).toBe(computeContentHash({ b: 2, a: 1 }));
  });

  it("preserves array order (order-sensitive)", () => {
    expect(canonicalStringify([1, 2, 3])).not.toBe(canonicalStringify([3, 2, 1]));
    expect(
      canonicalStringify({
        readings: [
          { pinyin: "hao", tone: 3 },
          { pinyin: "zhong", tone: 1 },
        ],
      }),
    ).not.toBe(
      canonicalStringify({
        readings: [
          { pinyin: "zhong", tone: 1 },
          { pinyin: "hao", tone: 3 },
        ],
      }),
    );
  });

  it("handles nested Json segments deterministically", () => {
    const segments = [
      { text: "我", pinyin: "wǒ", gloss: "I", entityType: "character", entityId: "ch_25105" },
    ];
    const h1 = computeContentHash({ chinese: "我", segments });
    const h2 = computeContentHash({
      chinese: "我",
      segments: JSON.parse(JSON.stringify(segments)),
    });
    expect(h1).toBe(h2);
  });

  it("null vs missing keys are distinct (nullable content is part of the hash)", () => {
    expect(computeContentHash({ a: null })).not.toBe(computeContentHash({}));
    expect(computeContentHash({ a: null })).toBe(computeContentHash({ a: null }));
  });
});

// ── KeySpec helpers ────────────────────────────────────────────────────────

describe("KeySpec helpers", () => {
  it("singleKey serializes + builds a uniqueWhere", () => {
    const spec = singleKey("content_id");
    expect(spec.serialize(["gr_0001"])).toBe("gr_0001");
    expect(spec.uniqueWhere(["gr_0001"])).toEqual({ content_id: "gr_0001" });
    expect(spec.conflictTarget).toEqual(["content_id"]);
  });

  it("compositeKey (CharacterRadical non-null pair) serializes with | and builds the compound uniqueWhere", () => {
    const spec = compositeKey("characterGlyph", "radicalId");
    expect(spec.serialize(["好", "rad_0038"])).toBe("好|rad_0038");
    expect(spec.uniqueWhere(["好", "rad_0038"])).toEqual({
      characterGlyph_radicalId: { characterGlyph: "好", radicalId: "rad_0038" },
    });
    expect(spec.conflictTarget).toEqual(["characterGlyph", "radicalId"]);
  });

  it("compositeKey (GrammarPatternRelation) uses from|to", () => {
    const spec = compositeKey("fromPatternContentId", "toPatternContentId");
    expect(spec.serialize(["gr_0018", "gr_0019"])).toBe("gr_0018|gr_0019");
    expect(spec.uniqueWhere(["gr_0018", "gr_0019"])).toEqual({
      fromPatternContentId_toPatternContentId: {
        fromPatternContentId: "gr_0018",
        toPatternContentId: "gr_0019",
      },
    });
  });

  it("compositeKey (MeasureWordWord) uses measureWordId|wordId", () => {
    const spec = compositeKey("measureWordId", "wordId");
    expect(spec.uniqueWhere(["mw_001", "w_00284"])).toEqual({
      measureWordId_wordId: { measureWordId: "mw_001", wordId: "w_00284" },
    });
  });
});

// ── syncTable classifier ───────────────────────────────────────────────────

describe("syncTable classifier (per-row path)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts new rows via createMany and stamps content_hash", async () => {
    const { db, calls } = createFakeDb([], "tone");
    const result = await syncTable(db, smallCfg, [{ id: "tn_0", name: "Neutral", number: 0 }]);
    expect(result.inserted).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.reconciled).toBe(0);
    expect(result.unchanged).toBe(0);
    expect(calls.createMany).toHaveLength(1);
    expect(calls.createMany[0].data[0].content_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(calls.createMany[0].skipDuplicates).toBe(true);
    expect(calls.update).toHaveLength(0);
  });

  it("updates changed rows and bumps content_version (hasVersion + non-NULL existing hash)", async () => {
    const existing = [
      {
        content_id: "gr_0001",
        content_hash: computeContentHash({ name: "old", structure: "X" }),
        content_version: 1,
      },
    ];
    const { db, calls } = createFakeDb(existing, "grammarPattern");
    const result = await syncTable(db, versionedCfg, [
      { content_id: "gr_0001", name: "new", structure: "Y" },
    ]);
    expect(result.updated).toBe(1);
    expect(result.unchanged).toBe(0);
    expect(calls.update).toHaveLength(1);
    const updateData = calls.update[0].data;
    expect(updateData.name).toBe("new");
    expect(updateData.content_version).toEqual({ increment: 1 });
    expect(updateData.content_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("leaves unchanged rows untouched (0 writes, unchanged counted)", async () => {
    const hash = computeContentHash({ name: "Neutral", number: 0 });
    const existing = [{ id: "tn_0", content_hash: hash }];
    const { db, calls } = createFakeDb(existing, "tone");
    const result = await syncTable(db, smallCfg, [{ id: "tn_0", name: "Neutral", number: 0 }]);
    expect(result.unchanged).toBe(1);
    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(0);
    expect(calls.createMany).toHaveLength(0);
    expect(calls.update).toHaveLength(0);
  });

  it("NULL-hash reconcile writes + stamps hash but does NOT bump content_version", async () => {
    const existing = [{ content_id: "gr_0001", content_hash: null, content_version: 1 }];
    const { db, calls } = createFakeDb(existing, "grammarPattern");
    const result = await syncTable(db, versionedCfg, [
      { content_id: "gr_0001", name: "把", structure: "Subj + 把 + Obj" },
    ]);
    expect(result.reconciled).toBe(1);
    expect(result.updated).toBe(0);
    expect(calls.update).toHaveLength(1);
    expect(calls.update[0].data.content_hash).toMatch(/^[0-9a-f]{64}$/);
    // No version bump on reconcile (existing hash was NULL).
    expect(calls.update[0].data.content_version).toBeUndefined();
  });

  it("reports removed rows (in DB, not in JSON) log-only — no delete", async () => {
    const existing = [
      { id: "tn_0", content_hash: computeContentHash({ name: "A", number: 0 }) },
      { id: "tn_1", content_hash: computeContentHash({ name: "B", number: 1 }) },
    ];
    const logs: string[] = [];
    const { db, calls } = createFakeDb(existing, "tone");
    const result = await syncTable(db, smallCfg, [{ id: "tn_0", name: "A", number: 0 }], {
      log: (m) => logs.push(m),
    });
    expect(result.unchanged).toBe(1);
    expect(result.removed).toBe(0);
    expect(calls.deleteMany).toHaveLength(0);
    expect(logs.join("\n")).toContain("in DB but not in JSON");
  });

  it("routes to the bulk raw-SQL path when the write-set exceeds the threshold", async () => {
    const bulkCfg: SyncTableConfig = {
      label: "Character",
      prismaModel: "character",
      tableName: "Character",
      keySpec: singleKey("id"),
      hashFields: ["glyph", "strokeCount"],
      hasVersion: false,
      bulkThreshold: 1, // force bulk for a 2-row delta
      bulkColumns: [
        { name: "id", cast: "text" },
        { name: "glyph", cast: "text" },
        { name: "strokeCount", cast: "int" },
        { name: "content_hash", cast: "text" },
      ],
    };
    const { db, calls } = createFakeDb([], "character");
    const result = await syncTable(db, bulkCfg, [
      { id: "ch_1", glyph: "好", strokeCount: 6 },
      { id: "ch_2", glyph: "中", strokeCount: 4 },
    ]);
    expect(result.inserted).toBe(0); // bulk path conflates counts into updated
    expect(result.updated).toBeGreaterThan(0);
    expect(calls.executeRaw).toHaveLength(1);
    expect(calls.createMany).toHaveLength(0);
    expect(calls.update).toHaveLength(0);
  });

  it("buildBulkUpsertQuery produces SQL containing IS DISTINCT FROM + ::jsonb casts", () => {
    const bulkCfg: SyncTableConfig = {
      label: "Character",
      prismaModel: "character",
      tableName: "Character",
      keySpec: singleKey("id"),
      hashFields: ["glyph", "readings"],
      hasVersion: false,
      bulkColumns: [
        { name: "id", cast: "text" },
        { name: "glyph", cast: "text" },
        { name: "readings", cast: "jsonb" },
        { name: "commonWords", cast: "text[]" },
        { name: "content_hash", cast: "text" },
      ],
    };
    const query = buildBulkUpsertQuery(bulkCfg, [
      {
        key: "ch_1",
        values: ["ch_1"],
        hash: "abc",
        payload: {
          id: "ch_1",
          glyph: "好",
          readings: [{ pinyin: "hao", tone: 3 }],
          commonWords: ["很好", "爱好"],
          content_hash: "abc",
        },
      },
    ]);
    // Prisma v7 exposes the prepared SQL via .text ($n placeholders) + .values.
    const text = (query as any).text as string;
    const values = (query as any).values as unknown[];
    expect(text).toContain('INSERT INTO "Character"');
    expect(text).toContain('ON CONFLICT ("id") DO UPDATE SET');
    expect(text).toContain('IS DISTINCT FROM EXCLUDED."content_hash"');
    expect(text).toContain("::jsonb");
    expect(text).toContain("::text[]");
    // Json is pre-serialized to a JSON string param; array to a pg array literal.
    expect(values).toContain('[{"pinyin":"hao","tone":3}]');
    expect(values).toContain('{"很好","爱好"}');
  });

  it("buildBulkUpsertQuery emits createdAt/updatedAt CURRENT_TIMESTAMP when bulkTimestamps is set", () => {
    const bulkCfg: SyncTableConfig = {
      label: "Character",
      prismaModel: "character",
      tableName: "Character",
      keySpec: singleKey("id"),
      hashFields: ["glyph", "strokeCount"],
      hasVersion: false,
      bulkTimestamps: true,
      bulkColumns: [
        { name: "id", cast: "text" },
        { name: "glyph", cast: "text" },
        { name: "strokeCount", cast: "int" },
        { name: "content_hash", cast: "text" },
      ],
    };
    const query = buildBulkUpsertQuery(bulkCfg, [
      {
        key: "ch_1",
        values: ["ch_1"],
        hash: "abc",
        payload: { id: "ch_1", glyph: "好", strokeCount: 6, content_hash: "abc" },
      },
    ]);
    const text = (query as any).text as string;
    expect(text).toContain(
      'INSERT INTO "Character" ("id", "glyph", "strokeCount", "content_hash", "createdAt", "updatedAt")',
    );
    expect(text).toContain('"updatedAt" = CURRENT_TIMESTAMP');
    // createdAt must be INSERT-only — never overwritten on conflict.
    expect(text).not.toContain('"createdAt" = EXCLUDED');
  });
});

// ── syncDerived checkpoint gating ──────────────────────────────────────────

describe("syncDerived (Bucket-B checkpoint rebuild)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rebuilds when no checkpoint exists (deleteMany + createMany + checkpoint upsert)", async () => {
    const rows = [
      { characterId: "ch_1001", pinyin: "hao", tone: 3 },
      { characterId: "ch_1002", pinyin: "zhong", tone: 1 },
    ];
    const { db, model, calls } = createFakeDb([], "characterReading");
    db.seedCheckpoint.findUnique.mockResolvedValue(null);
    const result = await syncDerived(
      db,
      { label: "CharacterReading", prismaModel: "characterReading" },
      rows,
    );
    expect(result.skipped).toBe(false);
    expect(result.writes).toBe(2);
    expect(model.deleteMany).toHaveBeenCalledTimes(1);
    expect(calls.createMany).toHaveLength(1);
    expect(db.seedCheckpoint.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "CharacterReading" },
        create: { id: "CharacterReading", contentHash: computeContentHash(rows), rowCount: 2 },
      }),
    );
  });

  it("skips (0 writes) when the checkpoint matches hash + row count", async () => {
    const rows = [{ characterId: "ch_1001", pinyin: "hao", tone: 3 }];
    const { db, model, calls } = createFakeDb([], "characterReading");
    db.seedCheckpoint.findUnique.mockResolvedValue({
      id: "CharacterReading",
      contentHash: computeContentHash(rows),
      rowCount: 1,
    });
    const result = await syncDerived(
      db,
      { label: "CharacterReading", prismaModel: "characterReading" },
      rows,
    );
    expect(result.skipped).toBe(true);
    expect(result.writes).toBe(0);
    expect(model.deleteMany).not.toHaveBeenCalled();
    expect(calls.createMany).toHaveLength(0);
    expect(db.seedCheckpoint.upsert).not.toHaveBeenCalled();
  });

  it("rebuilds when the payload changed (hash differs)", async () => {
    const original = [{ characterId: "ch_1001", pinyin: "hao", tone: 3 }];
    const doctored = [{ characterId: "ch_1001", pinyin: "hǎo", tone: 3 }];
    const { db, model } = createFakeDb([], "characterReading");
    db.seedCheckpoint.findUnique.mockResolvedValue({
      id: "CharacterReading",
      contentHash: computeContentHash(original),
      rowCount: 1,
    });
    const result = await syncDerived(
      db,
      { label: "CharacterReading", prismaModel: "characterReading" },
      doctored,
    );
    expect(result.skipped).toBe(false);
    expect(result.writes).toBe(1);
    expect(model.deleteMany).toHaveBeenCalledTimes(1);
  });
});

// ── syncChengyu orchestrator (Epic 23 — Story 23.1) ────────────────────────

describe("mapChengyuRows", () => {
  it("maps idioms → examples → relations payloads with FK by content_id", () => {
    const mapped = mapChengyuRows({
      idioms: [
        {
          content_id: "cy_0001",
          chengyu: "破釜沉舟",
          pinyin: "pò fǔ chén zhōu",
          literalMeaning: "Break pots, sink ships",
          figurativeMeaning: "Burning one's bridges",
          story: "Xiang Yu crossed the river and destroyed his escape route.",
          storySource: "《史记·卷七·项羽本纪》(zh.wikisource.org/wiki/史記/卷007)",
          era: "Qin–Han transition",
          theme: "determination",
          sortOrder: 1,
          metadata: { source: "CC-CEDICT" },
          examples: [
            {
              content_id: "cy_0001_ex1",
              chinese: "他破釜沉舟。",
              pinyin: "tā pò fǔ chén zhōu",
              english: "He burned his bridges.",
              sortOrder: 1,
              segments: [
                {
                  text: "破",
                  pinyin: "pò",
                  gloss: "break",
                  entityType: "character",
                  entityId: "ch_30772",
                },
              ],
            },
          ],
        },
      ],
      relations: [
        { fromChengyuContentId: "cy_0001", toChengyuContentId: "cy_0042", relationType: "RELATED" },
      ],
    });

    expect(mapped.idioms).toEqual([
      expect.objectContaining({
        content_id: "cy_0001",
        chengyu: "破釜沉舟",
        story: expect.stringContaining("Xiang Yu"),
        metadata: { source: "CC-CEDICT" },
      }),
    ]);
    expect(mapped.examples).toEqual([
      expect.objectContaining({
        content_id: "cy_0001_ex1",
        chengyuContentId: "cy_0001",
        segments: expect.any(Array),
      }),
    ]);
    expect(mapped.relations).toEqual([
      {
        fromChengyuContentId: "cy_0001",
        toChengyuContentId: "cy_0042",
        relationType: "RELATED",
        metadata: null,
      },
    ]);
  });
});

describe("syncChengyu (orchestrator — one interactive transaction)", () => {
  /** Fake DB that supports the interactive $transaction callback form and persists state. */
  function createChengyuFake() {
    const state: Record<string, Array<Record<string, unknown>>> = {
      chengyu: [],
      chengyuExample: [],
      chengyuRelation: [],
    };
    const calls: { createMany: any[]; update: any[] } = { createMany: [], update: [] };
    const mkModel = (name: string) => ({
      findMany: vi.fn(async () => state[name]),
      createMany: vi.fn(async (args: any) => {
        state[name].push(...args.data);
        calls.createMany.push(args);
        return { count: args.data.length };
      }),
      update: vi.fn(async (args: any) => {
        calls.update.push(args);
        return { ...args.data };
      }),
      deleteMany: vi.fn(async () => ({ count: 0 })),
    });
    const db: any = {
      chengyu: mkModel("chengyu"),
      chengyuExample: mkModel("chengyuExample"),
      chengyuRelation: mkModel("chengyuRelation"),
      $executeRaw: vi.fn(async () => 1),
      seedCheckpoint: { findUnique: vi.fn(async () => null), upsert: vi.fn(async () => ({})) },
    };
    // Interactive form: $transaction(callback, opts) → runs the callback with the tx handle.
    db.$transaction = vi.fn(async (cb: any) => cb(db));
    return { db, calls, state };
  }

  const baseFile = (): Parameters<typeof syncChengyu>[1] => ({
    idioms: [
      {
        content_id: "cy_0001",
        chengyu: "破釜沉舟",
        pinyin: "pò fǔ chén zhōu",
        literalMeaning: "Break pots, sink ships",
        figurativeMeaning: "Burning one's bridges",
        story: "Xiang Yu crossed the river.",
        storySource: "《史记·卷七·项羽本纪》(zh.wikisource.org/wiki/史記/卷007)",
        era: "Qin–Han transition",
        theme: "determination",
        sortOrder: 1,
        metadata: { source: "CC-CEDICT" },
        examples: [
          {
            content_id: "cy_0001_ex1",
            chinese: "他破釜沉舟。",
            pinyin: "tā pò fǔ chén zhōu",
            english: "He burned his bridges.",
            sortOrder: 1,
            segments: [
              {
                text: "破",
                pinyin: "pò",
                gloss: "break",
                entityType: "character",
                entityId: "ch_30772",
              },
            ],
          },
        ],
      },
    ],
    relations: [
      { fromChengyuContentId: "cy_0001", toChengyuContentId: "cy_0002", relationType: "RELATED" },
    ],
  });

  it("runs Chengyu → ChengyuExample → ChengyuRelation inside ONE interactive transaction", async () => {
    const { db, calls } = createChengyuFake();
    const result = await syncChengyu(db, baseFile(), { log: () => undefined });

    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(result.idioms.inserted).toBe(1);
    expect(result.examples.inserted).toBe(1);
    expect(result.relations.inserted).toBe(1);

    // Dependency order: idiom first, then example, then relation.
    const models = calls.createMany.map(
      (c) =>
        (c.data[0] as any).content_id ??
        (c.data[0] as any).chengyuContentId ??
        (c.data[0] as any).fromChengyuContentId,
    );
    expect(models).toEqual(["cy_0001", "cy_0001_ex1", "cy_0001"]);
    // Relation payload references both ends.
    expect(calls.createMany[2].data[0].fromChengyuContentId).toBe("cy_0001");
    expect(calls.createMany[2].data[0].toChengyuContentId).toBe("cy_0002");
    // content_hash stamped on all three.
    for (const c of calls.createMany) {
      expect(c.data[0].content_hash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("edit-propagates: an edited example reaches the DB + bumps content_version; the unchanged idiom stays at version 1", async () => {
    const { db } = createChengyuFake();
    await syncChengyu(db, baseFile(), { log: () => undefined });

    // Second run: the example's Chinese changed; the idiom is unchanged.
    const edited = baseFile();
    (edited.idioms[0].examples![0] as any).chinese = "他背水一战。";
    (edited.idioms[0].examples![0] as any).pinyin = "tā bèi shuǐ yī zhàn";

    const result = await syncChengyu(db, edited, { log: () => undefined });
    expect(result.examples.updated).toBe(1);
    expect(result.idioms.updated).toBe(0);
    expect(result.idioms.unchanged).toBe(1);

    const update = (db.chengyuExample.update as any).mock.calls[0][0];
    expect(update.data.chinese).toBe("他背水一战。");
    expect(update.data.content_version).toEqual({ increment: 1 });
  });

  it("is idempotent: re-syncing an identical payload writes 0 rows", async () => {
    const { db } = createChengyuFake();
    await syncChengyu(db, baseFile(), { log: () => undefined });
    (db.chengyu.update as any).mockClear();
    (db.chengyuExample.update as any).mockClear();
    (db.chengyuRelation.update as any).mockClear();

    const result = await syncChengyu(db, baseFile(), { log: () => undefined });
    expect(result.idioms.inserted).toBe(0);
    expect(result.idioms.updated).toBe(0);
    expect(result.examples.updated).toBe(0);
    expect(result.relations.updated).toBe(0);
    expect(db.chengyu.update).not.toHaveBeenCalled();
    expect(db.chengyuExample.update).not.toHaveBeenCalled();
  });

  it("removal: a row dropped from the JSON stays in the DB (log-only)", async () => {
    const { db } = createChengyuFake();
    await syncChengyu(db, baseFile(), { log: () => undefined });

    const dropped = baseFile();
    dropped.relations = [];
    const logs: string[] = [];
    await syncChengyu(db, dropped, { log: (m) => logs.push(m) });

    // Relation row still in DB (no auto-delete).
    expect(db.chengyuRelation.deleteMany).not.toHaveBeenCalled();
    expect(logs.join("\n")).toContain("in DB but not in JSON");
  });
});
