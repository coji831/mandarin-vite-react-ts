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
- **Content Browser** — Build shared `ContentBrowser` component with mixed-card grid, type badges, search, filters, pagination. Replaces `VocabularyListPage`.
- Estimated at **~9 days total** (2d restructure + 4d Zustand migration + 2d backend extraction + 1d cleanup).

**Status:** In Progress

**Last Update:** June 16, 2026 (Stories 17.1-17.4 completed)

## Background

The current frontend state architecture has three critical problems that block future development:

**1. Cross-Feature Coupling in `rootReducer`**

The `ProgressProvider` in `features/quiz/context/ProgressContext.tsx` uses a `rootReducer` that composes **4 slices**: `vocabLists` (imported from `features/vocabulary/reducers/listReducer.ts`), `progress`, `user`, and `ui`. This creates an inverted dependency — the quiz feature owns and manages vocabulary's state. Any change to vocabulary's `ListState` type or actions risks breaking the quiz feature, and vice versa.

The `rootReducer.ts` at `apps/frontend/src/features/quiz/reducers/rootReducer.ts` explicitly imports:

```typescript
import { ListState } from "../../vocabulary/types/State";
import { ListAction, listsInitialState, listsReducer } from "../../vocabulary/reducers/listReducer";
```

**2. Provider Nesting & Boilerplate**

The current provider hierarchy forces all `/learn/*` routes to be wrapped in `ProgressProvider` + `UserIdentityProvider`, even when a page doesn't need progress state. The `ProgressProvider` does eager backend loading on mount (blocking render with a loading state), which adds unnecessary latency to pages like Vocabulary List that only need vocab data.

Current nesting in `LearnLayout.tsx`:

```
UserIdentityProvider → ProgressProvider → <Outlet />
```

Each provider adds ~40-50 lines of boilerplate (createContext, Provider wrapper, useContext hook). With 3 context providers (Progress, Quiz, UserIdentity), that's ~150 lines of provider plumbing.

**3. No Shared Store Location**

Currently there is no `shared/store/` directory. UI state (loading flags, error messages, selected list) and user state (device identity, preferences) are mechanical/technical concerns — they don't belong in any feature folder. They need a neutral home accessible to all features without creating cross-feature import paths.

**4. Backend Progress is Embedded in Quiz Module**

The backend `modules/quiz/` contains progress-specific files (`ProgressController.js`, `ProgressService.js`, `ProgressRepository.js`, `StreakService.js`, `StreakRepository.js`) alongside quiz session files. This creates a module that violates single-responsibility — it handles both quiz sessions AND progress tracking. As reading and radicals features emerge, they need to record progress without importing from the quiz module.

**5. No Shared Content Browser**

The current `VocabularyListPage` only handles vocabulary data. Future content types (radicals, phonetics, readers, grammar, chengyu) each need their own browse pages. Without a shared `ContentBrowser` component, each new content type would duplicate grid layout, search, filtering, and pagination logic.

This epic restructures state ownership, extracts cross-cutting concerns, migrates to Zustand for simpler state management, builds a shared Content Browser, and enforces module boundaries — preparing the codebase for 6+ planned content epics.

## User Stories

This epic consists of the following user stories:

1. **Story 17.1: State Ownership Restructure** _(link to `story-17-1-state-ownership-restructure.md`)_ ✅
   - As a developer, I want to move ui/user slices to shared/store and decouple listReducer from quiz rootReducer, so that cross-feature state coupling is eliminated.

2. **Story 17.2: Extract Progress Feature (Frontend)** _(link to `story-17-2-extract-progress-feature-frontend.md`)_ ✅
   - As a developer, I want to extract progress tracking from features/quiz into its own features/progress/ with a Zustand store and public `useRecordActivity()` hook, so that quiz, reading, and radicals can all record progress without cross-feature imports.

3. **Story 17.3: Extract Progress Module (Backend)** _(link to `story-17-3-extract-progress-module-backend.md`)_ ✅
   - As a developer, I want to extract ProgressController, ProgressService, StreakService, and their repositories from modules/quiz/ into a new modules/progress/ with a generic POST /api/progress/event endpoint, so that the backend progress API is feature-agnostic.

4. **Story 17.4: Zustand Migration (Quiz + Vocabulary)** _(link to `story-17-4-zustand-migration-quiz-vocabulary.md`)_ ✅
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

