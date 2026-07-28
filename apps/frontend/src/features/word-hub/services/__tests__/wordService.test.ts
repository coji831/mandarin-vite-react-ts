/**
 * @file services/__tests__/wordService.test.ts
 * @description Tests for wordService API calls
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.x: Migrated to word-hub feature
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadWordData } from "../wordService";
import type { WordDetailResponse } from "../wordService";

const mockGet = vi.fn();

vi.mock("shared/api", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

const SAMPLE_WORD: WordDetailResponse = {
  glyph: "好",
  pinyin: "hǎo",
  definitions: ["good", "fine", "well"],
  hskLevel: 1,
  constituentCharacters: [
    { glyph: "女", pinyin: "nǚ", meaning: "woman" },
    { glyph: "子", pinyin: "zǐ", meaning: "child" },
  ],
};

describe("wordService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loadWordData", () => {
    it("returns word data on success", async () => {
      mockGet.mockResolvedValue({ data: { data: SAMPLE_WORD } });

      const result = await loadWordData("好");

      expect(result).toEqual(SAMPLE_WORD);
      expect(mockGet).toHaveBeenCalledWith("/v1/words/好", { timeout: 10000 });
    });

    it("throws when response has no data wrapper", async () => {
      mockGet.mockResolvedValue({ data: null });

      await expect(loadWordData("好")).rejects.toThrow();
    });

    it("throws on 404", async () => {
      mockGet.mockRejectedValue({ response: { status: 404 } });

      await expect(loadWordData("好")).rejects.toBeDefined();
    });

    it("throws on network error", async () => {
      mockGet.mockRejectedValue(new Error("Network error"));

      await expect(loadWordData("好")).rejects.toThrow("Network error");
    });
  });
});
