/**
 * @file apps/backend/tests/modules/foundations/FoundationsService.test.ts
 * @description Unit tests for FoundationsService.getPinyinCharacterMap —
 *   asserts the deterministic representative ordering (representativeRank asc
 *   NULLS LAST, then id) and rank-0 first-wins per syllablePretty.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPinyinCharacterMappingFindMany = vi.fn();

vi.mock("../../../src/shared/infrastructure/database/client.js", () => ({
  prisma: {
    pinyinCharacterMapping: { findMany: mockPinyinCharacterMappingFindMany },
  },
}));

const { FoundationsService } =
  await import("../../../src/modules/foundations/services/FoundationsService.js");

describe("FoundationsService.getPinyinCharacterMap (unit)", () => {
  let service: FoundationsService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPinyinCharacterMappingFindMany.mockReset();
    service = new FoundationsService();
  });

  it("orders by representativeRank asc (nulls last) then id", async () => {
    mockPinyinCharacterMappingFindMany.mockResolvedValue([]);
    await service.getPinyinCharacterMap();
    const args = mockPinyinCharacterMappingFindMany.mock.calls[0][0];
    expect(args.orderBy).toEqual([
      { representativeRank: { sort: "asc", nulls: "last" } },
      { id: "asc" },
    ]);
  });

  it("returns the rank-0 representative via first-wins per syllablePretty", async () => {
    // Rows arrive in orderBy order: rank-0 first for each syllable.
    mockPinyinCharacterMappingFindMany.mockResolvedValue([
      { pinyinSyllable: { syllablePretty: "bai" }, character: { glyph: "掰" } },
      { pinyinSyllable: { syllablePretty: "bai" }, character: { glyph: "伯" } },
      { pinyinSyllable: { syllablePretty: "bái" }, character: { glyph: "白" } },
      { pinyinSyllable: { syllablePretty: "bǎi" }, character: { glyph: "百" } },
      { pinyinSyllable: { syllablePretty: "bà" }, character: { glyph: "爸" } },
    ]);

    const map = await service.getPinyinCharacterMap();

    expect(map["bai"]).toBe("掰");
    expect(map["bái"]).toBe("白");
    expect(map["bǎi"]).toBe("百");
    expect(map["bà"]).toBe("爸");
  });

  it("keeps the first row per syllable even when a glyph repeats", async () => {
    mockPinyinCharacterMappingFindMany.mockResolvedValue([
      { pinyinSyllable: { syllablePretty: "quán" }, character: { glyph: "全" } },
      { pinyinSyllable: { syllablePretty: "quán" }, character: { glyph: "拳" } },
    ]);
    const map = await service.getPinyinCharacterMap();
    expect(map["quán"]).toBe("全");
  });
});
