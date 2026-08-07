/**
 * @file pages/learn/grammar/GrammarPage.tsx
 * @description Page-level container for the Grammar pattern library.
 * Story 22.3: Grammar UI
 *
 * Container → feature-component delegation (storybook-production-alignment):
 * the page renders the Grammar feature's presentational shells
 * (`GrammarFilterBar` + `GrammarList`), delegates data to the `useGrammar`
 * hook, and routes card clicks to the shared LexicalHub via
 * `openHub({ entityType: "grammar", ... })` from `shared/hub-entry` — exactly
 * ONE dialog at a time (no local modal).
 *
 * Locked-card state derives from `usePhaseGate()`'s numeric currentPhase
 * (guests = 4) — never from `userStore`. If the phase-gate fetch fails
 * (null gate), defaults to Phase 2 in prod and Phase 4 in dev so locked
 * preview cards never hide content.
 */
import { usePhaseGate } from "shared/hooks";
import { Box } from "shared/components";
import { openHub } from "shared/hub-entry";
import {
  GrammarFilterBar,
  GrammarList,
  useGrammar,
  type GrammarPatternData,
} from "features/grammar";
import "./GrammarPage.css";

export function GrammarPage() {
  const { patterns, filter, setFilter, resetFilter, isLoading, error, refetch } = useGrammar();
  const { phaseGate } = usePhaseGate();

  // If API fails (null phaseGate), default to Phase 2 in prod, Phase 4 in dev
  const defaultPhase = import.meta.env.DEV ? 4 : 2;
  const currentPhase = phaseGate?.currentPhase ?? defaultPhase;

  const handlePatternClick = (pattern: GrammarPatternData) => {
    openHub({
      entityType: "grammar",
      entityId: pattern.id,
      label: pattern.name,
    });
  };

  return (
    <div className="grammar-page flex flex-col flex-1 gap-xs p-md">
      <Box variant="dark" padding="md" className="grammar-page__header flex-col gap-xs">
        <h1 className="font-xl fw-700 text-secondary m-0">Grammar</h1>
        <p className="font-sm text-muted m-0">
          Browse the core sentence patterns of Mandarin. Click a card to see its structure,
          examples, and related patterns.
        </p>
      </Box>

      <GrammarFilterBar
        search={filter.search}
        onSearchChange={(search) => setFilter({ search })}
        hskLevel={filter.hskLevel}
        onHskLevelChange={(hskLevel) => setFilter({ hskLevel })}
        phase={filter.phase}
        onPhaseChange={(phase) => setFilter({ phase })}
      />

      <Box variant="dark" padding="md" className="grammar-page__content flex-1 flex-col">
        <div className="grammar-page__list-wrapper">
          <GrammarList
            patterns={patterns}
            isLoading={isLoading}
            error={error}
            currentPhase={currentPhase}
            onRetry={refetch}
            onPatternClick={handlePatternClick}
            onResetFilters={resetFilter}
          />
        </div>
      </Box>
    </div>
  );
}
