/**
 * @file modules/progression/services/__tests__/ProgressionService.test.js
 * @description Unit tests for ProgressionService — radical progress methods
 * Story 19.3: RadicalProgress + SRS Review Integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Create the mock existsSync function using vi.hoisted so it's available during mock factory hoisting
const mockExistsSync = vi.hoisted(() => vi.fn());

// Mock fs.existsSync at module level — intercepts ESM import in ProgressionService
vi.mock("fs", () => {
  // Return only what's needed — existsSync
  // Note: mockExistsSync is available here because vi.hoisted runs before vi.mock
  const fsMock = {
    existsSync: mockExistsSync,
    readdirSync: vi.fn(() => []),
    readFileSync: vi.fn(() => "{}"),
  };
  fsMock.default = fsMock;
  return fsMock;
});

import { ProgressionService } from "../ProgressionService.js";

describe("ProgressionService", () => {
  let progressionService;
  let mockProgressionRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: radical content file exists
    mockExistsSync.mockReturnValue(true);

    // Mock ProgressionRepository
    mockProgressionRepository = {
      findRadicalProgressByUser: vi.fn(),
      findRadicalProgressByUserAndRadicalId: vi.fn(),
      upsertRadicalProgress: vi.fn(),
    };

    progressionService = new ProgressionService(mockProgressionRepository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getRadicalProgress", () => {
    it("should return all radical progress records for a user", async () => {
      const userId = "user123";
      const mockRecords = [
        { userId, radicalId: "rad_0001", memorized: true, recognitionLevel: 3 },
        { userId, radicalId: "rad_0002", memorized: false, recognitionLevel: 1 },
      ];
      mockProgressionRepository.findRadicalProgressByUser.mockResolvedValue(mockRecords);

      const result = await progressionService.getRadicalProgress(userId);

      expect(result).toEqual(mockRecords);
      expect(mockProgressionRepository.findRadicalProgressByUser).toHaveBeenCalledWith(userId);
      expect(mockProgressionRepository.findRadicalProgressByUser).toHaveBeenCalledOnce();
    });

    it("should return empty array when user has no radical progress", async () => {
      const userId = "user456";
      mockProgressionRepository.findRadicalProgressByUser.mockResolvedValue([]);

      const result = await progressionService.getRadicalProgress(userId);

      expect(result).toEqual([]);
      expect(mockProgressionRepository.findRadicalProgressByUser).toHaveBeenCalledWith(userId);
    });
  });

  describe("getRadicalProgressById", () => {
    it("should return a radical progress record when found", async () => {
      const userId = "user123";
      const radicalId = "rad_0001";
      const mockRecord = { userId, radicalId, memorized: true, recognitionLevel: 3 };
      mockProgressionRepository.findRadicalProgressByUserAndRadicalId.mockResolvedValue(mockRecord);

      const result = await progressionService.getRadicalProgressById(userId, radicalId);

      expect(result).toEqual(mockRecord);
      expect(mockProgressionRepository.findRadicalProgressByUserAndRadicalId).toHaveBeenCalledWith(
        userId,
        radicalId,
      );
    });

    it("should return null when radical progress not found", async () => {
      const userId = "user123";
      const radicalId = "rad_9999";
      mockProgressionRepository.findRadicalProgressByUserAndRadicalId.mockResolvedValue(null);

      const result = await progressionService.getRadicalProgressById(userId, radicalId);

      expect(result).toBeNull();
      expect(mockProgressionRepository.findRadicalProgressByUserAndRadicalId).toHaveBeenCalledWith(
        userId,
        radicalId,
      );
    });
  });

  describe("upsertRadicalProgress", () => {
    // Default mock is already set in outer beforeEach

    it("should upsert and return the radical progress record (happy path)", async () => {
      const userId = "user123";
      const radicalId = "rad_0001";
      const data = { memorized: true, recognitionLevel: 3 };
      const mockRecord = { userId, radicalId, memorized: true, recognitionLevel: 3 };
      mockProgressionRepository.upsertRadicalProgress.mockResolvedValue(mockRecord);

      const result = await progressionService.upsertRadicalProgress(userId, radicalId, data);

      expect(result).toEqual(mockRecord);
      expect(mockProgressionRepository.upsertRadicalProgress).toHaveBeenCalledWith({
        userId,
        radicalId,
        memorized: true,
        recognitionLevel: 3,
      });
    });

    it("should use default values when memorized and recognitionLevel are not provided", async () => {
      const userId = "user123";
      const radicalId = "rad_0001";
      const mockRecord = {
        userId,
        radicalId,
        memorized: false,
        recognitionLevel: 0,
      };
      mockProgressionRepository.upsertRadicalProgress.mockResolvedValue(mockRecord);

      const result = await progressionService.upsertRadicalProgress(userId, radicalId, {});

      expect(result).toEqual(mockRecord);
      expect(mockProgressionRepository.upsertRadicalProgress).toHaveBeenCalledWith({
        userId,
        radicalId,
        memorized: false,
        recognitionLevel: 0,
      });
    });

    it("should throw validation error when radicalId does not exist in content data", async () => {
      const userId = "user123";
      const radicalId = "rad_9999";
      mockExistsSync.mockReturnValue(false);

      await expect(
        progressionService.upsertRadicalProgress(userId, radicalId, { memorized: true }),
      ).rejects.toThrow(`Invalid radicalId: ${radicalId}`);

      expect(mockProgressionRepository.upsertRadicalProgress).not.toHaveBeenCalled();
    });
  });
});
