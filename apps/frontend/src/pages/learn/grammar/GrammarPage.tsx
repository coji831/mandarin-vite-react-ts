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
 * (guests = 1 — calibrated guest identity, Story 24-7) — never from
 * `userStore`. If the phase-gate fetch fails (null gate), defaults to Phase 2
 * in prod and Phase 4 in dev so locked preview cards never hide content.
 */
import { usePhaseGate } from "shared/hooks";
import { PageHeader, PageShell, PageStack } from "shared/components";
import { openHub } from "shared/hub-entry";
import {
  GrammarFilterBar,
  GrammarList,
  useGrammar,
  type GrammarPatternData,
} from "features/grammar";

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
    <PageShell archetype="list">
      <PageStack size="default">
        <PageHeader
          title="Grammar"
          description="Browse the core sentence patterns of Mandarin. Click a card to see its structure, examples, and related patterns."
        />

        <GrammarFilterBar
          search={filter.search}
          onSearchChange={(search) => setFilter({ search })}
          hskLevel={filter.hskLevel}
          onHskLevelChange={(hskLevel) => setFilter({ hskLevel })}
          phase={filter.phase}
          onPhaseChange={(phase) => setFilter({ phase })}
        />

        <GrammarList
          patterns={patterns}
          isLoading={isLoading}
          error={error}
          currentPhase={currentPhase}
          onRetry={refetch}
          onPatternClick={handlePatternClick}
          onResetFilters={resetFilter}
        />
      </PageStack>
    </PageShell>
  );
}
