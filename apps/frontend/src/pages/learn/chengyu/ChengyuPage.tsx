/**
 * @file pages/learn/chengyu/ChengyuPage.tsx
 * @description Page-level container for the Chengyu (idiom) library.
 * Story 23.3: Chengyu UI
 *
 * Container → feature-component delegation (storybook-production-alignment):
 * the page renders the Chengyu feature's presentational shells
 * (`ChengyuFilterBar` + `ChengyuList` + `ChengyuPagination`), delegates data
 * to the `useChengyu` hook, and routes card clicks to the shared LexicalHub
 * via `openHub({ entityType: "chengyu", ... })` from `shared/hub-entry` —
 * exactly ONE dialog at a time (no local modal).
 *
 * The results summary + pager are rendered by `ChengyuPagination` as a flex
 * SIBLING of the scrolling list wrapper (NOT inside it), so they stay visible
 * at the bottom of the page while idiom cards scroll. The footer appears only
 * in the populated state — hiding it during loading/empty/error avoids an
 * empty bar and a layout jump.
 *
 * Access is gated at the route level (`LearnRoutes` PhaseGate requiredPhase={4}),
 * and idiom cards carry no phase/lock state — so the page itself does not need
 * to re-derive the phase gate (mirrors `ReadersPage`, which is also route-gated
 * and lock-free). Phase source remains `usePhaseGate()` (numeric; guests = 1 —
 * calibrated guest identity, Story 24-7) — never `userStore`.
 */
import { PageHeader, PageShell, PageStack } from "shared/components";
import { openHub } from "shared/hub-entry";
import {
  ChengyuFilterBar,
  ChengyuList,
  ChengyuPagination,
  useChengyu,
  type ChengyuData,
} from "features/chengyu";

export function ChengyuPage() {
  const {
    idioms,
    filter,
    setFilter,
    resetFilter,
    isLoading,
    error,
    refetch,
    page,
    setPage,
    total,
    totalPages,
    pageSize,
  } = useChengyu();

  const handleIdiomClick = (idiom: ChengyuData) => {
    openHub({
      entityType: "chengyu",
      entityId: idiom.id,
      label: idiom.chengyu,
    });
  };

  return (
    <PageShell archetype="list">
      <PageStack size="default">
        <PageHeader
          title="Chengyu"
          description="Browse Mandarin idioms by theme and era. Click a card to read its origin story, play audio, and follow related idioms and characters."
        />

        <ChengyuFilterBar
          search={filter.search}
          onSearchChange={(search) => setFilter({ search })}
          theme={filter.theme}
          onThemeChange={(theme) => setFilter({ theme })}
          era={filter.era}
          onEraChange={(era) => setFilter({ era })}
        />

        <ChengyuList
          idioms={idioms}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          onIdiomClick={handleIdiomClick}
          onResetFilters={resetFilter}
        />

        {/* Pagination footer — only in the populated state (hidden during
            loading/empty/error to avoid an empty bar / layout jump). */}
        {!isLoading && !error && idioms.length > 0 && (
          <ChengyuPagination
            page={page}
            total={total}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        )}
      </PageStack>
    </PageShell>
  );
}
