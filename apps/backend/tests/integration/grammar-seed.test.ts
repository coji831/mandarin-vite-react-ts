/**
 * @file apps/backend/tests/integration/grammar-seed.test.ts
 * @description DB-backed integration tests for the Epic 22 grammar seed
 * (Story 22.1 — Grammar Data). Covers:
 *   - seed idempotency (skipDuplicates on the unique content_id — re-running the
 *     grammar seed steps yields identical row counts),
 *   - schema shape (uuid id + unique content_id gr_XXXX + content_version=1 +
 *     metadata nullable; examples carry segments + reference patternContentId),
 *   - post-seed counts (patterns ≥ 21 / examples ≥ 63 / relations ≥ 0) and
 *     zero orphan examples (FK integrity),
 *   - cascade (deleting a pattern removes its examples + relation rows).
 *
 * Requires a reachable, SEEDED test database (see helpers/db.ts). Run via:
 *   cd apps/backend && npm run test:integration
 * When no DB is reachable the suite is skipped.
 *
 * NOTE: this suite deliberately drives the tables with the legacy
 * createMany + skipDuplicates mechanism to prove DB-level idempotency and
 * schema shape without re-running the full (100K-row) character seed. The
 * REAL hash-gated path (syncGrammar — which propagates edits and bumps
 * content_version) is exercised in tests/integration/grammar-delta.test.ts.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { prisma } from "../../src/shared/infrastructure/database/client.js";
import { checkDatabase, disconnectDatabase } from "./helpers/db.js";

const db = await checkDatabase();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GRAMMAR_FILE = path.resolve(
  __dirname,
  "../../../../content/seed/phase2/grammar-patterns.json",
);

interface GrammarSegment {
  text: string;
  pinyin: string;
  gloss: string;
  entityType: "character" | "word" | null;
  entityId: string | null;
}

interface GrammarExampleRow {
  content_id: string;
  chinese: string;
  pinyin: string;
  english: string;
  sortOrder: number;
  segments: GrammarSegment[];
}

interface GrammarPatternRow {
  content_id: string;
  name: string;
  structure: string;
  explanation: string;
  phase: number;
  hskLevel: number | null;
  sortOrder: number;
  metadata: Record<string, unknown> | null;
  examples?: GrammarExampleRow[];
}

interface GrammarRelationRow {
  fromPatternContentId: string;
  toPatternContentId: string;
  relationType: string;
  metadata?: Record<string, unknown> | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Read the authoring source and flatten it into the three table row shapes. */
function loadGrammar() {
  const raw = JSON.parse(fs.readFileSync(GRAMMAR_FILE, "utf-8")) as {
    patterns: GrammarPatternRow[];
    relations: GrammarRelationRow[];
  };
  return {
    patterns: raw.patterns.map((p) => ({
      content_id: p.content_id,
      name: p.name,
      structure: p.structure,
      explanation: p.explanation,
      phase: p.phase,
      hskLevel: p.hskLevel,
      sortOrder: p.sortOrder,
      metadata: p.metadata ?? null,
    })),
    examples: raw.patterns.flatMap((p) =>
      (p.examples ?? []).map((e) => ({
        content_id: e.content_id,
        patternContentId: p.content_id,
        chinese: e.chinese,
        pinyin: e.pinyin,
        english: e.english,
        segments: e.segments,
        sortOrder: e.sortOrder,
      })),
    ),
    relations: raw.relations.map((r) => ({
      fromPatternContentId: r.fromPatternContentId,
      toPatternContentId: r.toPatternContentId,
      relationType: r.relationType,
      metadata: r.metadata ?? null,
    })),
  };
}

/**
 * Seeds the grammar tables for the schema-shape/idempotency assertions below.
 * Deliberately uses the legacy createMany + skipDuplicates mechanism (the
 * hash-gated syncGrammar path is covered by grammar-delta.test.ts).
 */
async function runGrammarSeed() {
  const g = loadGrammar();
  const created = {
    patterns: await prisma.grammarPattern.createMany({ data: g.patterns, skipDuplicates: true }),
    examples: await prisma.grammarExample.createMany({ data: g.examples, skipDuplicates: true }),
    relations: await prisma.grammarPatternRelation.createMany({
      data: g.relations,
      skipDuplicates: true,
    }),
  };
  return created;
}

async function grammarCounts() {
  const [patterns, examples, relations] = await Promise.all([
    prisma.grammarPattern.count(),
    prisma.grammarExample.count(),
    prisma.grammarPatternRelation.count(),
  ]);
  return { patterns, examples, relations };
}

