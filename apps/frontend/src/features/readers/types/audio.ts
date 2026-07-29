/**
 * @file types/audio.ts
 * @description Audio-related types for the readers feature (Story 21.5).
 */

/** Source indicator matching the backend response. */
export type AudioSource = "gcs" | "ondemand" | "failed";

/** Audio URL info for a single sentence. */
export type SentenceAudioInfo = {
  url: string;
  source: AudioSource;
};

/** Keyed by sentence index (0-based). */
export type SentenceAudioMap = Record<number, SentenceAudioInfo>;

/** Response shape for POST /v1/readers/passages/:id/audio. */
export type PassageAudioResponse = {
  audioUrls: SentenceAudioMap;
};
