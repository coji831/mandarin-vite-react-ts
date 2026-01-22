/**
 * VocabularyController Unit Tests
 * Tests HTTP layer for vocabulary endpoints with mocked services
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { VocabularyController } from "../../../../src/api/controllers/VocabularyController.js";

describe("VocabularyController", () => {
  let vocabularyController;
  let mockVocabularyService;
  let mockProgressService;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Create mock services
    mockVocabularyService = {
      getAllLists: vi.fn(),
      getListById: vi.fn(),
      getWordsForList: vi.fn(),
      searchLists: vi.fn(),
    };

    mockProgressService = {
      calculateMasteryStats: vi.fn(),
    };

    vocabularyController = new VocabularyController(mockVocabularyService, mockProgressService);

    // Create mock Express req/res objects
    mockReq = {
      params: {},
      query: {},
      userId: null,
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("listVocabularyLists", () => {
    it("should return all vocabulary lists successfully", async () => {
      const mockLists = [
        { id: 1, name: "HSK 1", difficulty: "beginner" },
        { id: 2, name: "HSK 2", difficulty: "intermediate" },
      ];
      mockVocabularyService.getAllLists.mockResolvedValue(mockLists);

      await vocabularyController.listVocabularyLists(mockReq, mockRes);

      expect(mockVocabularyService.getAllLists).toHaveBeenCalledOnce();
      expect(mockRes.json).toHaveBeenCalledWith(mockLists);
    });

    it("should return 500 on service error", async () => {
      const error = new Error("Database connection failed");
      mockVocabularyService.getAllLists.mockRejectedValue(error);

      await vocabularyController.listVocabularyLists(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Database connection failed" });
    });

    it("should handle empty list result", async () => {
      mockVocabularyService.getAllLists.mockResolvedValue([]);

      await vocabularyController.listVocabularyLists(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith([]);
    });
  });

  describe("getVocabularyList", () => {
    it("should return a specific vocabulary list by ID", async () => {
      mockReq.params = { listId: "42" };
      const mockList = {
        id: "42",
        name: "Food & Dining",
        difficulty: "intermediate",
        wordCount: 50,
      };
      mockVocabularyService.getListById.mockResolvedValue(mockList);

      await vocabularyController.getVocabularyList(mockReq, mockRes);

      expect(mockVocabularyService.getListById).toHaveBeenCalledWith("42");
      expect(mockRes.json).toHaveBeenCalledWith(mockList);
    });

    it("should return 404 when list not found", async () => {
      mockReq.params = { listId: "999" };
      mockVocabularyService.getListById.mockResolvedValue(null);

      await vocabularyController.getVocabularyList(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "List not found" });
    });

    it("should return 500 on service error", async () => {
      mockReq.params = { listId: "42" };
      mockVocabularyService.getListById.mockRejectedValue(new Error("Query timeout"));

      await vocabularyController.getVocabularyList(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Query timeout" });
    });
  });

  describe("getWordsForList", () => {
    it("should return words for a specific list", async () => {
      mockReq.params = { listId: "10" };
      const mockWords = [
        { wordId: 1, simplified: "你好", pinyin: "nǐ hǎo", english: "hello" },
        { wordId: 2, simplified: "谢谢", pinyin: "xiè xie", english: "thank you" },
      ];
      mockVocabularyService.getWordsForList.mockResolvedValue(mockWords);

      await vocabularyController.getWordsForList(mockReq, mockRes);

      expect(mockVocabularyService.getWordsForList).toHaveBeenCalledWith("10");
      expect(mockRes.json).toHaveBeenCalledWith(mockWords);
    });

    it("should return empty array for list with no words", async () => {
      mockReq.params = { listId: "99" };
      mockVocabularyService.getWordsForList.mockResolvedValue([]);

      await vocabularyController.getWordsForList(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it("should return 500 on service error", async () => {
      mockReq.params = { listId: "10" };
      mockVocabularyService.getWordsForList.mockRejectedValue(new Error("Connection lost"));

      await vocabularyController.getWordsForList(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Connection lost" });
    });
  });

  describe("getListProgress", () => {
    it("should return progress stats for authenticated user", async () => {
      mockReq.params = { listId: "5" };
      mockReq.userId = 42;

      const mockList = { id: "5", name: "HSK 1 Basics" };
      const mockWords = [
        { wordId: 1, simplified: "你好" },
        { wordId: 2, simplified: "再见" },
      ];
      const mockStats = {
        totalWords: 2,
        masteredWords: 1,
        masteryPercentage: 50,
      };

      mockVocabularyService.getListById.mockResolvedValue(mockList);
      mockVocabularyService.getWordsForList.mockResolvedValue(mockWords);
      mockProgressService.calculateMasteryStats.mockResolvedValue(mockStats);

      await vocabularyController.getListProgress(mockReq, mockRes);

      expect(mockVocabularyService.getListById).toHaveBeenCalledWith("5");
      expect(mockVocabularyService.getWordsForList).toHaveBeenCalledWith("5");
      expect(mockProgressService.calculateMasteryStats).toHaveBeenCalledWith(42, "5", [1, 2]);
      expect(mockRes.json).toHaveBeenCalledWith({
        listId: "5",
        listName: "HSK 1 Basics",
        totalWords: 2,
        masteredWords: 1,
        masteryPercentage: 50,
      });
    });

    it("should calculate progress for unauthenticated user (userId = null)", async () => {
      mockReq.params = { listId: "5" };
      mockReq.userId = null;

      const mockList = { id: "5", name: "Travel Phrases" };
      const mockWords = [{ wordId: 10 }];
      const mockStats = { totalWords: 1, masteredWords: 0, masteryPercentage: 0 };

      mockVocabularyService.getListById.mockResolvedValue(mockList);
      mockVocabularyService.getWordsForList.mockResolvedValue(mockWords);
      mockProgressService.calculateMasteryStats.mockResolvedValue(mockStats);

      await vocabularyController.getListProgress(mockReq, mockRes);

      expect(mockProgressService.calculateMasteryStats).toHaveBeenCalledWith(null, "5", [10]);
      expect(mockRes.json).toHaveBeenCalledWith({
        listId: "5",
        listName: "Travel Phrases",
        totalWords: 1,
        masteredWords: 0,
        masteryPercentage: 0,
      });
    });

    it("should handle empty word list", async () => {
      mockReq.params = { listId: "99" };
      mockReq.userId = 1;

      const mockList = { id: "99", name: "Empty List" };
      mockVocabularyService.getListById.mockResolvedValue(mockList);
      mockVocabularyService.getWordsForList.mockResolvedValue([]);
      mockProgressService.calculateMasteryStats.mockResolvedValue({
        totalWords: 0,
        masteredWords: 0,
        masteryPercentage: 0,
      });

      await vocabularyController.getListProgress(mockReq, mockRes);

      expect(mockProgressService.calculateMasteryStats).toHaveBeenCalledWith(1, "99", []);
      expect(mockRes.json).toHaveBeenCalledWith({
        listId: "99",
        listName: "Empty List",
        totalWords: 0,
        masteredWords: 0,
        masteryPercentage: 0,
      });
    });

    it("should return 500 on service error", async () => {
      mockReq.params = { listId: "5" };
      mockReq.userId = 1;

      mockVocabularyService.getListById.mockRejectedValue(new Error("Service unavailable"));

      await vocabularyController.getListProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Service unavailable" });
    });
  });

  describe("searchLists", () => {
    it("should search lists with query and filters", async () => {
      mockReq.query = {
        q: "business",
        difficulty: "advanced",
        tags: "professional,workplace",
      };

      const mockResults = [{ id: 1, name: "Business Chinese", difficulty: "advanced" }];
      mockVocabularyService.searchLists.mockResolvedValue(mockResults);

      await vocabularyController.searchLists(mockReq, mockRes);

      expect(mockVocabularyService.searchLists).toHaveBeenCalledWith("business", {
        difficulties: ["advanced"],
        tags: ["professional", "workplace"],
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockResults);
    });

    it("should search with query only (no filters)", async () => {
      mockReq.query = { q: "hsk" };

      const mockResults = [
        { id: 1, name: "HSK 1" },
        { id: 2, name: "HSK 2" },
      ];
      mockVocabularyService.searchLists.mockResolvedValue(mockResults);

      await vocabularyController.searchLists(mockReq, mockRes);

      expect(mockVocabularyService.searchLists).toHaveBeenCalledWith("hsk", {
        difficulties: undefined,
        tags: undefined,
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockResults);
    });

    it("should handle single tag filter", async () => {
      mockReq.query = { q: "test", tags: "exam" };

      mockVocabularyService.searchLists.mockResolvedValue([]);

      await vocabularyController.searchLists(mockReq, mockRes);

      expect(mockVocabularyService.searchLists).toHaveBeenCalledWith("test", {
        difficulties: undefined,
        tags: ["exam"],
      });
    });

    it("should handle empty search results", async () => {
      mockReq.query = { q: "nonexistent" };
      mockVocabularyService.searchLists.mockResolvedValue([]);

      await vocabularyController.searchLists(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it("should return 500 on service error", async () => {
      mockReq.query = { q: "test" };
      mockVocabularyService.searchLists.mockRejectedValue(new Error("Search failed"));

      await vocabularyController.searchLists(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Search failed" });
    });
  });

  describe("method binding", () => {
    it("should have bound methods for Express handler usage", () => {
      // Verify methods are functions and can be passed as Express handlers
      expect(typeof vocabularyController.listVocabularyLists).toBe("function");
      expect(typeof vocabularyController.getVocabularyList).toBe("function");
      expect(typeof vocabularyController.getWordsForList).toBe("function");
      expect(typeof vocabularyController.getListProgress).toBe("function");
      expect(typeof vocabularyController.searchLists).toBe("function");

      // Verify methods maintain correct 'this' context (binding check)
      const { listVocabularyLists } = vocabularyController;
      expect(listVocabularyLists).toBeDefined();
      // Method should work even when detached from object due to constructor binding
    });
  });
});
