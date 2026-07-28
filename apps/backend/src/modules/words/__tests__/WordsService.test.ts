/**
 * @file modules/words/__tests__/WordsService.test.ts
 * @description Unit tests for WordsService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { WordsService } from "../services/WordsService.js";
import { WordNotFoundError } from "../types/words-errors.js";

// Mock the logger
vi.mock("../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe("WordsService", () => {
  let service: WordsService;
  let mockRepository: any;

  const testGlyph = "你好";

  const mockWordRecord = {
    id: "w_00001",
    simplified: "你好",
    pinyin: "nǐ hǎo",
    meaning: "hello; hi; how are you",
    hskLevel: 1,
    wordClass: "greeting",
    frequencyRank: 150,
    wordCharacters: [
      {
        character: {
          glyph: "你",
          definition: "you",
          readings: [{ pinyin: "nǐ", meaning: "you (singular)" }],
        },
      },
      {
        character: {
          glyph: "好",
          definition: "good",
          readings: [{ pinyin: "hǎo", meaning: "good, well" }],
        },
      },
    ],
  };

  const expectedDetail = {
    glyph: "你好",
    pinyin: "nǐ hǎo",
    definitions: ["hello", "hi", "how are you"],
    hskLevel: 1,
    wordClass: "greeting",
    frequencyRank: 150,
    constituentCharacters: [
      { glyph: "你", pinyin: "nǐ", meaning: "you" },
      { glyph: "好", pinyin: "hǎo", meaning: "good" },
    ],
  };

  beforeEach(() => {
    mockRepository = {
      findWordByGlyph: vi.fn(),
    };

    service = new WordsService(mockRepository);
  });

  describe("getWordDetail", () => {
    it("should return word detail when word is found", async () => {
      mockRepository.findWordByGlyph.mockResolvedValue(mockWordRecord);

      const result = await service.getWordDetail(testGlyph);

      expect(result).toEqual(expectedDetail);
      expect(mockRepository.findWordByGlyph).toHaveBeenCalledWith(testGlyph);
    });

    it("should return empty string pinyin when word has no pinyin", async () => {
      const recordWithoutPinyin = {
        ...mockWordRecord,
        pinyin: null,
      };
      mockRepository.findWordByGlyph.mockResolvedValue(recordWithoutPinyin);

      const result = await service.getWordDetail(testGlyph);

      expect(result.pinyin).toBe("");
    });

    it("should return empty definitions array when word has no meaning", async () => {
      const recordWithoutMeaning = {
        ...mockWordRecord,
        meaning: null,
      };
      mockRepository.findWordByGlyph.mockResolvedValue(recordWithoutMeaning);

      const result = await service.getWordDetail(testGlyph);

      expect(result.definitions).toEqual([]);
    });

    it("should return null levels when word has null hskLevel", async () => {
      const recordWithoutHsk = {
        ...mockWordRecord,
        hskLevel: null,
      };
      mockRepository.findWordByGlyph.mockResolvedValue(recordWithoutHsk);

      const result = await service.getWordDetail(testGlyph);

      expect(result.hskLevel).toBeNull();
    });

    it("should throw WordNotFoundError when word is not found", async () => {
      mockRepository.findWordByGlyph.mockResolvedValue(null);

      await expect(service.getWordDetail(testGlyph)).rejects.toThrow(WordNotFoundError);
      await expect(service.getWordDetail(testGlyph)).rejects.toThrow(
        `No word found for glyph: ${testGlyph}`,
      );
    });

    it("should handle glyph fallback when simplified is null", async () => {
      const recordWithoutSimplified = {
        ...mockWordRecord,
        simplified: null,
      };
      mockRepository.findWordByGlyph.mockResolvedValue(recordWithoutSimplified);

      const result = await service.getWordDetail(testGlyph);

      // Falls back to the input glyph
      expect(result.glyph).toBe(testGlyph);
    });

    it("should handle empty constituent characters", async () => {
      const recordWithoutChars = {
        ...mockWordRecord,
        wordCharacters: [],
      };
      mockRepository.findWordByGlyph.mockResolvedValue(recordWithoutChars);

      const result = await service.getWordDetail(testGlyph);

      expect(result.constituentCharacters).toEqual([]);
    });

    it("should handle character without readings", async () => {
      const recordWithNoReading = {
        ...mockWordRecord,
        wordCharacters: [
          {
            character: {
              glyph: "你",
              definition: "you",
              readings: [],
            },
          },
        ],
      };
      mockRepository.findWordByGlyph.mockResolvedValue(recordWithNoReading);

      const result = await service.getWordDetail(testGlyph);

      expect(result.constituentCharacters[0].pinyin).toBe("");
      expect(result.constituentCharacters[0].meaning).toBe("you"); // falls back to definition
    });
  });
});
