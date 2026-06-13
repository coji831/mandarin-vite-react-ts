/**
 * VocabularyController Unit Tests
 * Tests HTTP layer for vocabulary endpoints with mocked services
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { VocabularyController } from "../api/VocabularyController.js";

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
    mockRes = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };
  });

  describe("listVocabularyLists", () => {
    it("should return all lists", async () => {
      const mockLists = [{ id: "hsk-1", name: "HSK 1" }];
      mockVocabularyService.getAllLists.mockResolvedValue(mockLists);

      await vocabularyController.listVocabularyLists({}, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockLists);
    });

    it("should return 500 on error", async () => {
      mockVocabularyService.getAllLists.mockRejectedValue(new Error("DB error"));

      await vocabularyController.listVocabularyLists({}, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "DB error" });
    });
  });

  describe("getVocabularyList", () => {
    it("should return a list by ID", async () => {
      const mockList = { id: "hsk-1", name: "HSK 1" };
      mockVocabularyService.getListById.mockResolvedValue(mockList);
      mockReq = { params: { listId: "hsk-1" } };

      await vocabularyController.getVocabularyList(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockList);
    });

    it("should return 404 when list not found", async () => {
      mockVocabularyService.getListById.mockResolvedValue(null);
      mockReq = { params: { listId: "non-existent" } };

      await vocabularyController.getVocabularyList(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "List not found" });
    });
  });

  describe("getWordsForList", () => {
    it("should return words for a list", async () => {
      const mockWords = [{ wordId: "1", chinese: "我" }];
      mockVocabularyService.getWordsForList.mockResolvedValue(mockWords);
      mockReq = { params: { listId: "hsk-1" } };

      await vocabularyController.getWordsForList(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockWords);
    });
  });

  describe("searchLists", () => {
    it("should search with query params", async () => {
      const mockResults = [{ id: "hsk-1", name: "HSK 1" }];
      mockVocabularyService.searchLists.mockResolvedValue(mockResults);
      mockReq = { query: { q: "HSK", difficulty: "beginner", tags: "hsk,test" } };

      await vocabularyController.searchLists(mockReq, mockRes);

      expect(mockVocabularyService.searchLists).toHaveBeenCalledWith("HSK", {
        difficulties: ["beginner"],
        tags: ["hsk", "test"],
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockResults);
    });
  });
});
