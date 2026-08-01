/**
 * @file ReaderLibrary.tsx
 * @description Library view: HSK level pills + passage card grid.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.7: Added bookmark filter, isCompleted/isBookmarked props on PassageSummary,
 *   bookmark toggle callback.
 * VisFix W6b: Added isGenerating/generateError/onRetryGenerate — generation CTA now
 *   shows a loading state and inline error+retry so the user gets visible feedback.
 *
 * Props-only — no logic, no hooks, no API calls.
 * Covers: populated, loading (skeleton), empty (CTA), error (retry), filtered states.
 */
import { useMemo } from "react";
import { FilterChip, Skeleton, Button, ErrorScreen } from "shared/components";
import { PassageCard } from "./PassageCard";
import "./ReaderLibrary.css";

export interface PassageSummary {
  id: string;
  title: string;
  hskLevel: number;
  knownWordRatio: number;
  isBookmarked?: boolean;
  isCompleted?: boolean;
}

export type ReaderLibraryProps = {
  passages: PassageSummary[];
  selectedLevel: number | null;
  onLevelChange: (level: number | null) => void;
  onSelectPassage: (id: string) => void;
  isLoading: boolean;
  isEmpty: boolean;
  hasError: boolean;
  onRetry: () => void;
  onGeneratePassage: () => void;
  /** Active bookmark filter — "all" | "bookmarked". Default "all". */
  bookmarkFilter?: "all" | "bookmarked";
  /** Callback when bookmark filter changes. */
  onBookmarkFilterChange?: (filter: "all" | "bookmarked") => void;
  /** Callback when bookmark toggle is clicked on a passage card. */
  onBookmarkToggle?: (passageId: string) => void;
  /** Guest users cannot generate passages (backend returns 401) — hide the CTA. */
  isGuest?: boolean;
  /** True while a passage generation request is in flight — disables the CTA. */
  isGenerating?: boolean;
  /** True when the last generation attempt failed — shows an inline error with retry. */
  generateError?: boolean;
  /** Retry the last failed generation attempt. */
  onRetryGenerate?: () => void;
};

/** Inline banner shown when passage generation fails — keeps the library usable. */
function GenerateErrorBanner({
  isGenerating,
  onRetryGenerate,
}: {
  isGenerating: boolean;
  onRetryGenerate: () => void;
}) {
  return (
    <div
      className="reader-library__generate-error flex-col-center gap-sm p-lg radius-md text-center"
      role="alert"
    >
      <p className="font-sm text-error m-0">Could not generate a passage. Please try again.</p>
      <Button variant="secondary" size="sm" onClick={onRetryGenerate} loading={isGenerating}>
        Try Again
      </Button>
    </div>
  );
}

const HSK_LEVELS = [1, 2, 3, 4, 5, 6] as const;

function HskFilterChips({
  selectedLevel,
  onLevelChange,
}: {
  selectedLevel: number | null;
  onLevelChange: (level: number | null) => void;
}) {
  return (
    <div className="reader-library__filters flex-row gap-sm flex-wrap items-center shrink-0">
      <FilterChip
        label="All"
        selected={selectedLevel === null}
        onClick={() => onLevelChange(null)}
      />
      {HSK_LEVELS.map((level) => (
        <FilterChip
          key={level}
          label={`HSK ${level}`}
          selected={selectedLevel === level}
          onClick={() => onLevelChange(level)}
        />
      ))}
    </div>
  );
}

