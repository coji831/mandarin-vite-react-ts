/**
 * @file modules/radicals/services/__tests__/RadicalCharacterService.test.ts
 * @description Unit tests for RadicalCharacterService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { RadicalCharacterService } from "../RadicalCharacterService.js";
import { RadicalNotFoundError } from "../../types/radicals-errors.js";

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
  findInAggregateContent: vi.fn(),
}));

// Mock prisma
vi.mock("../../../../shared/infrastructure/database/client", () => ({
  prisma: {
    characterRadical: {
      findMany: vi.fn(),
    },
  },
}));

import { findInAggregateContent } from "../../../../shared/utils/contentUtils.js";
import { prisma } from "../../../../shared/infrastructure/database/client.js";

describe("RadicalCharacterService", () => {
  let service: RadicalCharacterService;

  const validRadicalId = "rad_0001";
  const invalidRadicalId = "rad_nonexistent";
  const validRadical = { id: validRadicalId, glyph: "一", meaning: "one" };

  const mockCharacterRadicals = [
    {
      characterGlyph: "一",
      radicalId: "rad_0001",
      decompositionType: "semantic",
      character: {
        glyph: "一",
        definition: "one",
        characterReadings: [{ pinyin: "yī", tone: 1, type: "primary" }],
        hskLevels: [{ hskLevel: 1 }],
      },
    },
    {
      characterGlyph: "三",
      radicalId: "rad_0001",
      decompositionType: null,
      character: {
        glyph: "三",
        definition: "three",
        characterReadings: [{ pinyin: "sān", tone: 1, type: "primary" }],
        hskLevels: [{ hskLevel: 1 }],
      },
    },
    {
      characterGlyph: "七",
      radicalId: "rad_0001",
      decompositionType: null,
      character: {
        glyph: "七",
        definition: "seven",
        characterReadings: [{ pinyin: "qī", tone: 1, type: "primary" }],
        hskLevels: [],
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RadicalCharacterService();
  });

  describe("getCharactersForRadical", () => {
    it("returns characters for a valid radical ID", async () => {
      vi.mocked(findInAggregateContent).mockResolvedValue(validRadical);
      vi.mocked(prisma.characterRadical.findMany).mockResolvedValue(mockCharacterRadicals as any);

      const result = await service.getCharactersForRadical(validRadicalId);

      expect(result.radicalId).toBe(validRadicalId);
      expect(result.characters).toHaveLength(3);
      expect(result.characters[0]).toEqual({
        glyph: "一",
        pinyin: "yī",
        meaning: "one",
        decompositionType: "semantic",
        hskLevel: 1,
      });
      expect(result.characters[1]).toEqual({
        glyph: "三",
        pinyin: "sān",
        meaning: "three",
        decompositionType: null,
        hskLevel: 1,
      });
      expect(result.characters[2]).toEqual({
        glyph: "七",
        pinyin: "qī",
        meaning: "seven",
        decompositionType: null,
        hskLevel: null,
      });

      expect(findInAggregateContent).toHaveBeenCalledWith(
        "radicals",
        "radicals.json",
        "id",
        validRadicalId,
      );
      expect(prisma.characterRadical.findMany).toHaveBeenCalledWith({
        where: { radicalId: validRadicalId },
        include: {
          character: {
            include: {
              characterReadings: {
                where: { type: "primary" },
                take: 1,
              },
              hskLevels: true,
            },
          },
        },
        orderBy: { character: { glyph: "asc" } },
      });
    });

    it("throws RadicalNotFoundError for an invalid radical ID", async () => {
      vi.mocked(findInAggregateContent).mockResolvedValue(null);

      await expect(service.getCharactersForRadical(invalidRadicalId)).rejects.toThrow(
        RadicalNotFoundError,
      );
      await expect(service.getCharactersForRadical(invalidRadicalId)).rejects.toThrow(
        `Radical '${invalidRadicalId}' not found`,
      );
      expect(prisma.characterRadical.findMany).not.toHaveBeenCalled();
    });

    it("returns empty characters array when no characters are associated", async () => {
      vi.mocked(findInAggregateContent).mockResolvedValue(validRadical);
      vi.mocked(prisma.characterRadical.findMany).mockResolvedValue([]);

      const result = await service.getCharactersForRadical(validRadicalId);

      expect(result.radicalId).toBe(validRadicalId);
      expect(result.characters).toEqual([]);
    });

    it("handles missing optional fields gracefully", async () => {
      vi.mocked(findInAggregateContent).mockResolvedValue(validRadical);
      vi.mocked(prisma.characterRadical.findMany).mockResolvedValue([
        {
          characterGlyph: "无",
          radicalId: "rad_0001",
          decompositionType: null,
          character: {
            glyph: "无",
            definition: null,
            characterReadings: [],
            hskLevels: [],
          },
        },
      ] as any);

      const result = await service.getCharactersForRadical(validRadicalId);

      expect(result.characters).toHaveLength(1);
      expect(result.characters[0]).toEqual({
        glyph: "无",
        pinyin: "",
        meaning: "",
        decompositionType: null,
        hskLevel: null,
      });
    });
  });
});
