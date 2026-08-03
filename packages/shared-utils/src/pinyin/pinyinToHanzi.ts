/**
 * @file packages/shared-utils/src/pinyin/pinyinToHanzi.ts
 * Canonical pinyin → Hanzi glyph resolution shared across the app.
 * Phase 0 foundation for universal pinyin/Hanzi handling (kills the
 * pinyin↔Chinese↔tone-format↔TTS-input bug family).
 */

import {
  extractToneNumber,
  normalizePinyinForComparison,
  stripToneAndDigits,
} from "./pinyinNormalization.js";
import { applyToneMark } from "../sandhi/toneSandhiUtils.js";

/** Map of syllablePretty ("bā" / "ba") → glyph. Source: backend PinyinCharacterMapping. */
export type PinyinCharacterMap = Record<string, string | null>;

/** CJK Unified Ideographs block — used to detect Hanzi glyphs. */
const CJK_IDEOGRAPH_RE = /[\u3400-\u9FFF]/;

/**
 * Resolve ANY pinyin format to a Hanzi glyph. Idempotent for already-Hanzi input.
 * Order: (1) already-Hanzi → return as-is; (2) exact map key; (3) tone-marked
 * key derived from digit-suffixed input; (4) normalized plain key (last resort).
 * Returns null when unresolvable.
 *
 * The tone-marked key (3) is preferred over the plain key (4) because the plain
 * key can point at a homophone with a different reading — e.g. `charMap["bai"]`
 * → 伯 "bó" while `charMap["bāi"]` → 掰 "bāi" — so "bai1" must resolve to 掰.
 *
 * @param input - Pinyin in any format ("ba", "bā", "ba1", "BA") or Hanzi
 * @param charMap - Pinyin → glyph map (e.g. backend PinyinCharacterMapping)
 * @returns The matched Hanzi glyph, `input` unchanged when already-Hanzi, or null
 */
export function resolveHanzi(input: string, charMap?: PinyinCharacterMap | null): string | null {
  if (!input || input.trim() === "") return null;
  if (!charMap) return null;

  // (1) Already-Hanzi → return as-is (idempotent).
  if (CJK_IDEOGRAPH_RE.test(input)) return input;

  // (2) Exact key lookup — handles plain "ba" and marked "bā" keys directly.
  const exact = charMap[input];
  if (exact) return exact;

  // (3) Tone-marked key lookup — for digit-suffixed input ("ba1") derive the
  // tone-marked form ("bā") and prefer it over the plain key. Neutral tones
  // (tone 0, incl. "ma5") have no mark, so they fall through to (4).
  const tone = extractToneNumber(input);
  if (tone > 0) {
    const marked = applyToneMark(stripToneAndDigits(input), tone);
    const markedMatch = charMap[marked];
    if (markedMatch) return markedMatch;
  }

  // (4) Normalized plain key lookup — last resort ("ba1" → "ba").
  const mapped = charMap[normalizePinyinForComparison(input)];
  if (mapped) return mapped;

  return null;
}
