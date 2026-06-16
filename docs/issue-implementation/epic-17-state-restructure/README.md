# Epic 17: State Restructure & Zustand Migration — Implementation

**BR Reference:** `docs/business-requirements/epic-17-state-restructure/README.md`

**Status:** In Progress

                    **Last Update:** June 16, 2026 (Stories 17.1-17.6 completed)

---

## Technical Overview

This epic fundamentally restructures frontend state management and backend module boundaries in the PinyinPal application. The current architecture uses React Context + useReducer with a `rootReducer` in `features/quiz/` that composes 4 slices (vocabLists, progress, user, ui) — creating cross-feature coupling between quiz and vocabulary. The backend embeds progress tracking inside the quiz module, blocking future features (reading, radicals) from recording progress.

**Key Technical Components:**

1. **State Ownership Restructure (Story 17.1)** ✅
   - Move `uiReducer.ts` and `userReducer.ts` from `features/quiz/reducers/` to `shared/store/`
   - Decouple `listReducer` from quiz's `rootReducer.ts` — vocabulary owns its own state
   - Update all imports across the codebase (hooks, types, barrel exports)
   - No logic changes — pure file relocation and import updates

2. **Frontend Progress Extraction (Story 17.2)** ✅
   - Create `features/progress/` with Zustand store (`progressStore.ts`), public `useRecordActivity()` hook, `progressService.ts` (API client), types, and barrel export
   - Extract progress logic from `features/quiz/` (progressReducer, progressService, progressHelpers)
   - The store uses Zustand with middleware for devtools. State shape mirrors existing `ProgressState`:
     ```typescript
     interface ProgressState {
       wordsById: Record<string, WordProgress>;
       wordIds: string[];
     }
     ```
   - `useRecordActivity()` hook: `(params: { feature: string; wordId: string; correct: boolean; data?: Record<string, unknown> }) => Promise<void>`

3. **Backend Progress Module Extraction (Story 17.3)** ✅
   - Create `modules/progress/` following Clean Architecture: `api/` (controllers, routes), `domain/` (entities, interfaces), `repositories/`, `use-cases/` (services)
   - Move from `modules/quiz/`: `ProgressController.js`, `progressRoutes.js`, `ProgressService.js`, `ProgressRepository.js`, `StreakService.js`, `StreakRepository.js`, `StreakRepository.js`
   - New generic endpoint: `POST /api/progress/event { type: string; feature: string; data: object }`
   - Event routing: backend routes events to correct handler based on `type` (e.g., `record-answer` → ProgressService, `update-streak` → StreakService)
   - Old quiz progress endpoints kept as deprecated wrappers that call the same ProgressService

4. **Zustand Migration — Quiz & Vocabulary (Story 17.4)** ✅
   - `quizReducer` → `features/quiz/stores/quizSessionStore.ts` — state machine (phases: LOADING → QUESTION → ANSWER_FEEDBACK → RESULTS → ERROR)
   - `listReducer` → `features/vocabulary/stores/listStore.ts` — vocabulary list state
   - Migrate action types, reducer logic, and selectors to Zustand's `set`/`get` API
   - Add `zustand/devtools` middleware for Redux DevTools support

