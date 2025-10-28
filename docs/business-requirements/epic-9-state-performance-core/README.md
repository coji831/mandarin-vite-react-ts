# Epic 9: State & Performance Core

## Epic Summary

**Goal:** Move the Mandarin feature to a normalized, reducer-driven state, split state vs dispatch contexts, add selectors and memoization, and reduce unnecessary re-renders.

**Key Points:**

- Split the existing `Progress` provider into `ProgressStateContext` and `ProgressDispatchContext`.
- Normalize the progress/vocabulary shape (byId + ids) and convert provider internals to `useReducer`. Any existing persisted progress will be cleared on upgrade and the provider will initialize a clean normalized state.
- Add stable action hooks (`useProgressActions`) and selector hooks (`useProgressState(selector)`) to reduce re-renders.
- Provide `useProgressState(selector)` and `useProgressActions()` as the public API; update consumers to use them.
- Add reducer unit tests and hook tests to validate action stability and selector correctness.

**Status:** Completed

**Last Update:** 2025-10-16

## Background

The Mandarin feature currently uses a context/provider that exposes combined state and actions. This causes many consumers to re-render on unrelated updates and makes the state shape harder to test and reason about. Normalizing the data and splitting state vs dispatch contexts will enable O(1) updates for common operations (e.g., mark word learned), allow memoized selectors, and improve testability.

## Stories

1. [Story 9.1 — Types & Reducer Skeletons](./story-9-1-types-reducer-skeletons.md)

Add canonical normalized types and reducer skeletons for the Mandarin progress domain so downstream work can rely on a stable type surface and unit tests can exercise reducer behavior.

2. [Story 9.2 — Provider -> useReducer](./story-9-2-provider-useReducer.md)

Convert the existing `Progress` provider internals to `useReducer`, ensure initialization clears legacy persisted progress, and export `initialState` for tests.

3. [Story 9.3 — Split Contexts & Hooks](./story-9-3-split-contexts-hooks.md)

Introduce `ProgressStateContext` and `ProgressDispatchContext`, implement `useProgressState(selector)` and `useProgressActions()`, and convert 2–3 heavy consumers to the new hooks.

4. [Story 9.4 — Sub-Reducer Decomposition](./story-9-4-sub-reducer-decomposition.md)

Refactor the large progress reducer into sub-reducers (`listsReducer`, `userReducer`, `uiReducer`) and compose them into a `rootReducer` for improved testability.

5. [Story 9.5 — Cleanup & Finalization (no migration)](./story-9-5-cleanup-finalization.md)

Finalize cleanup: deprecate or remove legacy types/APIs and complete documentation and tests. Persisted progress will be reset on upgrade (no migration shim).

<!-- Add story issue numbers when available -->

## Story Breakdown Logic

- Stories 9.1–9.2: Types and reducer skeletons (low-risk, no consumer changes).
- Stories 9.3–9.4: Provider conversion to `useReducer` and introduction of split contexts and hooks.
- Stories 9.5: Sub-reducer decomposition and final cleanup after consumers are updated.

Rationale: Group low-risk infra changes first (types, reducer) to make subsequent consumer updates safe and incremental.

## Acceptance Criteria

- [x] Provider exposes `useProgressState(selector)` and `useProgressActions()`.
- [x] `MARK_WORD_LEARNED` updates normalized state in O(1) with accompanying unit test.
- [x] Action functions returned from `useProgressActions()` are stable across unrelated state changes (testable via hook tests).
- [x] Two high-frequency components (e.g., `VocabularyCard`, `ConversationTurns`) show measurable reduced render counts in React Profiler after conversion.
- [x] Reducer and selector unit tests cover edge cases (restore/restore-from-legacy, reset, empty lists).
- [x] Implementation PRs for steps 9.1–9.4 include or reference the required files listed in the implementation doc (`docs/issue-implementation/epic-9-state-performance-core/README.md` → "Missing scope (source scan)") and tick the verification checklist in the PR description.

## Architecture Decisions

- Decision: Normalized state (byId + ids)

  - Rationale: O(1) updates for individual items and simpler identity checks for memoization.
  - Alternatives considered: Keep array-based shape with memoized selectors (more conversion friction).
  - Implications: Persisted legacy progress will be cleared on upgrade; provider should initialize a clean normalized state (reset at boot).

- Decision: Split state vs dispatch contexts

  - Rationale: Avoid rerenders by letting consumers subscribe only to state or dispatch.
  - Alternatives considered: Keep single context and use deep selectors (less ergonomic).

## Implementation Plan

- Types & reducer skeletons: add `types/Progress.ts` and reducer skeletons with tests.
- Provider -> `useReducer`: wire provider to `useReducer` and ensure persisted legacy progress is cleared during initialization.
- Split contexts & hooks: add `ProgressStateContext`/`ProgressDispatchContext`, `useProgressState(selector)` and `useProgressActions()`; convert 2–3 heavy components.
- Sub-reducer decomposition: implement `rootReducer` and sub-reducers (`listsReducer`, `userReducer`, `uiReducer`) and tests.
- Cleanup: finalize docs/tests.

## Risks & mitigations

- Risk: Breaking components that assume array shapes — Severity: Medium

  - Mitigation: Provide `getWordsForList(listId)` selector to ease consumer updates; if regression occurs, rollback the staged release and fix the issue.

- Risk: No measurable perf benefits due to missed memoization — Severity: Medium

  - Mitigation: Add unit tests for action stability and run React Profiler traces during migration; convert the heaviest consumers first.

## Implementation notes

- Conventions: follow `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md`.
- Operational notes: Prefer staged rollouts and feature-branch deployments for verification in staging; convert consumers incrementally to the new hooks.
- Links: Use templates in `docs/templates/` for PR and design files. Reference the consolidated epic docs in `docs/business-requirements/`.
- Implementation details and the verified missing-scope checklist live in the implementation README: `docs/issue-implementation/epic-9-state-performance-core/README.md` (see the "Missing scope (source scan)" section there). Reviewers should confirm PRs include the relevant files listed in that section; implementers may optionally extract the list into a separate implementation file in their PR if desired, but it is not required by this epic.
