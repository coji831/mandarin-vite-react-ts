/**
 * @file components/ChengyuList.tsx
 * @description Chengyu idiom card list with data-resilient states:
 * loading (skeleton), error (+ retry), empty, and populated. Pure
 * presentational shell — no hooks/API.
 * Story 23.3: Chengyu UI
 *
 * Populated state renders only the idiom card grid. The results summary and
 * pagination controls live in the sibling `ChengyuPagination` footer, which
 * `ChengyuPage` renders OUTSIDE the scrolling list region so they stay
 * visible while cards scroll. BUG-1 fix: `useChengyu`/`chengyuService`
 * surface `total`/`totalPages` so all idioms are reachable by browsing.
 */
import { ErrorScreen } from "shared/components";
import { ChengyuCard } from "./ChengyuCard";
import type { ChengyuData } from "../types";
import "./ChengyuList.css";

export interface ChengyuListProps {
  idioms: ChengyuData[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onIdiomClick: (idiom: ChengyuData) => void;
  /** Resets the page filters (shown in the empty state so users can recover). */
  onResetFilters?: () => void;
}

export function ChengyuList({
  idioms,
  isLoading,
  error,
  onRetry,
  onIdiomClick,
  onResetFilters,
}: ChengyuListProps) {
  // ─── Loading State (skeleton mirrors the final card footprint — no layout jump) ──
  if (isLoading) {
    return (
      <div className="chengyu-list" role="status" aria-label="Loading chengyu idioms">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="chengyu-list__skeleton-card flex-col gap-sm p-md radius-md border-1 border-surface bg-surface-dark"
          >
            <div className="skeleton-loading chengyu-list__skeleton-header" />
            <div className="skeleton-loading chengyu-list__skeleton-line" />
            <div className="skeleton-loading chengyu-list__skeleton-line chengyu-list__skeleton-line-narrow" />
            <div className="flex gap-xs">
              <div className="skeleton-loading chengyu-list__skeleton-chip" />
              <div className="skeleton-loading chengyu-list__skeleton-chip" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="chengyu-list">
        <ErrorScreen error={error} onRetry={onRetry} title="Failed to load chengyu idioms" />
      </div>
    );
  }

  // ─── Empty State ────────────────────────────────────────────────────────
  if (idioms.length === 0) {
    return (
      <div className="chengyu-list">
        <div className="chengyu-list__empty flex-col-center p-2xl gap-md text-center">
          <span className="font-5xl op-60">🏮</span>
          <h2 className="font-xl text-secondary fw-600">No idioms found</h2>
          <p className="font-sm text-tertiary max-w-450">
            No idioms match the current filters. Try clearing the search or selecting a different
            theme or era.
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
    <ul
      className="chengyu-list__grid flex-col gap-sm m-0 p-0"
      role="list"
      aria-label="Chengyu idioms"
    >
      {idioms.map((idiom) => (
        <li key={idiom.id} className="chengyu-list__item" role="listitem">
          <ChengyuCard idiom={idiom} onClick={() => onIdiomClick(idiom)} />
        </li>
      ))}
    </ul>
  );
}
