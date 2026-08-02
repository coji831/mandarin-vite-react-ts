/**
 * @file apps/backend/src/shared/utils/contentUtils.ts
 * @description Shared utilities: content-item type, pinyin normalization, shuffle.
 *
 * All runtime content reads are DB-backed (all-in-DB) — the legacy
 * readContentDir / readContentFile / readContentFiles / readAggregateContent /
 * readAggregateContentWhere / findInAggregateContent functions and the
 * CONTENT_DIR constant were removed (see docs/guides/data/seed-pipeline.md).
 * GCS is used for binary TTS audio only (see GCSClient).
 */

/**
 * ContentFile — shape of parsed JSON content files from the content/ directory.
 * Common fields across all content types (radicals, pinyin, tones, characters, etc.).
 * Kept for legacy type compatibility (e.g. review module's ContentItem).
 */
export interface ContentFile {
  id?: string;
  number?: number;
  name?: string;
  mark?: string;
  glyph?: string;
  meaning?: string;
  syllable?: string;
  tone?: number;
  character?: string | null;
  pinyin?: string;
  ipa?: string;
  description?: string;
  category?: string;
  pitch_description?: string;
  example_syllable?: string;
  example_character?: string;
  contour?: string;
  color?: string;
  name_pinyin?: string;
  simplified?: string;
  metadata?: Record<string, unknown>;
  readings?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

/**
 * Strip tone marks from a pinyin syllable, returning plain ASCII.
 * @param syllable - Pinyin with tone marks (e.g., "mā")
 * @returns Plain pinyin (e.g., "ma")
 */
export function stripToneMarks(syllable: string): string {
  return syllable
    .replace(/[āáǎà]/g, "a")
    .replace(/[ōóǒò]/g, "o")
    .replace(/[ēéěè]/g, "e")
    .replace(/[īíǐì]/g, "i")
    .replace(/[ūúǔù]/g, "u")
    .replace(/[ǖǘǚǜ]/g, "ü");
}

/**
 * Fisher-Yates shuffle (returns a new array).
 * @param array
 * @returns Shuffled copy
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
