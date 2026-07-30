/**
 * @file apps/backend/tests/modules/readers/ReadersProgressService.test.ts
 * @description Unit tests for ReadersService session & bookmark methods
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReadersService } from "../../../src/modules/readers/services/ReadersService.js";
import type { ReadersRepository } from "../../../src/modules/readers/repositories/ReadersRepository.js";
import type { SegmenterService } from "../../../src/modules/readers/services/SegmenterService.js";
import type { PassageGenerationService } from "../../../src/modules/readers/services/PassageGenerationService.js";
import type { CacheService } from "../../../src/shared/infrastructure/cache/CacheService.js";
import type { ReadersAudioService } from "../../../src/modules/readers/services/ReadersAudioService.js";

// ── Fixtures ────────────────────────────────────────────────────────────────

const mockSession = { id: "sess_001", currentSentence: 3, completed: false };
const mockCompletedSession = { id: "sess_001", currentSentence: 10, completed: true };
const mockBookmark = { id: "bm_001", passageId: "passage_001" };

// ── Tests ───────────────────────────────────────────────────────────────────

describe("ReadersService — Reading Progress", () => {
  let mockRepository: ReadersRepository;
  let mockSegmenterService: SegmenterService;
  let mockPassageGenService: PassageGenerationService;
  let mockCacheService: CacheService;
  let mockAudioService: ReadersAudioService;
  let service: ReadersService;

  beforeEach(() => {
    mockRepository = {
      findSession: vi.fn(),
      createSession: vi.fn(),
      upsertSession: vi.fn(),
      completePassage: vi.fn(),
      createBookmark: vi.fn(),
      deleteBookmarkByPassage: vi.fn(),
      findBookmarkByPassage: vi.fn(),
      findAllBookmarks: vi.fn(),
    } as unknown as ReadersRepository;

    mockSegmenterService = {} as unknown as SegmenterService;
    mockPassageGenService = {} as unknown as PassageGenerationService;
    mockCacheService = {} as unknown as CacheService;
    mockAudioService = {} as unknown as ReadersAudioService;

    service = new ReadersService(
      mockRepository,
      mockPassageGenService,
      mockSegmenterService,
      mockCacheService,
      mockAudioService,
    );
  });

  describe("getOrCreateSession", () => {
    it("returns existing session when one exists", async () => {
      vi.mocked(mockRepository.findSession).mockResolvedValue(mockSession);

      const result = await service.getOrCreateSession("user_001", "passage_001");

      expect(mockRepository.findSession).toHaveBeenCalledWith("user_001", "passage_001");
      expect(mockRepository.createSession).not.toHaveBeenCalled();
      expect(result).toEqual({ currentSentence: 3, isCompleted: false });
    });

    it("creates new session when none exists", async () => {
      vi.mocked(mockRepository.findSession).mockResolvedValue(null);
      vi.mocked(mockRepository.createSession).mockResolvedValue(mockSession);

      const result = await service.getOrCreateSession("user_001", "passage_001");

      expect(mockRepository.findSession).toHaveBeenCalledWith("user_001", "passage_001");
      expect(mockRepository.createSession).toHaveBeenCalledWith("user_001", "passage_001");
      expect(result).toEqual({ currentSentence: 3, isCompleted: false });
    });

    it("propagates repository errors", async () => {
      vi.mocked(mockRepository.findSession).mockRejectedValue(new Error("DB error"));

      await expect(service.getOrCreateSession("user_001", "passage_001")).rejects.toThrow(
        "DB error",
      );
    });
  });

  describe("updatePosition", () => {
    it("updates position and returns session data", async () => {
      vi.mocked(mockRepository.upsertSession).mockResolvedValue(mockSession);

      const result = await service.updatePosition("user_001", "passage_001", 3);

      expect(mockRepository.upsertSession).toHaveBeenCalledWith("user_001", "passage_001", 3);
      expect(result).toEqual({ currentSentence: 3, isCompleted: false });
    });

    it("throws on negative currentSentence", async () => {
      await expect(service.updatePosition("user_001", "passage_001", -1)).rejects.toThrow(
        "currentSentence must be a non-negative integer",
      );
      expect(mockRepository.upsertSession).not.toHaveBeenCalled();
    });

    it("throws on non-integer currentSentence", async () => {
      await expect(service.updatePosition("user_001", "passage_001", 1.5)).rejects.toThrow(
        "currentSentence must be a non-negative integer",
      );
      expect(mockRepository.upsertSession).not.toHaveBeenCalled();
    });

    it("propagates repository errors", async () => {
      vi.mocked(mockRepository.upsertSession).mockRejectedValue(new Error("DB error"));

      await expect(service.updatePosition("user_001", "passage_001", 3)).rejects.toThrow(
        "DB error",
      );
    });
  });

  describe("markCompleted", () => {
    it("marks passage completed and returns passageId", async () => {
      vi.mocked(mockRepository.completePassage).mockResolvedValue();

      const result = await service.markCompleted("user_001", "passage_001");

      expect(mockRepository.completePassage).toHaveBeenCalledWith("user_001", "passage_001");
      expect(result).toEqual({ passageId: "passage_001" });
    });

    it("propagates repository errors", async () => {
      vi.mocked(mockRepository.completePassage).mockRejectedValue(new Error("DB error"));

      await expect(service.markCompleted("user_001", "passage_001")).rejects.toThrow("DB error");
    });
  });

  describe("addBookmark", () => {
    it("creates bookmark and returns passageId", async () => {
      vi.mocked(mockRepository.createBookmark).mockResolvedValue(mockBookmark);

      const result = await service.addBookmark("user_001", "passage_001");

      expect(mockRepository.createBookmark).toHaveBeenCalledWith("user_001", "passage_001");
      expect(result).toEqual({ passageId: "passage_001" });
    });

    it("propagates repository errors", async () => {
      vi.mocked(mockRepository.createBookmark).mockRejectedValue(new Error("DB error"));

      await expect(service.addBookmark("user_001", "passage_001")).rejects.toThrow("DB error");
    });
  });

  describe("removeBookmarkByPassage", () => {
    it("deletes bookmark by passage ID", async () => {
      vi.mocked(mockRepository.deleteBookmarkByPassage).mockResolvedValue();

      await service.removeBookmarkByPassage("user_001", "passage_001");

      expect(mockRepository.deleteBookmarkByPassage).toHaveBeenCalledWith(
        "user_001",
        "passage_001",
      );
    });

    it("is idempotent (no-op when no bookmark exists)", async () => {
      vi.mocked(mockRepository.deleteBookmarkByPassage).mockResolvedValue();

      await service.removeBookmarkByPassage("user_001", "nonexistent");

      expect(mockRepository.deleteBookmarkByPassage).toHaveBeenCalledWith(
        "user_001",
        "nonexistent",
      );
    });

    it("propagates repository errors", async () => {
      vi.mocked(mockRepository.deleteBookmarkByPassage).mockRejectedValue(new Error("DB error"));

      await expect(service.removeBookmarkByPassage("user_001", "passage_001")).rejects.toThrow(
        "DB error",
      );
    });
  });

  describe("checkBookmarkByPassage", () => {
    it("returns true when passage is bookmarked", async () => {
      vi.mocked(mockRepository.findBookmarkByPassage).mockResolvedValue(mockBookmark);

      const result = await service.checkBookmarkByPassage("user_001", "passage_001");

      expect(mockRepository.findBookmarkByPassage).toHaveBeenCalledWith("user_001", "passage_001");
      expect(result).toBe(true);
    });

    it("returns false when passage is not bookmarked", async () => {
      vi.mocked(mockRepository.findBookmarkByPassage).mockResolvedValue(null);

      const result = await service.checkBookmarkByPassage("user_001", "passage_001");

      expect(result).toBe(false);
    });
  });

  describe("listBookmarks", () => {
    it("returns array of passage IDs", async () => {
      vi.mocked(mockRepository.findAllBookmarks).mockResolvedValue([
        { passageId: "passage_001" },
        { passageId: "passage_002" },
      ]);

      const result = await service.listBookmarks("user_001");

      expect(mockRepository.findAllBookmarks).toHaveBeenCalledWith("user_001");
      expect(result).toEqual(["passage_001", "passage_002"]);
    });

    it("returns empty array when no bookmarks exist", async () => {
      vi.mocked(mockRepository.findAllBookmarks).mockResolvedValue([]);

      const result = await service.listBookmarks("user_001");

      expect(result).toEqual([]);
    });
  });
});
