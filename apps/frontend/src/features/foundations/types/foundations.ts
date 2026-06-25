/**
 * @file foundations.ts
 * @description Type definitions for the Foundations feature data models
 */

import type {
  PinyinInitial,
  PinyinFinal,
  PinyinCombination,
  ToneDefinition,
  TonePairDrill,
  ToneRule,
} from "./pool";

/** PinyinData: The top-level shape of the pinyin.json data file */
export type PinyinData = {
  initials: PinyinInitial[];
  finals: PinyinFinal[];
  combinations: PinyinCombination[];
};

// ─── Stroke Types (Story 18.4) ───

/** BasicStroke: A single Chinese calligraphy stroke */
export type BasicStroke = {
  id: string;
  glyph: string;
  pinyin: string;
  meaning: string;
  order: number;
};

/** StrokeOrderRule: One of the four basic stroke order rules */
export type StrokeOrderRule = {
  id: string;
  number: number;
  name: string;
  rule: string;
  example: string;
  description: string;
};

/** StrokeData: The top-level shape of the strokes.json data file */
export type StrokeData = {
  strokes: BasicStroke[];
  strokeOrderRules: StrokeOrderRule[];
  suggestedCharacters: string[];
};

/** ToneData: The top-level shape of the tones.json data file */
export type ToneData = {
  tones: ToneDefinition[];
  tonePairDrills: TonePairDrill[];
  toneRules: ToneRule[];
};
