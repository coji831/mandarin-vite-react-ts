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

/**
 * PinyinInitial: A single pinyin initial (声母)
 */
export interface PinyinInitial {
  id: string;
  pinyin: string;
  ipa: string;
  description: string;
}

/**
 * PinyinFinal: A single pinyin final (韵母)
 */
export interface PinyinFinal {
  id: string;
  pinyin: string;
  type: "simple" | "compound" | "nasal";
  description: string;
}

/**
 * PinyinCombination: A valid initial+final combination with all tone forms
 */
export interface PinyinCombination {
  initial: string;
  final: string;
  tones: string[];
}

/**
 * PinyinData: The top-level shape of the pinyin.json data file
 */
export interface PinyinData {
  initials: PinyinInitial[];
  finals: PinyinFinal[];
  combinations: PinyinCombination[];
}

// ─── Tone Types (Story 18.3) ───

/**
 * ToneDefinition: A single Mandarin tone with contour and examples
 */
export interface ToneDefinition {
  number: number; // 0-4
  name: string;
  mark: string;
  pinyinExample: string;
  chineseExample: string;
  description: string;
  contour: number[];
  color: string;
}

/**
 * TonePairDrill: A 2-syllable tone pair drill with sandhi-aware pinyin
 */
export interface TonePairDrill {
  id: string;
  chinese: string;
  dictionaryPinyin: string;
  spokenPinyin: string;
  rule: string;
  pattern: string;
}

/**
 * ToneRuleExample: A single example within a tone change rule
 */
export interface ToneRuleExample {
  chinese: string;
  dictionary: string;
  spoken: string;
}

/**
 * ToneRule: A tone change rule with associated examples
 */
export interface ToneRule {
  id: string;
  title: string;
  rule: string;
  examples: ToneRuleExample[];
}

/**
 * ToneData: The top-level shape of the tones.json data file
 */
export interface ToneData {
  tones: ToneDefinition[];
  tonePairDrills: TonePairDrill[];
  toneRules: ToneRule[];
}
