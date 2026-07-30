/**
 * @file index.ts
 * @description Barrel exports for the readers feature.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Phase 4: Added store exports.
 * Story 21.5: Added audio hooks and components.
 * Story 21.7: Added reading progress service, auto-save hook.
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
  useSentenceAudio,
  useAutoSaveProgress,
} from "./hooks";

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
  SentenceAudioInfo,
  SentenceAudioMap,
  PassageAudioResponse,
} from "./types";
