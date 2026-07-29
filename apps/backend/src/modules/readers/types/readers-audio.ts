/**
 * @file apps/backend/src/modules/readers/types/readers-audio.ts
 * @description Types for the Readers audio endpoint (Story 21.5).
 */

/** Source indicator for an audio URL. */
export type AudioSource = "gcs" | "ondemand" | "failed";

/** Result for a single sentence. */
export interface SentenceAudioResult {
  /** Publicly accessible audio URL (empty string if failed). */
  url: string;
  /** How this URL was resolved. */
  source: AudioSource;
}

/** Response body for POST /v1/readers/passages/:id/audio. */
export interface PassageAudioResponse {
  /** Keyed by sentence index (0-based). */
  audioUrls: Record<number, SentenceAudioResult>;
}
