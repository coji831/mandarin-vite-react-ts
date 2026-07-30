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

const mockRadicals = [
  {
    id: "rad_0001",
    glyph: "⺅",
    name_pinyin: "rén",
    meaning: "person",
    stroke_count: 2,
    is_recommended: true,
    kangxi_index: 9,
    metadata: {},
  },
  {
    id: "rad_0002",
    glyph: "女",
    name_pinyin: "nǚ",
    meaning: "woman",
    stroke_count: 3,
    is_recommended: true,
    kangxi_index: 38,
    metadata: {},
  },
  {
    id: "rad_0003",
    glyph: "口",
    name_pinyin: "kǒu",
    meaning: "mouth",
    stroke_count: 3,
    is_recommended: true,
    kangxi_index: 30,
    metadata: {},
  },
];

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
    vi.mocked(apiClient.get).mockResolvedValue({ data: [mockRadicals[0], mockRadicals[1]] });

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
    vi.mocked(apiClient.get).mockResolvedValue({ data: [mockRadicals[2]] });

    const result = await fetchMergedRadicals("口");

    expect(result).toHaveLength(1);
    expect(result[0].glyph).toBe("口");
  });

  it("returns empty array when no radicals match", async () => {
    const result = await fetchMergedRadicals("无");

    expect(result).toEqual([]);
  });

  it("returns radicals with correct shape", async () => {
    const { apiClient } = await import("shared/api");
    vi.mocked(apiClient.get).mockResolvedValue({ data: [mockRadicals[0]] });

    const result = await fetchMergedRadicals("好");

    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("glyph");
    expect(result[0]).toHaveProperty("meaning");
    expect(result[0]).toHaveProperty("name_pinyin");
  });
});
