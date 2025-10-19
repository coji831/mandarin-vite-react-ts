# Epic 9: State & Performance Core

## Epic Summary

**Goal:** Move the Mandarin feature to a normalized, reducer-driven state, split state vs dispatch contexts, add selectors and memoization, and reduce unnecessary re-renders.

**Key Points:**

- Split the existing `Progress` provider into `ProgressStateContext` and `ProgressDispatchContext`.
- Normalize the progress/vocabulary shape (byId + ids) and convert provider internals to `useReducer`. Any existing persisted progress will be cleared on upgrade and the provider will initialize a clean normalized state.
- Add stable action hooks (`useProgressActions`) and selector hooks (`useProgressState(selector)`) to reduce re-renders.
- Provide `useProgressState(selector)` and `useProgressActions()` as the public API; update consumers to use them.
- Add reducer unit tests and hook tests to validate action stability and selector correctness.

**Status:** Planned

**Last Update:** 2025-10-16

## Background

The Mandarin feature currently uses a context/provider that exposes combined state and actions. This causes many consumers to re-render on unrelated updates and makes the state shape harder to test and reason about. Normalizing the data and splitting state vs dispatch contexts will enable O(1) updates for common operations (e.g., mark word learned), allow memoized selectors, and improve testability.

## User Stories

1. #XXXX / **Provider split & new hooks**

   - As a developer, I want the progress provider split into state and dispatch contexts, so that components can subscribe only to the state they need and avoid unnecessary re-renders.

2. #XXXX / **Normalize progress data**

   - As a developer, I want progress data in a normalized shape (byId + ids), so that updates like marking a word learned operate in O(1).

3. #XXXX / **Selectors & stable actions**

   - As a developer, I want `useProgressState(selector)` and `useProgressActions()` that return memoized values, so components receive stable references and re-render less frequently.

<!-- Add story issue numbers when available -->

## Story Breakdown Logic

- Stories 9.1–9.2: Types and reducer skeletons (low-risk, no consumer changes).
- Stories 9.3–9.4: Provider conversion to `useReducer` and introduction of split contexts and hooks.
- Stories 9.5: Sub-reducer decomposition and final cleanup after consumers are updated.

Rationale: Group low-risk infra changes first (types, reducer) to make subsequent consumer updates safe and incremental.

## Acceptance Criteria

- [ ] Provider exposes `useProgressState(selector)` and `useProgressActions()`.
- [ ] `MARK_WORD_LEARNED` updates normalized state in O(1) with accompanying unit test.
- [ ] Action functions returned from `useProgressActions()` are stable across unrelated state changes (testable via hook tests).
- [ ] Two high-frequency components (e.g., `VocabularyCard`, `ConversationTurns`) show measurable reduced render counts in React Profiler after conversion.
- [ ] Reducer and selector unit tests cover edge cases (restore/restore-from-legacy, reset, empty lists).
- [ ] Implementation PRs for steps 9.1–9.4 include or reference the required files listed in `docs/business-requirements/epic-9-state-performance-core/implementation/missing-scope.md` and tick the verification checklist in the PR description.

## Architecture Decisions

- Decision: Normalized state (byId + ids)

  - Rationale: O(1) updates for individual items and simpler identity checks for memoization.
  - Alternatives considered: Keep array-based shape with memoized selectors (more conversion friction).
  - Implications: Persisted legacy progress will be cleared on upgrade; provider should initialize a clean normalized state (reset at boot).

- Decision: Split state vs dispatch contexts

  - Rationale: Avoid rerenders by letting consumers subscribe only to state or dispatch.
  - Alternatives considered: Keep single context and use deep selectors (less ergonomic).

## Implementation Plan

1. PR 9.1 — Types & reducer skeletons: add `types/Progress.ts` and reducer skeletons with tests.
2. PR 9.2 — Provider -> `useReducer`: wire provider to `useReducer` and ensure persisted legacy progress is cleared during initialization.
3. PR 9.3 — Split contexts & hooks: add `ProgressStateContext`/`ProgressDispatchContext`, `useProgressState(selector)` and `useProgressActions()`; convert 2–3 heavy components.
4. PR 9.4 — Sub-reducer decomposition: implement `rootReducer` and sub-reducers (`listsReducer`, `userReducer`, `uiReducer`) and tests.
5. PR 9.5 — Cleanup: remove compatibility shim and finalize docs/tests.

## Risks & mitigations

- Risk: Breaking components that assume array shapes — Severity: Medium

  - Mitigation: Provide `getWordsForList(listId)` selector to ease consumer updates; if regression occurs, rollback the staged release and fix the issue.

