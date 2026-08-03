/**
 * @file apps/backend/src/modules/characters/repositories/__tests__/PinyinSearchRepository.test.ts
 * Unit tests for PinyinSearchRepository.
 *
 * Phase 2 (pinyin universalization): search input is normalized with the
 * canonical shared `stripToneAndDigits` — tone-marked ("mā"), digit-suffixed
 * ("ma1") and plain ("ma") inputs all reduce to the same syllable prefix, so
 * they all match the same indexed pinyinSyllable.syllable (tone-NUMBER "ba1")
 * rows.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindMany = vi.fn();
const mockCount = vi.fn();

vi.mock("../../../../shared/infrastructure/database/client.js", () => ({
  prisma: {
    pinyinCharacterMapping: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

const { PinyinSearchRepository } = await import("../PinyinSearchRepository.js");
type PinyinSearchRepositoryInstance = InstanceType<typeof PinyinSearchRepository>;

function latestStartsWith(): string | undefined {
  const calls = mockFindMany.mock.calls;
  const where = calls[calls.length - 1]?.[0]?.where;
  return where?.pinyinSyllable?.syllable?.startsWith;
}

describe("PinyinSearchRepository (Phase 2 — normalized prefix search)", () => {
  let repository: PinyinSearchRepositoryInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockReset();
    mockCount.mockReset();
    repository = new PinyinSearchRepository();
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);
  });

  it("maps tone-marked, digit-suffixed and plain input to the same syllable prefix", async () => {
    const cases = ["mā", "ma", "ma1", "MA1", "ma3"];

    for (const q of cases) {
      await repository.searchByPinyin({ q, page: 1, pageSize: 10 });
      expect(latestStartsWith()).toBe("ma");
    }
  });

  it("still applies an optional tone filter", async () => {
    await repository.searchByPinyin({ q: "ma", tone: 3, page: 1, pageSize: 10 });
    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.pinyinSyllable.syllable.startsWith).toBe("ma");
    expect(where.pinyinSyllable.tone).toBe(3);
  });

  it("returns the mapped result shape", async () => {
    mockFindMany.mockResolvedValue([
      {
        character: { glyph: "妈", definition: "mom" },
        pinyinSyllable: { syllablePretty: "mā", tone: 1 },
      },
    ]);
    mockCount.mockResolvedValue(1);

    const result = await repository.searchByPinyin({ q: "ma1", page: 1, pageSize: 10 });

    expect(result.totalResults).toBe(1);
    expect(result.results[0]).toEqual({
      glyph: "妈",
      pinyin: "mā",
      tone: 1,
      meaning: "mom",
    });
  });
});
