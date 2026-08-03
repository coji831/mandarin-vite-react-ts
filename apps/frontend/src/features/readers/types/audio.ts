/**
 * @file types/audio.ts
 * @description Audio-related types for the readers feature (Story 21.5).
 *
 * The wire shapes (AudioSource / SentenceAudioResult / PassageAudioResponse)
 * are promoted to @mandarin/shared-types (D5) and re-exported here; the
 * feature-local `SentenceAudioMap` alias is kept.
 */

import type { SentenceAudioResult } from "@mandarin/shared-types";

export type {
  AudioSource,
  SentenceAudioResult,
  PassageAudioResponse,
} from "@mandarin/shared-types";

/** Keyed by sentence index (0-based). */
export type SentenceAudioMap = Record<number, SentenceAudioResult>;
