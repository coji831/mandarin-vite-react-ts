/**
 * @file types/index.ts
 * @description Shared types for the readers feature.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */

export type { PassageSummary } from "../components/ReaderLibrary";
export type { PassageDetail } from "../components/ReadingView";

// ---------------------------------------------------------------------------
// API response types — mirror the backend shape for type-safe transforms
// ---------------------------------------------------------------------------

/** Raw word object returned by the backend API. */
export interface WordApiResponse {
  glyph: string;
  wordId: string | null;
  hskLevel: number | null;
  pinyin: string | null;
  isKnown: boolean;
}

/** Raw enriched sentence returned by the backend API. */
export interface SentenceApiResponse {
  index: number;
  text: string;
  pinyin: string;
  words: WordApiResponse[];
}

/** Raw response body for GET /v1/readers/passages/:id (inner data shape). */
export interface PassageDetailApiResponse {
  id: string;
  title: string;
  hskLevel: number;
  sentences: SentenceApiResponse[];
}
