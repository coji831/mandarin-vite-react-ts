/**
 * @file index.ts
 * @description Barrel exports for the readers feature.
 * Phase 2: Replaced useSentenceAudio export with useAudioPlayer.
 *   Added lib/ exports for AudioEngine and BrowserTTS.
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
export {
  usePassages,
  usePassageDetail,
  useGeneratePassage,
  usePassageAudio,
  useAudioPlayer,
  useAutoSaveProgress,
} from "./hooks";

// Stores
export { useReadingStore, useAudioStore } from "./stores";
export type { ReadersMode, AudioStatus } from "./stores";

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
  SentenceAudioInfo,
  SentenceAudioMap,
  PassageAudioResponse,
} from "./types";
