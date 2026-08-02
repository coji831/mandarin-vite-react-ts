/**
 * @file types/index.ts
 * @description Shared types for the readers feature. Barrel only — re-exports, no definitions.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.5: Audio Sync types
 */

export type { PassageSummary } from "../components/ReaderLibrary";
export type { PassageDetail } from "../components/ReadingView";

// Audio types (Story 21.5)
export type {
  AudioSource,
  SentenceAudioInfo,
  SentenceAudioMap,
  PassageAudioResponse,
} from "./audio";

// API response types
export type { WordApiResponse, SentenceApiResponse, PassageDetailApiResponse } from "./api";
