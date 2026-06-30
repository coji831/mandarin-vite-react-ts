/**
 * @file types/index.ts
 * @description Type definitions for the Radicals feature
 * Story 19.1: Radicals Browser Structure
 */

export interface RadicalData {
  id: string;
  glyph: string;
  alternate_glyphs: string[];
  name_pinyin: string;
  name_chinese?: string;
  meaning: string;
  stroke_count: number;
  is_recommended: boolean;
  kangxi_index: number;
  metadata: {
    etymology?: string;
    frequency_rank?: number;
    hsk_characters?: Array<{ glyph: string; pinyin: string; meaning: string }>;
    notes?: string;
    [key: string]: unknown;
  };
}

export interface RadicalFilter {
  search: string;
  strokeCount: number | null;
  showTop20Only: boolean;
  sortBy: "stroke_count_asc" | "stroke_count_desc" | "kangxi_index" | "meaning";
}

export interface RadicalsIndex {
  version: number;
  total: number;
  radicals: RadicalData[];
}
