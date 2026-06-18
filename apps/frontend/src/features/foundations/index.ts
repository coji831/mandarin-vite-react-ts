/**
 * Foundations feature — character foundations learning path
 * Story 18.1: Foundations Page Structure
 * Story 18.2: Pinyin System Guide
 *
 * Provides the foundations page with Pinyin, Tones, Strokes, and Animations tabs.
 * Phase-gated as the first content area in Phase 1.
 */

export { FoundationsProgressBar } from "./components/FoundationsProgressBar";
export { InitialsGrid } from "./components/InitialsGrid";
export { FinalsGrid } from "./components/FinalsGrid";
export { CombinationDisplay } from "./components/CombinationDisplay";
export { ToneCell } from "./components/ToneCell";
export { PinyinCell } from "./components/PinyinCell";
export { useFoundationsProgress } from "./hooks/useFoundationsProgress";
export { foundationsService } from "./services/foundationsService";
export {
  TONE_COLORS,
  getCombination,
  extractToneNumber,
  stripToneMarks,
  getToneVowelIndex,
} from "./utils/pinyinUtils";
export type { FoundationProgress, PhaseGate } from "./types";
export type { PinyinInitial, PinyinFinal, PinyinCombination, PinyinData } from "./types";
