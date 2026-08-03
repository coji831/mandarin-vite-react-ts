/**
 * @file index.ts
 * @description Barrel exports for the readers feature.
 * Phase D1: Audio migrated to the shared AudioManager — useAudioPlayer +
 *   usePassageAudio removed (use useAudioManager + the readers-owned passage
 *   audio behavior); the readers audioStore was replaced by the shared
 *   `shared/store/audioStore.ts` presentational store.
 * Phase 0 (TTS detachment): the passage audio behavior moved INTO this feature
 *   (`./audio`) so `shared/audio` stays feature-free; the audio/constants
 *   sub-barrels are re-exported here.
 * Phase 2 (candidates-as-data): the passage resolver is retired — `./audio`
 *   now builds the passage `AudioBehavior` contract (buildPassageAudioBehavior).
 */
export {
  PassageCard,
  ReaderLibrary,
  SentenceDisplay,
  ReadingView,
  WordPopover,
  AudioControlBar,
} from "./components";
export type {
  PassageCardProps,
  ReaderLibraryProps,
  PassageSummary,
  SentenceDisplayProps,
  ReadingViewProps,
  PassageDetail,
  AudioControlBarProps,
} from "./components";

// Page component — imported directly, not through components barrel
export { ReadersPage } from "../../pages/learn/readers/ReadersPage";
export type { ReadersPageProps, ReadersPageMode } from "../../pages/learn/readers/ReadersPage";

// Hooks
export { usePassages, usePassageDetail, useGeneratePassage, useAutoSaveProgress } from "./hooks";

// Audio (Phase 0: readers-owned passage resolver — shared/audio stays feature-free)
export * from "./audio";

// Constants (Phase 0: fixes the pre-existing deep-import barrel bypass)
export { PLAYBACK_SPEEDS } from "./constants";
export type { PlaybackSpeed } from "./constants";

// Stores
export { useReadingStore } from "./stores";
export type { ReadersMode } from "./stores";

// Services
export {
  fetchPassages,
  fetchPassageDetail,
  generatePassage,
  fetchPassageAudio,
} from "./services/passageService";
export { readingProgressService } from "./services/readingProgressService";

// Types
export type { SentenceData } from "./components";
export type {
  AudioSource,
  SentenceAudioResult,
  SentenceAudioMap,
  PassageAudioResponse,
} from "./types";
