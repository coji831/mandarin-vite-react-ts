# Epic 17: State Restructure & Zustand Migration

## Epic Summary

**Goal:** Restructure frontend and backend module boundaries to eliminate cross-feature coupling, extract progress tracking into its own feature, and migrate frontend state from Context+Reducers to Zustand — establishing a clean architecture that can support 6+ upcoming epics without bloat.

**Key Points:**

- **Extract progress from quiz** — Create `features/progress/` (frontend) and `modules/progress/` (backend). Progress is cross-cutting (quiz, reading, radicals all generate it), not quiz-specific.
- **Move cross-cutting state to shared** — `uiReducer` and `userReducer` from `features/quiz/` to `shared/store/`. These are mechanical/technical, not domain-specific.
- **Decouple vocabulary list state** — Remove `listReducer` import from quiz's `rootReducer.ts`. Each feature owns its own state.
- **Replace Context+Reducers with Zustand** — 5 stores (progress, quizSession, vocabulary lists, UI, user) instead of 4 reducer files + 3 context providers + rootReducer. ~75 lines per set → ~35 lines per store. No provider nesting.
- **Backend module extraction** — Move `ProgressController`, `ProgressService`, `ProgressRepository`, `StreakService` from `modules/quiz/` to new `modules/progress/`. Add generic `POST /api/progress/event` endpoint for cross-feature progress recording.
- **Provider cleanup** — Remove `ProgressProvider` from `LearnLayout`. Zustand needs no providers.
- **Boundary enforcement** — Add ESLint `no-restricted-imports` rule to prevent cross-feature imports.
- Estimated at **~9 days total** (2d restructure + 4d Zustand migration + 2d backend extraction + 1d cleanup).

**Status:** Planned

**Last Update:** June 16, 2026

## Background

## User Stories

This epic consists of the following user stories:

1. **Story 17.1: State Ownership Restructure** _(link to `story-17-1-state-ownership-restructure.md`)_
   - As a developer, I want to move ui/user slices to shared/store and decouple listReducer from quiz rootReducer, so that cross-feature state coupling is eliminated.

2. **Story 17.2: Extract Progress Feature (Frontend)** _(link to `story-17-2-extract-progress-feature.md`)_
   - As a developer, I want to extract progress tracking from features/quiz into its own features/progress/ with a Zustand store and public `useRecordActivity()` hook, so that quiz, reading, and radicals can all record progress without cross-feature imports.

3. **Story 17.3: Extract Progress Module (Backend)** _(link to `story-17-3-extract-progress-module.md`)_
   - As a developer, I want to extract ProgressController, ProgressService, StreakService, and their repositories from modules/quiz/ into a new modules/progress/ with a generic POST /api/progress/event endpoint, so that the backend progress API is feature-agnostic.

4. **Story 17.4: Zustand Migration (Quiz + Vocabulary)** _(link to `story-17-4-zustand-migration-quiz-vocabulary.md`)_
   - As a developer, I want to migrate quizReducer and listReducer to Zustand stores in their respective features, so that quiz and vocabulary state management have less boilerplate and DevTools support.

5. **Story 17.5: Zustand Migration (UI + User + Progress)** _(link to `story-17-5-zustand-migration-ui-user-progress.md`)_
   - As a developer, I want to migrate uiReducer, userReducer, and the new progress store to Zustand, so that all state management is consistent across the application.

6. **Story 17.6: Provider Cleanup & Boundary Enforcement** _(link to `story-17-6-provider-cleanup-boundary-enforcement.md`)_
   - As a developer, I want to remove monolithic ProgressProvider from LearnLayout, clean up dead provider nesting, and add ESLint rules, so that the modular monolith pattern is enforced automatically.
7. **Story 17.7: Content Browser Infrastructure** _(link to `story-17-7-content-browser-infrastructure.md`)_
   - As a **developer**, I want to **build the shared Content Browser component — a unified mixed-card grid with type badges, search bar, filter dropdowns, and tab-based filtering**, so that **all Phase 1-4 content types share a consistent browsing interface**. Replaces the existing VocabularyListPage.

## Story Breakdown Logic

This epic is divided into stories based on the following approach:

- **Story 17.1** restructures ownership first (safest — no library change, no backend change)
- **Stories 17.2-17.3** extract progress from quiz on frontend and backend (architectural fix — progress is cross-cutting, not quiz-specific)
- **Stories 17.4-17.5** migrate to Zustand slice by slice (quiz+vocabulary first, then UI+user+progress)
- **Story 17.6** cleans up providers and hardens boundaries with ESLint
- **Story 17.7** builds the shared Content Browser component replacing VocabularyListPage — provides the base card grid, search, and filtering infrastructure that all Phase 1-4 content tabs consume

