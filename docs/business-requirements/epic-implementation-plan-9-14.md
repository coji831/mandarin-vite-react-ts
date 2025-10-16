# Implementation Plan: Epics 9–14 (Optimize Re-Renders → Error Boundaries)

This document consolidates the phased implementation plan for the six epics created under `docs/business-requirements/epic-9` through `epic-14`. It completes the todo list and provides an actionable roadmap, file-level edits, tests, migration steps, and validation criteria. The goal is to incrementally improve the current Mandarin feature state management while preserving compatibility with the existing codebase.

---

## Summary of Epics (quick reference)

- Epic 9 — Optimize Re-Renders (split contexts, memoize actions, selectors)
- Epic 10 — Normalize Data & Improve Reducer Granularity
- Epic 11 — Sub-Reducers & Granular Actions (combineReducers)
- Epic 12 — Async Caching & Fetch Optimization
- Epic 13 — Testing Ergonomics & Dependency Injection
- Epic 14 — Error Boundaries & Centralized Logging

---

## Overall constraints & conventions

- Use TypeScript + ESM React patterns (hooks, contexts). Do not add external runtime dependencies.
- Keep changes backward compatible during migration using compatibility wrappers and shims.
- Prioritize low-risk, high-value work first (Phase 1 → Phase 6).
- Keep provider API stable while moving consumers incrementally.

---

## Phase-by-phase plan (detailed)

### Epic 9 — Optimize Re-Renders (Phase 1)

Goal: split contexts to state & actions, add selectors, memoize all action values.

Files to change / add

- `src/features/mandarin/context/ProgressContext.tsx` — replace single context with `ProgressStateContext` and `ProgressDispatchContext`, add `useProgressState(selector)` and `useProgressActions()` and a compatibility wrapper `useProgressContextCompat()`.
- `src/features/mandarin/context/index.tsx` — export the new hooks.
- Update key consumers gradually (see migration below).

Implementation steps

1. Implement the two contexts and provider (see code snippet in repo docs). Keep `useProgressData()` as the source of truth inside provider.
2. Memoize `state` and `actions` using `useMemo`, keeping lists of dependencies explicit.
3. Add `useProgressState(selector)` and `useProgressActions()` helpers.
4. Keep `useProgressContextCompat()` export that returns `{...state, ...actions}` for compatibility.
5. Update `src/features/mandarin/hooks/useMandarinContext.ts` to optionally compose from the new hooks.

Testing & validation

- Unit test to assert `useProgressActions()` returns stable function references across unrelated state changes.
- Use React Profiler on the vocabulary page to measure render counts before/after migrating a single heavy component.

Migration notes

- Convert high-frequency render components first (e.g., `VocabularyCard.tsx`, `ConversationTurns.tsx`) to use selectors.
- Keep compatibility wrapper until all components updated.

Estimated time: 1–2 days

---

### Epic 10 — Normalize Data & Improve Reducer Granularity (Phase 2)

Goal: normalize vocabulary and progress storage and move heavy mutations to pure reducers.

Files to change / add

- `src/features/mandarin/hooks/useProgressContext.ts` — migrate internal state to `useReducer` with normalized shape.
- `src/features/mandarin/reducers/progressReducer.ts` — new reducer implementation.
- `src/features/mandarin/utils/progressHelpers.ts` — migration helpers for persistent storage conversion.

Implementation steps

1. Define normalized types: `lists: Record<string, { ids: string[]; byId: Record<string, Word> }>` and `masteredByList: Record<string, Record<string, boolean>>`.
2. Implement `progressReducer` with actions (`MARK_WORD_LEARNED`, `SET_SELECTED_LIST`, `RESTORE_PROGRESS`, etc.).
3. Update `useProgressData()` to use `useReducer(progressReducer, initialState)` and keep side-effects (localStorage sync) inside `useEffect` hooks triggered by state.
4. Provide derived selectors for compatibility, e.g., `getWordsForList(listId)` returning arrays.

Testing & validation

- Reducer unit tests for each action.
- Integration test ensuring migration converts old persisted data correctly.

Migration notes

- Keep `getWordsForList()` until components are converted to use normalized shapes directly.

Estimated time: 2–3 days

---

### Epic 11 — Sub-Reducers & Granular Actions (Phase 3)

Goal: split root reducer into manageable sub-reducers to reduce coupling and make testing easier.

Files to change / add

- `src/features/mandarin/reducers/rootReducer.ts`
- `src/features/mandarin/reducers/listsReducer.ts`
- `src/features/mandarin/reducers/userReducer.ts`
- `src/features/mandarin/reducers/uiReducer.ts`
- Update `useProgressData()` to dispatch to the root reducer.

Implementation steps

1. Implement `combineReducers` helper that merges sub-states by key.
2. Move list-specific logic (word map updates) to `listsReducer`.
3. Move identity and per-user state to `userReducer`.
4. Keep UI flags (loading, error) in `uiReducer` or keep them in the top-level for simplicity.

Testing & validation

