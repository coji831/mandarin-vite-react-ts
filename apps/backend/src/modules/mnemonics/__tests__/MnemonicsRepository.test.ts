/**
 * @file modules/mnemonics/__tests__/MnemonicsRepository.test.ts
 * @description Unit tests for MnemonicsRepository
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma before importing the repository
const mockPrisma = vi.hoisted(() => ({
  mnemonicStory: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  characterRadical: {
    findMany: vi.fn(),
  },
}));

vi.mock("../../../shared/infrastructure/database/client", () => ({
  prisma: mockPrisma,
}));

vi.mock("../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

import { MnemonicsRepository } from "../repositories/MnemonicsRepository.js";

describe("MnemonicsRepository", () => {
  let repository: MnemonicsRepository;

  const testGlyph = "好";
  const testUserId = "user-1";
  const testStory = "A woman holding a child represents goodness.";
  const testRadicalIds = ["ch_1001"];

  const mockPrismaRecord = {
    id: "mnemonic-1",
    characterGlyph: testGlyph,
    userId: testUserId,
    story: testStory,
    radicalIds: testRadicalIds,
    isEdited: false,
    isPictograph: false,
    createdAt: new Date("2026-07-01"),
    updatedAt: new Date("2026-07-01"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new MnemonicsRepository();
  });

  describe("upsert", () => {
    it("should create record when none exists", async () => {
      mockPrisma.mnemonicStory.findFirst.mockResolvedValue(null);
      mockPrisma.mnemonicStory.create.mockResolvedValue(mockPrismaRecord);

      const result = await repository.upsert(
        testGlyph,
        testUserId,
        testStory,
        testRadicalIds,
        false,
        false,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe("mnemonic-1");
      expect(result.characterGlyph).toBe(testGlyph);
      expect(result.story).toBe(testStory);
      expect(mockPrisma.mnemonicStory.findFirst).toHaveBeenCalledWith({
        where: { characterGlyph: testGlyph, userId: testUserId },
      });
      expect(mockPrisma.mnemonicStory.create).toHaveBeenCalledWith({
        data: {
          characterGlyph: testGlyph,
          userId: testUserId,
          story: testStory,
          radicalIds: testRadicalIds,
          isEdited: false,
          isPictograph: false,
        },
      });
      expect(mockPrisma.mnemonicStory.update).not.toHaveBeenCalled();
    });

    it("should update record when exists", async () => {
      const updatedStory = "Updated story content.";
      mockPrisma.mnemonicStory.findFirst.mockResolvedValue(mockPrismaRecord);
      mockPrisma.mnemonicStory.update.mockResolvedValue({
        ...mockPrismaRecord,
        story: updatedStory,
        isEdited: true,
      });

      const result = await repository.upsert(
        testGlyph,
        testUserId,
        updatedStory,
        testRadicalIds,
        false,
        true,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe("mnemonic-1");
      expect(mockPrisma.mnemonicStory.update).toHaveBeenCalledWith({
        where: { id: "mnemonic-1" },
        data: {
          story: updatedStory,
          radicalIds: testRadicalIds,
          isEdited: true,
          isPictograph: false,
        },
      });
      expect(mockPrisma.mnemonicStory.create).not.toHaveBeenCalled();
    });

    it("should handle null userId (shared AI stories)", async () => {
      mockPrisma.mnemonicStory.findFirst.mockResolvedValue(null);
      mockPrisma.mnemonicStory.create.mockResolvedValue({
        ...mockPrismaRecord,
        userId: null,
      });

      const result = await repository.upsert(
        testGlyph,
        null,
        testStory,
        testRadicalIds,
        false,
        false,
      );

      expect(result).toBeDefined();
      expect(mockPrisma.mnemonicStory.findFirst).toHaveBeenCalledWith({
        where: { characterGlyph: testGlyph, userId: null },
      });
    });
  });

  describe("findByCharacter", () => {
    it("should return record when exists", async () => {
      mockPrisma.mnemonicStory.findFirst.mockResolvedValue(mockPrismaRecord);

      const result = await repository.findByCharacterAndUser(testGlyph, testUserId, true);

      expect(result).toBeDefined();
      expect(result!.id).toBe("mnemonic-1");
      expect(result!.characterGlyph).toBe(testGlyph);
      expect(mockPrisma.mnemonicStory.findFirst).toHaveBeenCalledWith({
        where: { characterGlyph: testGlyph, userId: testUserId, isEdited: true },
      });
    });

    it("should return null when not found", async () => {
      mockPrisma.mnemonicStory.findFirst.mockResolvedValue(null);

      const result = await repository.findByCharacterAndUser(testGlyph, testUserId);

      expect(result).toBeNull();
    });
  });

  describe("findAnyByCharacter", () => {
    it("should return record when exists", async () => {
      mockPrisma.mnemonicStory.findFirst.mockResolvedValue(mockPrismaRecord);

      const result = await repository.findAnyByCharacter(testGlyph, false);

      expect(result).toBeDefined();
      expect(result!.id).toBe("mnemonic-1");
      expect(mockPrisma.mnemonicStory.findFirst).toHaveBeenCalledWith({
        where: { characterGlyph: testGlyph, isEdited: false },
      });
    });

    it("should return null when not found", async () => {
      mockPrisma.mnemonicStory.findFirst.mockResolvedValue(null);

      const result = await repository.findAnyByCharacter(testGlyph);

      expect(result).toBeNull();
    });
  });

  describe("deleteByCharacterAndUser", () => {
    it("should delete records matching character and user", async () => {
      mockPrisma.mnemonicStory.deleteMany.mockResolvedValue({ count: 1 });

      await repository.deleteByCharacterAndUser(testGlyph, testUserId);

      expect(mockPrisma.mnemonicStory.deleteMany).toHaveBeenCalledWith({
        where: { characterGlyph: testGlyph, userId: testUserId },
      });
    });
  });

  describe("getCharacterRadicals", () => {
    it("should fetch radical decomposition", async () => {
      const mockRadicals = [{ characterGlyph: testGlyph, radicalId: "ch_1001" }];
      mockPrisma.characterRadical.findMany.mockResolvedValue(mockRadicals);

      const result = await repository.getCharacterRadicals(testGlyph);

      expect(result).toEqual(mockRadicals);
      expect(mockPrisma.characterRadical.findMany).toHaveBeenCalledWith({
        where: { characterGlyph: testGlyph },
      });
    });
  });
});
