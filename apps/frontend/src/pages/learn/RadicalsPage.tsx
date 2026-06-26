/**
 * @file pages/learn/RadicalsPage.tsx
 * @description Main radicals browsing page with filter bar and responsive grid
 * Story 19.1: Radicals Browser Structure
 */

import { useRadicals, FilterBar, RadicalGrid } from "../../features/radicals";
import "./RadicalsPage.css";

export function RadicalsPage() {
  const { filteredRadicals, filter, setFilter, resetFilter, isLoading, error, refetch } =
    useRadicals();

  return (
    <div className="radicals-page flex-col">
      <div className="radicals-page__header p-lg">
        <h1 className="font-2xl text-primary">
          <span aria-hidden="true" className="radicals-page__title-icon">
            📘
          </span>
          Radicals
        </h1>
        <p className="text-secondary font-sm">
          Browse the fundamental building blocks of Chinese characters.
        </p>
      </div>

      <FilterBar filter={filter} onFilterChange={setFilter} onReset={resetFilter} />

      <div className="radicals-page__content p-lg">
        <RadicalGrid
          radicals={filteredRadicals}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
        />
        <div className="radicals-page__legend">
          <span className="radical-card__badge" aria-hidden="true">
            ★
          </span>
          <span className="font-xs radicals-page__legend-text">
            {" "}
            = Recommended (top 20 — covers 70% of common characters)
          </span>
        </div>
      </div>
    </div>
  );
}
