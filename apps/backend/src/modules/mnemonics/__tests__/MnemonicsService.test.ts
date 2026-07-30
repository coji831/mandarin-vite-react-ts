/**
 * @file modules/mnemonics/__tests__/MnemonicsService.test.ts
 * @description Unit tests for MnemonicsService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MnemonicsService } from "../services/MnemonicsService.js";

// Mock the logger
vi.mock("../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    cacheHit: vi.fn(),
  })),
}));

describe("MnemonicsService", () => {
  let service: MnemonicsService;
  let mockRepository: any;
  let mockGeminiService: any;
  let mockCacheService: any;

  const testGlyph = "好";
  const testUserId = "user-1";
  const testStory = "A woman (女) holding a child (子) represents goodness.";
  const testRadicalIds = ["ch_1001"];

  const mockRecord = {
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

  const mockResponse = {
    id: "mnemonic-1",
    characterGlyph: testGlyph,
    story: testStory,
    radicalIds: testRadicalIds,
    isEdited: false,
    isPictograph: false,
    classification: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };

  beforeEach(() => {
    mockRepository = {
      findByCharacterAndUser: vi.fn(),
      findAnyByCharacter: vi.fn(),
      upsert: vi.fn(),
      deleteByCharacterAndUser: vi.fn(),
      getCharacterRadicals: vi.fn(),
      getCharacterByGlyph: vi.fn(),
      getPhoneticComponent: vi.fn(),
    };

    mockGeminiService = {
      generateText: vi.fn(),
    };

    mockCacheService = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
    };

    service = new MnemonicsService(mockRepository, mockGeminiService, mockCacheService);
  });

  describe("getMnemonic", () => {
    it("should return cached story when cache has it", async () => {
      mockCacheService.get.mockResolvedValue(JSON.stringify(mockResponse));

      // No userId → skip step 1 (user-edited), go straight to step 2 (cache)
      const result = await service.getMnemonic(testGlyph);

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.get).toHaveBeenCalledWith(`mnemonic:${testGlyph}`);
      expect(mockRepository.findByCharacterAndUser).not.toHaveBeenCalled();
    });

    it("should return DB story when cache miss but DB has it", async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findAnyByCharacter.mockResolvedValue(mockRecord);

      const result = await service.getMnemonic(testGlyph);

      expect(result).toEqual(mockResponse);
      expect(mockRepository.findAnyByCharacter).toHaveBeenCalledWith(testGlyph, false);
    });

    it("should return user-edited story when found (step 1)", async () => {
      mockRepository.findByCharacterAndUser.mockResolvedValue(mockRecord);

      const result = await service.getMnemonic(testGlyph, testUserId);

      expect(result).toEqual(mockResponse);
      expect(mockRepository.findByCharacterAndUser).toHaveBeenCalledWith(
        testGlyph,
        testUserId,
        true,
      );
      expect(mockCacheService.get).not.toHaveBeenCalled();
    });

    it("should throw MnemonicNotFoundError when nothing found", async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findAnyByCharacter.mockResolvedValue(null);
      mockRepository.getCharacterByGlyph.mockResolvedValue(null);

      await expect(service.getMnemonic(testGlyph)).rejects.toThrow(
        `No mnemonic story found for character: ${testGlyph}`,
      );
    });

    it("should return static pictograph note when character is pictograph and nothing else found", async () => {
      const pictographGlyph = "日";
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findAnyByCharacter.mockResolvedValue(null);
      mockRepository.getCharacterByGlyph.mockResolvedValue({
        classification: "pictograph",
        phoneticComponentId: null,
        etymology: "ancient depiction of the sun",
        definition: "sun",
        readings: [{ pinyin: "ri", tone: 4 }],
      });

      const result = await service.getMnemonic(pictographGlyph);

      expect(result.story).toContain("pictograph");
      expect(result.isPictograph).toBe(true);
      expect(result.id).toBe("");
    });

    it("should continue to DB when cache read fails", async () => {
      mockCacheService.get.mockRejectedValue(new Error("Cache error"));
      mockRepository.findAnyByCharacter.mockResolvedValue(mockRecord);

      const result = await service.getMnemonic(testGlyph);

      expect(result).toEqual(mockResponse);
      expect(mockRepository.findAnyByCharacter).toHaveBeenCalled();
    });
  });

  describe("generateMnemonic", () => {
    it("should call Gemini and persist when generation succeeds", async () => {
      mockRepository.getCharacterRadicals.mockResolvedValue([
        { characterGlyph: testGlyph, radicalId: "ch_1001" },
      ]);
      mockGeminiService.generateText.mockResolvedValue(testStory);
      mockRepository.upsert.mockResolvedValue(mockRecord);
      mockCacheService.set.mockResolvedValue(undefined);
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.delete.mockResolvedValue(undefined);

      const result = await service.generateMnemonic(testGlyph, testUserId);

      expect(result.characterGlyph).toBe(testGlyph);
      expect(result.story).toBe(testStory);
      expect(result.radicalIds).toEqual(testRadicalIds);
      expect(result.isEdited).toBe(false);
      expect(result.isPictograph).toBe(false);
      expect(result.id).toBe("");

      expect(mockGeminiService.generateText).toHaveBeenCalled();
      expect(mockRepository.upsert).toHaveBeenCalledTimes(2);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it("should return fallback when Gemini fails", async () => {
      mockRepository.getCharacterRadicals.mockResolvedValue([
        { characterGlyph: testGlyph, radicalId: "ch_1001" },
      ]);
      mockGeminiService.generateText.mockRejectedValue(new Error("API error"));
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.delete.mockResolvedValue(undefined);

      const result = await service.generateMnemonic(testGlyph, testUserId);

      expect(result.characterGlyph).toBe(testGlyph);
      expect(result.story).toContain("composed of radicals");
      expect(result.radicalIds).toEqual([]);
      expect(result.isEdited).toBe(false);
      expect(result.isPictograph).toBe(false);
    });

    it("should include id in response", async () => {
      mockRepository.getCharacterRadicals.mockResolvedValue([
        { characterGlyph: testGlyph, radicalId: "ch_1001" },
      ]);
      mockGeminiService.generateText.mockResolvedValue(testStory);
      mockRepository.upsert.mockResolvedValue(mockRecord);
      mockCacheService.set.mockResolvedValue(undefined);
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.delete.mockResolvedValue(undefined);

      const result = await service.generateMnemonic(testGlyph, testUserId);

      expect(result).toHaveProperty("id");
    });

    it("should release lock after generation", async () => {
      mockRepository.getCharacterRadicals.mockResolvedValue([
        { characterGlyph: testGlyph, radicalId: "ch_1001" },
      ]);
      mockGeminiService.generateText.mockResolvedValue(testStory);
      mockRepository.upsert.mockResolvedValue(mockRecord);
      mockCacheService.set.mockResolvedValue(undefined);
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.delete.mockResolvedValue(undefined);

      await service.generateMnemonic(testGlyph, testUserId);

      // Lock should be released via delete
      expect(mockCacheService.delete).toHaveBeenCalledWith(`mnemonic:lock:${testGlyph}`);
    });

    it("should return static pictograph note without calling Gemini", async () => {
      const pictographGlyph = "日";
      const pictographEtymology = "ancient depiction of the sun";
      mockRepository.getCharacterByGlyph.mockResolvedValue({
        classification: "pictograph",
        phoneticComponentId: null,
        etymology: pictographEtymology,
        definition: "sun",
        readings: [{ pinyin: "ri", tone: 4 }],
      });

      const result = await service.generateMnemonic(pictographGlyph, testUserId);

      expect(result.story).toContain("pictograph");
      expect(result.story).toContain(pictographEtymology);
      expect(result.isPictograph).toBe(true);
      expect(result.radicalIds).toEqual([]);
      // Should NOT call Gemini
      expect(mockGeminiService.generateText).not.toHaveBeenCalled();
      // Should NOT try to upsert or cache
      expect(mockRepository.upsert).not.toHaveBeenCalled();
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    it("should pass phono-semantic data into the AI prompt", async () => {
      const phonoGlyph = "沐";
      mockRepository.getCharacterByGlyph.mockResolvedValue({
        classification: "phono_semantic",
        phoneticComponentId: "ch_2001",
        etymology: "water + wood sound",
        definition: "to bathe",
        readings: [{ pinyin: "mu", tone: 4 }],
      });
      mockRepository.getPhoneticComponent.mockResolvedValue({
        glyph: "木",
        pinyin: "mu",
        meaning: "wood",
      });
      mockRepository.getCharacterRadicals.mockResolvedValue([
        { characterGlyph: phonoGlyph, radicalId: "ch_3001" },
      ]);
      mockGeminiService.generateText.mockResolvedValue("A mnemonic for 沐");
      mockRepository.upsert.mockResolvedValue(mockRecord);
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.delete.mockResolvedValue(undefined);

      await service.generateMnemonic(phonoGlyph, testUserId);

      // Verify the prompt sent to Gemini includes phonetic component info
      const promptArg = mockGeminiService.generateText.mock.calls[0][0] as string;
      expect(promptArg).toContain("phono-semantic");
      expect(promptArg).toContain("木 (mu, meaning: wood)");
      expect(promptArg).toContain("connect both the meaning clue and the sound clue");
    });

    it("should fall through to normal generation when classification is null", async () => {
      mockRepository.getCharacterByGlyph.mockResolvedValue({
        classification: null,
        phoneticComponentId: null,
        etymology: null,
        definition: "good",
        readings: [{ pinyin: "hao", tone: 3 }],
      });
      mockRepository.getCharacterRadicals.mockResolvedValue([
        { characterGlyph: testGlyph, radicalId: "ch_1001" },
      ]);
      mockGeminiService.generateText.mockResolvedValue(testStory);
      mockRepository.upsert.mockResolvedValue(mockRecord);
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.delete.mockResolvedValue(undefined);

      const result = await service.generateMnemonic(testGlyph, testUserId);

      // Should proceed with normal AI generation
      expect(mockGeminiService.generateText).toHaveBeenCalled();
      expect(result.story).toBe(testStory);
      expect(result.isPictograph).toBe(false);
    });
  });

  describe("updateMnemonic", () => {
    it("should update story and return response", async () => {
      const updatedStory = "An updated mnemonic story.";
      mockRepository.getCharacterRadicals.mockResolvedValue([
        { characterGlyph: testGlyph, radicalId: "ch_1001" },
      ]);
      const updatedRecord = { ...mockRecord, story: updatedStory, isEdited: true };
      mockRepository.upsert.mockResolvedValue(updatedRecord);

      const result = await service.updateMnemonic(testGlyph, testUserId, updatedStory);

      expect(result.characterGlyph).toBe(testGlyph);
      expect(result.story).toBe(updatedStory);
      expect(result.isEdited).toBe(true);
      expect(result.id).toBe("mnemonic-1");
      expect(mockRepository.upsert).toHaveBeenCalledWith(
        testGlyph,
        testUserId,
        updatedStory,
        testRadicalIds,
        false,
        true,
      );
    });
  });

  describe("resetMnemonic", () => {
    it("should delete the user's mnemonic story", async () => {
      mockRepository.deleteByCharacterAndUser.mockResolvedValue(undefined);

      await service.resetMnemonic(testGlyph, testUserId);

      expect(mockRepository.deleteByCharacterAndUser).toHaveBeenCalledWith(testGlyph, testUserId);
    });
  });

  describe("toResponse", () => {
    it("should include id in the output via updateMnemonic", async () => {
      mockRepository.getCharacterRadicals.mockResolvedValue([
        { characterGlyph: testGlyph, radicalId: "ch_1001" },
      ]);
      const updatedRecord = { ...mockRecord, isEdited: true };
      mockRepository.upsert.mockResolvedValue(updatedRecord);

      const result = await service.updateMnemonic(testGlyph, testUserId, testStory);

      expect(result).toHaveProperty("id");
      expect(result.id).toBe("mnemonic-1");
      expect(result.characterGlyph).toBe(testGlyph);
      expect(result.story).toBe(testStory);
      expect(result.createdAt).toBe("2026-07-01T00:00:00.000Z");
    });
  });
});
