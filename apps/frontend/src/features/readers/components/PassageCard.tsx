/**
 * @file PassageCard.tsx
 * @description Preview card for a single passage in the library grid.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.7: Added bookmark toggle button and completion checkmark indicator.
 *
 * Rework (§2): the card no longer prints a "known words" percentage. The API's
 * `knownWordRatio` is a stored 0–1 column written when the passage was
 * generated, so it cannot vary per learner — every card read "1%" and was wrong
 * twice over (wrong unit, meaningless number). The rule the proposal states:
 * a card whose ratio cannot vary per learner must not show a ratio. What it
 * shows instead is real and varies: the word count, plus an explicit read
 * affordance so the card looks as clickable as it is.
 *
 * Data-resilient: fixed card width, inner scroll for overflow, text-overflow ellipsis.
 * Props-only — no logic, no hooks, no API calls.
 */
import { memo } from "react";
import { Badge, Box } from "shared/components";
import "./PassageCard.css";

export type PassageCardProps = {
  title: string;
  hskLevel: number;
  /** Words in the passage — real, per-passage, and it varies. */
  wordCount?: number;
  isBookmarked?: boolean;
  isCompleted?: boolean;
  onClick: () => void;
  /** Fired when the bookmark toggle is clicked. If omitted, toggle is hidden. */
  onBookmarkToggle?: () => void;
};

export const PassageCard = memo(function PassageCard({
  title,
  hskLevel,
  wordCount,
  isBookmarked = false,
  isCompleted = false,
  onClick,
  onBookmarkToggle,
}: PassageCardProps) {
  const meta = [
    wordCount !== undefined ? `${wordCount} words` : null,
    isCompleted ? "finished" : null,
    isBookmarked ? "bookmarked" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Box
      variant="card"
      padding="md"
      className="passage-card flex-col gap-sm hover-lift-sm transition-all animate-fade-in min-w-0 max-w-full"
    >
      {/* Top row: HSK badge + indicators */}
      <div className="passage-card__top-row flex-between">
        <Badge>HSK {hskLevel}</Badge>
        <div className="passage-card__indicators flex-row gap-xs items-center">
          {/* Completion checkmark — decorative (name carried by the open button below) */}
          {isCompleted && (
            <span
              className="passage-card__completed text-success lh-1 font-sm fw-700"
              aria-hidden="true"
            >
              ✓
            </span>
          )}
          {/* Bookmark indicator / toggle */}
          {isBookmarked ? (
            <span
              className="passage-card__bookmark text-warning lh-1 font-sm cursor-pointer"
              aria-label="Bookmarked"
              role="button"
              tabIndex={0}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onBookmarkToggle?.();
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onBookmarkToggle?.();
                }
              }}
            >
              ★
            </span>
          ) : (
            onBookmarkToggle && (
              <span
                className="passage-card__bookmark-off text-tertiary lh-1 font-sm cursor-pointer op-50 hover-op-100 transition-all"
                aria-label="Add bookmark"
                role="button"
                tabIndex={0}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onBookmarkToggle?.();
                }}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onBookmarkToggle?.();
                  }
                }}
              >
                ☆
              </span>
            )
          )}
        </div>
      </div>

      {/* Clickable body — its own <button> so the bookmark toggle above is NOT
          nested inside another interactive element (axe nested-interactive). */}
      <button
        type="button"
        className="passage-card__open flex-col gap-sm"
        onClick={onClick}
        aria-label={`Read passage: ${title}, HSK level ${hskLevel}${meta ? `, ${meta}` : ""}`}
      >
        <h2 className="passage-card__title overflow-hidden whitespace-nowrap text-ellipsis font-md fw-600 text-secondary m-0 lh-1-3">
          {title}
        </h2>

        <div className="flex-between gap-sm font-xs text-tertiary">
          <span>{wordCount !== undefined ? `${wordCount} words` : "Graded passage"}</span>
          <span className="text-accent fw-600">Read →</span>
        </div>
      </button>
    </Box>
  );
});
