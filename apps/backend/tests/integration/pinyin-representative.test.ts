/**
 * @file apps/backend/tests/integration/pinyin-representative.test.ts
 * @description DB-backed integration test for the deterministic pinyin
 *   representative selection (post-seed).
 *
 * Asserts against the PinyinCharacterMapping table:
 *   - exactly one representativeRank=0 per syllable + contiguous 0..n
 *   - the curated representatives resolve to the correct glyph:
 *     bái→白, bǎi→百, bà→爸, bai→掰 (synthesized), quán→全 (no longer 鳈)
 *
 * Requires a reachable, SEEDED database (see helpers/db.ts). Skips when the
 * DB is unreachable. Run via:
 *   cd apps/backend && npm run test:integration
 */
import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "../../src/shared/infrastructure/database/client.js";
import { checkDatabase, disconnectDatabase } from "./helpers/db.js";

const db = await checkDatabase();

describe.skipIf(!db.available)("Pinyin representative (post-seed, DB)", () => {
  afterAll(async () => {
    await disconnectDatabase();
  });

  it("has exactly one representativeRank=0 per syllable and contiguous 0..n ranks", async () => {
    const rows = await prisma.pinyinCharacterMapping.findMany({
      select: { pinyinSyllableId: true, representativeRank: true },
    });
    expect(rows.length).toBeGreaterThan(0);

    const bySyllable = new Map<string, number[]>();
    for (const r of rows) {
      if (r.representativeRank == null) continue;
      const list = bySyllable.get(r.pinyinSyllableId) ?? [];
      list.push(r.representativeRank);
      bySyllable.set(r.pinyinSyllableId, list);
    }

    for (const [syllableId, ranks] of bySyllable) {
      const sorted = [...ranks].sort((a, b) => a - b);
      expect(
        sorted.filter((x) => x === 0),
        `syllable ${syllableId}`,
      ).toHaveLength(1);
      sorted.forEach((r, i) => expect(r, `syllable ${syllableId}`).toBe(i));
    }
  });

  it("resolves the curated representatives + quán to the correct glyph (rank-0 first)", async () => {
    const rows = await prisma.pinyinCharacterMapping.findMany({
      orderBy: [{ representativeRank: { sort: "asc", nulls: "last" } }, { id: "asc" }],
      where: { pinyinSyllable: { syllablePretty: { in: ["bái", "bǎi", "bà", "bai", "quán"] } } },
      include: {
        pinyinSyllable: { select: { syllablePretty: true } },
        character: { select: { glyph: true } },
      },
    });

    const first = new Map<string, string>();
    for (const r of rows) {
      const p = r.pinyinSyllable.syllablePretty;
      if (!first.has(p)) first.set(p, r.character.glyph);
    }

    expect(first.get("bái")).toBe("白");
    expect(first.get("bǎi")).toBe("百");
    expect(first.get("bà")).toBe("爸");
    expect(first.get("bai")).toBe("掰");
    expect(first.get("quán")).toBe("全");
  });
});
