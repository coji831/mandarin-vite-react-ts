/**
 * @file modules/characters/services/__tests__/PinyinSearchService.test.ts
 * @description Unit tests for PinyinSearchService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { PinyinSearchService } from "../PinyinSearchService.js";
import { PinyinValidationError } from "../../types/pinyin.js";

// Mock the logger
vi.mock("../../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe("PinyinSearchService", () => {
  let service: PinyinSearchService;
  let mockRepository: any;

  const mockResults = [
    { glyph: "好", pinyin: "hǎo", tone: 3, meaning: "good" },
    { glyph: "号", pinyin: "hào", tone: 4, meaning: "number, mark" },
  ];

  const mockResponse = {
    query: "hao",
    totalResults: 2,
    page: 1,
    pageSize: 50,
    results: mockResults,
  };

  beforeEach(() => {
    mockRepository = {
      searchByPinyin: vi.fn(),
    };

    service = new PinyinSearchService(mockRepository);
  });

  // ── search ───────────────────────────────────────────────────────────

  describe("search", () => {
    it("should return search results when valid q is provided", async () => {
      mockRepository.searchByPinyin.mockResolvedValue(mockResponse);

      const result = await service.search({ q: "hao", page: 1, pageSize: 50 });

      expect(result).toEqual(mockResponse);
      expect(mockRepository.searchByPinyin).toHaveBeenCalledWith({
        q: "hao",
        tone: undefined,
        page: 1,
        pageSize: 50,
      });
    });

    it("should throw PinyinValidationError when q is empty", async () => {
      await expect(service.search({ q: "", page: 1, pageSize: 50 })).rejects.toThrow(
        PinyinValidationError,
      );
      await expect(service.search({ q: "   ", page: 1, pageSize: 50 })).rejects.toThrow(
        PinyinValidationError,
      );
    });

    it("should throw PinyinValidationError when q is undefined", async () => {
      await expect(
        service.search({ q: undefined as unknown as string, page: 1, pageSize: 50 }),
      ).rejects.toThrow(PinyinValidationError);
    });

    it("should pass tone filter through to repository", async () => {
      mockRepository.searchByPinyin.mockResolvedValue({
        ...mockResponse,
        totalResults: 1,
        results: [mockResults[0]],
      });

      const result = await service.search({ q: "hao", tone: 3, page: 1, pageSize: 50 });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].tone).toBe(3);
      expect(mockRepository.searchByPinyin).toHaveBeenCalledWith({
        q: "hao",
        tone: 3,
        page: 1,
        pageSize: 50,
      });
    });

    it("should cap pageSize at 100", async () => {
      mockRepository.searchByPinyin.mockResolvedValue(mockResponse);

      await service.search({ q: "hao", page: 1, pageSize: 200 });

      expect(mockRepository.searchByPinyin).toHaveBeenCalledWith({
        q: "hao",
        tone: undefined,
        page: 1,
        pageSize: 100,
      });
    });

    it("should default page to 1 when not provided", async () => {
      mockRepository.searchByPinyin.mockResolvedValue(mockResponse);

      await service.search({ q: "hao", pageSize: 50 } as any);

      expect(mockRepository.searchByPinyin).toHaveBeenCalledWith({
        q: "hao",
        tone: undefined,
        page: 1,
        pageSize: 50,
      });
    });

    it("should return empty results when no characters match", async () => {
      mockRepository.searchByPinyin.mockResolvedValue({
        query: "xyz",
        totalResults: 0,
        page: 1,
        pageSize: 50,
        results: [],
      });

      const result = await service.search({ q: "xyz", page: 1, pageSize: 50 });

      expect(result.results).toHaveLength(0);
      expect(result.totalResults).toBe(0);
    });

    it("should trim whitespace from query", async () => {
      mockRepository.searchByPinyin.mockResolvedValue(mockResponse);

      await service.search({ q: "  hao  ", page: 1, pageSize: 50 });

      expect(mockRepository.searchByPinyin).toHaveBeenCalledWith({
        q: "hao",
        tone: undefined,
        page: 1,
        pageSize: 50,
      });
    });
  });
});