The progress extraction (17.2-17.3) must happen before or alongside the Zustand migration (17.4-17.5), because the progress store target location differs from where progressReducer currently lives. Story 17.7 can be done in parallel with 17.4-17.6 as it touches different files.

## Acceptance Criteria

## Architecture Decisions

- **Decision:** Progress as dedicated feature (not shared store, not in quiz)
  - **Rationale:** Progress is a cross-cutting **domain** concept (quiz, reading, radicals all generate it), not mechanical/technical. It needs its own components, services, and backend module. A shared store would mix domain logic with technical state.
  - **Alternatives considered:** Keep progress in quiz (cross-feature coupling), move to shared/store/ (mixes domain with technical)
  - **Implications:** New feature folder + backend module. Other features import a public hook, not the store directly.

- **Decision:** Generic progress event endpoint vs. per-feature endpoints
  - **Rationale:** A single `POST /api/progress/event { type, feature, data }` endpoint allows any future feature to record progress without backend changes. The backend routes events to the correct handler.
  - **Alternatives considered:** Per-feature endpoints (quiz-progress, reading-progress — more endpoints, more boilerplate)
  - **Implications:** Backend needs event routing logic. Existing quiz progress endpoints can be deprecated after migration.

- **Decision:** Zustand over Redux Toolkit
  - Same rationale as original Epic 19 BR: simpler API, less boilerplate, better TypeScript inference, smaller bundle (~1KB vs ~15KB).

## Implementation Plan

1. Move `uiReducer`/`userReducer` files to `shared/store/` and update imports (no logic change)
2. Decouple `listReducer` from `rootReducer.ts` — vocabulary owns its own state
3. Create `features/progress/` with Zustand store + `useRecordActivity()` hook
4. Create `modules/progress/` on backend — move ProgressService, StreakService, repositories
5. Add `POST /api/progress/event` endpoint
6. Migrate `progressReducer` → `features/progress/stores/progressStore.ts`
7. Migrate `quizReducer` → `features/quiz/stores/quizSessionStore.ts`
8. Migrate `listReducer` → `features/vocabulary/stores/listStore.ts`
9. Migrate `uiReducer` → `shared/store/uiStore.ts`
10. Migrate `userReducer` → `shared/store/userStore.ts`
11. Remove `rootReducer.ts`, `ProgressContext.tsx`, `UserIdentityContext.tsx`
12. Remove `ProgressProvider` from `LearnLayout.tsx`
13. Add ESLint `no-restricted-imports` rule for cross-feature store imports
14. Update all test files to use Zustand stores instead of context mocks
15. Update barrel exports (`index.ts` files)

## Risks & mitigations

- **Risk:** Backend progress extraction breaks existing quiz flow — Severity: High
  - **Mitigation:** Keep old quiz progress endpoints as deprecated wrappers during migration. Route both old and new endpoints to the same ProgressService. Remove old endpoints only after all frontend features migrate to the new event endpoint.
  - **Rollback:** Revert modules/progress/ directory, restore old imports in modules/quiz/

- **Risk:** Zustand migration introduces state regressions in quiz flow — Severity: Medium
  - **Mitigation:** Migrate one store at a time. Run full test suite after each migration. Keep old Context code until all stores migrated.
  - **Rollback:** Revert individual store files, restore old Context provider

- **Risk:** Progress hook becomes a hidden cross-feature dependency — Severity: Low
  - **Mitigation:** The hook is a **public API** (intentional, documented dependency), not a cross-store import. Enforce via ESLint that features call `useRecordActivity()` but never import `features/progress/stores/` directly.

## Implementation notes

- **Frontend conventions:** Each Zustand store lives in `features/<name>/stores/<name>Store.ts`. Stores are plain functions — no providers, no context wrappers.
- **Backend conventions:** New `modules/progress/` follows the same clean architecture pattern as existing modules (Controller → Service → Repository). See `modules/quiz/` as reference.
- **Testing:** Existing reducer tests can be adapted to test Zustand stores (same logic, different API). Store tests are simpler — no context wrapping needed.
- **ESLint rule:** `"no-restricted-imports": ["error", { "patterns": [{ "group": ["features/*/stores/*"], "message": "Cross-feature store imports are forbidden. Use public hooks from the feature's index.ts instead." }] }]`
