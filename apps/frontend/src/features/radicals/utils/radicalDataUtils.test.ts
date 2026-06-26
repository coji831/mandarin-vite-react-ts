/**
 * @file utils/radicalDataUtils.test.ts
 * @description Unit tests for radical filter and sort utilities
 * Story 19.1: Radicals Browser Structure
 */

import { describe, it, expect } from "vitest";
import {
  filterBySearch,
  filterByStrokeCount,
  filterTop20,
  sortRadicals,
  applyFilterPipeline,
} from "./radicalDataUtils";
import type { RadicalData } from "../types";

const mockRadicals: RadicalData[] = [
  {
    id: "rad_0001",
    glyph: "一",
    alternate_glyphs: [],
    name_pinyin: "yī",
    meaning: "one",
    stroke_count: 1,
    is_recommended: true,
    kangxi_index: 1,
    metadata: {},
  },
  {
    id: "rad_0030",
    glyph: "口",
    alternate_glyphs: [],
    name_pinyin: "kǒu",
    meaning: "mouth",
    stroke_count: 3,
    is_recommended: true,
    kangxi_index: 30,
    metadata: {},
  },
  {
    id: "rad_0038",
    glyph: "女",
    alternate_glyphs: [],
    name_pinyin: "nǚ",
    meaning: "woman",
    stroke_count: 3,
    is_recommended: false,
    kangxi_index: 38,
    metadata: {},
  },
  {
    id: "rad_0086",
    glyph: "火",
    alternate_glyphs: [],
    name_pinyin: "huǒ",
    meaning: "fire",
    stroke_count: 4,
    is_recommended: true,
    kangxi_index: 86,
    metadata: {},
  },
];

describe("filterBySearch", () => {
  it("returns all radicals for empty search", () => {
    expect(filterBySearch(mockRadicals, "")).toHaveLength(4);
    expect(filterBySearch(mockRadicals, "  ")).toHaveLength(4);
  });

  it("filters by pinyin substring", () => {
    const result = filterBySearch(mockRadicals, "huǒ");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("rad_0086");
  });

  it("filters by meaning substring (case-insensitive)", () => {
    const result = filterBySearch(mockRadicals, "MOUTH");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("rad_0030");
  });

  it("filters by glyph", () => {
    const result = filterBySearch(mockRadicals, "女");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("rad_0038");
  });

  it("returns empty array when no match", () => {
    expect(filterBySearch(mockRadicals, "zzzzz")).toHaveLength(0);
  });
});

describe("filterByStrokeCount", () => {
  it("returns all radicals when strokeCount is null", () => {
    expect(filterByStrokeCount(mockRadicals, null)).toHaveLength(4);
  });

  it("filters by exact stroke count", () => {
    const result = filterByStrokeCount(mockRadicals, 3);
    expect(result).toHaveLength(2);
  });

  it("handles 17+ (returns radicals with 17+ strokes)", () => {
    const result = filterByStrokeCount(mockRadicals, 17);
    expect(result).toHaveLength(0);
  });
});

describe("filterTop20", () => {
  it("returns all radicals when showOnlyTop20 is false", () => {
    expect(filterTop20(mockRadicals, false)).toHaveLength(4);
  });

  it("returns only recommended radicals when true", () => {
    const result = filterTop20(mockRadicals, true);
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.is_recommended)).toBe(true);
    expect(result.find((r) => r.id === "rad_0038")).toBeUndefined();
  });
});

describe("sortRadicals", () => {
  it("sorts by kangxi_index by default", () => {
    const result = sortRadicals(mockRadicals, "kangxi_index");
    expect(result[0].kangxi_index).toBe(1);
    expect(result[3].kangxi_index).toBe(86);
  });

  it("sorts by stroke_count ascending", () => {
    const result = sortRadicals(mockRadicals, "stroke_count_asc");
    expect(result[0].stroke_count).toBe(1);
    expect(result[3].stroke_count).toBe(4);
  });

  it("sorts by stroke_count descending", () => {
    const result = sortRadicals(mockRadicals, "stroke_count_desc");
    expect(result[0].stroke_count).toBe(4);
    expect(result[3].stroke_count).toBe(1);
  });

  it("sorts by meaning alphabetically", () => {
    const result = sortRadicals(mockRadicals, "meaning");
    expect(result[0].meaning).toBe("fire");
    expect(result[3].meaning).toBe("woman");
  });
});

describe("applyFilterPipeline", () => {
  it("applies search + stroke count + top20 + sort in order", () => {
    const result = applyFilterPipeline(mockRadicals, {
      search: "",
      strokeCount: 3,
      showTop20Only: true,
      sortBy: "meaning",
    });
    // 2 radicals have stroke_count=3, only 1 is recommended (口)
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("rad_0030");
  });

  it("returns all with default filter", () => {
    const result = applyFilterPipeline(mockRadicals, {
      search: "",
      strokeCount: null,
      showTop20Only: false,
      sortBy: "kangxi_index",
    });
    expect(result).toHaveLength(4);
  });
});