describe.skipIf(!db.available)("Grammar seed (integration, DB)", () => {
  beforeAll(async () => {
    await runGrammarSeed();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("seed idempotency", () => {
    it("running the grammar seed steps twice leaves identical row counts", async () => {
      const before = await grammarCounts();
      // Second run — every row already exists, skipDuplicates skips them all.
      const second = await runGrammarSeed();
      const after = await grammarCounts();

      expect(second.patterns.count).toBe(0);
      expect(second.examples.count).toBe(0);
      expect(second.relations.count).toBe(0);

      expect(after.patterns).toBe(before.patterns);
      expect(after.examples).toBe(before.examples);
      expect(after.relations).toBe(before.relations);
    });
  });

  describe("schema shape (pre-adaptation: uuid id + unique content_id)", () => {
    it("GrammarPattern exposes a uuid id, unique gr_XXXX content_id, content_version=1 and metadata", async () => {
      const p = await prisma.grammarPattern.findUnique({ where: { content_id: "gr_0001" } });
      expect(p).not.toBeNull();
      expect(p!.id).toMatch(UUID_RE);
      expect(p!.content_id).toBe("gr_0001");
      expect(p!.name).toBe("SVO basic word order");
      expect(p!.structure).toBe("Subject + Verb + Object");
      expect(p!.phase).toBe(2);
      expect(p!.hskLevel).toBe(1);
      expect(p!.sortOrder).toBe(1);
      expect(p!.content_version).toBe(1);
      expect(p!.metadata).toEqual(expect.objectContaining({ family: "word-order-tense" }));
    });

    it("all 21 seeded patterns carry gr_XXXX content_ids (uuid ids, never business-key PKs)", async () => {
      const patterns = await prisma.grammarPattern.findMany({
        orderBy: { sortOrder: "asc" },
        select: { id: true, content_id: true, phase: true, hskLevel: true },
      });
      expect(patterns.length).toBeGreaterThanOrEqual(21);
      for (const p of patterns) {
        expect(p.content_id).toMatch(/^gr_\d{4}$/);
        expect(p.id).toMatch(UUID_RE);
        expect([2, 3, 4]).toContain(p.phase);
        expect(p.hskLevel === null || (p.hskLevel! >= 1 && p.hskLevel! <= 6)).toBe(true);
      }
    });

    it("GrammarExample carries segments and references patternContentId", async () => {
      const ex = await prisma.grammarExample.findUnique({ where: { content_id: "gr_0001_ex1" } });
      expect(ex).not.toBeNull();
      expect(ex!.patternContentId).toBe("gr_0001");
      expect(ex!.chinese).toBe("我打人。");
      expect(ex!.pinyin).toBe("wǒ dǎ rén");
      expect(ex!.content_version).toBe(1);
      expect(Array.isArray(ex!.segments)).toBe(true);
      const segments = ex!.segments as unknown as GrammarSegment[];
      expect(segments.length).toBeGreaterThan(0);
      expect(segments[0]).toMatchObject({
        text: "我",
        pinyin: "wǒ",
        entityType: "character",
        entityId: "ch_25105",
      });
    });

    it("GrammarPatternRelation exposes relationType and both content_id endpoints", async () => {
      const rel = await prisma.grammarPatternRelation.findUnique({
        where: {
          fromPatternContentId_toPatternContentId: {
            fromPatternContentId: "gr_0018",
            toPatternContentId: "gr_0019",
          },
        },
      });
      expect(rel).not.toBeNull();
      expect(rel!.relationType).toBe("CONTRASTS_WITH");
    });
  });

  describe("post-seed counts + FK integrity", () => {
    it("has ≥ 21 patterns, ≥ 63 examples, ≥ 0 relations", async () => {
      const counts = await grammarCounts();
      expect(counts.patterns).toBeGreaterThanOrEqual(21);
      expect(counts.examples).toBeGreaterThanOrEqual(63);
      expect(counts.relations).toBeGreaterThanOrEqual(0);
    });

    it("has zero orphan examples (every patternContentId resolves to a GrammarPattern)", async () => {
      const orphans = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM "GrammarExample" e
        LEFT JOIN "GrammarPattern" p ON e."patternContentId" = p."content_id"
        WHERE p."content_id" IS NULL
      `;
      expect(Number(orphans[0].count)).toBe(0);
    });
  });

  describe("cascade delete", () => {
    it("deleting a pattern removes its examples and relation rows", async () => {
      const TEST_PATTERN = "gr_9999";
      const TEST_EXAMPLE = "gr_9999_ex1";
      try {
        await prisma.grammarPattern.create({
          data: {
            content_id: TEST_PATTERN,
            name: "cascade test pattern",
            structure: "X + Y",
            explanation: "temporary cascade test row — not authored content",
            phase: 4,
            hskLevel: null,
            sortOrder: 999,
            examples: {
              create: {
                content_id: TEST_EXAMPLE,
                chinese: "测试。",
                pinyin: "cèshì",
                english: "test sentence",
                segments: [],
                sortOrder: 1,
              },
            },
          },
        });
        await prisma.grammarPatternRelation.create({
          data: {
            fromPatternContentId: TEST_PATTERN,
            toPatternContentId: "gr_0001",
            relationType: "RELATED",
          },
        });

        await prisma.grammarPattern.delete({ where: { content_id: TEST_PATTERN } });

        const example = await prisma.grammarExample.findUnique({
          where: { content_id: TEST_EXAMPLE },
        });
        const relation = await prisma.grammarPatternRelation.findUnique({
          where: {
            fromPatternContentId_toPatternContentId: {
              fromPatternContentId: TEST_PATTERN,
              toPatternContentId: "gr_0001",
            },
          },
        });
        expect(example).toBeNull();
        expect(relation).toBeNull();
      } finally {
        // Clean up any leftovers if an assertion failed mid-test.
        await prisma.grammarExample.deleteMany({ where: { content_id: TEST_EXAMPLE } });
        await prisma.grammarPatternRelation.deleteMany({
          where: { fromPatternContentId: TEST_PATTERN },
        });
        await prisma.grammarPattern.deleteMany({ where: { content_id: TEST_PATTERN } });
      }
    });
  });
});
