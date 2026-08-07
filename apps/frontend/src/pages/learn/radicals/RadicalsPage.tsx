/**
 * @file pages/learn/RadicalsPage.tsx
 * @description Main radicals browsing page with filter bar, responsive grid, and tree view.
 * Story 19.1: Radicals Browser Structure
 * Story 19.2: Radical Detail Card
 * Story 19.4: Radical Trees (Phase 3)
 * Story 21.x (visual wave): Radical detail now opens in the shared LexicalHub via
 * openHub() — exactly ONE dialog at a time (no local modal).
 * Story 22.4 follow-up (Issue 4): `view` (browse/trees) + `mode` (radical/phonetic)
 * are URL params via useSearchParamState — `?view=trees&mode=phonetic` deep-links
 * work, writes use replace so Back exits the page, and the localStorage `treeMode`
 * preference is dropped (URL replaces it). The transient `?radical=` deep-link
 * still self-clears with replace after opening the hub.
 */

import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { usePhaseGate, useSearchParamState } from "shared/hooks";
import { SEARCH_PARAMS } from "shared/constants";
import { Box, Button } from "shared/components";
import { openHub } from "shared/store";
import {
  useRadicals,
  FilterBar,
  RadicalGrid,
  RadicalTreesTab,
  type RadicalData,
} from "features/radicals";
import "./RadicalsPage.css";

const VIEWS = ["browse", "trees"] as const;
type RadicalsView = (typeof VIEWS)[number];

const TREE_MODES = ["radical", "phonetic"] as const;
type TreeMode = (typeof TREE_MODES)[number];

export function RadicalsPage() {
  const { radicals, filteredRadicals, filter, setFilter, resetFilter, isLoading, error, refetch } =
    useRadicals();
  const { phaseGate } = usePhaseGate();
  const [searchParams, setSearchParams] = useSearchParams();

  // View + mode are URL-driven (Story 22.4 follow-up, Issue 4).
  const [view, setView] = useSearchParamState<RadicalsView>(SEARCH_PARAMS.view, {
    defaultValue: "browse",
    parse: (raw) => (VIEWS.includes(raw as RadicalsView) ? (raw as RadicalsView) : null),
  });
  const [treeMode, setTreeMode] = useSearchParamState<TreeMode>(SEARCH_PARAMS.mode, {
    defaultValue: "radical",
    parse: (raw) => (TREE_MODES.includes(raw as TreeMode) ? (raw as TreeMode) : null),
  });

  // Guards the ?radical deep-link effect against re-open loops — only reacts to NEW param values.
  const lastAutoOpenedRadicalRef = useRef<string | null>(null);

  // Effect 1: ?radical query param — open the radical in the lexical hub, then clear
  // the param (replace state) so back-navigation returns to the plain page without re-opening.
  useEffect(() => {
    const radicalParam = searchParams.get("radical");
    if (!radicalParam || radicals.length === 0) return;
    if (lastAutoOpenedRadicalRef.current === radicalParam) return;
    const found = radicals.find((r) => r.id === radicalParam);
    if (!found) return;
    lastAutoOpenedRadicalRef.current = radicalParam;
    openHub({
      entityType: "radical",
      entityId: found.id,
      label: `${found.glyph} (${found.name_pinyin})`,
    });
    // If we were in trees view, drop back to browse so the hub opens over the grid.
    setView((prev) => (prev === "trees" ? "browse" : prev));
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("radical");
        return next;
      },
      { replace: true },
    );
  }, [searchParams, radicals, setSearchParams, setView]);

  // If API fails (null phaseGate), default to Phase 1 in prod, Phase 3 in dev
  const defaultPhase = import.meta.env.DEV ? 3 : 1;
  const effectivePhase = phaseGate?.currentPhase ?? defaultPhase;
  const isPhase3 = effectivePhase >= 3;

  const showTrees = view === "trees";
  const showTreesHeading = showTrees && (treeMode === "radical" ? isPhase3 : true);

  const handleRadicalClick = (radical: RadicalData) => {
    openHub({
      entityType: "radical",
      entityId: radical.id,
      label: `${radical.glyph} (${radical.name_pinyin})`,
    });
  };

  const toggleView = () => {
    setView((prev) => (prev === "trees" ? "browse" : "trees"));
  };

  const handleTreeModeChange = (mode: TreeMode) => {
    setTreeMode(mode);
  };

  return (
    <div className="radicals-page flex flex-col flex-1 gap-xs p-md">
      <Box variant="dark" padding="md" className="radicals-page__header flex-col gap-xs">
        <h1 className="font-xl fw-700 text-secondary m-0 flex gap-xs">
          {showTrees && treeMode === "phonetic"
            ? "Phonetic Trees"
            : showTreesHeading
              ? "Radical Trees"
              : "Radicals"}
        </h1>
        <p className="font-sm text-muted m-0">
          {showTrees && treeMode === "phonetic"
            ? "Explore characters grouped by shared phonetic components."
            : showTreesHeading
              ? "Explore mastered radicals as expandable tree views."
              : "Browse the building blocks of Chinese characters. Click a card to see its characters and story."}
        </p>
      </Box>

      {!showTrees && <FilterBar filter={filter} onFilterChange={setFilter} onReset={resetFilter} />}

      <Box variant="dark" padding="md" className="radicals-page__content flex-1 flex-col">
        {showTrees ? (
          <RadicalTreesTab radicals={filteredRadicals} isLoading={isLoading} treeMode={treeMode} />
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
        {showTrees && (
          <>
            <span className="text-muted font-xs" aria-hidden="true">
              |
            </span>
            <Button
              variant={treeMode === "radical" ? "primary-active" : "ghost"}
              onClick={() => handleTreeModeChange("radical")}
              size="sm"
            >
              🔤 Radical
            </Button>
            <Button
              variant={treeMode === "phonetic" ? "primary-active" : "ghost"}
              onClick={() => handleTreeModeChange("phonetic")}
              size="sm"
            >
              🔈 Phonetic
            </Button>
          </>
        )}
      </Box>
    </div>
  );
}
