/**
 * @file components/index.ts
 * @description Barrel exports for readers feature components.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.5: Added AudioControlBar exports.
 */
export { PassageCard } from "./PassageCard";
export type { PassageCardProps } from "./PassageCard";
export { ReaderLibrary } from "./ReaderLibrary";
export type { ReaderLibraryProps, PassageSummary } from "./ReaderLibrary";
export { SentenceDisplay } from "./SentenceDisplay";
export type { SentenceDisplayProps, SentenceData } from "./SentenceDisplay";
export { ReadingView } from "./ReadingView";
export type { ReadingViewProps } from "./ReadingView";
export type { PassageDetail } from "./ReadingView";
export { WordPopover } from "./WordPopover";
export { AudioControlBar } from "./AudioControlBar";
export type { AudioControlBarProps } from "./AudioControlBar";
