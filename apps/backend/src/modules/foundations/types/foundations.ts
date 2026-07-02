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

/** PinyinCombination row shape. */
export interface PinyinComboRow {
  initialId: string;
  finalId: string;
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
