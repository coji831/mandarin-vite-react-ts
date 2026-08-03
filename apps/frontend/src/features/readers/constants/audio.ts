/**
 * @file constants/audio.ts
 * @description Shared audio constants for the readers feature (Story 21.5).
 *
 * Phase D1: `PLAYBACK_START_DELAY_MS` was removed — the shared AudioManager's
 * engine contract always settles, so the "let stop settle" delay is gone.
 */

/** Available playback speeds for sentence audio. */
export const PLAYBACK_SPEEDS = [0.75, 1, 1.25] as const;

/** Type of valid playback speeds. */
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];
