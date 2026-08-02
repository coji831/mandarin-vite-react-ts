/**
 * @file PassageCard.tsx
 * @description Preview card for a single passage in the library grid.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.7: Added bookmark toggle button and completion checkmark indicator.
 *
 * Data-resilient: fixed card width, inner scroll for overflow, text-overflow ellipsis.
 * Props-only — no logic, no hooks, no API calls.
 */
import { memo } from "react";
import { Badge, Box, ProgressBar } from "shared/components";
import "./PassageCard.css";

export type PassageCardProps = {
  title: string;
  hskLevel: number;
  knownWordRatio: number;
  isBookmarked?: boolean;
  isCompleted?: boolean;
  onClick: () => void;
  /** Fired when the bookmark toggle is clicked. If omitted, toggle is hidden. */
  onBookmarkToggle?: () => void;
};

export const PassageCard = memo(function PassageCard({
  title,
  hskLevel,
  knownWordRatio: rawRatio,
  isBookmarked = false,
  isCompleted = false,
  onClick,
  onBookmarkToggle,
}: PassageCardProps) {
  // Clamp knownWordRatio to [0, 100] range
  const knownWordRatio = Math.min(100, Math.max(0, rawRatio));

  return (
    <Box
      variant="card"
      padding="md"
      className="passage-card flex-col gap-sm cursor-pointer hover-lift-sm transition-all animate-fade-in min-w-0 max-w-full focus-ring-primary"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={
        `Passage: ${title}, HSK level ${hskLevel}, ${knownWordRatio}% known words` +
        (isCompleted ? ", completed" : "") +
        (isBookmarked ? ", bookmarked" : "")
      }
    >
      {/* Top row: HSK badge + indicators */}
      <div className="passage-card__top-row flex-between">
        <Badge>HSK {hskLevel}</Badge>
        <div className="passage-card__indicators flex-row gap-xs items-center">
          {/* Completion checkmark */}
          {isCompleted && (
            <span
              className="passage-card__completed text-success lh-1 font-sm fw-700"
              aria-label="Completed"
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

      {/* Title */}
      <h3 className="passage-card__title overflow-hidden whitespace-nowrap text-ellipsis font-md fw-600 text-secondary m-0 lh-1-3">
        {title}
      </h3>

      {/* Known-word ratio */}
      <div className="passage-card__ratio flex-col gap-xs">
        <span className="font-xs text-muted">Known words</span>
        <ProgressBar value={knownWordRatio} />
        <span className="font-xs text-tertiary">{knownWordRatio}%</span>
      </div>
    </Box>
  );
});
