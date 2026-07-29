/**
 * @file types/api.ts
 * @description API response types for the readers feature — mirrors backend shape.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.5: Audio Sync types
 */

/** Raw word object returned by the backend API. */
export type WordApiResponse = {
  glyph: string;
  wordId: string | null;
  hskLevel: number | null;
  pinyin: string | null;
  isKnown: boolean;
};

/** Raw enriched sentence returned by the backend API. */
export type SentenceApiResponse = {
  index: number;
  text: string;
  pinyin: string;
  words: WordApiResponse[];
};

/** Raw response body for GET /v1/readers/passages/:id (inner data shape). */
export type PassageDetailApiResponse = {
  id: string;
  title: string;
  hskLevel: number;
  sentences: SentenceApiResponse[];
};
