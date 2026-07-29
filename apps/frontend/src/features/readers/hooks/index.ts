/**
 * @file index.ts
 * @description Barrel exports for readers feature hooks.
 * Story 21.5: Added audio hooks.
 * Story 21.6: Added useAudioEngine, useBrowserTTS, useAudioAutoAdvance.
 */
export { usePassages } from "./usePassages";
export { usePassageDetail } from "./usePassageDetail";
export { useGeneratePassage } from "./useGeneratePassage";
export { usePassageAudio } from "./usePassageAudio";
export { useSentenceAudio } from "./useSentenceAudio";
export { useAudioEngine } from "./useAudioEngine";
export type { UseAudioEngineReturn } from "./useAudioEngine";
export { useBrowserTTS } from "./useBrowserTTS";
export type { UseBrowserTTSReturn } from "./useBrowserTTS";
export { useAudioAutoAdvance } from "./useAudioAutoAdvance";
export type { UseAudioAutoAdvanceReturn } from "./useAudioAutoAdvance";
