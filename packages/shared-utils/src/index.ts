/**
 * packages/shared-utils barrel
 * Exports shared utility functions used across the monorepo.
 */

export {
  isSandhiAcceptable,
  applyToneMark,
  stripToneMarks,
  findToneVowel,
} from "./sandhi/toneSandhiUtils.js";
export {
  normalizeTone,
  areTonesEquivalent,
  normalizePinyinForComparison,
  stripToneAndDigits,
  extractToneNumber,
  isHanziText,
  toneMarkToPlain,
} from "./pinyin/pinyinNormalization.js";
export { resolveHanzi } from "./pinyin/pinyinToHanzi.js";
export type { PinyinCharacterMap } from "./pinyin/pinyinToHanzi.js";
