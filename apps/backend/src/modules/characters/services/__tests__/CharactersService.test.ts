/**
 * @file modules/characters/services/__tests__/CharactersService.test.ts
 * @description Unit tests for CharactersService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { CharactersService } from "../CharactersService.js";
import {
  CharacterNotFoundError,
  PhoneticComponentNotFoundError,
  CharacterValidationError,
} from "../../types/characters-errors.js";

// Mock the logger
vi.mock("../../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock contentUtils to avoid file system access
vi.mock("../../../../shared/utils/contentUtils", () => ({
  readAggregateContent: vi.fn(),
}));

import { readAggregateContent } from "../../../../shared/utils/contentUtils.js";

describe("CharactersService", () => {
  let service: CharactersService;
  let mockRepository: any;

  const testGlyph = "好";
  const nonexistentGlyph = "无无无";

  const mockFullCharacter = {
    id: "ch_1001",
    glyph: "好",
    traditional: null,
    strokeCount: 6,
    classification: "phono_semantic",
    phoneticComponentId: "ch_0500",
    hskLevel: 1,
    frequencyRank: 42,
    definition: "good",
    readings: [{ pinyin: "hǎo", tone: 3, type: "primary", meaning: "good" }],
    characterReadings: [
      {
        id: "r1",
        characterId: "ch_1001",
        pinyin: "hǎo",
        tone: 3,
        type: "primary",
        commonality: 90,
      },
      {
        id: "r2",
        characterId: "ch_1001",
        pinyin: "hào",
        tone: 4,
        type: "secondary",
        commonality: 10,
      },
    ],
    radicals: [{ characterGlyph: "好", radicalId: "rad_0038", decompositionType: "semantic" }],
    hskLevels: [{ hskLevel: 1 }],
    phoneticComponent: {
      glyph: "子",
      readings: [{ pinyin: "zǐ" }],
      definition: "child",
    },
  };

  const mockPhoneticComponent = {
    glyph: "子",
    readings: [{ pinyin: "zǐ" }],
    definition: "child",
  };

  const mockHomophoneReadings = [
    {
      id: "hr1",
      characterId: "ch_2001",
      pinyin: "hǎo",
      tone: 3,
      type: "primary" as string | null,
      character: { id: "ch_2001", glyph: "郝", definition: "surname Hao" },
    },
    {
      id: "hr2",
      characterId: "ch_2002",
      pinyin: "hào",
      tone: 4,
      type: "primary" as string | null,
      character: { id: "ch_2002", glyph: "號", definition: "number, mark" },
    },
    {
      id: "hr3",
      characterId: "ch_2003",
      pinyin: "hào",
      tone: 4,
      type: "primary" as string | null,
      character: { id: "ch_2003", glyph: "昊", definition: "vast, sky" },
    },
  ];

  const mockDecompositionComponents = [
    {
      id: "cc1",
      characterId: "ch_1001",
      componentId: "cmp_001",
      position: "left" as string | null,
      function: "semantic" as string | null,
      component: { glyph: "氵", meaning: "water" },
    },
    {
      id: "cc2",
      characterId: "ch_1001",
      componentId: "cmp_002",
      position: "right" as string | null,
      function: "phonetic" as string | null,
      component: { glyph: "可", meaning: "can/allow" },
    },
  ];

  const mockSearchResults = [
    {
      id: "ch_1001",
      glyph: "好",
      hskLevel: 1,
      frequencyRank: 42,
      characterReadings: [{ pinyin: "hǎo", tone: 3 }],
      hskLevels: [{ hskLevel: 1 }],
    },
    {
      id: "ch_2001",
      glyph: "号",
      hskLevel: 2,
      frequencyRank: 100,
      characterReadings: [{ pinyin: "hào", tone: 4 }],
      hskLevels: [{ hskLevel: 2 }],
    },
  ];

  const mockFrequencyData = {
    data: [
      {
        id: "ch_0001",
        glyph: "的",
        frequencyRank: 1,
        hskLevel: 1,
        characterReadings: [{ pinyin: "de", tone: 5 }],
      },
      {
        id: "ch_0002",
        glyph: "一",
        frequencyRank: 2,
        hskLevel: 1,
        characterReadings: [{ pinyin: "yī", tone: 1 }],
      },
    ],
    total: 2,
  };

  beforeEach(() => {
    mockRepository = {
      findByGlyph: vi.fn(),
      findPhoneticComponent: vi.fn(),
      findHomophones: vi.fn(),
      findDecomposition: vi.fn(),
      searchCharacters: vi.fn(),
      findFrequencyList: vi.fn(),
    };

    service = new CharactersService(mockRepository);

    // Mock readAggregateContent to return radicals
    (readAggregateContent as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "rad_0038", glyph: "女", meaning: "woman" },
    ]);
  });

  // ── getCharacter ─────────────────────────────────────────────────────

  describe("getCharacter", () => {
    it("should return full character detail when character is found", async () => {
      mockRepository.findByGlyph.mockResolvedValue(mockFullCharacter);

      const result = await service.getCharacter(testGlyph);

      expect(result).toEqual({
        glyph: "好",
        pinyin: ["hǎo", "hào"],
        meanings: ["good"],
        strokeCount: 6,
        radical: { id: "rad_0038", glyph: "女", meaning: "woman" },
        classification: "phono_semantic",
        phoneticComponent: { glyph: "子", pinyin: "zǐ", meaning: "child" },
        hskLevels: [1],
        frequencyRank: 42,
      });
      expect(mockRepository.findByGlyph).toHaveBeenCalledWith(testGlyph);
    });

    it("should return null radical when character has no radicals", async () => {
      const withoutRadicals = { ...mockFullCharacter, radicals: [] };
      mockRepository.findByGlyph.mockResolvedValue(withoutRadicals);

      const result = await service.getCharacter(testGlyph);

      expect(result.radical).toBeNull();
    });

    it("should return null phonetic component when character has none", async () => {
      const withoutPhonetic = {
        ...mockFullCharacter,
        phoneticComponentId: null,
        phoneticComponent: null,
      };
      mockRepository.findByGlyph.mockResolvedValue(withoutPhonetic);

      const result = await service.getCharacter(testGlyph);

      expect(result.phoneticComponent).toBeNull();
    });

    it("should throw CharacterNotFoundError when character is not found", async () => {
      mockRepository.findByGlyph.mockResolvedValue(null);

      await expect(service.getCharacter(nonexistentGlyph)).rejects.toThrow(CharacterNotFoundError);
    });
  });

  // ── getPhoneticComponent ──────────────────────────────────────────────

  describe("getPhoneticComponent", () => {
    it("should return phonetic component info when present", async () => {
      mockRepository.findPhoneticComponent.mockResolvedValue(mockPhoneticComponent);

      const result = await service.getPhoneticComponent(testGlyph);

      expect(result).toEqual({
        glyph: "子",
        pinyin: "zǐ",
        meaning: "child",
      });
    });

    it("should throw PhoneticComponentNotFoundError when no phonetic component", async () => {
      mockRepository.findPhoneticComponent.mockResolvedValue(null);
      mockRepository.findByGlyph.mockResolvedValue(mockFullCharacter);

      await expect(service.getPhoneticComponent(testGlyph)).rejects.toThrow(
        PhoneticComponentNotFoundError,
      );
    });

    it("should throw CharacterNotFoundError when character does not exist", async () => {
      mockRepository.findPhoneticComponent.mockResolvedValue(null);
      mockRepository.findByGlyph.mockResolvedValue(null);

      await expect(service.getPhoneticComponent(nonexistentGlyph)).rejects.toThrow(
        CharacterNotFoundError,
      );
    });
  });

  // ── getHomophones ─────────────────────────────────────────────────────

  describe("getHomophones", () => {
    it("should return grouped homophones for multi-pronunciation character", async () => {
      mockRepository.findHomophones.mockResolvedValue({
        sourceReadings: [
          { pinyin: "hǎo", tone: 3 },
          { pinyin: "hào", tone: 4 },
        ],
        homophoneReadings: mockHomophoneReadings,
      });

      const result = await service.getHomophones(testGlyph);

      expect(result).toEqual({
        glyph: "好",
        readings: [
          {
            pinyin: "hǎo",
            tone: 3,
            homophones: [{ glyph: "郝", pinyin: "hǎo", tone: 3, meaning: "surname Hao" }],
          },
          {
            pinyin: "hào",
            tone: 4,
            homophones: [
              { glyph: "號", pinyin: "hào", tone: 4, meaning: "number, mark" },
              { glyph: "昊", pinyin: "hào", tone: 4, meaning: "vast, sky" },
            ],
          },
        ],
      });
      expect(mockRepository.findHomophones).toHaveBeenCalledWith(testGlyph, false);
    });

    it("should pass exactTone parameter to repository", async () => {
      mockRepository.findHomophones.mockResolvedValue({
        sourceReadings: [{ pinyin: "hǎo", tone: 3 }],
        homophoneReadings: [],
      });
      mockRepository.findByGlyph.mockResolvedValue(mockFullCharacter);

      await service.getHomophones(testGlyph, true);

      expect(mockRepository.findHomophones).toHaveBeenCalledWith(testGlyph, true);
    });

    it("should throw CharacterNotFoundError when character does not exist", async () => {
      mockRepository.findHomophones.mockResolvedValue({
        sourceReadings: [],
        homophoneReadings: [],
      });
      mockRepository.findByGlyph.mockResolvedValue(null);

      await expect(service.getHomophones(nonexistentGlyph)).rejects.toThrow(CharacterNotFoundError);
    });

    it("should return empty readings when character has no homophones", async () => {
      mockRepository.findHomophones.mockResolvedValue({
        sourceReadings: [{ pinyin: "hǎo", tone: 3 }],
        homophoneReadings: [],
      });

      const result = await service.getHomophones(testGlyph);

      expect(result.readings[0].homophones).toEqual([]);
    });
  });

  // ── getDecomposition ──────────────────────────────────────────────────

  describe("getDecomposition", () => {
    it("should return ordered component list for a character", async () => {
      mockRepository.findDecomposition.mockResolvedValue(mockDecompositionComponents);

      const result = await service.getDecomposition("河");

      expect(result).toEqual({
        glyph: "河",
        components: [
          { glyph: "氵", type: "semantic", meaning: "water" },
          { glyph: "可", type: "phonetic", meaning: "can/allow" },
        ],
      });
    });

    it("should throw CharacterNotFoundError when character does not exist", async () => {
      mockRepository.findDecomposition.mockResolvedValue([]);
      mockRepository.findByGlyph.mockResolvedValue(null);

      await expect(service.getDecomposition(nonexistentGlyph)).rejects.toThrow(
        CharacterNotFoundError,
      );
    });

    it("should return empty components for undecomposed characters", async () => {
      mockRepository.findDecomposition.mockResolvedValue([]);
      mockRepository.findByGlyph.mockResolvedValue(mockFullCharacter);

      const result = await service.getDecomposition("一");

      expect(result.components).toEqual([]);
    });
  });

  // ── searchCharacters ──────────────────────────────────────────────────

  describe("searchCharacters", () => {
    it("should return filtered results when searching by q", async () => {
      mockRepository.searchCharacters.mockResolvedValue(mockSearchResults);

      const result = await service.searchCharacters({ q: "hao" });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        glyph: "好",
        pinyin: "hǎo",
        tone: 3,
        hskLevels: [1],
      });
    });

    it("should throw CharacterValidationError when all params empty", async () => {
      await expect(service.searchCharacters({})).rejects.toThrow(CharacterValidationError);
      await expect(service.searchCharacters({ q: "", tone: "", hskLevel: "" })).rejects.toThrow(
        CharacterValidationError,
      );
    });

    it("should return empty array when no matches found", async () => {
      mockRepository.searchCharacters.mockResolvedValue([]);

      const result = await service.searchCharacters({ q: "xyz" });

      expect(result).toEqual([]);
    });
  });

  // ── getFrequencyList ──────────────────────────────────────────────────

  describe("getFrequencyList", () => {
    it("should return paginated frequency list with defaults", async () => {
      mockRepository.findFrequencyList.mockResolvedValue(mockFrequencyData);

      const result = await service.getFrequencyList();

      expect(result).toEqual({
        data: [
          { glyph: "的", frequencyRank: 1, hskLevel: 1, pinyin: "de", tone: 5 },
          { glyph: "一", frequencyRank: 2, hskLevel: 1, pinyin: "yī", tone: 1 },
        ],
        page: 1,
        pageSize: 50,
        total: 2,
      });
      expect(mockRepository.findFrequencyList).toHaveBeenCalledWith(undefined, 1, 50);
    });

    it("should apply tier filter when provided", async () => {
      mockRepository.findFrequencyList.mockResolvedValue({ data: [], total: 0 });

      await service.getFrequencyList(2);

      expect(mockRepository.findFrequencyList).toHaveBeenCalledWith(2, 1, 50);
    });

    it("should apply pagination parameters", async () => {
      mockRepository.findFrequencyList.mockResolvedValue({ data: [], total: 0 });

      await service.getFrequencyList(undefined, 3, 20);

      expect(mockRepository.findFrequencyList).toHaveBeenCalledWith(undefined, 3, 20);
    });
  });
});
