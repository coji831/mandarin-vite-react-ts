/**
 * @file mergeRadicals.test.ts
 * @description Tests for mergeRadicals service
 * Story 19.5: Character Hub Radical Section
 *
 * NOTE: vitest config has mockReset: true which clears vi.fn() implementations
 * before each test. All mock setup is done in beforeEach using dynamic imports.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock shared/api so the real radicalsService can load without alias errors.
vi.mock("shared/api", () => ({
  apiClient: { get: vi.fn() },
}));

// Mock characterHubService
vi.mock("../characterHubService", () => ({
  loadRadicalsByCharacter: vi.fn(),
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

describe("loadMergedRadicals", () => {
  beforeEach(async () => {
    // Re-apply mock implementations after mockReset
    const { apiClient } = await import("shared/api");
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockRadicals });

    const { loadRadicalsByCharacter } = await import("../characterHubService");
    vi.mocked(loadRadicalsByCharacter).mockResolvedValue([]);
  });

  it("returns radicals matching the character via hsk_characters", async () => {
    const { loadMergedRadicals } = await import("../mergeRadicals");
    const result = await loadMergedRadicals("好");

    expect(result).toHaveLength(2);
    expect(result[0].glyph).toBe("⺅");
    expect(result[1].glyph).toBe("女");
  });

  it("returns empty array when no radicals match", async () => {
    const { loadMergedRadicals } = await import("../mergeRadicals");
    const result = await loadMergedRadicals("无");

    expect(result).toEqual([]);
  });

  it("returns radicals with correct shape", async () => {
    const { loadMergedRadicals } = await import("../mergeRadicals");
    const result = await loadMergedRadicals("好");

    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("glyph");
    expect(result[0]).toHaveProperty("meaning");
    expect(result[0]).toHaveProperty("name_pinyin");
  });
});
