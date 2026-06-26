/**
 * @file components/RadicalTreesTab.tsx
 * @description Radical Trees sub-view — Phase 2 (locked teaser) or Phase 3 tree visualization
 * Story 19.4: Radical Trees (Phase 3)
 *
 * Phase 2 (currentPhase < 3): Shows locked teaser explaining trees unlock in Phase 3.
 * Phase 3 (currentPhase >= 3): Delegates to Phase3TreeView.
 *
 * The Browse/Trees toggle is owned by RadicalsPage (page-level) — this component has no
 * internal toggle to avoid duplicate controls.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { usePhaseGate } from "shared/hooks";
import {
  radicalProgressService,
  type RadicalProgressItem,
} from "../services/radicalProgressService";
import type { RadicalData } from "../types";
import { Phase3TreeView } from "./Phase3TreeView";
import "./RadicalTreesTab.css";

interface RadicalTreesTabProps {
  radicals: RadicalData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function RadicalTreesTab({
  radicals,
  isLoading: radicalsLoading,
  error: radicalsError,
  refetch,
}: RadicalTreesTabProps) {
  const { phaseGate, isLoading: phaseGateLoading } = usePhaseGate();
  // If API fails (null phaseGate), default to Phase 1 in prod, Phase 3 in dev
  const defaultPhase = import.meta.env.DEV ? 3 : 1;
  const effectivePhase = phaseGate?.currentPhase ?? defaultPhase;
  const isPhase3 = effectivePhase >= 3;

  const [selectedRadical, setSelectedRadical] = useState<RadicalData | null>(null);
  const [masteredRadicals, setMasteredRadicals] = useState<RadicalData[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);

  // Build character mapping from radical data
  const getCharactersForRadical = useCallback(
    (radical: RadicalData): Array<{ glyph: string; pinyin: string; meaning: string }> => {
      return radical.metadata.hsk_characters ?? [];
    },
    [],
  );

  // Filter mastered radicals by search query
  const filteredChips = useMemo(() => {
    if (!searchQuery.trim()) return masteredRadicals;
    const query = searchQuery.toLowerCase();
    return masteredRadicals.filter(
      (r) =>
        r.glyph.includes(query) ||
        r.meaning.toLowerCase().includes(query) ||
        r.name_pinyin.toLowerCase().includes(query),
    );
  }, [masteredRadicals, searchQuery]);

  // Determine the selected radical — either from chip or first mastered
  const activeRadical = useMemo(() => {
    if (selectedChipId) {
      return masteredRadicals.find((r) => r.id === selectedChipId) ?? null;
    }
    return masteredRadicals.length > 0 ? masteredRadicals[0] : null;
  }, [masteredRadicals, selectedChipId]);

  // Fetch mastered radicals for Phase 3 view
  const loadMasteredRadicals = useCallback(async () => {
    setProgressLoading(true);
    setProgressError(null);
    try {
      const progressData = await radicalProgressService.getRadicalProgress();
      const masteredIds = new Set(
        progressData
          .filter((item: RadicalProgressItem) => item.memorized)
          .map((item: RadicalProgressItem) => item.radicalId),
      );
      const mastered = radicals.filter((r) => masteredIds.has(r.id));
      setMasteredRadicals(mastered);
      // Default select the first mastered radical
      if (mastered.length > 0) {
        setSelectedChipId(mastered[0].id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load radical progress";
      setProgressError(message);
    } finally {
      setProgressLoading(false);
    }
  }, [radicals]);

  // Load mastered radicals on mount when radicals are ready
  useEffect(() => {
    if (radicals.length > 0 && !radicalsLoading && isPhase3) {
      loadMasteredRadicals();
    }
  }, [radicals.length, radicalsLoading, isPhase3, loadMasteredRadicals]);

  const handleRadicalClick = useCallback((radical: RadicalData) => {
    setSelectedRadical(radical);
  }, []);

  const handleBackToBrowse = useCallback(() => {
    setSelectedRadical(null);
  }, []);

  const handleChipClick = useCallback((id: string) => {
    setSelectedChipId(id);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Loading state
  if (radicalsLoading || phaseGateLoading) {
    return (
      <div className="radical-trees-tab">
        <div className="radical-trees-tab__loading flex-col flex-center p-xl">
          <div className="radical-trees-tab__skeleton-tree" aria-hidden="true" />
          <span className="text-muted font-sm">Loading…</span>
        </div>
      </div>
    );
  }

  // --- Phase 2: Locked teaser (Trees tab clicked but user not yet Phase 3) ---
  if (!isPhase3) {
    return (
      <div className="radical-trees-tab">
        <div className="flex-col flex-center p-xl gap-md">
          <span className="font-3xl" aria-hidden="true">🔒</span>
          <p className="text-muted font-lg">Radical Trees</p>
          <p className="text-muted font-sm text-center">
            Master radicals and pass the Phase 2 quiz to unlock tree visualization.
          </p>
        </div>
      </div>
    );
  }

  // --- Phase 3: Trees view ---
  return (
    <div className="radical-trees-tab">
      <Phase3TreeView
        searchQuery={searchQuery}
        filteredChips={filteredChips}
        masteredRadicals={masteredRadicals}
        activeRadical={activeRadical}
        progressError={progressError}
        progressLoading={progressLoading}
        onSearchChange={handleSearchChange}
        onChipClick={handleChipClick}
        onRetry={loadMasteredRadicals}
        getCharactersForRadical={getCharactersForRadical}
      />
    </div>
  );
}
