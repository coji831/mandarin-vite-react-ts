/**
 * @file apps/backend/src/modules/review/repositories/__tests__/ReviewRepository.test.ts
 * @description P0-1 regression tests (Story 24-1) — `findByUserAndTypes` and
 * `countDue` structurally reject `undefined` userId BEFORE any Prisma call, so
 * a guest / missing-auth caller can never read or count another user's SRS
 * rows through a Prisma ignore-`undefined` where-key.
 *
 * Story 24-1: P0-1 Security Stopgap.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../../shared/infrastructure/database/client.js", () => ({
  prisma: {
    reviewItem: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "../../../../shared/infrastructure/database/client.js";
import { ReviewRepository } from "../ReviewRepository.js";

describe("ReviewRepository — P0-1 cross-tenant leak stopgap (Story 24-1)", () => {
  let repository: ReviewRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new ReviewRepository();
  });

  describe("findByUserAndTypes", () => {
    it("returns [] and never touches Prisma when userId is undefined", async () => {
      const result = await repository.findByUserAndTypes(undefined, ["radical"]);

      expect(result).toEqual([]);
      expect(prisma.reviewItem.findMany).not.toHaveBeenCalled();
    });

    it("queries Prisma scoped to the given userId when defined", async () => {
      vi.mocked(prisma.reviewItem.findMany).mockResolvedValue([]);

      const result = await repository.findByUserAndTypes("user123", ["radical", "tone"]);

      expect(prisma.reviewItem.findMany).toHaveBeenCalledWith({
        where: { userId: "user123", itemType: { in: ["radical", "tone"] } },
        orderBy: { nextReview: "asc" },
      });
      expect(result).toEqual([]);
    });
  });

  describe("countDue", () => {
    it("returns 0 and never touches Prisma when userId is undefined", async () => {
      const result = await repository.countDue(undefined, "radical");

      expect(result).toBe(0);
      expect(prisma.reviewItem.count).not.toHaveBeenCalled();
    });

    it("counts only the given user's due rows when userId is defined", async () => {
      vi.mocked(prisma.reviewItem.count).mockResolvedValue(3);

      const result = await repository.countDue("user123", "radical");

      expect(prisma.reviewItem.count).toHaveBeenCalledWith({
        where: {
          userId: "user123",
          nextReview: { lte: expect.any(Date) },
          itemType: { startsWith: "radical" },
        },
      });
      expect(result).toBe(3);
    });
  });
});
