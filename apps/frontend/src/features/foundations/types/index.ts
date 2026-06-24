/**
 * @file types/index.ts
 * @description Type definitions for the Foundations feature
 * Story 18.1: Foundations Page Structure
 * Story 18.2: Pinyin System Guide
 * Story 18.3: Tones Reference & Practice
 *
 * FoundationProgress and PhaseGate are defined in @mandarin/shared-types
 * for cross-package consumption (frontend + backend).
 */

export type { FoundationProgress, PhaseGate } from "@mandarin/shared-types";
export type {
  PinyinTonesPool,
  PinyinInitial,
  PinyinFinal,
  PinyinCombination,
  ToneDefinition,
  TonePairDrill,
  ToneRule,
  ToneRuleExample,
} from "./pool";

import type {
  PinyinInitial,
  PinyinFinal,
  PinyinCombination,
  ToneDefinition,
  TonePairDrill,
  ToneRule,
} from "./pool";

/**
 * PinyinData: The top-level shape of the pinyin.json data file
 */
export interface PinyinData {
  initials: PinyinInitial[];
  finals: PinyinFinal[];
  combinations: PinyinCombination[];
}

// ─── Tone Types (Story 18.3) ───

// ToneDefinition, TonePairDrill re-exported from pool.ts

// ─── Stroke Types (Story 18.4) ───

/**
 * BasicStroke: A single Chinese calligraphy stroke
 */
export interface BasicStroke {
  id: string;
  glyph: string;
  pinyin: string;
  meaning: string;
  order: number;
}

/**
 * StrokeOrderRule: One of the four basic stroke order rules
 */
export interface StrokeOrderRule {
  id: string;
  number: number;
  name: string;
  rule: string;
  example: string;
  description: string;
}

/**
 * StrokeData: The top-level shape of the strokes.json data file
 */
export interface StrokeData {
  strokes: BasicStroke[];
  strokeOrderRules: StrokeOrderRule[];
  suggestedCharacters: string[];
}

/**
 * ToneData: The top-level shape of the tones.json data file
 */
export interface ToneData {
  tones: ToneDefinition[];
  tonePairDrills: TonePairDrill[];
  toneRules: ToneRule[];
}
