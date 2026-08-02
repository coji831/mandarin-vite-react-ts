/**
 * @file services/__tests__/readingProgressService.test.ts
 * @description Tests for readingProgressService API calls
 * Story 21.7: Reading Progress
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { readingProgressService } from "../readingProgressService";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.mock("shared/api", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

describe("readingProgressService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSession", () => {
    it("calls GET /v1/readers/sessions/:passageId", async () => {
      mockGet.mockResolvedValue({ data: { data: { currentSentence: 5, isCompleted: false } } });

      const result = await readingProgressService.getSession("abc");

      expect(result).toEqual({ currentSentence: 5, isCompleted: false });
      expect(mockGet).toHaveBeenCalledWith("/v1/readers/sessions/abc", { timeout: 10000 });
    });

    it("falls back to response.data when data wrapper missing", async () => {
      mockGet.mockResolvedValue({ data: { currentSentence: 3, isCompleted: true } });

      const result = await readingProgressService.getSession("abc");

      expect(result).toEqual({ currentSentence: 3, isCompleted: true });
    });
  });

  describe("updatePosition", () => {
    it("calls PUT /v1/readers/sessions/:passageId with currentSentence", async () => {
      mockPut.mockResolvedValue({});

      await readingProgressService.updatePosition("abc", 5);

      expect(mockPut).toHaveBeenCalledWith(
        "/v1/readers/sessions/abc",
        { currentSentence: 5 },
        { timeout: 10000 },
      );
    });
  });

  describe("completePassage", () => {
    it("calls POST /v1/readers/sessions/:passageId/complete", async () => {
      mockPost.mockResolvedValue({});

      await readingProgressService.completePassage("abc");

      expect(mockPost).toHaveBeenCalledWith(
        "/v1/readers/sessions/abc/complete",
        {},
        { timeout: 10000 },
      );
    });
  });

  describe("listBookmarks", () => {
    it("calls GET /v1/readers/bookmarks", async () => {
      mockGet.mockResolvedValue({ data: { data: { bookmarks: ["p1", "p2"] } } });

      const result = await readingProgressService.listBookmarks();

      expect(result).toEqual({ bookmarks: ["p1", "p2"] });
      expect(mockGet).toHaveBeenCalledWith("/v1/readers/bookmarks", { timeout: 10000 });
    });

    it("falls back to response.data when data wrapper missing", async () => {
      mockGet.mockResolvedValue({ data: { bookmarks: ["p1"] } });

      const result = await readingProgressService.listBookmarks();

      expect(result).toEqual({ bookmarks: ["p1"] });
    });
  });

  describe("addBookmark", () => {
    it("calls POST /v1/readers/bookmarks with passageId", async () => {
      mockPost.mockResolvedValue({});

      await readingProgressService.addBookmark("abc");

      expect(mockPost).toHaveBeenCalledWith(
        "/v1/readers/bookmarks",
        { passageId: "abc" },
        { timeout: 10000 },
      );
    });
  });

  describe("removeBookmarkByPassage", () => {
    it("calls DELETE /v1/readers/bookmarks/by-passage/:passageId", async () => {
      mockDelete.mockResolvedValue({});

      await readingProgressService.removeBookmarkByPassage("abc");

      expect(mockDelete).toHaveBeenCalledWith("/v1/readers/bookmarks/by-passage/abc", {
        timeout: 10000,
      });
    });
  });

  describe("checkBookmarkByPassage", () => {
    it("calls GET /v1/readers/bookmarks/by-passage/:passageId", async () => {
      mockGet.mockResolvedValue({ data: { data: { isBookmarked: true } } });

      const result = await readingProgressService.checkBookmarkByPassage("abc");

      expect(result).toEqual({ isBookmarked: true });
      expect(mockGet).toHaveBeenCalledWith("/v1/readers/bookmarks/by-passage/abc", {
        timeout: 10000,
      });
    });

    it("falls back to response.data when data wrapper missing", async () => {
      mockGet.mockResolvedValue({ data: { isBookmarked: false } });

      const result = await readingProgressService.checkBookmarkByPassage("abc");

      expect(result).toEqual({ isBookmarked: false });
    });
  });
});
