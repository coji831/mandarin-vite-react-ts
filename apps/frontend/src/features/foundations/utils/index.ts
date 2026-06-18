/**
 * @file utils/index.ts
 * @description Utility exports for the Foundations feature
 * Story 18.1: Foundations Page Structure
 * Story 18.2: Pinyin System Guide
 */

export {
  TONE_COLORS,
  getCombination,
  extractToneNumber,
  stripToneMarks,
  getToneVowelIndex,
} from "./pinyinUtils";
export { loadPinyinAudioMap, getPinyinAudioText } from "./pinyinAudioMap";
