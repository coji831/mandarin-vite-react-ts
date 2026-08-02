/**
 * @file services/__tests__/radicalsService.test.ts
 * @description Unit tests for radicalsService API mapping
 *
 * Guards against a regression class: the backend API serializes radical data
 * in camelCase (e.g. `alternateGlyphs`, `namePinyin`) while the frontend
 * `RadicalData` type consumes snake_case (`alternate_glyphs`, `name_pinyin`).
 * The service MUST map the payload; otherwise consumers crash on
 * `undefined.length` (alternate_glyphs) or render `undefined` pinyin/strokes.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

type AxiosResponse<T> = { data: T };

const mockGet = vi.fn();

vi.mock("shared/api", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

import { radicalsService } from "../radicalsService";
import type { RadicalApiItem } from "../../types";

// Real API contract — camelCase, exactly what the backend returns.
const API_RADICAL: RadicalApiItem = {
  id: "rad_0008",
  glyph: "氵",
  alternateGlyphs: ["⺡", "氺"],
  namePinyin: "sāndiǎnshuǐ",
  nameChinese: "",
  meaning: "water radical",
  strokeCount: 3,
  isRecommended: true,
  kangxiIndex: 8,
  etymology: "The water radical appears at the left of many characters.",
  frequencyRank: 3,
  notes: "Common radical.",
  isAlsoCharacter: false,
  variants: null,
  hskCharacters: [{ glyph: "水", pinyin: "shuǐ", meaning: "water" }],
};

// A minimal payload missing optional fields — must not crash consumers.
const API_RADICAL_MINIMAL: RadicalApiItem = {
  id: "rad_0001",
  glyph: "一",
  alternateGlyphs: [],
  namePinyin: "yī",
  nameChinese: "",
  meaning: "one",
  strokeCount: 1,
  isRecommended: true,
  kangxiIndex: 1,
  etymology: "",
  frequencyRank: null,
  notes: null,
  isAlsoCharacter: null,
  variants: null,
  hskCharacters: [],
};

describe("radicalsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    radicalsService.clearCache();
  });

  describe("loadAllRadicals", () => {
    it("maps the camelCase API payload into the snake_case RadicalData shape", async () => {
      mockGet.mockResolvedValue({
        data: [API_RADICAL, API_RADICAL_MINIMAL],
      } as AxiosResponse<RadicalApiItem[]>);

      const result = await radicalsService.loadAllRadicals();

      expect(mockGet).toHaveBeenCalledWith("/v1/radicals", {
        timeout: 5000,
        _skipRetry: true,
      });
      expect(result).toHaveLength(2);

      const full = result[0];
      expect(full.id).toBe("rad_0008");
      expect(full.glyph).toBe("氵");
      expect(full.alternate_glyphs).toEqual(["⺡", "氺"]);
      expect(full.name_pinyin).toBe("sāndiǎnshuǐ");
      expect(full.name_chinese).toBeUndefined();
      expect(full.meaning).toBe("water radical");
      expect(full.stroke_count).toBe(3);
      expect(full.is_recommended).toBe(true);
      expect(full.kangxi_index).toBe(8);
      expect(full.metadata.etymology).toContain("water radical");
      expect(full.metadata.frequency_rank).toBe(3);
      expect(full.metadata.notes).toBe("Common radical.");
      expect(full.metadata.is_also_character).toBe(false);
    });

    it("defaults missing optional fields so consumers never read undefined", async () => {
      mockGet.mockResolvedValue({
        data: [
          {
            ...API_RADICAL,
            alternateGlyphs: undefined,
            etymology: "",
            frequencyRank: null,
            notes: null,
            isAlsoCharacter: null,
          },
        ],
      } as unknown as AxiosResponse<RadicalApiItem[]>);

      const [result] = await radicalsService.loadAllRadicals();

      // Guard for the original crash: RadicalDetailCard reads alternate_glyphs.length
      expect(result.alternate_glyphs).toEqual([]);
      expect(result.alternate_glyphs.length).toBe(0);
      expect(result.metadata.etymology).toBeUndefined();
      expect(result.metadata.frequency_rank).toBeUndefined();
      expect(result.metadata.notes).toBeUndefined();
      expect(result.metadata.is_also_character).toBeUndefined();
    });

    it("returns an empty list for an empty payload", async () => {
      mockGet.mockResolvedValue({ data: [] } as AxiosResponse<RadicalApiItem[]>);

      const result = await radicalsService.loadAllRadicals();

      expect(result).toEqual([]);
    });

    it("propagates API errors", async () => {
      mockGet.mockRejectedValue(new Error("Network error"));

      await expect(radicalsService.loadAllRadicals()).rejects.toThrow("Network error");
    });
  });

  describe("loadRadicalById", () => {
    it("maps a single camelCase API item into snake_case RadicalData", async () => {
      mockGet.mockResolvedValue({ data: API_RADICAL } as AxiosResponse<RadicalApiItem>);

      const result = await radicalsService.loadRadicalById("rad_0008");

      expect(mockGet).toHaveBeenCalledWith("/v1/radicals/rad_0008", {
        timeout: 5000,
        _skipRetry: true,
      });
      expect(result.name_pinyin).toBe("sāndiǎnshuǐ");
      expect(result.alternate_glyphs).toEqual(["⺡", "氺"]);
      expect(result.stroke_count).toBe(3);
      expect(result.is_recommended).toBe(true);
    });
  });

  describe("getRadicalCharacters", () => {
    it("passes the characters payload through unchanged", async () => {
      const charactersPayload = {
        radicalId: "rad_0008",
        characters: [{ glyph: "水", pinyin: "shuǐ", meaning: "water" }],
      };
      mockGet.mockResolvedValue({ data: charactersPayload });

      const result = await radicalsService.getRadicalCharacters("rad_0008");

      expect(mockGet).toHaveBeenCalledWith("/v1/radicals/rad_0008/characters");
      expect(result).toEqual(charactersPayload);
    });
  });
});
