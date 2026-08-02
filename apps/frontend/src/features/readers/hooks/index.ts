/**
 * @file index.ts
 * @description Barrel exports for readers feature hooks.
 * Phase 2: Replaced useSentenceAudio, useAudioEngine, useBrowserTTS,
 *   useAudioAutoAdvance with unified useAudioPlayer.
 */
export { usePassages } from "./usePassages";
export { usePassageDetail } from "./usePassageDetail";
export { useGeneratePassage } from "./useGeneratePassage";
export { usePassageAudio } from "./usePassageAudio";
export { useAudioPlayer } from "./useAudioPlayer";
export type { UseAudioPlayerOptions, UseAudioPlayerReturn } from "./useAudioPlayer";
export { useAutoSaveProgress } from "./useAutoSaveProgress";
