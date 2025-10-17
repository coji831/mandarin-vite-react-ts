# Implementation Plan: Consolidated Epics 9–11

This document drafts three consolidated epics (indexed starting at 9) that group the original Epics 9–14 into a smaller set for incremental delivery. These are intended as draft PR descriptions that can be used as the body for draft pull requests.

---

## Summary

We condense the original roadmap into three focused epics to keep migration manageable and reviewable:

- Epic 9 — State & Performance Core (merges original Epics 9, 10, 11)
- Epic 10 — Caching & Reliability (merges original Epics 12, 14)
- Epic 11 — Testing & Dependency Injection (original Epic 13)

Each epic below lists the concrete file-level scope, implementation steps, migration strategy, tests, risks, and an estimated effort. Use these as draft PRs and split them into smaller PRs if reviewers ask for narrower changes.

---

## Epic 9 — State & Performance Core

Purpose

- Move the Mandarin feature to a normalized, reducer-driven state, split state vs dispatch contexts, and add selector/APIs and memoization to reduce unnecessary re-renders.

Includes (from original):

- Optimize Re-Renders (9)
- Normalize Data & Improve Reducer Granularity (10)
- Sub-Reducers & Granular Actions (11)

Files to add / update

- `src/features/mandarin/types/Progress.ts` — define normalized types (byId + ids).
- `src/features/mandarin/reducers/progressReducer.ts` — normalized reducer implementation (actions: MARK_WORD_LEARNED, SET_SELECTED_LIST, RESTORE_PROGRESS, RESET_PROGRESS).
- `src/features/mandarin/reducers/rootReducer.ts` — `combineReducers` helper and root composition.
- `src/features/mandarin/reducers/listsReducer.ts`, `userReducer.ts`, `uiReducer.ts` — sub-reducers.
- `src/features/mandarin/context/ProgressContext.tsx` — refactor to provide `ProgressStateContext` and `ProgressDispatchContext` and implement `useProgressState(selector)` and `useProgressActions()`.
- `src/features/mandarin/hooks/useProgressContext.ts` — migrate internals to `useReducer` or expose new hooks `useProgressState(selector)` and `useProgressActions()`.
- `src/features/mandarin/utils/progressHelpers.ts` — migration helpers and selectors such as `getWordsForList(listId)`.
- Consumers (selective edits): `src/features/mandarin/components/*` and `src/features/mandarin/pages/*` that call `useProgressContext()` (e.g., `FlashCard.tsx`, `VocabularyCard.tsx`, `NavBar.tsx`, `Sidebar.tsx`).

Implementation steps (recommended PR sequence)

1. PR 9.1 — Types & reducer skeletons: add `types/Progress.ts`, create `reducers/` folder with skeletons and unit test placeholders. (no consumer changes)
2. PR 9.2 — Provider -> useReducer: wire `ProgressContext` provider internals to `useReducer(progressReducer, initialState)` and add reducer unit tests.
3. PR 9.3 — Split contexts & new hooks: add `ProgressStateContext`/`ProgressDispatchContext`, implement `useProgressState(selector)` and `useProgressActions()`. Convert 2–3 heavy components to new hooks and measure with React Profiler.
4. PR 9.4 — Sub-reducer decomposition: implement `rootReducer` and sub-reducers (`listsReducer`, `userReducer`, `uiReducer`), add tests and finalize types.
5. PR 9.5 — Final cleanup: remove any deprecated compatibility selectors and finalize docs/tests.

Testing & validation

- Unit tests for each reducer + action.
- Test ensuring `MARK_WORD_LEARNED` updates normalized shape in O(1).
- Hook test asserting `useProgressActions()` returns stable function references across unrelated state changes.
- React Profiler before/after traces for migrated components (target: 30%+ render reduction for heavy consumers).

Initialization notes

- Clear any existing persisted progress on upgrade and initialize a clean normalized state during provider initialization; update `getWordsForList(listId)` usages to the selector-based API as part of consumer updates.

Risks & mitigations

- Risk: Breaking components assuming arrays — mitigation: compatibility selectors, incremental conversion.
- Risk: Missed memoization causing no perf win — mitigation: unit tests for action identity and per-component profiling.

Estimate

- Rough effort: 3–5 working days (split across PRs). Files touched: ~15–25. LOC ~600–1000.

---

## Epic 10 — Caching & Reliability

Purpose

- Add session-level in-memory caching for expensive async operations (CSV loads, repeated API fetches), and introduce a feature-scoped ErrorBoundary with centralized logging and a reset action.

Includes (from original):

