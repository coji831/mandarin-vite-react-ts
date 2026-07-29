/**
 * @file constants/audio.ts
 * @description Shared audio constants for the readers feature (Story 21.5).
 */

/** Available playback speeds for sentence audio. */
export const PLAYBACK_SPEEDS = [0.75, 1, 1.25] as const;

/** Type of valid playback speeds. */
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

/** Delay before starting sentence playback (allows stop to settle). */
export const PLAYBACK_START_DELAY_MS = 50;
