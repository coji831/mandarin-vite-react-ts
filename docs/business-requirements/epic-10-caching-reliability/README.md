# Epic 10: Caching & Reliability

## Epic Summary

**Goal:** Add session-level caching for expensive async operations (CSV loads, repeated API fetches) and introduce a feature-scoped ErrorBoundary with centralized logging and a reset action to improve runtime reliability.

**Key Points:**

- Implement a small in-memory cache with TTL and optional max-entry eviction for expensive operations.
- Integrate cache into list/schema loaders and hooks, and provide `prefetchList(listId)` to warm caches on navigation.
- Add `ErrorBoundary` scoped to the Mandarin feature with `logger.error` integration and a Reset action that dispatches `RESET_PROGRESS`.
- Keep changes incremental and backward-compatible by using feature flags and compatibility shims in reducers.
- Add unit tests for cache behavior (hit/miss/eviction) and ErrorBoundary + reset flow.

**Status:** Planned

**Last Update:** 2025-10-16

## Background

The app currently parses or fetches several large vocab/list artifacts repeatedly (CSV parsing or external API calls). Repeated parsing and network calls increase latency and CPU use, and can create inconsistent user experiences. A small TTL cache will reduce redundant work. Separately, adding an ErrorBoundary scoped to the Mandarin feature will allow graceful recovery from UI errors and send consolidated logs for debugging.

## User Stories

1. #XXXX / **Cache module**

   - As a developer, I want a small in-memory cache (`get`, `set`, `prefetch`, `clear`) with TTL and optional max entries, so that repeated expensive operations are avoided.

2. #XXXX / **Integrate cache into loaders**

   - As a developer, I want schema/list loaders and hooks to consult the cache before parsing or fetching, so that page loads are faster and cheaper.

3. #XXXX / **ErrorBoundary & logger**

   - As a user, I want the app to show a reasonable fallback and allow resetting the feature state when a UI error occurs, so I can continue using the app without a full page refresh.

## Story Breakdown Logic

- Stories 10.1–10.2: Implement small cache and unit tests; integrate into the highest-cost loaders.
- Stories 10.3–10.4: Add ErrorBoundary and `logger` integration; wire a `RESET_PROGRESS` action to the dispatch context.

Rationale: implement the cache first (low-risk, measurable ROI) then add ErrorBoundary so the reset flow can leverage reducer reset support.

## Acceptance Criteria

- [ ] A cache module exists at `src/features/mandarin/services/cache.ts` with `get`, `set`, `prefetch`, and `clear` and supports TTL and max entries.
- [ ] Loaders/hooks consult the cache and return cached data when valid.
- [ ] `prefetchList(listId)` warms the cache on navigation to reduce latency.
- [ ] `ErrorBoundary` class component exists at `src/components/ErrorBoundary.tsx` and calls `logger.error` on catch.
- [ ] A `RESET_PROGRESS` action is implemented in reducers and clears feature state when invoked from the ErrorBoundary fallback UI.
- [ ] Unit tests cover cache hit/miss, TTL expiry, and eviction.

## Architecture Decisions

- Decision: In-memory feature-scoped cache (simple LRU/TTL)

  - Rationale: Low operational complexity, easy to reason about, and sufficient for session-level caching needs.
  - Alternatives considered: Service worker or platform cache (too heavyweight), remote caching (increases infra complexity).
  - Implications: Memory usage must be bounded (TTL + maxEntries). Use conservative defaults.

- Decision: Scope ErrorBoundary to feature area

  - Rationale: Avoid hiding unrelated app-wide errors; provide focused recovery for Mandarin feature.

## Implementation Plan

1. PR 10.1 — Logger & ErrorBoundary skeleton: add `src/utils/logger.ts` and `src/components/ErrorBoundary.tsx`, wire `componentDidCatch` to `logger.error` and add fallback UI with Reset button placeholder.
2. PR 10.2 — Reducer reset support: add `RESET_PROGRESS` handling in reducers and tests.
3. PR 10.3 — Cache module: implement `src/features/mandarin/services/cache.ts` with `get`, `set`, `prefetch`, `clear`, TTL and max-entries; unit tests for hit/miss/eviction.
4. PR 10.4 — Integrate cache into loaders/hooks and add `prefetchList(listId)` usage on page navigation; measure reduced parse/network calls.
5. PR 10.5 — Wrap feature provider (or App) with `ErrorBoundary` in staging and exercise reset workflow.

## Risks & mitigations

- Risk: Unbounded memory growth — Severity: Medium

  - Mitigation: Use TTL, max-entries eviction, and conservative defaults; expose `clear` for diagnostics.
  - Rollback: Remove cache usage and fall back to existing loader behavior.

- Risk: ErrorBoundary hides bugs — Severity: Medium

  - Mitigation: Scope ErrorBoundary to the Mandarin feature area, log with `logger.error`, and ensure tests still surface failures in CI.

## Implementation notes

- Conventions: follow `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md`.
- Operational notes: expose cache stats via dev-only logs for monitoring during rollout.
- Links: See `docs/templates/implementation-large-epic-template.md` for PR body and `docs/templates/feature-design-template.md` for design details.
- Update date object name to match the real feature. Note: the current codebase uses `generatorVersion` and `hash` metadata in feature types (see `src/features/mandarin/types/Conversation.ts`) rather than a dedicated date object; follow existing type conventions when adding date/version metadata.
- Concrete defaults for cache configuration: TTL = 5 minutes (300000 ms) and maxEntries = 50. There is no cache module implemented yet in the codebase; use these conservative defaults when creating `src/features/mandarin/services/cache.ts`.
- Canonical loader entry points to integrate with the cache (existing files discovered in the repo):
  - `src/utils/csvLoader.ts` — primary CSV vocab loader (used by pages and tests).
  - `src/features/mandarin/utils/schemaLoader.ts` — feature schema loader.
  - `src/features/mandarin/pages/VocabularyListPage.tsx` — imports CSV/loader utilities for list UI.
  - `src/features/mandarin/pages/FlashCardPage.tsx` — loads vocabulary for flashcard flows and uses `loadCsvVocab`.
  - `src/features/mandarin/components/PlayButton.tsx` — TTS playback and backend cache (GCS) integration via `/api/get-tts-audio`.
  - `src/features/mandarin/context/ProgressContext.tsx` and `src/features/mandarin/hooks/useProgressData.ts` (and alternates) — progress state and reset helpers used by the feature.
- Tests: existing tests include `src/utils/csvLoader.test.ts`. There are currently no cache unit tests or ErrorBoundary reset tests; suggested test names remain `cache.hit.spec.ts`, `cache.eviction.spec.ts`, and `ErrorBoundary.reset.spec.ts` for the future test files.
