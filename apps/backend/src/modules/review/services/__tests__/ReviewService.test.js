/**
 * @file modules/review/services/__tests__/ReviewService.test.js
 * @description Unit tests for ReviewService — buildRadicalItem and radical path in getReviewItems
 * Story 19.3: RadicalProgress + SRS Review Integration
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock content utilities
vi.mock("../../../../shared/utils/contentUtils.js", () => ({
  readContentDir: vi.fn(),
  stripToneMarks: vi.fn((s) => s),
  shuffleArray: vi.fn((arr) => arr),
}));

// Mock Prisma
vi.mock("../../../../shared/infrastructure/database/client.js", () => ({
  prisma: {
    pinyinCombination: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { readContentDir } from "../../../../shared/utils/contentUtils.js";
import { ReviewService } from "../ReviewService.js";

describe("ReviewService - buildRadicalItem", () => {
  let reviewService;
  let mockReviewRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReviewRepository = {
      findByUserAndTypes: vi.fn(),
    };

    reviewService = new ReviewService(mockReviewRepository);

    // Default: no SRS items exist
    mockReviewRepository.findByUserAndTypes.mockResolvedValue([]);
  });

  /**
   * Helper: creates a mock radical content object
   */
  function createMockRadical(id, overrides = {}) {
    return {
      id,
      glyph: overrides.glyph || "木",
      name_pinyin: overrides.name_pinyin || "mù",
      meaning: overrides.meaning || "tree",
      ...overrides,
    };
  }

  describe("radical item from getReviewItems with type=radical", () => {
    it("should build correct shape for a radical item with source=all", async () => {
      const radical = createMockRadical("rad_0001");
      readContentDir.mockResolvedValue([radical]);

      const items = await reviewService.getReviewItems("user123", {
        source: "all",
        type: "radical",
        limit: 10,
      });

      expect(items).toHaveLength(1);
      const item = items[0];

      expect(item.itemType).toBe("radical");
      expect(item.itemId).toBe("rad_0001");
      expect(item.front).toBe("mù");
      expect(item.character).toBe("木");
      expect(item.back).toBe("木 (mù) — tree");
      expect(item.category).toBe("radicals");
      expect(item.meaning).toBe("tree");
      expect(item.pinyinPlain).toBe("mù");
      expect(item.studyCount).toBe(0);
      expect(item.correctCount).toBe(0);
      expect(item.intervalDays).toBe(1);
      expect(item.id).toBe("radical-rad_0001");
      expect(item.nextReview).toBeTruthy();
    });

    it("should return null when filtered by 'due' source and nextReview is in the future", async () => {
      const radical = createMockRadical("rad_0001");
      readContentDir.mockResolvedValue([radical]);

      // SRS item has nextReview in the future
      const futureDate = new Date(Date.now() + 86400000 * 7); // 7 days from now
      mockReviewRepository.findByUserAndTypes.mockResolvedValue([
        {
          id: "srs-1",
          itemType: "radical",
          itemId: "rad_0001",
          nextReview: futureDate,
          lastReviewed: new Date(),
          studyCount: 3,
          correctCount: 2,
          intervalDays: 7,
        },
      ]);

      const items = await reviewService.getReviewItems("user123", {
        source: "due",
        type: "radical",
        limit: 10,
      });

      // Should be filtered out because nextReview is in the future
      expect(items).toHaveLength(0);
    });

    it("should return item when filtered by 'due' source and nextReview is in the past", async () => {
      const radical = createMockRadical("rad_0001");
      readContentDir.mockResolvedValue([radical]);

      // SRS item has nextReview in the past (due for review)
      const pastDate = new Date(Date.now() - 86400000);
      mockReviewRepository.findByUserAndTypes.mockResolvedValue([
        {
          id: "srs-1",
          itemType: "radical",
          itemId: "rad_0001",
          nextReview: pastDate,
          lastReviewed: new Date(),
          studyCount: 3,
          correctCount: 2,
          intervalDays: 7,
        },
      ]);

      const items = await reviewService.getReviewItems("user123", {
        source: "due",
        type: "radical",
        limit: 10,
      });

      expect(items).toHaveLength(1);
      expect(items[0].itemId).toBe("rad_0001");
    });

    it("should return null when filtered by 'recent' source and lastReviewed is more than 7 days ago", async () => {
      const radical = createMockRadical("rad_0001");
      readContentDir.mockResolvedValue([radical]);

      // SRS item with lastReviewed more than 7 days ago
      const oldDate = new Date(Date.now() - 86400000 * 10); // 10 days ago
      mockReviewRepository.findByUserAndTypes.mockResolvedValue([
        {
          id: "srs-1",
          itemType: "radical",
          itemId: "rad_0001",
          nextReview: new Date(),
          lastReviewed: oldDate,
          studyCount: 3,
          correctCount: 2,
          intervalDays: 7,
        },
      ]);

      const items = await reviewService.getReviewItems("user123", {
        source: "recent",
        type: "radical",
        limit: 10,
      });

      expect(items).toHaveLength(0);
    });

    it("should return item when filtered by 'recent' source and lastReviewed is within 7 days", async () => {
      const radical = createMockRadical("rad_0001");
      readContentDir.mockResolvedValue([radical]);

      // SRS item with lastReviewed within the last 7 days
      const recentDate = new Date(Date.now() - 86400000 * 2); // 2 days ago
      mockReviewRepository.findByUserAndTypes.mockResolvedValue([
        {
          id: "srs-1",
          itemType: "radical",
          itemId: "rad_0001",
          nextReview: new Date(),
          lastReviewed: recentDate,
          studyCount: 3,
          correctCount: 2,
          intervalDays: 7,
        },
      ]);

      const items = await reviewService.getReviewItems("user123", {
        source: "recent",
        type: "radical",
        limit: 10,
      });

      expect(items).toHaveLength(1);
      expect(items[0].itemId).toBe("rad_0001");
    });

    it("should return item when source is 'all' regardless of SRS state", async () => {
      const radical = createMockRadical("rad_0001");
      readContentDir.mockResolvedValue([radical]);

      // SRS item with nextReview in the future AND lastReviewed long ago
      // Both conditions would normally filter it out, but source "all" skips filters
      const futureDate = new Date(Date.now() + 86400000 * 30);
      const oldDate = new Date(Date.now() - 86400000 * 30);
      mockReviewRepository.findByUserAndTypes.mockResolvedValue([
        {
          id: "srs-1",
          itemType: "radical",
          itemId: "rad_0001",
          nextReview: futureDate,
          lastReviewed: oldDate,
          studyCount: 5,
          correctCount: 4,
          intervalDays: 30,
        },
      ]);

      const items = await reviewService.getReviewItems("user123", {
        source: "all",
        type: "radical",
        limit: 10,
      });

      // Should still be included because source is "all"
      expect(items).toHaveLength(1);
      expect(items[0].itemId).toBe("rad_0001");
      expect(items[0].studyCount).toBe(5);
    });

    it("should return item when no SRS record exists (new item) with source=due", async () => {
      const radical = createMockRadical("rad_0001");
      readContentDir.mockResolvedValue([radical]);

      // No SRS items at all — brand new radical
      mockReviewRepository.findByUserAndTypes.mockResolvedValue([]);

      const items = await reviewService.getReviewItems("user123", {
        source: "due",
        type: "radical",
        limit: 10,
      });

      // New items are always due (nextReview defaults to now, which is <= now)
      expect(items).toHaveLength(1);
      expect(items[0].itemId).toBe("rad_0001");
      expect(items[0].studyCount).toBe(0);
    });

    it("should handle missing optional fields gracefully", async () => {
      const radical = createMockRadical("rad_0001", {
        name_pinyin: "",
        meaning: "",
      });
      readContentDir.mockResolvedValue([radical]);

      const items = await reviewService.getReviewItems("user123", {
        source: "all",
        type: "radical",
        limit: 10,
      });

      expect(items).toHaveLength(1);
      expect(items[0].pinyinPlain).toBe("");
      expect(items[0].meaning).toBeNull();
    });
  });

  describe("radical type filter in getReviewItems", () => {
    it("should include radicals when type is empty (all types)", async () => {
      readContentDir.mockResolvedValue([createMockRadical("rad_0001")]);

      const items = await reviewService.getReviewItems("user123", {
        source: "all",
        type: "",
        limit: 10,
      });

      // Should include radicals when no type filter is specified
      const radicalItems = items.filter((i) => i.itemType === "radical");
      expect(radicalItems.length).toBeGreaterThan(0);
    });

    it("should exclude radicals when type is 'tone'", async () => {
      readContentDir.mockResolvedValue([createMockRadical("rad_0001")]);

      const items = await reviewService.getReviewItems("user123", {
        source: "all",
        type: "tone",
        limit: 10,
      });

      const radicalItems = items.filter((i) => i.itemType === "radical");
      expect(radicalItems).toHaveLength(0);
    });
  });
});
