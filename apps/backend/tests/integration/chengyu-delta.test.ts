/**
 * @file apps/backend/tests/integration/chengyu-delta.test.ts
 * @description DB-backed integration tests for the hash-gated chengyu delta
 * sync (syncChengyu). Directly encodes the Story 22.1 regression for the
 * chengyu pipeline: an edit to a seeded chengyu row must propagate on re-sync.
 *
 * IMPORTANT: feeds in-memory doctored payloads to `syncChengyu` directly —
 * the real `content/seed/phase2/chengyu.json` is NEVER mutated here.
 * Uses a dedicated test namespace (cy_99XX) so it never collides with the
 * authored cy_0001–cy_0055 rows; the afterAll hook cascade-cleans everything.
 *
 * Requires a reachable, SEEDED test database (see helpers/db.ts). Run via:
 *   cd apps/backend && npm run test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/shared/infrastructure/database/client.js";
import { checkDatabase, disconnectDatabase } from "./helpers/db.js";
import { syncChengyu, type ChengyuFile } from "../../prisma/sync-helpers.js";

const db = await checkDatabase();

const NAMESPACE = "cy_99";
const CY_A = "cy_9901";
const CY_B = "cy_9902";
const EX_1 = "cy_9901_ex1";

const silentLog = (): void => undefined;

/** In-memory chengyu payload — never touches the real JSON file. */
function makeChengyu(overrides?: {
  exampleChinese?: string;
  examplePinyin?: string;
  dropIdiomB?: boolean;
}): ChengyuFile {
  const idioms = [
    {
      content_id: CY_A,
      chengyu: "破釜沉舟",
      pinyin: "pò fǔ chén zhōu",
      literalMeaning: "Break pots, sink ships",
      figurativeMeaning: "Burning one's bridges",
      story: "temporary delta-sync test idiom — not authored content",
      storySource: "《史记·卷七·项羽本纪》(zh.wikisource.org/wiki/史記/卷007)",
      era: "Qin–Han transition",
      theme: "determination",
      sortOrder: 9901,
      metadata: { source: "CC-CEDICT" },
      examples: [
        {
          content_id: EX_1,
          chinese: overrides?.exampleChinese ?? "他破釜沉舟。",
          pinyin: overrides?.examplePinyin ?? "tā pò fǔ chén zhōu",
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
  ];
  if (!overrides?.dropIdiomB) {
    idioms.push({
      content_id: CY_B,
      chengyu: "画蛇添足",
      pinyin: "huà shé tiān zú",
      literalMeaning: "Draw a snake, add feet",
      figurativeMeaning: "Gilding the lily",
      story: "temporary delta-sync test idiom — not authored content",
      storySource: "《战国策·齐策二》(zh.wikisource.org/wiki/戰國策/卷九)",
      era: "Warring States",
      theme: "self-defeating excess",
      sortOrder: 9902,
    });
  }
  return {
    idioms,
    relations: [{ fromChengyuContentId: CY_A, toChengyuContentId: CY_B, relationType: "RELATED" }],
  };
}

async function cleanupNamespace(): Promise<void> {
  await prisma.chengyuRelation.deleteMany({
    where: { fromChengyuContentId: { startsWith: NAMESPACE } },
  });
  await prisma.chengyu.deleteMany({ where: { content_id: { startsWith: NAMESPACE } } });
}

describe.skipIf(!db.available)("Chengyu delta sync (hash-gated, integration)", () => {
  beforeAll(async () => {
    await cleanupNamespace();
    // Baseline: first sync writes everything with content_version=1 + content_hash set.
    await syncChengyu(prisma, makeChengyu(), { log: silentLog });
  });

  afterAll(async () => {
    await cleanupNamespace();
    await disconnectDatabase();
  });

  it("baseline: inserts idioms/examples/relations with content_version=1 and a content_hash", async () => {
    const idiom = await prisma.chengyu.findUnique({ where: { content_id: CY_A } });
    const example = await prisma.chengyuExample.findUnique({ where: { content_id: EX_1 } });
    const relation = await prisma.chengyuRelation.findUnique({
      where: {
        fromChengyuContentId_toChengyuContentId: {
          fromChengyuContentId: CY_A,
          toChengyuContentId: CY_B,
        },
      },
    });
    expect(idiom).not.toBeNull();
    expect(idiom!.content_version).toBe(1);
    expect(idiom!.content_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(example).not.toBeNull();
    expect(example!.content_version).toBe(1);
    expect(example!.content_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(relation).not.toBeNull();
    expect(relation!.content_version).toBe(1);
    expect(relation!.content_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("idempotency: re-syncing an identical payload writes 0 rows and leaves versions stable", async () => {
    const beforeIdiom = await prisma.chengyu.findUnique({ where: { content_id: CY_A } });
    const beforeExample = await prisma.chengyuExample.findUnique({ where: { content_id: EX_1 } });

    const result = await syncChengyu(prisma, makeChengyu(), { log: silentLog });
    expect(result.idioms.inserted).toBe(0);
    expect(result.idioms.updated).toBe(0);
    expect(result.idioms.reconciled).toBe(0);
    expect(result.examples.updated).toBe(0);
    expect(result.relations.updated).toBe(0);

    const afterIdiom = await prisma.chengyu.findUnique({ where: { content_id: CY_A } });
    const afterExample = await prisma.chengyuExample.findUnique({ where: { content_id: EX_1 } });
    expect(afterIdiom!.content_version).toBe(beforeIdiom!.content_version);
    expect(afterExample!.content_version).toBe(beforeExample!.content_version);
    // updatedAt untouched proves no blind write.
    expect(afterIdiom!.updatedAt.getTime()).toBe(beforeIdiom!.updatedAt.getTime());
    expect(afterExample!.updatedAt.getTime()).toBe(beforeExample!.updatedAt.getTime());
  });

  it("edit-propagates regression: an edited example reaches the DB + content_version bumps to 2; unchanged rows untouched", async () => {
    const result = await syncChengyu(
      prisma,
      makeChengyu({ exampleChinese: "他背水一战。", examplePinyin: "tā bèi shuǐ yī zhàn" }),
      { log: silentLog },
    );
    // Only the example changed → 1 updated; idiom + relation unchanged.
    expect(result.examples.updated).toBe(1);
    expect(result.idioms.updated).toBe(0);
    expect(result.relations.updated).toBe(0);

    const example = await prisma.chengyuExample.findUnique({ where: { content_id: EX_1 } });
    expect(example!.chinese).toBe("他背水一战。");
    expect(example!.pinyin).toBe("tā bèi shuǐ yī zhàn");
    expect(example!.content_version).toBe(2);

    // The unedited idiom (cy_9902) stays at version 1.
    const idiom = await prisma.chengyu.findUnique({ where: { content_id: CY_B } });
    expect(idiom!.content_version).toBe(1);
  });

  it("insert: a brand-new idiom is created with content_version=1", async () => {
    const newId = "cy_9903";
    const chengyu = makeChengyu();
    chengyu.idioms.push({
      content_id: newId,
      chengyu: "守株待兔",
      pinyin: "shǒu zhū dài tù",
      literalMeaning: "Guard the stump, wait for rabbits",
      figurativeMeaning: "temporary delta-sync insert test idiom",
      story: "temporary delta-sync insert test idiom",
      storySource: "《韩非子·五蠹》(zh.wikisource.org/wiki/韓非子/五蠹)",
      era: "Warring States",
      theme: "misguided persistence",
      sortOrder: 9903,
    });
    const result = await syncChengyu(prisma, chengyu, { log: silentLog });
    expect(result.idioms.inserted).toBe(1);
    const created = await prisma.chengyu.findUnique({ where: { content_id: newId } });
    expect(created).not.toBeNull();
    expect(created!.content_version).toBe(1);
    expect(created!.content_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("NULL-hash reconcile: clears content_hash on a slice → re-sync writes + stamps hash WITHOUT a version bump", async () => {
    // cy_9902 has version 1; null out its hash to simulate a post-migration row.
    await prisma.chengyu.updateMany({
      where: { content_id: CY_B },
      data: { content_hash: null },
    });
    const result = await syncChengyu(prisma, makeChengyu(), { log: silentLog });
    expect(result.idioms.reconciled).toBe(1);
    const idiom = await prisma.chengyu.findUnique({ where: { content_id: CY_B } });
    expect(idiom!.content_hash).toMatch(/^[0-9a-f]{64}$/);
    // No version bump on NULL-hash reconcile.
    expect(idiom!.content_version).toBe(1);
  });

  it("removal: a row dropped from the JSON stays in the DB (log-only, no auto-delete)", async () => {
    const result = await syncChengyu(prisma, makeChengyu({ dropIdiomB: true }), {
      log: silentLog,
    });
    // Idiom B still present (no prune path in tests).
    const stillThere = await prisma.chengyu.findUnique({ where: { content_id: CY_B } });
    expect(stillThere).not.toBeNull();
    // The relation to the dropped idiom is NOT deleted by default either.
    const relation = await prisma.chengyuRelation.findUnique({
      where: {
        fromChengyuContentId_toChengyuContentId: {
          fromChengyuContentId: CY_A,
          toChengyuContentId: CY_B,
        },
      },
    });
    expect(relation).not.toBeNull();
    void result;
  });
});
