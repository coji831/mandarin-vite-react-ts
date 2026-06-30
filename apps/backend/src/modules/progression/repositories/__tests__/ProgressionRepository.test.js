/**
 * @file modules/progression/repositories/__tests__/ProgressionRepository.test.js
 * @description Unit tests for ProgressionRepository — radical progress data access
 * Story 19.3: RadicalProgress + SRS Review Integration
 *
 * Tests the Prisma data access layer with a mocked Prisma client.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Prisma before importing the repository
const mockPrisma = {
  radicalProgress: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
};

vi.mock("../../../../shared/infrastructure/database/client.js", () => ({
  prisma: mockPrisma,
}));

const { ProgressionRepository } = await import("../ProgressionRepository.js");

describe("ProgressionRepository", () => {
  let progressionRepository;

  beforeEach(() => {
    progressionRepository = new ProgressionRepository();
    vi.clearAllMocks();
  });

  describe("findRadicalProgressByUser", () => {
    it("should return all radical progress records for a user", async () => {
      const userId = "user123";
      const mockRecords = [
        {
          userId,
          radicalId: "rad_0001",
          memorized: true,
          recognitionLevel: 3,
          createdAt: new Date(),
        },
        {
          userId,
          radicalId: "rad_0002",
          memorized: false,
          recognitionLevel: 1,
          createdAt: new Date(),
        },
      ];
      mockPrisma.radicalProgress.findMany.mockResolvedValue(mockRecords);

      const result = await progressionRepository.findRadicalProgressByUser(userId);

      expect(result).toEqual(mockRecords);
      expect(mockPrisma.radicalProgress.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
    });

    it("should return empty array when user has no radical progress", async () => {
      mockPrisma.radicalProgress.findMany.mockResolvedValue([]);

      const result = await progressionRepository.findRadicalProgressByUser("user456");

      expect(result).toEqual([]);
    });
  });

  describe("findRadicalProgressByUserAndRadicalId", () => {
    it("should return a single record when found", async () => {
      const userId = "user123";
      const radicalId = "rad_0001";
      const mockRecord = { userId, radicalId, memorized: true, recognitionLevel: 3 };
      mockPrisma.radicalProgress.findUnique.mockResolvedValue(mockRecord);

      const result = await progressionRepository.findRadicalProgressByUserAndRadicalId(
        userId,
        radicalId,
      );

      expect(result).toEqual(mockRecord);
      expect(mockPrisma.radicalProgress.findUnique).toHaveBeenCalledWith({
        where: { userId_radicalId: { userId, radicalId } },
      });
    });

    it("should return null when not found", async () => {
      mockPrisma.radicalProgress.findUnique.mockResolvedValue(null);

      const result = await progressionRepository.findRadicalProgressByUserAndRadicalId(
        "user123",
        "rad_9999",
      );

      expect(result).toBeNull();
    });
  });

  describe("upsertRadicalProgress", () => {
    const userId = "user123";
    const radicalId = "rad_0001";
    const baseParams = { userId, radicalId, memorized: true, recognitionLevel: 3 };

    it("should create a new record when one does not exist", async () => {
      const mockCreated = { ...baseParams, reviewedAt: new Date() };
      mockPrisma.radicalProgress.upsert.mockResolvedValue(mockCreated);

      const result = await progressionRepository.upsertRadicalProgress(baseParams);

      expect(result).toEqual(mockCreated);
      expect(mockPrisma.radicalProgress.upsert).toHaveBeenCalledWith({
        where: { userId_radicalId: { userId, radicalId } },
        update: { memorized: true, recognitionLevel: 3, reviewedAt: expect.any(Date) },
        create: {
          userId,
          radicalId,
          memorized: true,
          recognitionLevel: 3,
          reviewedAt: expect.any(Date),
        },
      });
    });

    it("should update an existing record", async () => {
      const updateParams = { userId, radicalId, memorized: false, recognitionLevel: 1 };
      const mockUpdated = { ...updateParams, reviewedAt: new Date() };
      mockPrisma.radicalProgress.upsert.mockResolvedValue(mockUpdated);

      const result = await progressionRepository.upsertRadicalProgress(updateParams);

      expect(result).toEqual(mockUpdated);
      expect(mockPrisma.radicalProgress.upsert).toHaveBeenCalledWith({
        where: { userId_radicalId: { userId, radicalId } },
        update: { memorized: false, recognitionLevel: 1, reviewedAt: expect.any(Date) },
        create: {
          userId,
          radicalId,
          memorized: false,
          recognitionLevel: 1,
          reviewedAt: expect.any(Date),
        },
      });
    });

    it("should set reviewedAt to a current date on both create and update", async () => {
      const before = Date.now();
      mockPrisma.radicalProgress.upsert.mockResolvedValue({
        ...baseParams,
        reviewedAt: new Date(),
      });

      await progressionRepository.upsertRadicalProgress(baseParams);

      const call = mockPrisma.radicalProgress.upsert.mock.calls[0][0];
      expect(call.update.reviewedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(call.create.reviewedAt.getTime()).toBeGreaterThanOrEqual(before);
    });
  });
});
