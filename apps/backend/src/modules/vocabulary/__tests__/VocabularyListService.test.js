/**
 * VocabularyListService Unit Tests
 * Tests business logic for vocabulary list operations with mocked repository
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { VocabularyListService } from "../services/VocabularyListService.js";

describe("VocabularyListService", () => {
  let listService;
  let mockRepository;

  beforeEach(() => {
    mockRepository = {
      findAllLists: vi.fn(),
      findListById: vi.fn(),
      findWordsForList: vi.fn(),
      searchLists: vi.fn(),
      findAllCategories: vi.fn(),
    };

    listService = new VocabularyListService(mockRepository);
  });

  describe("getAllLists", () => {
    it("should return all vocabulary lists", async () => {
      const mockLists = [
        { id: "1", name: "HSK 1", difficulty: "beginner" },
        { id: "2", name: "HSK 2", difficulty: "intermediate" },
      ];
      mockRepository.findAllLists.mockResolvedValue(mockLists);

      const result = await listService.getAllLists();

      expect(result).toEqual(mockLists);
      expect(mockRepository.findAllLists).toHaveBeenCalledOnce();
    });

    it("should handle empty list from repository", async () => {
      mockRepository.findAllLists.mockResolvedValue([]);

      const result = await listService.getAllLists();

      expect(result).toEqual([]);
    });
  });

  describe("getListById", () => {
    it("should return a list by ID", async () => {
      const mockList = { id: "hsk-1", name: "HSK 1", difficulty: "beginner" };
      mockRepository.findListById.mockResolvedValue(mockList);

      const result = await listService.getListById("hsk-1");

      expect(result).toEqual(mockList);
      expect(mockRepository.findListById).toHaveBeenCalledWith("hsk-1");
    });

    it("should return null when list not found", async () => {
      mockRepository.findListById.mockResolvedValue(null);

      const result = await listService.getListById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("getWordsForList", () => {
    it("should return words for a list", async () => {
      const mockWords = [{ wordId: "1", chinese: "我", pinyin: "wǒ", english: "I" }];
      mockRepository.findWordsForList.mockResolvedValue(mockWords);

      const result = await listService.getWordsForList("hsk-1");

      expect(result).toEqual(mockWords);
    });
  });

  describe("searchLists", () => {
    it("should search lists with query and difficulty filter", async () => {
      mockRepository.searchLists.mockResolvedValue([]);

      await listService.searchLists("HSK", { difficulties: ["beginner"] });

      expect(mockRepository.searchLists).toHaveBeenCalledWith("HSK", {
        difficulties: ["beginner"],
      });
    });
  });

  describe("getAllCategories", () => {
    it("should return all categories", async () => {
      const mockCategories = [{ id: "1", name: "Food", displayOrder: 1 }];
      mockRepository.findAllCategories.mockResolvedValue(mockCategories);

      const result = await listService.getAllCategories();

      expect(result).toEqual(mockCategories);
    });
  });
});
