/**
 * Foundations section constants
 * Shared between frontend and backend for Foundation Progress tracking.
 * Story 18.1: Foundations Page Structure.
 */

/** @type {readonly string[]} */
export const FOUNDATION_SECTIONS = Object.freeze(["pinyin", "tones", "strokes", "animations"]);

/** @type {Object<string, string>} */
export const FOUNDATION_SECTION_LABELS = Object.freeze({
  pinyin: "Pinyin",
  tones: "Tones",
  strokes: "Strokes",
  animations: "Animations",
});
