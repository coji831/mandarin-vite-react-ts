/**
 * @file components/RadicalCard.tsx
 * @description Individual radical card showing glyph, pinyin, meaning, and metadata
 * Story 19.1: Radicals Browser Structure
 */

import { Button } from "shared/components";
import type { RadicalData } from "../types";
import "./RadicalCard.css";

interface RadicalCardProps {
  radical: RadicalData;
  onClick?: (radical: RadicalData) => void;
}

export function RadicalCard({ radical, onClick }: RadicalCardProps) {
  return (
    <Button
      variant="control"
      className="radical-card flex-col relative"
      onClick={() => onClick?.(radical)}
      aria-label={`${radical.meaning} — ${radical.name_pinyin} — ${radical.stroke_count} strokes`}
    >
      {radical.is_recommended && (
        <span
          className="radical-card__badge absolute text-warning font-lg lh-1"
          aria-label="Recommended radical"
          title="Top 20 — covers 70% of common characters"
        >
          ★
        </span>
      )}
      {radical.metadata?.frequency_rank !== undefined && radical.metadata.frequency_rank <= 20 && (
        <span
          className="radical-card__freq-dot absolute radius-full bg-warning-bg"
          title={`Frequency rank: #${radical.metadata.frequency_rank}`}
          aria-label={`Frequency rank ${radical.metadata.frequency_rank}`}
        />
      )}
      <span className="radical-card__glyph font-5xl text-primary lh-tight">{radical.glyph}</span>
      <span className="radical-card__pinyin font-sm text-primary-light font-italic">
        {radical.name_pinyin}
      </span>
      <span className="radical-card__meaning font-sm text-secondary text-center">
        {radical.meaning}
      </span>
      <span className="radical-card__strokes font-xs text-muted">
        {radical.stroke_count} stroke{radical.stroke_count !== 1 ? "s" : ""}
      </span>
    </Button>
  );
}
