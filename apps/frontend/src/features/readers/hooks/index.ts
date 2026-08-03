/**
 * @file index.ts
 * @description Barrel exports for readers feature hooks.
 * Phase D1: usePassageAudio + useAudioPlayer removed — readers audio is now
 *   driven by the shared useAudioManager + the readers-owned passage audio
 *   behavior (features/readers/audio, Phase 0 TTS detachment).
 * Phase 2 (candidates-as-data): buildPassageAudioBehavior produces the
 *   AudioBehavior contract; the shared manager is a pure transport.
 */
export { usePassages } from "./usePassages";
export { usePassageDetail } from "./usePassageDetail";
export { useGeneratePassage } from "./useGeneratePassage";
export { useAutoSaveProgress } from "./useAutoSaveProgress";