export function ReaderLibrary({
  passages,
  selectedLevel,
  onLevelChange,
  onSelectPassage,
  isLoading,
  isEmpty,
  hasError,
  onRetry,
  onGeneratePassage,
  bookmarkFilter = "all",
  onBookmarkFilterChange,
  onBookmarkToggle,
  isGuest = false,
  isGenerating = false,
  generateError = false,
  onRetryGenerate,
}: ReaderLibraryProps) {
  // Apply filters: HSK level + bookmark (must be before early returns — hooks rule)
  const filteredPassages = useMemo(() => {
    let result = passages;

    // HSK level filter
    if (selectedLevel !== null) {
      result = result.filter((p) => p.hskLevel === selectedLevel);
    }

    // Bookmark filter
    if (bookmarkFilter === "bookmarked") {
      result = result.filter((p) => p.isBookmarked);
    }

    return result;
  }, [passages, selectedLevel, bookmarkFilter]);

  // Bookmark filter toggle — rendered in EVERY non-loading/non-error state so
  // users (including guests) can always switch back to the full list (V13 trap).
  const bookmarkToggle = onBookmarkFilterChange ? (
    <div className="reader-library__bookmark-filter flex-row gap-xs items-center shrink-0">
      <FilterChip
        label="All Passages"
        selected={bookmarkFilter === "all"}
        onClick={() => onBookmarkFilterChange("all")}
      />
      <FilterChip
        label="Bookmarked"
        selected={bookmarkFilter === "bookmarked"}
        onClick={() => onBookmarkFilterChange("bookmarked")}
      />
    </div>
  ) : null;

  // Error state
  if (hasError) {
    return (
      <ErrorScreen
        error="Failed to load passages. Please check your connection and try again."
        onRetry={onRetry}
        title="Unable to load passages"
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className="reader-library w-full flex-col gap-md"
        role="status"
        aria-label="Loading passages"
      >
        <div className="reader-library__filters flex flex-wrap gap-xs" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} variant="custom" width="64px" height="32px" className="radius-pill" />
          ))}
        </div>
        <div className="reader-library__grid grid-3-col gap-sm">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <div className="reader-library w-full flex-col gap-md">
        {bookmarkToggle}
        {generateError && onRetryGenerate && (
          <GenerateErrorBanner isGenerating={isGenerating} onRetryGenerate={onRetryGenerate} />
        )}
        <div className="reader-library w-full flex-col-center gap-lg p-2xl text-center">
          <div className="font-3xl op-80" aria-hidden="true">
            📖
          </div>
          <h3 className="font-xl fw-600 text-secondary m-0">No passages yet</h3>
          <p className="font-sm text-tertiary m-0 max-w-450">
            Generate your first graded reading passage tailored to your HSK level. Passages are
            created based on the characters and words you already know.
          </p>
          {!isGuest && (
            <Button
              variant="primary"
              size="md"
              onClick={onGeneratePassage}
              loading={isGenerating}
              disabled={isGenerating}
            >
              Generate your first passage
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Empty filter result
  if (filteredPassages.length === 0) {
    // Null-safe label — a null level used to render "Generate HSK  passage" (double space).
    const generateLabel =
      selectedLevel !== null ? `Generate HSK ${selectedLevel} passage` : "Generate HSK passage";
    return (
      <div className="reader-library w-full flex-col gap-md">
        <HskFilterChips selectedLevel={selectedLevel} onLevelChange={onLevelChange} />
        {bookmarkToggle}
        {generateError && onRetryGenerate && (
          <GenerateErrorBanner isGenerating={isGenerating} onRetryGenerate={onRetryGenerate} />
        )}
        <div className="reader-library__empty-filter w-full flex-col-center gap-sm p-2xl text-center">
          <p className="font-md text-tertiary m-0">
            {bookmarkFilter === "bookmarked"
              ? "No bookmarked passages yet. Bookmark passages to see them here."
              : selectedLevel !== null
                ? `No passages found for HSK ${selectedLevel}. Try a different level or generate a new passage.`
                : "No passages found. Try a different level or generate a new passage."}
          </p>
          {!isGuest && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onGeneratePassage}
              loading={isGenerating}
              disabled={isGenerating}
            >
              {generateLabel}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="reader-library w-full flex-col gap-md">
      {/* HSK Level Pills */}
      <HskFilterChips selectedLevel={selectedLevel} onLevelChange={onLevelChange} />

      {/* Bookmark filter chip */}
      {bookmarkToggle}

      {/* Generate error — inline so the populated library stays usable */}
      {generateError && onRetryGenerate && (
        <GenerateErrorBanner isGenerating={isGenerating} onRetryGenerate={onRetryGenerate} />
      )}

      {/* Passage Card Grid */}
      <div className="reader-library__grid w-full grid-3-col gap-sm">
        {filteredPassages.map((passage) => (
          <PassageCard
            key={passage.id}
            title={passage.title}
            hskLevel={passage.hskLevel}
            knownWordRatio={passage.knownWordRatio}
            isBookmarked={passage.isBookmarked}
            isCompleted={passage.isCompleted}
            onClick={() => onSelectPassage(passage.id)}
            onBookmarkToggle={onBookmarkToggle ? () => onBookmarkToggle(passage.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
