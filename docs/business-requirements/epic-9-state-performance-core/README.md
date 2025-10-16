# Epic 9: State & Performance Core

## Epic Summary

**Goal:** Move the Mandarin feature to a normalized, reducer-driven state, split state vs dispatch contexts, add selectors and memoization, and reduce unnecessary re-renders.

**Key Points:**

- Split the existing `Progress` provider into `ProgressStateContext` and `ProgressDispatchContext`.
- Normalize the progress/vocabulary shape (byId + ids) and migrate provider internals to `useReducer`.
- Add stable action hooks (`useProgressActions`) and selector hooks (`useProgressState(selector)`) to reduce re-renders.
- Provide a compatibility shim `useProgressContextCompat()` during migration to avoid breaking consumers.
- Add reducer unit tests and hook tests to validate action stability and selector correctness.

**Status:** Planned

**Last Update:** 2025-10-16

## Background

The Mandarin feature currently uses a context/provider that exposes combined state and actions. This causes many consumers to re-render on unrelated updates and makes the state shape harder to test and reason about. Normalizing the data and splitting state vs dispatch contexts will enable O(1) updates for common operations (e.g., mark word learned), allow memoized selectors, and improve testability.

## User Stories

1. #XXXX / **Provider split & compatibility shim**

   - As a developer, I want the progress provider split into state and dispatch contexts, so that components can subscribe only to the state they need and avoid unnecessary re-renders.

2. #XXXX / **Normalize progress data**

   - As a developer, I want progress data in a normalized shape (byId + ids), so that updates like marking a word learned operate in O(1).

3. #XXXX / **Selectors & stable actions**

   - As a developer, I want `useProgressState(selector)` and `useProgressActions()` that return memoized values, so components receive stable references and re-render less frequently.

<!-- Add story issue numbers when available -->

## Story Breakdown Logic

- Stories 9.1–9.2: Types and reducer skeletons (low-risk, no consumer changes).
- Stories 9.3–9.4: Provider migration to `useReducer` + compatibility shim and introduction of split contexts and hooks.
- Stories 9.5: Sub-reducer decomposition and removal of compatibility shim after consumers are migrated.

Rationale: Group low-risk infra changes first (types, reducer) to make subsequent consumer migration safe and incremental.

## Acceptance Criteria

- [ ] Provider exposes `useProgressState(selector)` and `useProgressActions()` in addition to the compatibility shim.
- [ ] `MARK_WORD_LEARNED` updates normalized state in O(1) with accompanying unit test.
- [ ] Action functions returned from `useProgressActions()` are stable across unrelated state changes (testable via hook tests).
- [ ] Two high-frequency components (e.g., `VocabularyCard`, `ConversationTurns`) show measurable reduced render counts in React Profiler after migration.
- [ ] Reducer and selector unit tests cover edge cases (restore/restore-from-legacy, reset, empty lists).

## Architecture Decisions

- Decision: Normalized state (byId + ids)

  - Rationale: O(1) updates for individual items and simpler identity checks for memoization.
  - Alternatives considered: Keep array-based shape with memoized selectors (more migration friction).
  - Implications: Need a migration helper to convert persisted legacy shape to normalized shape on boot.

- Decision: Split state vs dispatch contexts

  - Rationale: Avoid rerenders by letting consumers subscribe only to state or dispatch.
  - Alternatives considered: Keep single context and use deep selectors (less ergonomic).

## Implementation Plan

1. PR 9.1 — Types & reducer skeletons: add `types/Progress.ts` and reducer skeletons with tests.
2. PR 9.2 — Provider -> `useReducer`: wire provider to `useReducer` and keep compatibility shim.
3. PR 9.3 — Split contexts & hooks: add `ProgressStateContext`/`ProgressDispatchContext`, `useProgressState(selector)` and `useProgressActions()`; migrate 2–3 heavy components.
4. PR 9.4 — Sub-reducer decomposition: implement `rootReducer` and sub-reducers (`listsReducer`, `userReducer`, `uiReducer`) and tests.
5. PR 9.5 — Cleanup: remove compatibility shim and finalize docs/tests.

## Risks & mitigations

- Risk: Breaking components that assume array shapes — Severity: Medium

  - Mitigation: Provide `getWordsForList(listId)` compatibility selector and perform incremental migration.
  - Rollback: Re-enable compatibility shim and revert provider changes if regression is detected in staging.

- Risk: No measurable perf benefits due to missed memoization — Severity: Medium

  - Mitigation: Add unit tests for action stability and run React Profiler traces during migration; convert the heaviest consumers first.

## Implementation notes

- Conventions: follow `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md`.
- Operational notes: Keep migration behind compatibility until all consumers are migrated; consider a runtime migration flag (`window.__MANDARIN_STATE_MIGRATION__`).
- Links: Use templates in `docs/templates/` for PR and design files. Reference the consolidated epic docs in `docs/business-requirements/`.

---

Generated on: 2025-10-16
