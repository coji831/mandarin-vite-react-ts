/**
 * @file PassageCard.tsx
 * @description Preview card for a single passage in the library grid.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 *
 * Data-resilient: fixed card width, inner scroll for overflow, text-overflow ellipsis.
 * Props-only — no logic, no hooks, no API calls.
 */
import { memo } from "react";
import { Box, ProgressBar } from "shared/components";
import "./PassageCard.css";

export type PassageCardProps = {
  title: string;
  hskLevel: number;
  knownWordRatio: number;
  isBookmarked?: boolean;
  onClick: () => void;
};

export const PassageCard = memo(function PassageCard({
  title,
  hskLevel,
  knownWordRatio: rawRatio,
  isBookmarked = false,
  onClick,
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
      aria-label={`Passage: ${title}, HSK level ${hskLevel}, ${knownWordRatio}% known words`}
    >
      {/* Top row: HSK badge + bookmark */}
      <div className="passage-card__top-row flex-between">
        <span className="passage-card__hsk-badge inline-block lh-1 bg-primary-bg radius-pill p-xs font-xs fw-600 text-primary">
          HSK {hskLevel}
        </span>
        {isBookmarked && (
          <span
            className="passage-card__bookmark text-warning lh-1 bg-warning-bg radius-pill p-xs font-xs"
            aria-label="Bookmarked"
          >
            ★
          </span>
        )}
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
