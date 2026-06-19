/**
 * @file utils/toneUtils.ts
 * @description Tone utility functions: pinyin parsing for tone pair drills
 * Story 18.3: Tones Reference & Practice
 */

/**
 * Extract the first pinyin syllable from a spaced pinyin string.
 * Used to look up individual syllables in the pinyin audio map for TTS.
 *
 * Examples:
 *   "ní hǎo"   → "ní"
 *   "chī fàn"  → "chī"
 *   "mā"       → "mā"
 */
export function parseSpokenPinyinForAudio(spokenPinyin: string): string {
  return spokenPinyin.split(/\s+/)[0] ?? spokenPinyin;
}
