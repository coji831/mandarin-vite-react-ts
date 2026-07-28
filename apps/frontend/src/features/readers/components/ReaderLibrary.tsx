/**
 * @file ReaderLibrary.tsx
 * @description Library view: HSK level pills + passage card grid.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 *
 * Props-only — no logic, no hooks, no API calls.
 * Covers: populated, loading (skeleton), empty (CTA), error (retry), filtered states.
 */
import { FilterChip, Skeleton, Button, ErrorScreen } from "shared/components";
import { PassageCard } from "./PassageCard";
import "./ReaderLibrary.css";

export interface PassageSummary {
  id: string;
  title: string;
  hskLevel: number;
  knownWordRatio: number;
  isBookmarked?: boolean;
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
};

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
}: ReaderLibraryProps) {
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
      <div className="reader-library w-full flex-col-center gap-lg p-2xl text-center">
        <div className="font-3xl op-80" aria-hidden="true">
          📖
        </div>
        <h3 className="font-xl fw-600 text-secondary m-0">No passages yet</h3>
        <p className="font-sm text-tertiary m-0 max-w-450">
          Generate your first graded reading passage tailored to your HSK level. Passages are
          created based on the characters and words you already know.
        </p>
        <Button variant="primary" size="md" onClick={onGeneratePassage}>
          Generate your first passage
        </Button>
      </div>
    );
  }

  // Get filtered passages for the current selection
  const filteredPassages = selectedLevel
    ? passages.filter((p) => p.hskLevel === selectedLevel)
    : passages;

  // Empty filter result
  if (filteredPassages.length === 0) {
    return (
      <div className="reader-library w-full flex-col gap-md">
        <HskFilterChips selectedLevel={selectedLevel} onLevelChange={onLevelChange} />
        <div className="reader-library__empty-filter w-full flex-col-center gap-sm p-2xl text-center">
          <p className="font-md text-tertiary m-0">
            No passages found for HSK {selectedLevel}. Try a different level or generate a new
            passage.
          </p>
          <Button variant="secondary" size="sm" onClick={onGeneratePassage}>
            Generate HSK {selectedLevel} passage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="reader-library w-full flex-col gap-md">
      {/* HSK Level Pills */}
      <HskFilterChips selectedLevel={selectedLevel} onLevelChange={onLevelChange} />

      {/* Passage Card Grid */}
      <div className="reader-library__grid w-full grid-3-col gap-sm">
        {filteredPassages.map((passage) => (
          <PassageCard
            key={passage.id}
            title={passage.title}
            hskLevel={passage.hskLevel}
            knownWordRatio={passage.knownWordRatio}
            isBookmarked={passage.isBookmarked}
            onClick={() => onSelectPassage(passage.id)}
          />
        ))}
      </div>
    </div>
  );
}
