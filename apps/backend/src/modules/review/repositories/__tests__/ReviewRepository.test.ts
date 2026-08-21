/**
 * @file apps/backend/src/modules/review/repositories/__tests__/ReviewRepository.test.ts
 * @description P0-1 regression tests (Story 24-1 + re-authored in Story 24-11)
 * — `findByUserAndTypes` and `countDue` structurally reject `undefined` userId
 * BEFORE any Prisma call, so a guest / missing-auth caller can never read or
 * count another user's SRS rows through a Prisma ignore-`undefined` where-key.
 *
 * Story 24-11 (Review Port + SRS Schema): the repository is RE-POINTED from
 * `ReviewItem` to the absorbed additive `SrsCardState` table, so these tests
 * now mock `prisma.srsCardState` — the P0-1 structural rejection is verified
 * against the live SRS table the review feature reads/writes. The Nest-land
 * defense-in-depth (calibrated `RequireAuthGuard` rejects guests at the HTTP
 * boundary before the controller) is covered by the review parity harness and
 * the Nest controller regression test.
 *
 * Story 24-1: P0-1 Security Stopgap.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../../shared/infrastructure/database/client.js", () => ({
  prisma: {
    srsCardState: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "../../../../shared/infrastructure/database/client.js";
import { ReviewRepository } from "../ReviewRepository.js";

describe("ReviewRepository — P0-1 cross-tenant leak stopgap (Story 24-1 + 24-11)", () => {
  let repository: ReviewRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new ReviewRepository();
  });

  describe("findByUserAndTypes", () => {
    it("returns [] and never touches Prisma when userId is undefined", async () => {
      const result = await repository.findByUserAndTypes(undefined, ["radical"]);

      expect(result).toEqual([]);
      expect(prisma.srsCardState.findMany).not.toHaveBeenCalled();
    });

    it("queries Prisma scoped to the given userId when defined", async () => {
      vi.mocked(prisma.srsCardState.findMany).mockResolvedValue([]);

      const result = await repository.findByUserAndTypes("user123", ["radical", "tone"]);

      expect(prisma.srsCardState.findMany).toHaveBeenCalledWith({
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
      expect(prisma.srsCardState.count).not.toHaveBeenCalled();
    });

    it("counts only the given user's due rows when userId is defined", async () => {
      vi.mocked(prisma.srsCardState.count).mockResolvedValue(3);

      const result = await repository.countDue("user123", "radical");

      expect(prisma.srsCardState.count).toHaveBeenCalledWith({
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
