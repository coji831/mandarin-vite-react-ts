/**
 * @file apps/backend/tests/integration/chengyu-seed.test.ts
 * @description DB-backed integration tests for the Epic 23 chengyu seed
 * (Story 23.1 — Chengyu Data). Covers:
 *   - seed idempotency (re-running the chengyu seed steps yields identical row counts),
 *   - schema shape (uuid id + unique content_id cy_XXXX + content_version=1 +
 *     metadata nullable; examples carry segments + reference chengyuContentId),
 *   - post-seed counts (idioms ≥ 50 / examples ≥ 50 / relations ≥ 0) and
 *     zero orphan examples (FK integrity),
 *   - cascade (deleting an idiom removes its examples + relation rows).
 *
 * Requires a reachable, SEEDED test database (see helpers/db.ts). Run via:
 *   cd apps/backend && npm run test:integration
 * When no DB is reachable the suite is skipped.
 *
 * NOTE: mirrors grammar-seed.test.ts — it drives the tables with the legacy
 * createMany + skipDuplicates mechanism to prove DB-level idempotency and
 * schema shape without re-running the full seed. The REAL hash-gated path
 * (syncChengyu) is exercised in tests/integration/chengyu-delta.test.ts.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { prisma } from "../../src/shared/infrastructure/database/client.js";
import { checkDatabase, disconnectDatabase } from "./helpers/db.js";

const db = await checkDatabase();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHENGYU_FILE = path.resolve(__dirname, "../../../../content/seed/phase2/chengyu.json");

interface ChengyuSegment {
  text: string;
  pinyin: string;
  gloss: string;
  entityType: "character" | "word" | null;
  entityId: string | null;
}

interface ChengyuExampleRow {
  content_id: string;
  chinese: string;
  pinyin: string;
  english: string;
  sortOrder: number;
  segments: ChengyuSegment[];
}

interface ChengyuRow {
  content_id: string;
  chengyu: string;
  pinyin: string;
  literalMeaning: string;
  figurativeMeaning: string;
  story: string;
  storySource: string;
  era: string;
  theme: string;
  sortOrder: number;
  metadata: Record<string, unknown> | null;
  examples?: ChengyuExampleRow[];
}

interface ChengyuRelationRow {
  fromChengyuContentId: string;
  toChengyuContentId: string;
  relationType: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Read the authoring source and flatten it into the three table row shapes. */
function loadChengyu() {
  const raw = JSON.parse(fs.readFileSync(CHENGYU_FILE, "utf-8")) as {
    idioms: ChengyuRow[];
    relations: ChengyuRelationRow[];
  };
  return {
    idioms: raw.idioms.map((c) => ({
      content_id: c.content_id,
      chengyu: c.chengyu,
      pinyin: c.pinyin,
      literalMeaning: c.literalMeaning,
      figurativeMeaning: c.figurativeMeaning,
      story: c.story,
      storySource: c.storySource,
      era: c.era,
      theme: c.theme,
      sortOrder: c.sortOrder,
      metadata: c.metadata ?? null,
    })),
    examples: raw.idioms.flatMap((c) =>
      (c.examples ?? []).map((e) => ({
        content_id: e.content_id,
        chengyuContentId: c.content_id,
        chinese: e.chinese,
        pinyin: e.pinyin,
        english: e.english,
        segments: e.segments,
        sortOrder: e.sortOrder,
      })),
    ),
    relations: raw.relations.map((r) => ({
      fromChengyuContentId: r.fromChengyuContentId,
      toChengyuContentId: r.toChengyuContentId,
      relationType: r.relationType,
    })),
  };
}

/**
 * Seeds the chengyu tables for the schema-shape/idempotency assertions below.
 * Deliberately uses the legacy createMany + skipDuplicates mechanism (the
 * hash-gated syncChengyu path is covered by chengyu-delta.test.ts).
 */
async function runChengyuSeed() {
  const c = loadChengyu();
  return {
    idioms: await prisma.chengyu.createMany({ data: c.idioms, skipDuplicates: true }),
    examples: await prisma.chengyuExample.createMany({ data: c.examples, skipDuplicates: true }),
    relations: await prisma.chengyuRelation.createMany({
      data: c.relations,
      skipDuplicates: true,
    }),
  };
}

async function chengyuCounts() {
  const [idioms, examples, relations] = await Promise.all([
    prisma.chengyu.count(),
    prisma.chengyuExample.count(),
    prisma.chengyuRelation.count(),
  ]);
  return { idioms, examples, relations };
}

