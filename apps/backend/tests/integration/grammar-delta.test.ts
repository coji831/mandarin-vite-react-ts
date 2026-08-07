/**
 * @file apps/backend/tests/integration/grammar-delta.test.ts
 * @description DB-backed integration tests for the hash-gated grammar delta
 * sync (syncGrammar). Directly encodes the Story 22.1 regression: an edit to a
 * seeded grammar row must propagate on re-sync.
 *
 * IMPORTANT: feeds in-memory doctored payloads to `syncGrammar` directly —
 * the real `content/seed/phase2/grammar-patterns.json` is NEVER mutated here.
 * Uses a dedicated test namespace (gr_99XX) so it never collides with the
 * authored gr_0001–gr_0021 rows; the afterAll hook cascade-cleans everything.
 *
 * Requires a reachable, SEEDED test database (see helpers/db.ts). Run via:
 *   cd apps/backend && npm run test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/shared/infrastructure/database/client.js";
import { checkDatabase, disconnectDatabase } from "./helpers/db.js";
import { syncGrammar, type GrammarFile } from "../../prisma/sync-helpers.js";

const db = await checkDatabase();

const NAMESPACE = "gr_99";
const P_A = "gr_9901";
const P_B = "gr_9902";
const EX_1 = "gr_9901_ex1";

const silentLog = (): void => undefined;

/** In-memory grammar payload — never touches the real JSON file. */
function makeGrammar(overrides?: {
  exampleChinese?: string;
  examplePinyin?: string;
  dropPatternB?: boolean;
}): GrammarFile {
  const patterns = [
    {
      content_id: P_A,
      name: "Delta test pattern A",
      structure: "A + B",
      explanation: "temporary delta-sync test pattern — not authored content",
      phase: 2,
      hskLevel: 1,
      sortOrder: 9901,
      examples: [
        {
          content_id: EX_1,
          chinese: overrides?.exampleChinese ?? "我打人。",
          pinyin: overrides?.examplePinyin ?? "wǒ dǎ rén",
          english: "I hit a person.",
          sortOrder: 1,
          segments: [
            { text: "我", pinyin: "wǒ", gloss: "I", entityType: "character", entityId: "ch_25105" },
          ],
        },
      ],
    },
  ];
  if (!overrides?.dropPatternB) {
    patterns.push({
      content_id: P_B,
      name: "Delta test pattern B",
      structure: "C + D",
      explanation: "temporary delta-sync test pattern — not authored content",
      phase: 3,
      hskLevel: null,
      sortOrder: 9902,
    });
  }
  return {
    patterns,
    relations: [{ fromPatternContentId: P_A, toPatternContentId: P_B, relationType: "RELATED" }],
  };
}

async function cleanupNamespace(): Promise<void> {
  await prisma.grammarPatternRelation.deleteMany({
    where: { fromPatternContentId: { startsWith: NAMESPACE } },
  });
  await prisma.grammarPattern.deleteMany({ where: { content_id: { startsWith: NAMESPACE } } });
}

