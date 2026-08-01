/**
 * @file radicals.ts
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
    // hsk_characters REMOVED — now fetched from API
    notes?: string;
    is_also_character?: boolean;
    [key: string]: unknown;
  };
}

/**
 * Shape of a radical as returned by the backend API (camelCase contract).
 * The backend serializes camelCase (e.g. `alternateGlyphs`, `namePinyin`);
 * the frontend `RadicalData` type consumes snake_case. Map via
 * `mapRadicalToData` in `features/radicals/utils`.
 */
export interface RadicalApiItem {
  id: string;
  glyph: string;
  alternateGlyphs: string[];
  namePinyin: string;
  nameChinese: string;
  meaning: string;
  strokeCount: number;
  isRecommended: boolean;
  kangxiIndex: number;
  etymology: string;
  frequencyRank: number | null;
  notes: string | null;
  isAlsoCharacter: boolean | null;
  variants: Record<string, unknown> | null;
  hskCharacters: Array<{ glyph: string; pinyin: string; meaning: string }>;
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