- Unit tests per reducer.
- Ensure no behavioral changes via integration tests.

Estimated time: 1–2 days

---

### Epic 12 — Async Caching & Fetch Optimization (Phase 4)

Goal: add an in-memory cache for expensive fetch/parse operations (CSV, TTS calls) to reduce runtime overhead.

Files to change / add

- `src/features/mandarin/services/cache.ts`
- Integrate cache calls in `src/features/mandarin/hooks/*` where CSV or network calls occur.

Implementation steps

1. Implement a small cache module (getCached, setCached, clearCache) with TTL.
2. Wrap CSV loaders and API calls to check cache first.
3. Provide `prefetchList(listId)` to warm cache on page navigation.

Testing & validation

- Unit tests for cache behavior (hit/miss/eviction).
- Measure parse/network call counts before/after in staging.

Estimated time: 0.5–1 day

---

### Epic 13 — Testing Ergonomics & Dependency Injection (Phase 5)

Goal: make tests easier to write and less dependent on heavy module mocking.

Files to change / add

- `src/test-utils.tsx` or `src/features/mandarin/test-utils.tsx` (shared provider wrapper)
- Optionally update `useProgressData` and other hooks to accept optional dependency overrides (DI) for storage/fetch.

Implementation steps

1. Add `Providers` wrapper that mounts `UserIdentityProvider`, `ProgressProvider`, `VocabularyProvider`.
2. Export `customRender` from `src/test-utils.tsx` and document usage.
3. Add an example test: `useProgressData` hook tested via `renderHook` with the `Providers` wrapper.
4. Update existing tests to use `customRender` where beneficial.

Testing & validation

- Ensure tests run in CI unchanged; new tests reduce the need for `jest.mock()` in many cases.

Estimated time: 0.5–1 day

---

### Epic 14 — Error Boundaries & Centralized Logging (Phase 6)

Goal: add ErrorBoundary and a tiny logger utility; expose a reset action from the dispatch context.

Files to change / add

- `src/components/ErrorBoundary.tsx`
- `src/utils/logger.ts` (simple abstraction over `console`)
- Optionally add `reset` action to `ProgressDispatchContext` to clear state on fallback.

Implementation steps

1. Create class-based ErrorBoundary with `getDerivedStateFromError` and `componentDidCatch` (call `logger.error` in `componentDidCatch`).
2. Add fallback UI with a Reset button that calls a `reset` action exposed by `useProgressActions()`.
3. Wrap the Mandarin providers (or App) in `ErrorBoundary`.

Testing & validation

- Throw a test error inside a child component and assert fallback is shown and reset clears state.

Estimated time: 0.5 day

---

## Migration strategy & rollout plan

1. Implement Epic 9 fully with compatibility wrappers. Deploy to staging.
2. Convert 2–4 heaviest components to selectors, measure performance improvements, and fix any regressions.
3. Implement Epic 10 (normalize) using reducers while keeping selectors to provide array shapes.
4. Implement Epic 11 (split reducers) after Epic 10 is stable.
5. Implement Epic 12–14 (cache, testing, error boundary) — these are lower risk and can be landed incrementally.

Feature-flagging

- Use `window.__MANDARIN_STATE_MIGRATION__ = true` (or env var) to gate the new provider during initial staging rollout if desired.

Backout plan

- If a change introduces regressions, revert the provider to the compatibility shim (`useProgressContextCompat`) and disable migration flag.

---

## Tests and validation checklist (CI)

- Lint and TypeScript checks - `npm run lint` and `npm run typecheck` (if present).
- Unit tests: run specific reducer tests and hook tests.
- Integration tests: run the React Testing Library tests for key pages.
- Manual/CI profiling: run the app in staging and capture React Profiler traces for the vocabulary page.

---

## File-level change summary (one-liners)

- Add `src/features/mandarin/context/ProgressContext.tsx` — split state/dispatch & compatibility shim.
- Create `src/features/mandarin/reducers/progressReducer.ts` and `rootReducer.ts` (and other sub-reducers) as needed.
- Add `src/features/mandarin/services/cache.ts` for TTL caching.
- Add `src/components/ErrorBoundary.tsx` and `src/utils/logger.ts`.
- Add `src/test-utils.tsx` and update tests to use `customRender`.

---

## Acceptance metrics

- Render count reduction: target 30–70% reduction for components previously re-rendering on unrelated updates.
- Faster single-item updates: marking a word learned should be O(1) in normalized shape.
- Test hygiene: fewer global module mocks; more tests using providers.
- Error handling: caught UI errors show fallback and can reset feature state.

---

## Next tasks I can perform for you

- Apply Epic 9 code changes (edit `ProgressContext.tsx`, exports, and add compatibility wrapper) and run TypeScript and tests.
- Run a repo search for `useProgressContext` usages and generate a migration patch for callers to use `useProgressState` / `useProgressActions`.
- Create example tests and reducer unit tests based on snippets above.

Tell me which of the next tasks you want me to do and I’ll start implementing it right away.
