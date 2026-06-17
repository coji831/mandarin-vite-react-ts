/**
 * @deprecated Vocabulary feature is being replaced by the Foundations + Learning Roadmap
 * system (Epics 18+). New code should use the foundations feature and future learning
 * modules (Radicals, Grammar, Phonetic Clusters, Graded Readers, Chengyu) instead.
 *
 * Kept for backward compatibility during migration. Remove in a future cleanup pass
 * once all external references to this barrel are verified as removed.
 */

// Vocabulary feature — all word-related UI (vocabulary browsing,
// conversations, examples, audio playback)
export { AddForm } from "./components/AddForm";
export { Basic } from "./components/Basic";
export { ExampleListItem } from "./components/ExampleListItem";
export { FilterChip } from "../../shared/components/FilterChip/FilterChip";
export { PlaybackControls } from "./components/PlaybackControls";
export { PlayButton } from "./components/PlayButton";
export { Sidebar } from "./components/Sidebar";
export { VocabularyCard } from "./components/VocabularyCard";
export { WordDetails } from "./components/WordDetails";
export { WordExamplesPanel } from "./components/WordExamplesPanel";

export { useAudioPlayback } from "./hooks/useAudioPlayback";
export { default as useExamples } from "./hooks/useExamples";

export { AudioService, VocabularyDataService, DefaultVocabularyBackend } from "./services";
export type {
  IVocabularyDataService,
  IVocabularyBackend,
  IAudioService,
  IAudioBackend,
} from "./services";
export { BaseService } from "./services";

export type {
  Card,
  VocabularyList,
  DifficultyLevel,
  WordBasic,
  WordAudio,
  WordAudioRequest,
  Setting,
  ListState,
} from "./types";

// Stores
export { useListStore } from "./stores";

export {
  loadCsvVocab,
  getFilteredVocabularyLists,
  extractDistinctDifficulties,
  extractDistinctTags,
} from "./utils";
export type { VocabWord } from "./utils";