describe.skipIf(!db.available)("Chengyu seed (integration, DB)", () => {
  beforeAll(async () => {
    await runChengyuSeed();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("seed idempotency", () => {
    it("running the chengyu seed steps twice leaves identical row counts", async () => {
      const before = await chengyuCounts();
      const second = await runChengyuSeed();
      const after = await chengyuCounts();

      expect(second.idioms.count).toBe(0);
      expect(second.examples.count).toBe(0);
      expect(second.relations.count).toBe(0);

      expect(after.idioms).toBe(before.idioms);
      expect(after.examples).toBe(before.examples);
      expect(after.relations).toBe(before.relations);
    });
  });

  describe("schema shape (pre-adaptation: uuid id + unique content_id)", () => {
    it("Chengyu exposes a uuid id, unique cy_XXXX content_id, content_version=1 and metadata", async () => {
      const c = await prisma.chengyu.findUnique({ where: { content_id: "cy_0001" } });
      expect(c).not.toBeNull();
      expect(c!.id).toMatch(UUID_RE);
      expect(c!.content_id).toBe("cy_0001");
      expect(c!.chengyu).toBe("破釜沉舟");
      expect(c!.pinyin).toBe("pò fǔ chén zhōu");
      expect(c!.era).toBe("Qin–Han transition");
      expect(c!.theme).toBe("determination");
      expect(c!.sortOrder).toBe(1);
      expect(c!.content_version).toBe(1);
      expect(c!.storySource).toContain("zh.wikisource.org");
      expect(c!.metadata).toEqual(expect.objectContaining({ source: "CC-CEDICT" }));
    });

    it("all seeded idioms carry cy_XXXX content_ids (uuid ids, never business-key PKs)", async () => {
      const idioms = await prisma.chengyu.findMany({
        orderBy: { sortOrder: "asc" },
        select: { id: true, content_id: true, chengyu: true },
      });
      expect(idioms.length).toBeGreaterThanOrEqual(50);
      for (const c of idioms) {
        expect(c.content_id).toMatch(/^cy_\d{4}$/);
        expect(c.id).toMatch(UUID_RE);
        expect([...c.chengyu]).toHaveLength(4);
      }
    });

    it("ChengyuExample carries segments and references chengyuContentId", async () => {
      const ex = await prisma.chengyuExample.findUnique({ where: { content_id: "cy_0001_ex1" } });
      expect(ex).not.toBeNull();
      expect(ex!.chengyuContentId).toBe("cy_0001");
      expect(ex!.chinese).toContain("破釜沉舟");
      expect(ex!.content_version).toBe(1);
      expect(Array.isArray(ex!.segments)).toBe(true);
      const segments = ex!.segments as unknown as ChengyuSegment[];
      expect(segments.length).toBeGreaterThan(0);
      expect(segments[0]).toMatchObject({
        text: "破",
        pinyin: "pò",
        entityType: "character",
        entityId: "ch_30772",
      });
    });

    it("ChengyuRelation exposes relationType and both content_id endpoints", async () => {
      const rel = await prisma.chengyuRelation.findUnique({
        where: {
          fromChengyuContentId_toChengyuContentId: {
            fromChengyuContentId: "cy_0001",
            toChengyuContentId: "cy_0042",
          },
        },
      });
      expect(rel).not.toBeNull();
      expect(rel!.relationType).toBe("RELATED");
    });
  });

  describe("post-seed counts + FK integrity", () => {
    it("has ≥ 50 idioms, ≥ 50 examples, ≥ 0 relations", async () => {
      const counts = await chengyuCounts();
      expect(counts.idioms).toBeGreaterThanOrEqual(50);
      expect(counts.examples).toBeGreaterThanOrEqual(50);
      expect(counts.relations).toBeGreaterThanOrEqual(0);
    });

    it("has zero orphan examples (every chengyuContentId resolves to a Chengyu)", async () => {
      const orphans = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM "ChengyuExample" e
        LEFT JOIN "Chengyu" c ON e."chengyuContentId" = c."content_id"
        WHERE c."content_id" IS NULL
      `;
      expect(Number(orphans[0].count)).toBe(0);
    });
  });

  describe("cascade delete", () => {
    it("deleting an idiom removes its examples and relation rows", async () => {
      const TEST_IDIOM = "cy_9999";
      const TEST_EXAMPLE = "cy_9999_ex1";
      try {
        await prisma.chengyu.create({
          data: {
            content_id: TEST_IDIOM,
            chengyu: "测试成语",
            pinyin: "cè shì chéng yǔ",
            literalMeaning: "test idiom",
            figurativeMeaning: "temporary cascade test row",
            story: "temporary cascade test row — not authored content",
            storySource: "《论语·为政》(zh.wikisource.org/wiki/論語/為政)",
            era: "Spring & Autumn",
            theme: "test",
            sortOrder: 999,
            examples: {
              create: {
                content_id: TEST_EXAMPLE,
                chinese: "这是测试。",
                pinyin: "zhè shì cè shì",
                english: "this is a test",
                segments: [],
                sortOrder: 1,
              },
            },
          },
        });
        await prisma.chengyuRelation.create({
          data: {
            fromChengyuContentId: TEST_IDIOM,
            toChengyuContentId: "cy_0001",
            relationType: "RELATED",
          },
        });

        await prisma.chengyu.delete({ where: { content_id: TEST_IDIOM } });

        const example = await prisma.chengyuExample.findUnique({
          where: { content_id: TEST_EXAMPLE },
        });
        const relation = await prisma.chengyuRelation.findUnique({
          where: {
            fromChengyuContentId_toChengyuContentId: {
              fromChengyuContentId: TEST_IDIOM,
              toChengyuContentId: "cy_0001",
            },
          },
        });
        expect(example).toBeNull();
        expect(relation).toBeNull();
      } finally {
        // Clean up any leftovers if an assertion failed mid-test.
        await prisma.chengyuExample.deleteMany({ where: { content_id: TEST_EXAMPLE } });
        await prisma.chengyuRelation.deleteMany({
          where: { fromChengyuContentId: TEST_IDIOM },
        });
        await prisma.chengyu.deleteMany({ where: { content_id: TEST_IDIOM } });
      }
    });
  });
});