- Async Caching & Fetch Optimization (12)
- Error Boundaries & Centralized Logging (14)

Files to add / update

- `src/features/mandarin/services/cache.ts` — small in-memory cache with TTL and optional max-entries eviction.
- Integrations: `src/features/mandarin/utils/schemaLoader.ts` and any hook/service that loads lists to consult cache.
- `src/components/ErrorBoundary.tsx` — class component with `getDerivedStateFromError` / `componentDidCatch` and fallback UI.
- `src/utils/logger.ts` — simple logging abstraction (info/warn/error) to centralize console calls and future remote logging.
- Update reducers (from Epic 9) to handle `RESET_PROGRESS` action for fallback reset.

Implementation steps (recommended PR sequence)

1. PR 10.1 — Logger & ErrorBoundary skeleton: add `utils/logger.ts` and `components/ErrorBoundary.tsx`, wire `componentDidCatch` to `logger.error` and add fallback UI with Reset button placeholder.
2. PR 10.2 — Reducer reset support: add `RESET_PROGRESS` handling in reducer(s) and tests.
3. PR 10.3 — Cache module: implement `services/cache.ts` with `get`, `set`, `prefetch`, `clear`, TTL and max-entries; unit tests for hit/miss/eviction.
4. PR 10.4 — Integrate cache into loaders/hooks and add `prefetchList(listId)` usage on page navigation; measure reduced parse/network calls.
5. PR 10.5 — Wrap feature provider (or App) with `ErrorBoundary` in staging and exercise reset workflow.

Testing & validation

- Unit tests for cache behavior (hit/miss, TTL, eviction) and reducer reset.
- Manual/CI measurement: network/parse counts for list loads before/after.
- ErrorBoundary test: intentionally throw in a child to assert fallback and Reset clears feature state.

Migration notes

- Scope ErrorBoundary to the Mandarin feature area rather than the entire app to avoid hiding unrelated bugs.

Risks & mitigations

- Risk: unbounded memory growth — mitigate using TTL and max-entries eviction.
- Risk: ErrorBoundary hides bugs — mitigate by scoping, logging, and ensuring CI tests still fail on uncaught errors in other areas.

Estimate

- Rough effort: 1–2 working days. Files touched: ~6–10. LOC ~200–400.

---

## Epic 11 — Testing & Dependency Injection

Purpose

- Improve test ergonomics by adding `test-utils` provider wrappers and allow optional dependency injection (DI) in hooks so tests can be written with fewer module mocks.

Includes (from original):

- Testing Ergonomics & Dependency Injection (13)

Files to add / update

- `src/test-utils.tsx` (or `src/features/mandarin/test-utils.tsx`) — export `Providers`, `customRender`, and `renderHookWithProviders` utilities.
- Update hooks to accept optional DI overrides (e.g., `useProgressData({ storage, fetcher } = {})`) where sensible.
- Example tests in `src/features/mandarin/hooks/__tests__/*` updated to use `customRender` / `renderHookWithProviders`.

Implementation steps (recommended PR sequence)

1. PR 11.1 — Add `test-utils.tsx` with `Providers` and `customRender`, and document usage in a short README snippet.
2. PR 11.2 — Update one or two hooks to accept DI overrides and update their tests to demonstrate the pattern.
3. PR 11.3 — Gradually convert other tests to use `customRender` and remove unnecessary `jest.mock` calls.

Testing & validation

- Ensure CI tests run and pass with the new helpers.
- Verify sample tests no longer need heavy internals mocking and are less flaky.

Risks & mitigations

- Risk: Updating many tests across the codebase — mitigate by converting high-value tests first and leaving the rest for follow-up sprints.

Estimate

- Rough effort: 0.5–1.5 working days to add helpers and convert high-value tests; more time to fully convert entire test suite.

---

## PR naming and branches (suggestions)

- `feat/epic-9-state-performance-core` — initial work and follow-up PRs with suffixes `-part-1`, `-part-2` for smaller PRs.
- `feat/epic-10-caching-reliability`
- `feat/epic-11-testing-di`

## Acceptance & rollout guidance

- Ship Epic 9 first (state + performance core). Use compatibility shims and measure with React Profiler.
- After Epic 9 stabilizes in staging, ship Epic 10 (cache + ErrorBoundary) to improve runtime reliability and reduce repeated loads.
- Ship Epic 11 in parallel or immediately after to speed up test migration and developer ergonomics.

## Notes & next steps

- This file is a draft PR body. I can split each epic into multiple smaller PR markdown files (one per PR) on demand and scaffold branch names and commit templates.

---

Generated on: 2025-10-16
