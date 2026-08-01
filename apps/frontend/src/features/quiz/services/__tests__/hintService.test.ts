/**
 * @file hintService.test.ts
 * @description Tests for hintService — phonetic and radical hint fetching
 * Story 21.18: IME Simulator Phonetic Hints
 */

import { describe, it, expect, vi } from "vitest";

const mockPhoneticData = {
  glyph: "子",
  pinyin: "zǐ",
  meaning: "child",
};

const mockCharacterDetail = {
  glyph: "好",
  pinyin: ["hǎo", "hào"],
  meanings: ["good", "well"],
  strokeCount: 6,
  radical: { glyph: "女", meaning: "woman" },
  classification: "phono_semantic",
  phoneticComponent: mockPhoneticData,
  hskLevels: [1],
  frequencyRank: 42,
};

// Mock the apiClient module
const mockApiClient = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("shared/api", () => ({
  apiClient: mockApiClient,
}));

// Re-import after mock is set up
const {
  getPhoneticHint,
  getRadicalHint,
  getCharacterDetail,
  searchPinyinCandidates,
} = await import("../hintService");

// ── getPhoneticHint tests ─────────────────────────────────────────────

describe("getPhoneticHint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns phonetic hint data when API succeeds", async () => {
    mockApiClient.get.mockResolvedValue({ data: mockPhoneticData });

    const result = await getPhoneticHint("好");

    expect(result).toEqual(mockPhoneticData);
    expect(mockApiClient.get).toHaveBeenCalledWith(
      expect.stringContaining("/v1/characters/好/phonetic"),
      { timeout: 10000 },
    );
  });

  it("returns null when API fails (404/network error)", async () => {
    mockApiClient.get.mockRejectedValue(new Error("Not found"));

    const result = await getPhoneticHint("不存在的字");

    expect(result).toBeNull();
  });
});

// ── getRadicalHint tests ─────────────────────────────────────────────

describe("getRadicalHint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns radical data when API succeeds", async () => {
    mockApiClient.get.mockResolvedValue({ data: mockCharacterDetail });

    const result = await getRadicalHint("好");

    expect(result).toEqual({ glyph: "女", meaning: "woman" });
    expect(mockApiClient.get).toHaveBeenCalledWith(
      expect.stringContaining("/v1/characters/好"),
      { timeout: 10000 },
    );
  });

  it("returns null when API fails", async () => {
    mockApiClient.get.mockRejectedValue(new Error("Network error"));

    const result = await getRadicalHint("不存在的字");

    expect(result).toBeNull();
  });
});

// ── getCharacterDetail tests ─────────────────────────────────────────--

describe("getCharacterDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns full character detail when API succeeds", async () => {
    mockApiClient.get.mockResolvedValue({ data: mockCharacterDetail });

    const result = await getCharacterDetail("好");

    expect(result).toEqual(mockCharacterDetail);
    expect(mockApiClient.get).toHaveBeenCalledWith(
      expect.stringContaining("/v1/characters/好"),
      { timeout: 10000 },
    );
  });

  it("returns null when API fails", async () => {
    mockApiClient.get.mockRejectedValue(new Error("Network error"));

    const result = await getCharacterDetail("不存在的字");

    expect(result).toBeNull();
  });
});

// ── searchPinyinCandidates tests ─────────────────────────────────────

describe("searchPinyinCandidates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null and handles API errors gracefully", async () => {
    mockApiClient.get.mockRejectedValue(new Error("Network error"));

    const result = await searchPinyinCandidates("qing");

    expect(result).toBeNull();
    expect(mockApiClient.get).toHaveBeenCalledWith(
      expect.stringContaining("/v1/pinyin/search"),
      expect.objectContaining({ timeout: 10000 }),
    );
  });
});
