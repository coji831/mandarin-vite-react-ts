/**
 * @file components/RadicalCard.tsx
 * @description Individual radical card showing glyph, pinyin, meaning, and metadata
 * Story 19.1: Radicals Browser Structure
 */

import type { RadicalData } from "../types";

interface RadicalCardProps {
  radical: RadicalData;
  onClick?: (radical: RadicalData) => void;
}

export function RadicalCard({ radical, onClick }: RadicalCardProps) {
  return (
    <div
      className="radical-card card-dark-hover flex-col flex-center"
      onClick={() => onClick?.(radical)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
          e.preventDefault();
          onClick(radical);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${radical.meaning} — ${radical.name_pinyin} — ${radical.stroke_count} strokes`}
    >
      {radical.is_recommended && (
        <span className="radical-card__badge" aria-label="Recommended radical">
          ★
        </span>
      )}
      <span className="radical-card__glyph">{radical.glyph}</span>
      <span className="radical-card__pinyin">{radical.name_pinyin}</span>
      <span className="radical-card__meaning">{radical.meaning}</span>
      <span className="radical-card__strokes">
        {radical.stroke_count} stroke{radical.stroke_count !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
