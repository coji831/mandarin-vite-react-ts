/**
 * @file index.ts
 * @description Barrel exports for the readers feature.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Phase 4: Added store exports.
 */
export {
  PassageCard,
  ReaderLibrary,
  SentenceDisplay,
  ReadingView,
  WordPopover,
  ReadersPage,
} from "./components";
export type {
  PassageCardProps,
  ReaderLibraryProps,
  PassageSummary,
  SentenceDisplayProps,
  ReadingViewProps,
  PassageDetail,
  ReadersPageProps,
  ReadersPageMode,
} from "./components";

// Stores
export { useReadingStore } from "./stores";
export type { ReadersMode } from "./stores";

// Services
export { fetchPassages, fetchPassageDetail, generatePassage } from "./services/passageService";

// Hooks
export { usePassages } from "./hooks/usePassages";
export { usePassageDetail } from "./hooks/usePassageDetail";
export { useGeneratePassage } from "./hooks/useGeneratePassage";
