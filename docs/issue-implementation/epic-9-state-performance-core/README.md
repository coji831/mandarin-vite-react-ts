# Implementation epic-9: State & Performance Core

This document follows `docs/templates/implementation-large-epic-template.md` (structure-aligned; headings kept human-friendly).

## Epic Summary

**Goal:** Implement a normalized, reducer-driven state for the Mandarin feature, split state vs dispatch contexts, add selector/action hooks, and incrementally convert heavy consumers to reduce re-renders.

**Key Points:**

- Convert provider internals to `useReducer` and export `initialState` for consumers and tests.
- Normalize domain types (byId + ids) and expose stable selector/action hooks.
- Decompose the large reducer into sub-reducers for maintainability.
- Prepare release notes and staged rollout that documents reset behavior for persisted progress.

**Status:** Planned

## Technical Overview

**Implementation Goal:** Replace the legacy flattened provider with a reducer-driven normalized state, export a stable public hook API (`useProgressState(selector)`, `useProgressActions()`), and ensure tests and release procedures cover the reset behavior.

**Status:** Planned

**Last Update:** 2025-10-19

## Architecture Decisions

1. Normalized state (byId + ids)

   - Rationale: O(1) updates and simpler memoization.
   - Alternatives considered: array-based shape with memoized selectors (rejected due to higher conversion friction).

2. Split state vs dispatch contexts

   - Rationale: reduce rerenders by allowing consumers to subscribe only to state or dispatch.

3. No migration shim — reset persisted progress on upgrade

   - Rationale: implementing a one-off migration path is higher cost and risky; reset behavior simplifies correctness. Must be clearly documented in release notes.

## Technical Implementation

### Architecture

Client → App Provider wiring → `Progress` provider (useReducer + rootReducer) → Contexts (ProgressStateContext / ProgressDispatchContext)

### API Endpoints (if applicable)

N/A — this epic does not add HTTP API endpoints.

### Files to create (minimal purpose)

- `src/features/mandarin/types/ProgressNormalized.ts` — normalized types and action type declarations.
- `src/features/mandarin/reducers/progressReducer.ts` — reducer implementing normalized updates and action handling.
- `src/features/mandarin/reducers/index.ts` — compose sub-reducers and export `rootReducer` and `initialState`.
- `src/features/mandarin/reducers/listsReducer.ts`, `userReducer.ts`, `uiReducer.ts` — sub-reducers.
- `src/features/mandarin/hooks/useProgressState.ts` and `useProgressActions.ts` — public selector/action hooks.
- `src/features/mandarin/services/cache.ts` — optional in-memory TTL cache for hot lookups.

### Files to update

- `src/features/mandarin/context/ProgressContext.tsx` — wire to `useReducer`, split contexts, clear legacy persisted progress on init.
- `src/features/mandarin/hooks/useProgressContext.ts` — adapt internals or mark deprecated in favor of new hooks.
- Heavy consumer components (migrated incrementally):
  - `src/features/mandarin/components/VocabularyCard.tsx`
  - `src/features/mandarin/components/ConversationTurns.tsx`
  - `src/features/mandarin/components/Flashcard.tsx`
  - `src/features/mandarin/pages/FlashCardPage.tsx`
  - `src/features/mandarin/pages/VocabularyListPage.tsx`

### Verification & QA

- Reviewer checklist (copy into PR description):

  - [ ] Files created per Missing scope are present
  - [ ] Unit tests for reducers cover init, update, reset edge cases
  - [ ] Hook tests validate action stability and selector correctness
  - [ ] Converted consumers show reduced render counts (React Profiler or render counters)
  - [ ] Release notes mention reset behavior and user impact

CI: keep Jest until a Vitest migration guide is validated in CI. If a conversion is attempted, add a `test:vitest` script and validate on a forked CI run before replacing the main `test` script.

### Deployment & Rollout

- Stage PRs one-at-a-time: 9.1 → 9.2 → 9.3 → 9.4 → 9.5. Run QA in staging for each PR and verify no visible regressions.
- If a regression is discovered, revert the PR and fix the underlying issue before re-applying.

### Rollback and Recovery

- If user data loss occurs (unexpected reset), provide scripts to re-ingest CSV data and document the process in `docs/issue-implementation/epic-9-state-performance-core/restore.md` (create as-needed during recovery).

### Notes

This implementation doc focuses on the technical deliverables and rollout plan. Test strategy and test scaffolding may be added by implementers in their PRs as needed but are intentionally omitted from this plan.

## Implementation Steps

1. PR 9.1 — Types & Reducer Skeletons

   - Add `ProgressNormalized.ts`, reducer skeletons, and exported `initialState`.

2. PR 9.2 — Provider → `useReducer`

   - Convert `ProgressContext` internals to `useReducer` and split contexts.
   - Ensure initialization clears any legacy persisted progress and exports `initialState`.

3. PR 9.3 — Split Contexts & Hooks

   - Implement `useProgressState(selector)` and `useProgressActions()`.
   - Convert 2–3 heavy consumers and validate render reduction.

4. PR 9.4 — Sub-Reducer Decomposition

   - Implement `listsReducer`, `userReducer`, `uiReducer` and compose `rootReducer`.

5. PR 9.5 — Cleanup & Finalization

   - Remove/deprecate legacy types and compatibility shims.
   - Finalize tests, update docs, and prepare release notes documenting reset behavior.

---

This implementation doc follows the project's implementation template and provides the technical plan, missing scope, tests, and rollout guidance for Epic 9.
