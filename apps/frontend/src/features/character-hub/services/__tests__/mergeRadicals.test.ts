/**
 * @file mergeRadicals.test.ts
 * @description Tests for the merged radicals fetch function
 * Story 19.5: Character Hub Radical Section
 *
 * Tests the fetchMergedRadicals helper used by the useMergedRadicals hook.
 *
 * Note: hsk_characters in radical metadata has been removed (Story 21.11).
 * All character-to-radical mappings now come from the backend DB-backed API.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("shared/api", () => ({
  apiClient: { get: vi.fn() },
}));

// Mock radicals service so loadAllRadicals returns controlled data
vi.mock("../../../radicals/services", () => ({
  radicalsService: { loadAllRadicals: vi.fn() },
}));

// Real API contract: the backend returns camelCase radical items.
// loadRadicalsByCharacter maps them into the snake_case RadicalData shape.
const mockApiRadicals = [
  {
    id: "rad_0001",
    glyph: "⺅",
    alternateGlyphs: [],
    namePinyin: "rén",
    nameChinese: "",
    meaning: "person",
    strokeCount: 2,
    isRecommended: true,
    kangxiIndex: 9,
    etymology: "",
    frequencyRank: null,
    notes: null,
    isAlsoCharacter: null,
    variants: null,
    hskCharacters: [],
  },
  {
    id: "rad_0002",
    glyph: "女",
    alternateGlyphs: [],
    namePinyin: "nǚ",
    nameChinese: "",
    meaning: "woman",
    strokeCount: 3,
    isRecommended: true,
    kangxiIndex: 38,
    etymology: "",
    frequencyRank: null,
    notes: null,
    isAlsoCharacter: null,
    variants: null,
    hskCharacters: [],
  },
  {
    id: "rad_0003",
    glyph: "口",
    alternateGlyphs: [],
    namePinyin: "kǒu",
    nameChinese: "",
    meaning: "mouth",
    strokeCount: 3,
    isRecommended: true,
    kangxiIndex: 30,
    etymology: "",
    frequencyRank: null,
    notes: null,
    isAlsoCharacter: null,
    variants: null,
    hskCharacters: [],
  },
];

// Post-mapping shape (snake_case) — returned by the mocked loadAllRadicals.
const mockRadicals = mockApiRadicals.map((r) => ({
  id: r.id,
  glyph: r.glyph,
  alternate_glyphs: r.alternateGlyphs,
  name_pinyin: r.namePinyin,
  meaning: r.meaning,
  stroke_count: r.strokeCount,
  is_recommended: r.isRecommended,
  kangxi_index: r.kangxiIndex,
  metadata: {},
}));

async function fetchMergedRadicals(character: string) {
  const { loadRadicalsByCharacter } = await import("../characterService");
  const { radicalsService } = await import("../../../radicals/services");

  // Source 1: Match via CharacterRadical table (DB-backed)
  const dbMatches = await loadRadicalsByCharacter(character);

  // Source 2: Check if character matches any radical's own glyph (self-match)
  const allRadicals = await radicalsService.loadAllRadicals();
  const selfMatch = allRadicals.filter((r) => r.glyph === character);

  // Merge and deduplicate by id (favor DB matches first)
  const merged = [...dbMatches];
  for (const self of selfMatch) {
    if (!merged.find((m: { id: string }) => m.id === self.id)) {
      merged.push(self);
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
    const { apiClient } = await import("shared/api");
    const { radicalsService } = await import("../../../radicals/services");
    vi.mocked(radicalsService.loadAllRadicals).mockResolvedValue(mockRadicals);
    // Default: apiClient.get returns empty array for radicals/character endpoint
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
  });

  it("returns radicals from DB when character matches via CharacterRadical table", async () => {
    const { apiClient } = await import("shared/api");
    vi.mocked(apiClient.get).mockResolvedValue({ data: [mockApiRadicals[0], mockApiRadicals[1]] });

    const result = await fetchMergedRadicals("好");

    expect(result).toHaveLength(2);
    expect(result[0].glyph).toBe("⺅");
    expect(result[1].glyph).toBe("女");
  });

  it("returns self-match radical when character glyph matches radical glyph", async () => {
    // DB returns nothing (default mock), but "口" is a self-match
    const result = await fetchMergedRadicals("口");

    expect(result).toHaveLength(1);
    expect(result[0].glyph).toBe("口");
  });

  it("deduplicates when DB match and self-match return the same radical", async () => {
    const { apiClient } = await import("shared/api");
    // DB returns "口" as a match, and "口" is also a self-match
    vi.mocked(apiClient.get).mockResolvedValue({ data: [mockApiRadicals[2]] });

    const result = await fetchMergedRadicals("口");

    expect(result).toHaveLength(1);
    expect(result[0].glyph).toBe("口");
  });

  it("returns empty array when no radicals match", async () => {
    const result = await fetchMergedRadicals("无");

    expect(result).toEqual([]);
  });

  it("returns radicals with correct shape, mapping camelCase API fields to snake_case", async () => {
    const { apiClient } = await import("shared/api");
    vi.mocked(apiClient.get).mockResolvedValue({ data: [mockApiRadicals[0]] });

    const result = await fetchMergedRadicals("好");

    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("glyph");
    expect(result[0]).toHaveProperty("meaning");
    expect(result[0].name_pinyin).toBe("rén");
  });
});
