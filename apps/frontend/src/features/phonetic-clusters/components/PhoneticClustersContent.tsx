/**
 * @file components/PhoneticClustersContent.tsx
 * @description Main content component for the Phonetic Clusters browser.
 * Handles all visual states: loading, error, empty, filtered-empty, populated.
 * Story 21.6: Phonetic Clusters
 */

import { FilterChip, ErrorScreen } from "shared/components";
import { HSK_LEVELS } from "@mandarin/shared-constants";
import { ClusterCard } from "./ClusterCard";
import type { PhoneticClusterDetail } from "../types";
import "./PhoneticClustersContent.css";

interface PhoneticClustersContentProps {
  clusters: PhoneticClusterDetail[];
  isLoading: boolean;
  error: string | null;
  hskFilter: number | null;
  onHskFilterChange: (level: number | null) => void;
  onRetry: () => void;
}

export function PhoneticClustersContent({
  clusters,
  isLoading,
  error,
  hskFilter,
  onHskFilterChange,
  onRetry,
}: PhoneticClustersContentProps) {
  // ─── Loading State ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="phonetic-clusters-content">
        <div
          className="phonetic-clusters-content__filters flex flex-wrap gap-sm mb-md"
          role="group"
          aria-label="HSK filter"
        >
          {HSK_LEVELS.map((level) => (
            <FilterChip key={level} label={`HSK ${level}`} selected={false} onClick={() => {}} />
          ))}
        </div>
        <div className="phonetic-clusters-content__grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="cluster-card-skeleton flex-col p-md radius-md border-1 border-surface bg-surface-dark"
            >
              <div className="skeleton-loading cluster-card-skeleton__header" />
              <div className="skeleton-loading cluster-card-skeleton__line" />
              <div className="skeleton-loading cluster-card-skeleton__line cluster-card-skeleton__line-narrow" />
              <div className="flex flex-wrap gap-sm skeleton-loading__chips-row">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="skeleton-loading cluster-card-skeleton__chip" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="phonetic-clusters-content">
        <ErrorScreen error={error} onRetry={onRetry} title="Failed to load clusters" />
      </div>
    );
  }

  // ─── Empty State (no clusters at all) ────────────────────────────────
  if (clusters.length === 0 && hskFilter === null) {
    return (
      <div className="phonetic-clusters-content">
        <div className="phonetic-clusters-content__empty flex-col-center p-2xl gap-md text-center">
          <span className="font-5xl op-60">🔤</span>
          <h2 className="font-xl text-secondary fw-600">No phonetic clusters available yet</h2>
          <p className="font-sm text-tertiary max-w-450">
            Phonetic clusters group characters that share a common sound component. Check back soon
            as we add more clusters.
          </p>
        </div>
      </div>
    );
  }

  // ─── Filtered-Empty State ────────────────────────────────────────────
  if (clusters.length === 0 && hskFilter !== null) {
    return (
      <div className="phonetic-clusters-content">
        <div
          className="phonetic-clusters-content__filters flex flex-wrap gap-sm mb-md"
          role="group"
          aria-label="HSK filter"
        >
          {HSK_LEVELS.map((level) => (
            <FilterChip
              key={level}
              label={`HSK ${level}`}
              selected={level === hskFilter}
              onClick={() => onHskFilterChange(level === hskFilter ? null : level)}
            />
          ))}
        </div>
        <div className="phonetic-clusters-content__empty flex-col-center p-2xl gap-md text-center">
          <span className="font-5xl op-60">🔍</span>
          <h2 className="font-xl text-secondary fw-600">No clusters for HSK {hskFilter}</h2>
          <p className="font-sm text-tertiary max-w-450">
            No phonetic clusters found at HSK {hskFilter} level. Try a different level.
          </p>
          <button
            type="button"
            className="btn-base text-accent font-sm mt-md"
            onClick={() => onHskFilterChange(null)}
          >
            Show all
          </button>
        </div>
      </div>
    );
  }

  // ─── Populated State ─────────────────────────────────────────────────
  return (
    <div className="phonetic-clusters-content">
      <div
        className="phonetic-clusters-content__filters flex flex-wrap gap-sm mb-md"
        role="group"
        aria-label="HSK filter"
      >
        {HSK_LEVELS.map((level) => (
          <FilterChip
            key={level}
            label={`HSK ${level}`}
            selected={level === hskFilter}
            onClick={() => onHskFilterChange(level === hskFilter ? null : level)}
          />
        ))}
      </div>

      <div className="phonetic-clusters-content__grid" role="list" aria-label="Phonetic clusters">
        {clusters.map((cluster) => (
          <div key={cluster.id} role="listitem">
            <ClusterCard cluster={cluster} />
          </div>
        ))}
      </div>
    </div>
  );
}
