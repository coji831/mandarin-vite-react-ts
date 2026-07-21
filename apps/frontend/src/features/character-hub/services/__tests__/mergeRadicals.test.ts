/**
 * @file mergeRadicals.test.ts
 * @description Tests for the merged radicals fetch function
 * Story 19.5: Character Hub Radical Section
 *
 * Tests the fetchMergedRadicals helper used by the useMergedRadicals hook.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("shared/api", () => ({
  apiClient: { get: vi.fn() },
}));

// Mock radicals service so loadAllRadicals returns controlled data
vi.mock("../../../radicals/services", () => ({
  radicalsService: { loadAllRadicals: vi.fn() },
}));

const mockRadicals = [
  {
    id: "rad_0001",
    glyph: "⺅",
    name_pinyin: "rén",
    meaning: "person",
    stroke_count: 2,
    is_recommended: true,
    kangxi_index: 9,
    metadata: { hsk_characters: [{ glyph: "好", pinyin: "hǎo", meaning: "good" }] },
  },
  {
    id: "rad_0002",
    glyph: "女",
    name_pinyin: "nǚ",
    meaning: "woman",
    stroke_count: 3,
    is_recommended: true,
    kangxi_index: 38,
    metadata: { hsk_characters: [{ glyph: "好", pinyin: "hǎo", meaning: "good" }] },
  },
  {
    id: "rad_0003",
    glyph: "口",
    name_pinyin: "kǒu",
    meaning: "mouth",
    stroke_count: 3,
    is_recommended: true,
    kangxi_index: 30,
    metadata: { hsk_characters: [{ glyph: "吃", pinyin: "chī", meaning: "eat" }] },
  },
];

async function fetchMergedRadicals(character: string) {
  const { loadRadicalsByCharacter } = await import("../characterService");
  const { radicalsService } = await import("../../../radicals/services");

  const allRadicals = await radicalsService.loadAllRadicals();

  const hskMatches = allRadicals.filter((r) =>
    r.metadata.hsk_characters?.some((c) => c.glyph === character),
  );
  const selfMatch = allRadicals.filter((r) => r.glyph === character);
  const withSelf = [
    ...hskMatches,
    ...selfMatch.filter((r) => !hskMatches.find((m) => m.id === r.id)),
  ];

  const dbMatches = await loadRadicalsByCharacter(character);

  const merged = [...withSelf];
  for (const dbMatch of dbMatches) {
    if (!merged.find((m) => m.id === dbMatch.id)) {
      merged.push(dbMatch);
    }
  }

  return merged.map((r) => ({
    id: r.id,
    glyph: r.glyph,
    meaning: r.meaning,
    name_pinyin: r.name_pinyin,
  }));
}

describe("fetchMergedRadicals", () => {
  beforeEach(async () => {
    const { radicalsService } = await import("../../../radicals/services");
    vi.mocked(radicalsService.loadAllRadicals).mockResolvedValue(mockRadicals);
  });

  it("returns radicals matching the character via hsk_characters", async () => {
    const result = await fetchMergedRadicals("好");

    expect(result).toHaveLength(2);
    expect(result[0].glyph).toBe("⺅");
    expect(result[1].glyph).toBe("女");
  });

  it("returns empty array when no radicals match", async () => {
    const result = await fetchMergedRadicals("无");

    expect(result).toEqual([]);
  });

  it("returns radicals with correct shape", async () => {
    const result = await fetchMergedRadicals("好");

    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("glyph");
    expect(result[0]).toHaveProperty("meaning");
    expect(result[0]).toHaveProperty("name_pinyin");
  });
});
