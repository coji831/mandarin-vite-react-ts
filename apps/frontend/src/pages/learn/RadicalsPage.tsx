/**
 * @file pages/learn/RadicalsPage.tsx
 * @description Main radicals browsing page with filter bar, responsive grid, detail card, and tree view
 * Story 19.1: Radicals Browser Structure
 * Story 19.2: Radical Detail Card
 * Story 19.4: Radical Trees (Phase 3)
 */

import { useState } from "react";
import { usePhaseGate } from "shared/hooks";
import {
  useRadicals,
  FilterBar,
  RadicalGrid,
  RadicalDetailCard,
  RadicalTreesTab,
  type RadicalData,
} from "features/radicals";
import "./RadicalsPage.css";

export function RadicalsPage() {
  const { filteredRadicals, filter, setFilter, resetFilter, isLoading, error, refetch } =
    useRadicals();
  const { phaseGate } = usePhaseGate();
  const [selectedRadical, setSelectedRadical] = useState<RadicalData | null>(null);
  const [showTrees, setShowTrees] = useState(false);

  // If API fails (null phaseGate), default to Phase 1 in prod, Phase 3 in dev
  const defaultPhase = import.meta.env.DEV ? 3 : 1;
  const effectivePhase = phaseGate?.currentPhase ?? defaultPhase;
  const isPhase3 = effectivePhase >= 3;

  const showTreesHeading = showTrees && isPhase3;

  const handleRadicalClick = (radical: RadicalData) => {
    setSelectedRadical(radical);
  };

  const handleCloseDetail = () => {
    setSelectedRadical(null);
  };

  const toggleView = () => {
    setShowTrees((prev) => !prev);
    setSelectedRadical(null);
  };

  return (
    <div className="radicals-page flex-col">
      <div className="radicals-page__header p-lg">
        <h1 className="font-2xl text-primary">
          <span aria-hidden="true" className="radicals-page__title-icon">
            {showTreesHeading ? "🌳" : "📘"}
          </span>
          {showTreesHeading ? "Radical Trees" : "Radicals"}
        </h1>
        <p className="text-secondary font-sm">
          {showTreesHeading
            ? "Explore mastered radicals as expandable tree views."
            : "Browse the fundamental building blocks of Chinese characters."}
        </p>
      </div>

      {!showTrees && <FilterBar filter={filter} onFilterChange={setFilter} onReset={resetFilter} />}

      <div className="radicals-page__content p-lg">
        {showTrees ? (
          <RadicalTreesTab
            radicals={filteredRadicals}
            isLoading={isLoading}
            error={error}
            refetch={refetch}
          />
        ) : (
          <>
            <RadicalGrid
              radicals={filteredRadicals}
              isLoading={isLoading}
              error={error}
              onRadicalClick={handleRadicalClick}
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
          </>
        )}
      </div>

      {/* View toggle footer */}
      {/* Toggle buttons use raw <button> because they form a segmented control
          (active/inactive toggle, not action buttons). The shared Button component
          doesn't support the segmented control pattern. */}
      <div className="radicals-page__view-toggle p-md flex-center">
        <button
          className={`radicals-page__toggle-btn ${!showTrees ? "radicals-page__toggle-btn--active" : ""}`}
          onClick={showTrees ? toggleView : undefined}
          aria-pressed={!showTrees}
          type="button"
        >
          📋 Browse
        </button>
        <button
          className={`radicals-page__toggle-btn ${showTrees ? "radicals-page__toggle-btn--active" : ""}`}
          onClick={!showTrees ? toggleView : undefined}
          aria-pressed={showTrees}
          type="button"
        >
          🌳 Trees
        </button>
      </div>

      {selectedRadical && (
        <RadicalDetailCard radical={selectedRadical} onClose={handleCloseDetail} />
      )}
    </div>
  );
}
