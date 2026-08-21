/**
 * @file components/GrammarList.tsx
 * @description Grammar pattern card list with data-resilient states:
 * loading (skeleton), error (+ retry), empty, and populated (locked cards
 * derive from the phase gate's currentPhase). Pure presentational shell.
 * Story 22.3: Grammar UI
 */
import { ErrorScreen } from "shared/components";
import { GrammarCard } from "./GrammarCard";
import { isPatternLocked } from "../utils";
import type { GrammarPatternData } from "../types";
import "./GrammarList.css";

export interface GrammarListProps {
  patterns: GrammarPatternData[];
  isLoading: boolean;
  error: string | null;
  /** Learner's current phase from `usePhaseGate()` (guests = 1 — calibrated). */
  currentPhase: number;
  onRetry: () => void;
  onPatternClick: (pattern: GrammarPatternData) => void;
  /** Resets the page filters (shown in the empty state so users can recover). */
  onResetFilters?: () => void;
}

export function GrammarList({
  patterns,
  isLoading,
  error,
  currentPhase,
  onRetry,
  onPatternClick,
  onResetFilters,
}: GrammarListProps) {
  // ─── Loading State (skeleton mirrors the final card footprint — no layout jump) ──
  if (isLoading) {
    return (
      <div className="grammar-list" role="status" aria-label="Loading grammar patterns">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="grammar-list__skeleton-card flex-col gap-sm p-md radius-md border-1 border-surface bg-surface-dark"
          >
            <div className="skeleton-loading grammar-list__skeleton-header" />
            <div className="skeleton-loading grammar-list__skeleton-line" />
            <div className="skeleton-loading grammar-list__skeleton-line grammar-list__skeleton-line-narrow" />
            <div className="flex gap-xs">
              <div className="skeleton-loading grammar-list__skeleton-chip" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="grammar-list">
        <ErrorScreen error={error} onRetry={onRetry} title="Failed to load grammar patterns" />
      </div>
    );
  }

  // ─── Empty State ────────────────────────────────────────────────────────
  if (patterns.length === 0) {
    return (
      <div className="grammar-list">
        <div className="grammar-list__empty flex-col-center p-2xl gap-md text-center">
          <span className="font-5xl op-60">📕</span>
          <h2 className="font-xl text-secondary fw-600">No grammar patterns found</h2>
          <p className="font-sm text-tertiary max-w-450">
            No patterns match the current filters. Try clearing the search or selecting a different
            HSK level or phase.
          </p>
          {onResetFilters && (
            <button
              type="button"
              className="btn-base text-accent font-sm mt-md"
              onClick={onResetFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Populated State ────────────────────────────────────────────────────
  return (
    <div className="grammar-list">
      <ul
        className="grammar-list__grid flex-col gap-sm m-0 p-0"
        role="list"
        aria-label="Grammar patterns"
      >
        {patterns.map((pattern) => (
          <li key={pattern.id} className="grammar-list__item" role="listitem">
            <GrammarCard
              pattern={pattern}
              isLocked={isPatternLocked(pattern.phase, currentPhase)}
              onClick={() => onPatternClick(pattern)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
