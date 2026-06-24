/**
 * Foundations feature — character foundations learning path
 * Story 18.1: Foundations Page Structure
 * Story 18.2: Pinyin System Guide
 * Story 18.3: Tones Reference & Practice
 *
 * Provides the foundations page with Pinyin, Tones, Strokes, and Animations tabs.
 * Phase-gated as the first content area in Phase 1.
 */

// Components (pinyin, tones, strokes, animations — re-exported through component barrel)
export {
  InitialsGrid,
  FinalsGrid,
  CombinationDisplay,
  PinyinCell,
  ToneCell,
  ToneContourCard,
  TonePairDrills,
  ToneChangeRules,
  FoundationsProgressBar,
  BasicStrokesGrid,
  StrokeRulesList,
  AnimationCanvas,
  AnimationControls,
  StrokeBreakdown,
  StrokeRulesDisplay,
  StrokeReferenceContent,
  CharacterSearchBar,
  AnimationPanel,
  SuggestionPanel,
} from "./components";
export { useFoundationsProgress } from "./hooks/useFoundationsProgress";
export { isValidHanzi } from "./hooks/useCharacterSearch";
export { useHanziWriter } from "./hooks/useHanziWriter";
export { useStrokeReferenceData } from "./hooks/useStrokeReferenceData";
export { foundationsService } from "./services/foundationsService";
export {
  TONE_COLORS,
  getCombination,
  extractToneNumber,
  stripToneMarks,
  getToneVowelIndex,
} from "./utils/pinyinUtils";
export {
  loadStrokeData,
  getCachedStrokeData,
  clearStrokeDataCache,
} from "./utils/strokeDataLoader";
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
