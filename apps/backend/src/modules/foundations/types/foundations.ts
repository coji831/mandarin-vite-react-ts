/**
 * @file apps/backend/src/modules/foundations/types/foundations.ts
 * @description Type definitions for the Foundations module
 */

/** A combo pair with a 5-slot tone array. */
export interface ComboPair {
  initial: string;
  final: string;
  tones: (string | null)[];
}

/** PinyinSyllable row shape (replaces deprecated PinyinCombination). */
export interface PinyinComboRow {
  initial: string | null;
  final: string | null;
  tone: number;
  syllable: string;
}

/** PinyinTonesPool — the full response shape. */
export interface PinyinTonesPool {
  initials: Array<{ id: string; pinyin: string; ipa: string | null; description: string }>;
  finals: Array<{ id: string; pinyin: string; type: string; description: string }>;
  combinations: ComboPair[];
  toneInfo: Array<{
    number: number;
    name: string;
    mark: string;
    pinyinExample: string;
    chineseExample: string;
    description: string;
    contour: string | null;
    color: string;
  }>;
  tonePairs: unknown[];
  toneRules: unknown[];
}

/** Strokes reference shape. */
export interface StrokesReference {
  strokes: unknown[];
  strokeOrderRules: unknown[];
  suggestedCharacters: unknown[];
  [key: string]: unknown;
}

/** Character reading (from content JSON). */
export interface CharacterReading {
  pinyin: string;
  tone: number;
  type: string;
  core_meaning: string;
}

/** Character detail response shape. */
export interface CharacterDetailResponse {
  glyph: string;
  traditional: string;
  strokeCount: number;
  hskLevel: number;
  readings: CharacterReading[];
  etymology?: string;
  frequencyRank?: number;
  commonWords?: string[];
  radicalIds?: string[];
  /** Core meaning from primary reading's gloss */
  definition?: string;
}
