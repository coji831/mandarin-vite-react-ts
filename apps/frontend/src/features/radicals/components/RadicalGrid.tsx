/**
 * @file components/RadicalGrid.tsx
 * @description Responsive grid of RadicalCards
 * Story 19.1: Radicals Browser Structure
 */

import type { RadicalData } from "../types";
import { RadicalCard } from "./RadicalCard";

interface RadicalGridProps {
  radicals: RadicalData[];
  isLoading: boolean;
  error: string | null;
  onRadicalClick?: (radical: RadicalData) => void;
  onRetry?: () => void;
}

export function RadicalGrid({
  radicals,
  isLoading,
  error,
  onRadicalClick,
  onRetry,
}: RadicalGridProps) {
  if (isLoading) {
    return (
      <div className="radical-grid__loading flex-col flex-center p-xl" role="status">
        <div className="radical-grid__skeleton-grid">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="radical-grid__skeleton-card card-dark" aria-hidden="true" />
          ))}
        </div>
        <span className="text-muted font-sm radical-grid__loading-text">Loading radicals…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="radical-grid__error flex-col flex-center p-xl gap-md">
        <div className="alert-error">
          <p className="text-primary">{error}</p>
        </div>
        {onRetry && (
          <button className="btn-primary" onClick={onRetry} type="button">
            Retry
          </button>
        )}
      </div>
    );
  }

  if (radicals.length === 0) {
    return (
      <div className="radical-grid__empty flex-col flex-center p-xl">
        <p className="text-muted font-lg">No radicals match your filters.</p>
        <p className="text-muted font-sm">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="radical-grid" role="list" aria-label="Radicals grid">
      {radicals.map((radical) => (
        <div key={radical.id} role="listitem">
          <RadicalCard radical={radical} onClick={onRadicalClick} />
        </div>
      ))}
    </div>
  );
}
