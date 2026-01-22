/**
 * VocabularyService Unit Tests
 * Tests business logic for vocabulary operations with mocked repository
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import VocabularyService from "../../../src/core/services/VocabularyService.js";

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

    it("should propagate repository errors", async () => {
      const error = new Error("Database connection failed");
      mockRepository.findAllLists.mockRejectedValue(error);

      await expect(vocabularyService.getAllLists()).rejects.toThrow("Database connection failed");
    });
  });

  describe("getListById", () => {
    it("should return a specific vocabulary list by ID", async () => {
      const mockList = {
        id: 42,
        title: "Food & Dining",
        difficulty: "intermediate",
        wordCount: 50,
      };
      mockRepository.findListById.mockResolvedValue(mockList);

      const result = await vocabularyService.getListById(42);

      expect(result).toEqual(mockList);
      expect(mockRepository.findListById).toHaveBeenCalledWith(42);
    });

    it("should return null for non-existent list", async () => {
      mockRepository.findListById.mockResolvedValue(null);

      const result = await vocabularyService.getListById(999);

      expect(result).toBeNull();
      expect(mockRepository.findListById).toHaveBeenCalledWith(999);
    });

    it("should handle string IDs (convert if repository expects)", async () => {
      const mockList = { id: "5", title: "Numbers" };
      mockRepository.findListById.mockResolvedValue(mockList);

      const result = await vocabularyService.getListById("5");

      expect(result).toEqual(mockList);
      expect(mockRepository.findListById).toHaveBeenCalledWith("5");
    });
  });

  describe("getWordsForList", () => {
    it("should return words for a specific list", async () => {
      const mockWords = [
        { id: 1, simplified: "你好", pinyin: "nǐ hǎo", english: "hello" },
        { id: 2, simplified: "谢谢", pinyin: "xiè xie", english: "thank you" },
      ];
      mockRepository.findWordsForList.mockResolvedValue(mockWords);

      const result = await vocabularyService.getWordsForList(10);

      expect(result).toEqual(mockWords);
      expect(mockRepository.findWordsForList).toHaveBeenCalledWith(10);
    });

    it("should return empty array for list with no words", async () => {
      mockRepository.findWordsForList.mockResolvedValue([]);

      const result = await vocabularyService.getWordsForList(99);

      expect(result).toEqual([]);
      expect(mockRepository.findWordsForList).toHaveBeenCalledWith(99);
    });

    it("should propagate repository errors", async () => {
      const error = new Error("Query timeout");
      mockRepository.findWordsForList.mockRejectedValue(error);

      await expect(vocabularyService.getWordsForList(5)).rejects.toThrow("Query timeout");
    });
  });

  describe("searchLists", () => {
    it("should search lists with query and filters", async () => {
      const mockResults = [{ id: 1, title: "Business Chinese", difficulty: "advanced" }];
      mockRepository.searchLists.mockResolvedValue(mockResults);

      const result = await vocabularyService.searchLists("business", {
        difficulty: "advanced",
        tags: ["professional"],
      });

      expect(result).toEqual(mockResults);
      expect(mockRepository.searchLists).toHaveBeenCalledWith("business", {
        difficulty: "advanced",
        tags: ["professional"],
      });
    });

    it("should default to empty object for filters if not provided", async () => {
      const mockResults = [{ id: 2, title: "HSK 2" }];
      mockRepository.searchLists.mockResolvedValue(mockResults);

      const result = await vocabularyService.searchLists("hsk");

      expect(result).toEqual(mockResults);
      expect(mockRepository.searchLists).toHaveBeenCalledWith("hsk", {});
    });

    it("should handle empty search results", async () => {
      mockRepository.searchLists.mockResolvedValue([]);

      const result = await vocabularyService.searchLists("nonexistent");

      expect(result).toEqual([]);
    });

    it("should pass through null/undefined filters as empty object", async () => {
      mockRepository.searchLists.mockResolvedValue([]);

      await vocabularyService.searchLists("test", null);
      expect(mockRepository.searchLists).toHaveBeenCalledWith("test", {});

      await vocabularyService.searchLists("test", undefined);
      expect(mockRepository.searchLists).toHaveBeenCalledWith("test", {});
    });
  });

  describe("extractDistinctDifficulties", () => {
    it("should extract unique difficulty values from lists", () => {
      const lists = [
        { id: 1, difficulty: "beginner" },
        { id: 2, difficulty: "intermediate" },
        { id: 3, difficulty: "beginner" },
        { id: 4, difficulty: "advanced" },
        { id: 5, difficulty: "intermediate" },
      ];

      const result = vocabularyService.extractDistinctDifficulties(lists);

      expect(result).toHaveLength(3);
      expect(result).toContain("beginner");
      expect(result).toContain("intermediate");
      expect(result).toContain("advanced");
    });

    it("should return empty array for empty lists", () => {
      const result = vocabularyService.extractDistinctDifficulties([]);
      expect(result).toEqual([]);
    });

    it("should handle lists with single difficulty", () => {
      const lists = [
        { id: 1, difficulty: "beginner" },
        { id: 2, difficulty: "beginner" },
      ];

      const result = vocabularyService.extractDistinctDifficulties(lists);

      expect(result).toEqual(["beginner"]);
    });
  });

  describe("extractDistinctTags", () => {
    it("should extract unique tags from all lists", () => {
      const lists = [
        { id: 1, tags: ["hsk", "beginner"] },
        { id: 2, tags: ["conversation", "travel"] },
        { id: 3, tags: ["hsk", "intermediate"] },
        { id: 4, tags: ["business", "advanced"] },
      ];

      const result = vocabularyService.extractDistinctTags(lists);

      expect(result).toHaveLength(7);
      expect(result).toContain("hsk");
      expect(result).toContain("beginner");
      expect(result).toContain("conversation");
      expect(result).toContain("travel");
      expect(result).toContain("intermediate");
      expect(result).toContain("business");
      expect(result).toContain("advanced");
    });

    it("should handle lists with no tags", () => {
      const lists = [
        { id: 1, tags: [] },
        { id: 2 }, // missing tags property
        { id: 3, tags: null },
      ];

      const result = vocabularyService.extractDistinctTags(lists);

      expect(result).toEqual([]);
    });

    it("should return empty array for empty lists", () => {
      const result = vocabularyService.extractDistinctTags([]);
      expect(result).toEqual([]);
    });

    it("should deduplicate tags across lists", () => {
      const lists = [
        { id: 1, tags: ["hsk", "test"] },
        { id: 2, tags: ["hsk", "study"] },
        { id: 3, tags: ["test", "exam"] },
      ];

      const result = vocabularyService.extractDistinctTags(lists);

      expect(result).toHaveLength(4);
      expect(result).toContain("hsk");
      expect(result).toContain("test");
      expect(result).toContain("study");
      expect(result).toContain("exam");
    });

    it("should handle mixed null/undefined/empty tags gracefully", () => {
      const lists = [
        { id: 1, tags: ["valid"] },
        { id: 2, tags: null },
        { id: 3 },
        { id: 4, tags: ["another"] },
      ];

      const result = vocabularyService.extractDistinctTags(lists);

      expect(result).toHaveLength(2);
      expect(result).toContain("valid");
      expect(result).toContain("another");
    });
  });
});