- Risk: No measurable perf benefits due to missed memoization — Severity: Medium

  - Mitigation: Add unit tests for action stability and run React Profiler traces during migration; convert the heaviest consumers first.

## Implementation notes

- Conventions: follow `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md`.
- Operational notes: Prefer staged rollouts and feature-branch deployments for verification in staging; convert consumers incrementally to the new hooks.
- Links: Use templates in `docs/templates/` for PR and design files. Reference the consolidated epic docs in `docs/business-requirements/`.
- Verification note: The detailed missing-scope list currently lives in the "Missing scope (source scan)" section below in this README; reviewers should confirm PRs include the relevant files from that list. Developers may optionally extract that list into `docs/business-requirements/epic-9-state-performance-core/implementation/missing-scope.md` as part of their implementation PR, but creating that file is not required by this epic.

### Missing scope (source scan)

Short summary: the codebase already includes a legacy `Progress` provider, CSV/schema loaders, and helpers. The conversion to a normalized, reducer-driven design requires creating a small set of infra files, updating provider and consumer code, and adding targeted tests. Note: persisted progress will be cleared during upgrade (system reset) rather than transformed to the new shape. Add the following items to PRs 9.1–9.4 so implementation work is complete and reviewable.

- Files to create (minimal purpose)

  - `src/features/mandarin/types/ProgressNormalized.ts` — canonical normalized types (byId / ids) and action types.
  - `src/features/mandarin/reducers/progressReducer.ts` — reducer implementing normalized updates (with unit tests).
  - `src/features/mandarin/reducers/index.ts` or `rootReducer.ts` — combine sub-reducers and export initial state.
  - `src/features/mandarin/reducers/{lists,user,ui}Reducer.ts` — sub-reducers planned for PR 9.4.
  - `src/features/mandarin/services/cache.ts` — small in-memory TTL cache (maxEntries + eviction) for high-frequency services.
  - `src/test-utils.tsx` — `Providers` test wrapper and `customRender` helper for hook/component tests.
  - `src/components/ErrorBoundary.tsx` and `src/utils/logger.ts` — capture and collect runtime errors during testing.
  - `src/features/mandarin/hooks/{useProgressState,useProgressActions}.ts` — selector hook + stable action hooks (public API after conversion).
  - `src/features/mandarin/hooks/useProgressContext.ts` — update internals to expose `useProgressState` and `useProgressActions`, and provide transitional selectors (e.g., `getWordsForList`) if needed.

- Files to update (key areas)

  - `src/features/mandarin/context/ProgressContext.tsx` — convert provider internals to `useReducer`, split state/dispatch contexts, and initialize a clean normalized state by clearing any legacy persisted progress on boot.
  - `src/router/Router.tsx` — ensure provider wiring (state + dispatch) is mounted consistently at the app root.
  - Heavy consumer components (update incrementally):
    - `src/features/mandarin/components/vocabularycard.tsx`
    - `src/features/mandarin/components/conversationturns.tsx`
    - `src/features/mandarin/components/flashcard.tsx`
    - `src/features/mandarin/pages/FlashCardPage.tsx`
    - `src/features/mandarin/pages/VocabularyListPage.tsx`
    - `src/features/mandarin/components/navbar.tsx`, `sidebar.tsx`
  - `src/features/mandarin/hooks/useProgressContext.ts` — either adapt implementation to the new internals or deprecate in favor of the new selector/action hooks; update tests to use `test-utils`.
  - CSV/schema loader sites: update `src/features/mandarin/utils/schemaloader.ts` and importers to transform public CSV data into normalized types on load.

- Post-conversion deprecations (remove later)

- Legacy flattened `types/Progress.ts` (move to `types/legacy/` or remove once no consumers use it).
- Legacy single-export `ProgressContext` API (remove after consumers use the new hooks).

- Tests to add or update
  - Reducer unit tests: `src/features/mandarin/reducers/__tests__/*` (init, mark-word-learned, reset, empty-state/clear-state edge cases).
  - Hook tests: `useProgressActions` identity stability; `useProgressState(selector)` correctness.
  - Integration tests with `test-utils` to assert render-count improvements for heavy consumers (profiler snapshots or render counters).

Phasing: include these items across PRs 9.1–9.4 (9.1: types + reducer skeletons + tests; 9.2: provider -> useReducer; 9.3: split contexts + hooks + convert heavy consumers; 9.4: sub-reducers + cleanup plan).