describe.skipIf(!db.available)("Grammar delta sync (hash-gated, integration)", () => {
  beforeAll(async () => {
    await cleanupNamespace();
    // Baseline: first sync writes everything with content_version=1 + content_hash set.
    await syncGrammar(prisma, makeGrammar(), { log: silentLog });
  });

  afterAll(async () => {
    await cleanupNamespace();
    await disconnectDatabase();
  });

  it("baseline: inserts patterns/examples/relations with content_version=1 and a content_hash", async () => {
    const pattern = await prisma.grammarPattern.findUnique({ where: { content_id: P_A } });
    const example = await prisma.grammarExample.findUnique({ where: { content_id: EX_1 } });
    const relation = await prisma.grammarPatternRelation.findUnique({
      where: {
        fromPatternContentId_toPatternContentId: {
          fromPatternContentId: P_A,
          toPatternContentId: P_B,
        },
      },
    });
    expect(pattern).not.toBeNull();
    expect(pattern!.content_version).toBe(1);
    expect(pattern!.content_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(example).not.toBeNull();
    expect(example!.content_version).toBe(1);
    expect(example!.content_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(relation).not.toBeNull();
    expect(relation!.content_version).toBe(1);
    expect(relation!.content_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("idempotency: re-syncing an identical payload writes 0 rows and leaves versions stable", async () => {
    const beforePattern = await prisma.grammarPattern.findUnique({ where: { content_id: P_A } });
    const beforeExample = await prisma.grammarExample.findUnique({ where: { content_id: EX_1 } });

    const result = await syncGrammar(prisma, makeGrammar(), { log: silentLog });
    expect(result.patterns.inserted).toBe(0);
    expect(result.patterns.updated).toBe(0);
    expect(result.patterns.reconciled).toBe(0);
    expect(result.examples.updated).toBe(0);
    expect(result.relations.updated).toBe(0);

    const afterPattern = await prisma.grammarPattern.findUnique({ where: { content_id: P_A } });
    const afterExample = await prisma.grammarExample.findUnique({ where: { content_id: EX_1 } });
    expect(afterPattern!.content_version).toBe(beforePattern!.content_version);
    expect(afterExample!.content_version).toBe(beforeExample!.content_version);
    // updatedAt untouched proves no blind write.
    expect(afterPattern!.updatedAt.getTime()).toBe(beforePattern!.updatedAt.getTime());
    expect(afterExample!.updatedAt.getTime()).toBe(beforeExample!.updatedAt.getTime());
  });

  it("edit-propagates regression (Story 22.1): an edited example reaches the DB + content_version bumps to 2; unchanged rows untouched", async () => {
    const result = await syncGrammar(
      prisma,
      makeGrammar({ exampleChinese: "我昨天吃饭了。", examplePinyin: "wǒ zuótiān chī fàn le" }),
      { log: silentLog },
    );
    // Only the example changed → 1 updated; pattern + relation unchanged.
    expect(result.examples.updated).toBe(1);
    expect(result.patterns.updated).toBe(0);
    expect(result.relations.updated).toBe(0);

    const example = await prisma.grammarExample.findUnique({ where: { content_id: EX_1 } });
    expect(example!.chinese).toBe("我昨天吃饭了。");
    expect(example!.pinyin).toBe("wǒ zuótiān chī fàn le");
    expect(example!.content_version).toBe(2);

    // The pattern (gr_9902) was not edited → version stays 1.
    const pattern = await prisma.grammarPattern.findUnique({ where: { content_id: P_B } });
    expect(pattern!.content_version).toBe(1);
  });

  it("insert: a brand-new pattern is created with content_version=1", async () => {
    const newId = "gr_9903";
    const grammar = makeGrammar();
    grammar.patterns.push({
      content_id: newId,
      name: "Delta test pattern C",
      structure: "E + F",
      explanation: "temporary delta-sync insert test pattern",
      phase: 4,
      hskLevel: null,
      sortOrder: 9903,
    });
    const result = await syncGrammar(prisma, grammar, { log: silentLog });
    expect(result.patterns.inserted).toBe(1);
    const created = await prisma.grammarPattern.findUnique({ where: { content_id: newId } });
    expect(created).not.toBeNull();
    expect(created!.content_version).toBe(1);
    expect(created!.content_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("NULL-hash reconcile: clears content_hash on a slice → re-sync writes + stamps hash WITHOUT a version bump", async () => {
    // gr_9902 has version 1; null out its hash to simulate a post-migration row.
    await prisma.grammarPattern.updateMany({
      where: { content_id: P_B },
      data: { content_hash: null },
    });
    const result = await syncGrammar(prisma, makeGrammar(), { log: silentLog });
    expect(result.patterns.reconciled).toBe(1);
    const pattern = await prisma.grammarPattern.findUnique({ where: { content_id: P_B } });
    expect(pattern!.content_hash).toMatch(/^[0-9a-f]{64}$/);
    // No version bump on NULL-hash reconcile.
    expect(pattern!.content_version).toBe(1);
  });

  it("removal: a row dropped from the JSON stays in the DB (log-only, no auto-delete)", async () => {
    const result = await syncGrammar(prisma, makeGrammar({ dropPatternB: true }), {
      log: silentLog,
    });
    // Pattern B still present (no prune path in tests).
    const stillThere = await prisma.grammarPattern.findUnique({ where: { content_id: P_B } });
    expect(stillThere).not.toBeNull();
    // The relation to the dropped pattern is NOT deleted by default either.
    const relation = await prisma.grammarPatternRelation.findUnique({
      where: {
        fromPatternContentId_toPatternContentId: {
          fromPatternContentId: P_A,
          toPatternContentId: P_B,
        },
      },
    });
    expect(relation).not.toBeNull();
    void result;
  });
});
