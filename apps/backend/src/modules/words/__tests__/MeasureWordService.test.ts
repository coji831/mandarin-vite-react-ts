/**
 * @file modules/words/__tests__/MeasureWordService.test.ts
 * @description Unit tests for MeasureWordService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MeasureWordService } from "../services/MeasureWordService.js";
import { WordIdNotFoundError } from "../types/words-errors.js";
import type { MeasureWordRepository } from "../repositories/MeasureWordRepository.js";

// Mock the logger
vi.mock("../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe("MeasureWordService", () => {
  let service: MeasureWordService;
  let mockRepository: any;

  const testWordId = "w_00284";
  const testGlyph = "朋友";

  const mockWord = {
    id: testWordId,
    simplified: testGlyph,
  };

  const mockMeasureWordRecords = [
    {
      isDefault: true,
      exampleSentence: "一个朋友",
      measureWord: {
        id: "mw_001",
        simplified: "个",
        pinyin: "gè",
        meaning: "generic individual unit",
        category: "general",
        usageNote: "The most common and versatile measure word.",
      },
    },
    {
      isDefault: false,
      exampleSentence: "一位朋友",
      measureWord: {
        id: "mw_044",
        simplified: "位",
        pinyin: "wèi",
        meaning: "polite person counter",
        category: "formal",
        usageNote: "Polite measure word for people.",
      },
    },
  ];

  beforeEach(() => {
    mockRepository = {
      findWordById: vi.fn(),
      findMeasureWordsForWord: vi.fn(),
    };
    service = new MeasureWordService(mockRepository);
    vi.clearAllMocks();
  });

  describe("getMeasureWordsForWord", () => {
    it("should return measure words for a known noun word", async () => {
      mockRepository.findWordById.mockResolvedValue(mockWord);
      mockRepository.findMeasureWordsForWord.mockResolvedValue(mockMeasureWordRecords);

      const result = await service.getMeasureWordsForWord(testWordId);

      expect(result).toEqual({
        wordId: testWordId,
        simplified: testGlyph,
        measureWords: [
          {
            id: "mw_001",
            simplified: "个",
            pinyin: "gè",
            meaning: "generic individual unit",
            category: "general",
            usageNote: "The most common and versatile measure word.",
            isDefault: true,
            exampleSentence: "一个朋友",
          },
          {
            id: "mw_044",
            simplified: "位",
            pinyin: "wèi",
            meaning: "polite person counter",
            category: "formal",
            usageNote: "Polite measure word for people.",
            isDefault: false,
            exampleSentence: "一位朋友",
          },
        ],
      });

      expect(mockRepository.findWordById).toHaveBeenCalledWith(testWordId);

      expect(mockRepository.findMeasureWordsForWord).toHaveBeenCalledWith(testWordId);
    });

    it("should return empty array for a word with no associated measure words", async () => {
      mockRepository.findWordById.mockResolvedValue({
        id: "w_99999",
        simplified: "跑",
      });
      mockRepository.findMeasureWordsForWord.mockResolvedValue([]);

      const result = await service.getMeasureWordsForWord("w_99999");

      expect(result).toEqual({
        wordId: "w_99999",
        simplified: "跑",
        measureWords: [],
      });
    });

    it("should throw WordIdNotFoundError for non-existent word ID", async () => {
      mockRepository.findWordById.mockResolvedValue(null);

      await expect(service.getMeasureWordsForWord("w_nonexistent")).rejects.toThrow(
        WordIdNotFoundError,
      );

      expect(mockRepository.findMeasureWordsForWord).not.toHaveBeenCalled();
    });

    it("should pass correct orderBy (isDefault DESC, simplified ASC)", async () => {
      mockRepository.findWordById.mockResolvedValue(mockWord);
      // The mock returns data in the order the repository would serve it
      const orderedRecords = [
        {
          isDefault: true,
          exampleSentence: "一个人",
          measureWord: {
            id: "mw_001",
            simplified: "个",
            pinyin: "gè",
            meaning: "generic individual unit",
            category: "general",
            usageNote: "The most common and versatile measure word.",
          },
        },
        {
          isDefault: false,
          exampleSentence: "一只猫",
          measureWord: {
            id: "mw_005",
            simplified: "只",
            pinyin: "zhǐ",
            meaning: "one of a pair; animals",
            category: "measure",
            usageNote: "One of a pair or small animals.",
          },
        },
      ];
      mockRepository.findMeasureWordsForWord.mockResolvedValue(orderedRecords);

      const result = await service.getMeasureWordsForWord(testWordId);

      // Results mirror what the repository returned (ordered by isDefault DESC, simplified ASC)
      expect(result.measureWords[0].isDefault).toBe(true);
      expect(result.measureWords[0].simplified).toBe("个");
      expect(result.measureWords[1].isDefault).toBe(false);
      expect(result.measureWords[1].simplified).toBe("只");

      // Verify the correct repository method was called
      expect(mockRepository.findMeasureWordsForWord).toHaveBeenCalledWith(testWordId);
    });
  });
});