- [ ] `uiReducer.ts` and `userReducer.ts` moved from `features/quiz/reducers/` to `shared/store/` — all imports updated, existing tests pass unchanged
- [ ] `listReducer` removed from quiz's `rootReducer.ts` — vocabulary feature fully owns its own state, no cross-feature reducer composition
- [ ] New `features/progress/` directory created with Zustand store (`progressStore.ts`), `useRecordActivity()` hook, `progressService.ts`, types, and barrel export (`index.ts`)
- [ ] `useRecordActivity()` hook exposes a clean API: `{ feature, wordId, correct, data }` — usable by quiz, reading, and radicals without importing progress internals
- [ ] New `modules/progress/` directory on backend with `ProgressController`, `ProgressService`, `ProgressRepository`, `StreakService`, `StreakRepository` — all files moved from `modules/quiz/` with preserved functionality
- [ ] Generic `POST /api/progress/event` endpoint deployed — accepts `{ type, feature, data }` and routes to correct handler. Old quiz progress endpoints kept as deprecated wrappers.
- [ ] `quizReducer` migrated to Zustand store at `features/quiz/stores/quizSessionStore.ts` — all quiz page flows work identically
- [ ] `listReducer` migrated to Zustand store at `features/vocabulary/stores/listStore.ts` — all vocabulary flows work identically
- [ ] `uiReducer` migrated to Zustand store at `shared/store/uiStore.ts` — shared UI state accessible across features
- [ ] `userReducer` migrated to Zustand store at `shared/store/userStore.ts` — shared user state accessible across features
- [ ] `progressReducer` removed, `features/progress/stores/progressStore.ts` is the single source of truth
- [ ] `rootReducer.ts` and `ProgressContext.tsx` removed — no longer needed after Zustand migration
- [ ] `UserIdentityContext.tsx` removed — user identity handled by Zustand store
- [ ] `ProgressProvider` removed from `LearnLayout.tsx` — Zustand stores need no providers
- [ ] ESLint `no-restricted-imports` rule added preventing direct `features/*/stores/*` cross-feature imports
- [ ] All existing reducer tests adapted to test Zustand stores — same coverage, simpler test setup
- [ ] Barrel exports (`index.ts`) updated for all affected features
- [ ] Shared `ContentBrowser` component built at `src/shared/components/ContentBrowser/` with: `ContentCard` (polymorphic by contentType), `ContentGrid` (responsive grid + pagination), `SearchBar`, `FilterDropdown` (HSK level + phase), `TabBar` (content type tabs)
- [ ] Content Browser shows type badges (🔤 Foundations, 📘 Radicals, 🔊 Phonetic, 📖 Readers, 📕 Grammar, 🏮 Chengyu) per card
- [ ] Locked content cards shown with 🔒 badge (phase-gated)
- [ ] `VocabularyListPage` removed — `/learn/vocabulary-list` route redirects to `/learn`
- [ ] `npm test` passes with 100% success rate across affected features

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
  - **Rationale:** Simpler API, less boilerplate, better TypeScript inference, smaller bundle (~1KB vs ~15KB). No provider nesting, no action type constants. Middleware support (devtools, persist) via plugins.
  - **Alternatives considered:** Keep Context+Reducers (provider nesting, boilerplate), Redux Toolkit (heavier, more ceremony)
  - **Implications:** Install `zustand` dependency. Existing reducer tests adapt to store tests. No runtime migration — stores imported directly.

- **Decision:** Content Browser as shared component (not per-feature)
  - **Rationale:** All Phase 1-4 content types need identical browsing UI (grid, search, filter, paginate). Building once in `shared/components/ContentBrowser/` eliminates 6+ duplicate implementations.
  - **Alternatives considered:** Per-feature browser components (6x duplication), generic table (too rigid)
  - **Implications:** Content Browser is data-driven via `contentType` prop. Each content tab provides its data source.

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
14. Build Content Browser: `ContentCard` → `ContentGrid` → `SearchBar` → `FilterDropdown` → `TabBar`
15. Replace `VocabularyListPage` with Content Browser, add route redirect
16. Update all test files to use Zustand stores instead of context mocks
17. Update barrel exports (`index.ts` files)

## Risks & mitigations

- **Risk:** Backend progress extraction breaks existing quiz flow — Severity: High
  - **Mitigation:** Keep old quiz progress endpoints as deprecated wrappers during migration. Route both old and new endpoints to the same ProgressService. Remove old endpoints only after all frontend features migrate to the new event endpoint.
  - **Rollback:** Revert modules/progress/ directory, restore old imports in modules/quiz/

- **Risk:** Zustand migration introduces state regressions in quiz flow — Severity: Medium
  - **Mitigation:** Migrate one store at a time. Run full test suite after each migration. Keep old Context code until all stores migrated.
  - **Rollback:** Revert individual store files, restore old Context provider

- **Risk:** Progress hook becomes a hidden cross-feature dependency — Severity: Low
  - **Mitigation:** The hook is a **public API** (intentional, documented dependency), not a cross-store import. Enforce via ESLint that features call `useRecordActivity()` but never import `features/progress/stores/` directly.

- **Risk:** Content Browser breaks existing vocabulary list functionality — Severity: Medium
  - **Mitigation:** Build Content Browser alongside existing VocabularyListPage. Only remove old page after Content Browser is verified with same data. Route redirect as final step.
  - **Rollback:** Restore VocabularyListPage route, remove redirect.

## Implementation notes

- **Frontend conventions:** Each Zustand store lives in `features/<name>/stores/<name>Store.ts`. Stores are plain functions — no providers, no context wrappers. Shared stores (UI, User) live in `shared/store/`.
- **Backend conventions:** New `modules/progress/` follows the same clean architecture pattern as existing modules (Controller → Service → Repository). See `modules/quiz/` as reference.
- **Testing:** Existing reducer tests can be adapted to test Zustand stores (same logic, different API). Store tests are simpler — no context wrapping needed.
- **ESLint rule:** `"no-restricted-imports": ["error", { "patterns": [{ "group": ["features/*/stores/*"], "message": "Cross-feature store imports are forbidden. Use public hooks from the feature's index.ts instead." }] }]`
- **Installation:** Run `npm install zustand` in `apps/frontend/` before story 17.2.
- **Content Browser data sources:** Each content tab provides its own data through a shared interface (`ContentSource`). The Content Browser consumes data via this interface — it does not import feature internals.
- **Conventions:** Follow `docs/guides/conventions/code-conventions.md` and `docs/knowledge-base/solid-principles.md`.
- **Docs:** Update `docs/architecture.md` state management section after Zustand migration is complete.
