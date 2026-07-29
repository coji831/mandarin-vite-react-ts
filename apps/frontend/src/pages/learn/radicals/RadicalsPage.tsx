/**
 * @file pages/learn/RadicalsPage.tsx
 * @description Main radicals browsing page with filter bar, responsive grid, detail card, and tree view
 * Story 19.1: Radicals Browser Structure
 * Story 19.2: Radical Detail Card
 * Story 19.4: Radical Trees (Phase 3)
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { usePhaseGate } from "shared/hooks";
import { Box, Button } from "shared/components";
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
  const { radicals, filteredRadicals, filter, setFilter, resetFilter, isLoading, error, refetch } =
    useRadicals();
  const { phaseGate } = usePhaseGate();
  const [searchParams] = useSearchParams();
  const [selectedRadical, setSelectedRadical] = useState<RadicalData | null>(null);
  const [showTrees, setShowTrees] = useState(() => searchParams.get("view") === "trees");

  // Effect 1: ?radical query param — select radical, switch to browse if in trees
  useEffect(() => {
    const radicalParam = searchParams.get("radical");
    if (!radicalParam || radicals.length === 0) return;
    const found = radicals.find((r) => r.id === radicalParam);
    if (!found) return;
    setSelectedRadical(found);
    setShowTrees((prev) => (prev === true ? false : prev));
  }, [searchParams, radicals]);

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
    <div className="radicals-page flex flex-col flex-1 gap-xs p-md">
      <Box variant="dark" padding="md" className="radicals-page__header flex-col gap-xs">
        <h2 className="font-xl fw-700 text-secondary m-0 flex gap-xs">
          {showTreesHeading ? "Radical Trees" : "Radicals"}
        </h2>
        <p className="font-sm text-muted m-0">
          {showTreesHeading
            ? "Explore mastered radicals as expandable tree views."
            : "Browse the building blocks of Chinese characters. Click a card to see its characters and story."}
        </p>
      </Box>

      {!showTrees && <FilterBar filter={filter} onFilterChange={setFilter} onReset={resetFilter} />}

      <Box variant="dark" padding="md" className="radicals-page__content flex-1 flex-col">
        {showTrees ? (
          <RadicalTreesTab
            radicals={filteredRadicals}
            isLoading={isLoading}
            error={error}
            refetch={refetch}
          />
        ) : (
          <div className="radicals-page__grid-wrapper">
            <RadicalGrid
              radicals={filteredRadicals}
              isLoading={isLoading}
              error={error}
              onRadicalClick={handleRadicalClick}
              onRetry={refetch}
            />
          </div>
        )}
      </Box>

      {/* View toggle footer */}
      <Box variant="dark" padding="md" className="radicals-page__view-toggle flex-center gap-sm">
        <Button
          variant={!showTrees ? "primary-active" : "ghost"}
          onClick={showTrees ? toggleView : undefined}
        >
          📋 Browse
        </Button>
        <Button
          variant={showTrees ? "primary-active" : "ghost"}
          onClick={!showTrees ? toggleView : undefined}
        >
          🌳 Trees
        </Button>
      </Box>

      {selectedRadical && (
        <RadicalDetailCard radical={selectedRadical} onClose={handleCloseDetail} />
      )}
    </div>
  );
}
