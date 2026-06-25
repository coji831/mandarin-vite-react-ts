/**
 * @file apps/frontend/src/features/foundations/types/pool.ts
 * @description Type definitions for the unified pinyin + tones pool data.
 * Matches the schema of pinyin-tones-pool.json consumed by the backend
 * and exposed to the frontend via API.
 */

export interface PinyinTonesPool {
  initials: PinyinInitial[];
  finals: PinyinFinal[];
  combinations: PinyinCombination[];
  toneInfo: ToneDefinition[];
  tonePairs: TonePairDrill[];
  toneRules: ToneRule[];
}

export interface PinyinInitial {
  id: string;
  pinyin: string;
  ipa: string;
  description: string;
}

export interface PinyinFinal {
  id: string;
  pinyin: string;
  ipa?: string;
  type: "simple" | "compound" | "nasal";
  description: string;
}

export interface PinyinCombination {
  initial: string;
  final: string;
  tones: (string | null)[];
}

export interface ToneDefinition {
  number: number;
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

export interface ToneRule {
  id: string;
  title: string;
  rule: string;
  examples: ToneRuleExample[];
}

export interface ToneRuleExample {
  chinese: string;
  dictionary: string;
  spoken: string;
}
