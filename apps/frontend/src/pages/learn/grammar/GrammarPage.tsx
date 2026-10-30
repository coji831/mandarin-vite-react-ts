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
 * Phase is SEQUENCING metadata only (BM-1 §3 / rework-proposal §9): every row
 * is clickable and no row claims a lock, so this page reads no phase gate. The
 * `?phase=` filter chips are the sequencing affordance.
 */
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
          onRetry={refetch}
          onPatternClick={handlePatternClick}
          onResetFilters={resetFilter}
        />
      </PageStack>
    </PageShell>
  );
}