5. **Zustand Migration — UI, User & Progress (Story 17.5)** ✅
   - `uiReducer` → `shared/store/uiStore.ts` — loading flags, error, selected list
   - `userReducer` → `shared/store/userStore.ts` — userId, preferences
   - `progressReducer` → `features/progress/stores/progressStore.ts` (replaces Story 17.2's initial store)
   - All stores get devtools middleware, selectors, and action creators

6. **Provider Cleanup & Boundary Enforcement (Story 17.6)** ✅
   - `ProgressProvider`, `UserIdentityProvider`, `QuizProvider` all removed — flat provider tree
   - `rootReducer.ts`, `ProgressContext.tsx`, `UserIdentityContext.tsx`, `QuizContext.tsx` deleted
   - All 5 reducer files deleted (quizReducer, progressReducer, listReducer, prelude files)
   - ESLint rules added: no cross-feature `stores/*` imports, no direct `shared/store/*` imports
   - `useQuizEngine.ts` replaces QuizProvider initialization logic

7. **Content Browser Infrastructure (Story 17.7)**
   - Build `src/shared/components/ContentBrowser/` with:
     - `ContentCard` — polymorphic card component rendering different content types via `contentType` prop
     - `ContentGrid` — responsive CSS grid (auto-fill, min 280px) with pagination
     - `SearchBar` — debounced text input filtering cards by Chinese/pinyin/english match
     - `FilterDropdown` — HSK level selector + phase selector dropdowns
     - `TabBar` — horizontal tabs: All, Foundations, Radicals, Phonetic, Readers, Grammar, Chengyu
   - Phase-gated data: cards with locked phases show 🔒 badge, not clickable
   - Replace `VocabularyListPage` — route `/learn/vocabulary-list` → redirect to `/learn`

---

## Architecture Decisions

| Decision                | Choice                                                       | Rationale                                                                                  | Alternatives Considered                                                                      |
| ----------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| **State management**    | Zustand over Context+Reducers                                | Simpler API (~35 lines/store vs ~75 lines/set), no provider nesting, devtools middleware   | Keep Context+Reducers (boilerplate, provider nesting), Redux Toolkit (heavier ~15KB vs ~1KB) |
| **Progress as feature** | Dedicated `features/progress/`                               | Cross-cutting domain concept — not mechanical (shared) or quiz-specific                    | Keep in quiz (coupling), put in shared/store (mixes domain with technical)                   |
| **Progress endpoint**   | Single `POST /api/progress/event`                            | Any future feature records progress without backend changes                                | Per-feature endpoints (more endpoints, more boilerplate)                                     |
| **Content Browser**     | Shared component in `shared/components/`                     | Reusable by ALL content tabs — eliminates 6+ duplicate implementations                     | Per-feature browsers (6x duplication), generic table (too rigid)                             |
| **Store locations**     | Domain stores in feature folders, technical stores in shared | Clear separation: domain (progress, quiz, vocab) → feature, mechanical (UI, user) → shared | All stores in shared (mixes concerns), all stores in features (shared state duplicated)      |

---

## Technical Implementation

### Architecture — Current State (Before)

```
apps/frontend/src/
├── features/
│   ├── quiz/
│   │   ├── context/
│   │   │   ├── ProgressContext.tsx    ← rootReducer wraps 4 slices
│   │   │   ├── QuizContext.tsx        ← quizReducer (separate)
│   │   │   └── UserIdentityContext.tsx ← user identity
│   │   ├── reducers/
│   │   │   ├── rootReducer.ts         ← composes vocabLists + progress + user + ui
│   │   │   ├── progressReducer.ts     ← progress state
│   │   │   ├── quizReducer.ts         ← quiz state machine
│   │   │   ├── uiReducer.ts           ← UI flags
│   │   │   └── userReducer.ts         ← user preferences
│   │   └── services/
│   │       └── progressService.ts     ← API client for progress endpoints
│   └── vocabulary/
│       └── reducers/
│           └── listReducer.ts         ← vocab list state (imported BY quiz rootReducer!)
├── shared/
│   └── (no store/ directory)

apps/backend/src/modules/
├── quiz/
│   ├── api/ProgressController.js      ← progress HTTP handlers
│   ├── api/progressRoutes.js          ← progress routes
│   ├── use-cases/ProgressService.js   ← progress business logic
│   ├── use-cases/StreakService.js     ← streak business logic
│   ├── repositories/ProgressRepository.js
│   └── repositories/StreakRepository.js
```

### Architecture — Target State (After)

```
apps/frontend/src/
├── features/
│   ├── progress/          ← NEW
│   │   ├── stores/progressStore.ts    ← Zustand store
│   │   ├── hooks/useRecordActivity.ts ← public API hook
│   │   ├── services/progressService.ts ← API client
│   │   ├── types/
│   │   └── index.ts
│   ├── quiz/
│   │   ├── stores/quizSessionStore.ts ← Zustand (was quizReducer)
│   │   ├── (context/ removed)
│   │   └── (reducers/ removed)
│   └── vocabulary/
│       ├── stores/listStore.ts        ← Zustand (was listReducer)
│       └── (reducers/listReducer.ts removed)
├── shared/
│   ├── store/
│   │   ├── uiStore.ts                 ← Zustand (was uiReducer from quiz)
│   │   ├── userStore.ts               ← Zustand (was userReducer from quiz)
│   │   └── index.ts                   ← barrel export
│   └── components/
│       └── ContentBrowser/            ← NEW
│           ├── ContentCard.tsx
│           ├── ContentGrid.tsx
│           ├── SearchBar.tsx
│           ├── FilterDropdown.tsx
│           ├── TabBar.tsx
│           └── index.ts

apps/backend/src/modules/
├── progress/              ← NEW (extracted from quiz)
│   ├── api/
│   │   ├── ProgressController.js     ← moved from quiz
│   │   ├── progressRoutes.js         ← moved from quiz + new /event endpoint
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Progress.js           ← moved from quiz
│   │   │   └── StudyStreak.js        ← moved from quiz
│   │   └── interfaces/
│   │       ├── IProgressRepository.js ← moved from quiz
│   ├── repositories/
│   │   ├── ProgressRepository.js     ← moved from quiz
│   │   └── StreakRepository.js       ← moved from quiz
│   └── use-cases/
│       ├── ProgressService.js        ← moved from quiz
│       └── StreakService.js          ← moved from quiz
├── quiz/
│   └── (progress-specific files removed — quiz module is now single-purpose)
```

### API Endpoints

**Existing endpoints (preserved as deprecated wrappers):**

| Method | Route                                    | Description                  | Migration                    |
| ------ | ---------------------------------------- | ---------------------------- | ---------------------------- |
| GET    | `ROUTE_PATTERNS.progress`                | All user progress            | Delegates to ProgressService |
| GET    | `ROUTE_PATTERNS.progressStats`           | Stats (total, mastered, due) | Delegates to ProgressService |
| GET    | `ROUTE_PATTERNS.progressWord(":wordId")` | Single word progress         | Delegates to ProgressService |
| PUT    | `ROUTE_PATTERNS.progressWord(":wordId")` | Update word progress         | Delegates to ProgressService |
| DELETE | `ROUTE_PATTERNS.progressWord(":wordId")` | Delete word progress         | Delegates to ProgressService |
| POST   | `ROUTE_PATTERNS.progressBatch`           | Batch update                 | Delegates to ProgressService |

**New endpoint:**

| Method | Route                 | Description            | Request Body                                      |
| ------ | --------------------- | ---------------------- | ------------------------------------------------- |
| POST   | `/api/progress/event` | Generic progress event | `{ type: string, feature: string, data: object }` |

**Event types handled by `/api/progress/event`:**

| type            | feature   | data                                | Handler                             |
| --------------- | --------- | ----------------------------------- | ----------------------------------- |
| `record-answer` | `quiz`    | `{ wordId, correct, questionType }` | ProgressService.recordQuizResult    |
| `record-answer` | `reading` | `{ wordId, correct }`               | ProgressService.recordQuizResult    |
| `update-streak` | any       | `{ date }`                          | StreakService.updateStreak          |
| `batch-update`  | any       | `{ updates: Array<{wordId, ...}> }` | ProgressService.batchUpdateProgress |

**Quiz session endpoints (unchanged, remain in quiz module):**

| Method | Route                                 | Description               |
| ------ | ------------------------------------- | ------------------------- |
| POST   | `/v1/quiz/session/start`              | Start/resume quiz session |
| POST   | `/v1/quiz/session/:sessionId/answer`  | Submit answer             |
| GET    | `/v1/quiz/session/:sessionId`         | Get session details       |
| GET    | `/v1/quiz/session/:sessionId/summary` | Session metrics           |

### Component Relationships — Zustand Store Pattern

```typescript
// Example: quizSessionStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface QuizSessionState {
  phase: QuizPhase;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: QuizAnswer[];
  // actions
  initializeSession: (questions: QuizQuestion[], sessionId: string) => void;
  submitAnswer: (answer: QuizAnswer) => void;
  nextQuestion: () => void;
  resetSession: () => void;
}

export const useQuizSessionStore = create<QuizSessionState>()(
  devtools(
    (set, get) => ({
      phase: "LOADING",
      questions: [],
      currentIndex: 0,
      answers: [],

      initializeSession: (questions, sessionId) =>
        set({ phase: "QUESTION", questions, sessionId, currentIndex: 0, answers: [] }),

      submitAnswer: (answer) =>
        set((state) => ({
          answers: [...state.answers, answer],
          phase: "ANSWER_FEEDBACK" as QuizPhase,
        })),

      nextQuestion: () =>
        set((state) => {
          const nextIndex = state.currentIndex + 1;
          return {
            currentIndex: nextIndex,
            phase: nextIndex >= state.questions.length ? "RESULTS" : "QUESTION",
          } as Partial<QuizSessionState>;
        }),

      resetSession: () =>
        set({
          phase: "LOADING",
          questions: [],
          currentIndex: 0,
          answers: [],
          sessionId: undefined,
        }),
    }),
    { name: "quiz-session" },
  ),
);
```

### Component Relationships — Content Browser

```
Page (e.g., LearnPage)
  └── ContentBrowser
      ├── TabBar (All | Foundations | Radicals | Phonetic | Readers | Grammar | Chengyu)
      ├── SearchBar (debounced text input)
      ├── FilterDropdown (HSK level, Phase)
      └── ContentGrid
          └── ContentCard[] (polymorphic by contentType prop)
              ├── TypeBadge (🔤📘🔊📖📕🏮)
              ├── CardContent (varies by type)
              └── LockBadge (🔒 if phase-gated)

Data Flow:
  ContentBrowser
    ↓ receives: contentType, searchQuery, hskLevel, phase (controlled props)
    ↓ filters: dataSource based on above criteria
    ↓ paginates: sliced results into pages
    ↓ renders: ContentGrid with filtered/paginated cards
```

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
