# Epic 17: State Restructure — Implementation

**BR Reference:** `docs/business-requirements/epic-17-state-restructure/README.md`

**Status:** Planned

**Last Update:** June 16, 2026

---

## Architecture Decisions

| Decision                | Choice                                                         | Rationale                                                                       |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **State management**    | Zustand over Context+Reducers                                  | Simpler API, less boilerplate, no provider nesting, DevTools support.           |
| **Progress as feature** | Dedicated `features/progress/` (not shared store, not in quiz) | Cross-cutting domain concept (quiz, reading, radicals all generate progress).   |
| **Progress endpoint**   | Single `POST /api/progress/event { type, feature, data }`      | Any future feature can record progress without backend changes.                 |
| **Content Browser**     | Shared component in `src/shared/components/ContentBrowser/`    | Reusable mixed-card grid used by ALL content tabs. Replaces VocabularyListPage. |

---

## Stories

### Stories 17.1-17.6: State Restructure

See BR for full story breakdown. Key deliverables:

- Zustand stores: `progressStore`, `quizSessionStore`, `listStore`, `uiStore`, `userStore`
- Backend: `modules/progress/` with `POST /api/progress/event`
- ESLint `no-restricted-imports` rule
- Provider cleanup

### Story 17.7: Content Browser Infrastructure

**Files:** `src/shared/components/ContentBrowser/`

**AC:** Unified mixed-card grid component. Type badges (🔤📘🔊📖📕🏮) per card. Tab-based filtering (All / Foundations / Radicals / Phonetic / Readers / Grammar / Chengyu). Search bar (searches across ALL types). Filter dropdowns (HSK level, phase). Pagination. Locked cards shown with 🔒 badge.

**Replaces:** Existing `VocabularyListPage` — redirect `/learn/vocabulary-list` → `/learn`

**Implementation Plan:**

1. Build `ContentCard` component — polymorphic by `contentType` prop
2. Build `ContentGrid` — responsive grid with pagination
3. Build `SearchBar` — filters cards by text match
4. Build `FilterDropdown` — HSK level + phase options
5. Build `TabBar` — content type tabs
6. Wire up to phase-gated data (hide locked content)
7. Remove `VocabularyListPage` — add route redirect
