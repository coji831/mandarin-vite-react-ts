/**
 * @file features/readers/constants/index.ts
 * @description Barrel exports for readers constants. Re-exports ONLY.
 * Phase 0 (TTS detachment): fixes the pre-existing barrel bypass — consumers
 * must import via the readers feature barrel, not deep `constants/audio`.
 */
export { PLAYBACK_SPEEDS } from "./audio";
export type { PlaybackSpeed } from "./audio";
