/**
 * @file modules/word/__tests__/WordService.test.js
 * @description WordService Unit Tests
 * Tests business logic for word operations with mocked repository
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { WordService } from "../services/WordService.js";

describe("WordService", () => {
  let wordService;
  let mockRepository;

  beforeEach(() => {
    mockRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByList: vi.fn(),
      search: vi.fn(),
      findByIds: vi.fn(),
      findUnlearnedWords: vi.fn(),
    };

    wordService = new WordService(mockRepository);
  });

  describe("findAll", () => {
    it("should return all words from repository", async () => {
      const mockWords = [
        { id: "1", simplified: "你好", pinyin: "nǐ hǎo", english: "hello" },
        { id: "2", simplified: "谢谢", pinyin: "xiè xie", english: "thank you" },
      ];
      mockRepository.findAll.mockResolvedValue(mockWords);

      const result = await wordService.findAll();

      expect(result).toEqual(mockWords);
      expect(mockRepository.findAll).toHaveBeenCalledOnce();
    });

    it("should propagate repository errors", async () => {
      const error = new Error("Database connection failed");
      mockRepository.findAll.mockRejectedValue(error);

      await expect(wordService.findAll()).rejects.toThrow("Database connection failed");
    });
  });

  describe("findById", () => {
    it("should return a word by ID", async () => {
      const mockWord = { id: "1", simplified: "你好", pinyin: "nǐ hǎo", english: "hello" };
      mockRepository.findById.mockResolvedValue(mockWord);

      const result = await wordService.findById("1");

      expect(result).toEqual(mockWord);
      expect(mockRepository.findById).toHaveBeenCalledWith("1");
    });

    it("should return null for non-existent word", async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await wordService.findById("999");

      expect(result).toBeNull();
      expect(mockRepository.findById).toHaveBeenCalledWith("999");
    });
  });

  describe("findByList", () => {
    it("should return words for a given list", async () => {
      const mockWords = [
        { id: "1", simplified: "你好", sortOrder: 1 },
        { id: "2", simplified: "谢谢", sortOrder: 2 },
      ];
      mockRepository.findByList.mockResolvedValue(mockWords);

      const result = await wordService.findByList("list-1");

      expect(result).toEqual(mockWords);
      expect(mockRepository.findByList).toHaveBeenCalledWith("list-1");
    });

    it("should return empty array for non-existent list", async () => {
      mockRepository.findByList.mockResolvedValue([]);

      const result = await wordService.findByList("non-existent");

      expect(result).toEqual([]);
    });
  });

  describe("search", () => {
    it("should return matching words for a query", async () => {
      const mockResults = [{ id: "1", simplified: "你好", pinyin: "nǐ hǎo", english: "hello" }];
      mockRepository.search.mockResolvedValue(mockResults);

      const result = await wordService.search("你好", {});

      expect(result).toEqual(mockResults);
      expect(mockRepository.search).toHaveBeenCalledWith("你好", {});
    });

    it("should pass filters to repository", async () => {
      const filters = { categories: ["HSK1"], limit: 10 };
      mockRepository.search.mockResolvedValue([]);

      await wordService.search("test", filters);

      expect(mockRepository.search).toHaveBeenCalledWith("test", filters);
    });

    it("should default to empty filters", async () => {
      mockRepository.search.mockResolvedValue([]);

      await wordService.search("test");

      expect(mockRepository.search).toHaveBeenCalledWith("test", {});
    });
  });

  describe("findByIds", () => {
    it("should return words for given IDs", async () => {
      const mockWords = [
        { id: "1", simplified: "你好" },
        { id: "2", simplified: "谢谢" },
      ];
      mockRepository.findByIds.mockResolvedValue(mockWords);

      const result = await wordService.findByIds(["1", "2"]);

      expect(result).toEqual(mockWords);
      expect(mockRepository.findByIds).toHaveBeenCalledWith(["1", "2"]);
    });
  });

  describe("findUnlearnedWords", () => {
    it("should return unlearned words excluding learned IDs", async () => {
      const mockWords = [
        { id: "3", simplified: "学习" },
        { id: "4", simplified: "中文" },
      ];
      mockRepository.findUnlearnedWords.mockResolvedValue(mockWords);

      const result = await wordService.findUnlearnedWords(["1", "2"], 10);

      expect(result).toEqual(mockWords);
      expect(mockRepository.findUnlearnedWords).toHaveBeenCalledWith(["1", "2"], 10);
    });

    it("should use default limit of 10", async () => {
      mockRepository.findUnlearnedWords.mockResolvedValue([]);

      await wordService.findUnlearnedWords(["1"]);

      expect(mockRepository.findUnlearnedWords).toHaveBeenCalledWith(["1"], 10);
    });
  });
});
