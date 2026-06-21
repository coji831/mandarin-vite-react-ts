/**
 * Foundations feature — character foundations learning path
 * Story 18.1: Foundations Page Structure
 * Story 18.2: Pinyin System Guide
 * Story 18.3: Tones Reference & Practice
 *
 * Provides the foundations page with Pinyin, Tones, Strokes, and Animations tabs.
 * Phase-gated as the first content area in Phase 1.
 */

export { FoundationsProgressBar } from "./components/shared/FoundationsProgressBar";
export { InitialsGrid } from "./components/pinyin/InitialsGrid";
export { FinalsGrid } from "./components/pinyin/FinalsGrid";
export { CombinationDisplay } from "./components/pinyin/CombinationDisplay";
export { ToneCell } from "./components/pinyin/ToneCell";
export { PinyinCell } from "./components/pinyin/PinyinCell";
export { ToneContourCard } from "./components/tones/ToneContourCard";
export { TonePairDrills } from "./components/tones/TonePairDrills";
export { ToneChangeRules } from "./components/tones/ToneChangeRules";
export { useFoundationsProgress } from "./hooks/useFoundationsProgress";
export { foundationsService } from "./services/foundationsService";
export { getPinyinAudioText } from "./utils/pinyinAudioMap";
export {
  TONE_COLORS,
  getCombination,
  extractToneNumber,
  stripToneMarks,
  getToneVowelIndex,
} from "./utils/pinyinUtils";
export type { FoundationProgress, PhaseGate, PinyinTonesPool } from "./types";
export type {
  PinyinInitial,
  PinyinFinal,
  PinyinCombination,
  PinyinData,
  ToneDefinition,
  TonePairDrill,
  ToneRuleExample,
  ToneRule,
  ToneData,
} from "./types";
