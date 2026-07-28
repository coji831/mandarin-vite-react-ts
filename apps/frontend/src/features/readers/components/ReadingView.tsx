/**
 * @file ReadingView.tsx
 * @description Sentence-by-sentence reader for a single passage.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.x: Migrated onWordTap → onPopoverOpen (now only handles popover position;
 *   hub navigation goes directly through Zustand hubStore).
 * Story 21.x Phase 2: Collapsed onPopoverOpen prop chain via component composition.
 *   SentenceDisplay is now rendered as children by the parent (ReadersPage).
 *
 * Props-only — no logic, no hooks, no API calls.
 * Covers: default, loading (skeleton), error (retry).
 * No AudioControlBar — deferred to Story 21.5.
 */
import { Box, Button, Skeleton, ErrorScreen } from "shared/components";
import type { SentenceData } from "./SentenceDisplay";
import "./ReadingView.css";

export interface PassageDetail {
  id: string;
  title: string;
  hskLevel: number;
  sentences: SentenceData[];
}

export type ReadingViewProps = {
  passage: PassageDetail;
  onBack: () => void;
  children?: React.ReactNode;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
};

export function ReadingView({
  passage,
  onBack,
  children,
  isLoading,
  hasError,
  onRetry,
}: ReadingViewProps) {
  // Error state
  if (hasError) {
    return (
      <ErrorScreen
        error="Failed to load this passage. Please try again."
        onRetry={onRetry}
        title="Unable to load passage"
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="reading-view flex-col gap-md" role="status" aria-label="Loading passage">
        <div className="reading-view__header flex-align-center gap-sm">
          <Skeleton variant="custom" width="36px" height="36px" className="radius-md" />
          <Skeleton variant="line" width="200px" height="24px" />
          <Skeleton variant="custom" width="60px" height="24px" className="radius-pill" />
        </div>
        <div className="flex-col gap-md">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex-col gap-xs">
              <Skeleton variant="line" width="100%" height="20px" />
              <Skeleton variant="line" width="60%" height="14px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Box
      variant="dark-alt"
      padding="md"
      className="reading-view w-full flex-col gap-md animate-fade-in min-h-0"
    >
      {/* Passage Header: back button + title + HSK badge */}
      <div className="reading-view__header flex-align-center gap-sm shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          aria-label="Back to library"
          className="reading-view__back-btn shrink-0 font-sm gap-xs"
        >
          ← Back
        </Button>
        <h3 className="reading-view__title overflow-hidden whitespace-nowrap text-ellipsis font-xl fw-600 text-primary m-0 flex-1">
          {passage.title}
        </h3>
        <span className="reading-view__hsk-badge inline-block lh-1 bg-surface-hover radius-pill p-xs font-xs fw-600 text-primary shrink-0">
          HSK {passage.hskLevel}
        </span>
      </div>

      <Box variant="divider" />

      {/* Sentences — scrollable (rendered from parent via children) */}
      <Box
        variant="surface"
        className="reading-view__sentences flex-col gap-sm flex-1 overflow-y-auto min-h-0"
      >
        {children}
      </Box>
    </Box>
  );
}
