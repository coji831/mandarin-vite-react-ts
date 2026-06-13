/**
 * VocabularyService Unit Tests
 * Tests business logic for vocabulary operations with mocked repository
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import VocabularyService from "../services/VocabularyService.js";

describe("VocabularyService", () => {
  let vocabularyService;
  let mockRepository;

  beforeEach(() => {
    // Create mock repository with all required methods
    mockRepository = {
      findAllLists: vi.fn(),
      findListById: vi.fn(),
      findWordsForList: vi.fn(),
      searchLists: vi.fn(),
    };

    vocabularyService = new VocabularyService(mockRepository);
  });

  describe("getAllLists", () => {
    it("should return all vocabulary lists from repository", async () => {
      const mockLists = [
        { id: 1, title: "HSK 1", difficulty: "beginner", tags: ["hsk"] },
        { id: 2, title: "Travel", difficulty: "intermediate", tags: ["conversation"] },
      ];
      mockRepository.findAllLists.mockResolvedValue(mockLists);

      const result = await vocabularyService.getAllLists();

      expect(result).toEqual(mockLists);
      expect(mockRepository.findAllLists).toHaveBeenCalledOnce();
    });

    it("should handle empty list from repository", async () => {
      mockRepository.findAllLists.mockResolvedValue([]);

      const result = await vocabularyService.getAllLists();

      expect(result).toEqual([]);
    });
  });

  describe("getListById", () => {
    it("should return a list by ID", async () => {
      const mockList = { id: "hsk-1", name: "HSK 1", difficulty: "beginner" };
      mockRepository.findListById.mockResolvedValue(mockList);

      const result = await vocabularyService.getListById("hsk-1");

      expect(result).toEqual(mockList);
      expect(mockRepository.findListById).toHaveBeenCalledWith("hsk-1");
    });

    it("should return null when list not found", async () => {
      mockRepository.findListById.mockResolvedValue(null);

      const result = await vocabularyService.getListById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("getWordsForList", () => {
    it("should return words for a list", async () => {
      const mockWords = [
        { wordId: "1", chinese: "我", pinyin: "wǒ", english: "I" },
        { wordId: "2", chinese: "你", pinyin: "nǐ", english: "you" },
      ];
      mockRepository.findWordsForList.mockResolvedValue(mockWords);

      const result = await vocabularyService.getWordsForList("hsk-1");

      expect(result).toEqual(mockWords);
      expect(mockRepository.findWordsForList).toHaveBeenCalledWith("hsk-1");
    });
  });

  describe("searchLists", () => {
    it("should search lists with query and filters", async () => {
      const mockResults = [{ id: "hsk-1", name: "HSK 1", difficulty: "beginner" }];
      mockRepository.searchLists.mockResolvedValue(mockResults);

      const result = await vocabularyService.searchLists("HSK", { difficulties: ["beginner"] });

      expect(result).toEqual(mockResults);
      expect(mockRepository.searchLists).toHaveBeenCalledWith("HSK", {
        difficulties: ["beginner"],
      });
    });

    it("should pass empty filters when none provided", async () => {
      mockRepository.searchLists.mockResolvedValue([]);

      await vocabularyService.searchLists("test");

      expect(mockRepository.searchLists).toHaveBeenCalledWith("test", {});
    });
  });
});
