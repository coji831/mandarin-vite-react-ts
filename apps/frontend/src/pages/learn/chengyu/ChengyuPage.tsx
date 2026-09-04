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
import { Box } from "shared/components";
import { openHub } from "shared/hub-entry";
import {
  ChengyuFilterBar,
  ChengyuList,
  ChengyuPagination,
  useChengyu,
  type ChengyuData,
} from "features/chengyu";
import "./ChengyuPage.css";

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
    <div className="chengyu-page flex flex-col flex-1 gap-xs p-md">
      <Box variant="dark" padding="md" className="chengyu-page__header flex-col gap-xs">
        <h1 className="font-xl fw-700 text-secondary m-0">Chengyu</h1>
        <p className="font-sm text-muted m-0">
          Browse Mandarin idioms by theme and era. Click a card to read its origin story, play
          audio, and follow related idioms and characters.
        </p>
      </Box>

      <ChengyuFilterBar
        search={filter.search}
        onSearchChange={(search) => setFilter({ search })}
        theme={filter.theme}
        onThemeChange={(theme) => setFilter({ theme })}
        era={filter.era}
        onEraChange={(era) => setFilter({ era })}
      />

      <Box variant="dark" padding="md" className="chengyu-page__content flex-1 flex-col">
        <div className="chengyu-page__list-wrapper">
          <ChengyuList
            idioms={idioms}
            isLoading={isLoading}
            error={error}
            onRetry={refetch}
            onIdiomClick={handleIdiomClick}
            onResetFilters={resetFilter}
          />
        </div>

        {/* Pagination footer — flex sibling of the scrolling list wrapper, so
            the results summary + pager stay visible while cards scroll. Only
            rendered in the populated state (hidden during loading/empty/error
            to avoid an empty bar / layout jump). */}
        {!isLoading && !error && idioms.length > 0 && (
          <ChengyuPagination
            page={page}
            total={total}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        )}
      </Box>
    </div>
  );
}
