# Frontend Restructure Plan

**Date:** June 8, 2026
**Status:** Draft for review
**Audience:** Frontend developers

> **Backend plan moved:** The backend restructure is now in [restructure-backend-plan.md](./restructure-backend-plan.md).
> This document focuses on frontend feature split, page composition, and FE?BE alignment.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Target Architecture](#2-target-architecture)
3. [Frontend Feature Restructure](#3-frontend-feature-restructure)
4. [Page Composition Model](#4-page-composition-model)
5. [Migration Phases](#5-migration-phases)

> **Backend restructure:** See [restructure-backend-plan.md](./restructure-backend-plan.md) for backend module structure, controller renames, service relocations, and backend migration phases.

---

## 1. Current State Analysis

### 1.1 The Core Problem

The current codebase has **asymmetric architecture** -- the frontend and backend don't share a consistent domain boundary model:

```
FRONTEND FEATURES            BACKEND DOMAINS
-----------------            -----------------
features/auth                AuthModule (clean, 1:1)
features/mandarin     =======+ WordModule (core -- everyone depends on it)
  (super-feature)     |    +== VocabularyModule (lists, categories, filters)
  calls 6 domains     |    +== ConversationModule (deprecated -> examples)
                      |    +== ExamplesModule (non-recorded, vocab-related)
                      |    +== QuizModule (sessions, progress, SRS)
                      |    +== GamificationModule (cross-cutting)
features/quiz               QuizModule (clean)
features/gamification       GamificationModule (cross-cutting)
features/dashboard          QuizModule (via leech endpoint)
features/word         ----- ExamplesModule ([RED] duplicate of mandarin, delete)
```

**Key issues:**

- `features/mandarin/` is a **super-feature** containing 17 components, 7 hooks, 5 services, 5 reducers -- it's actually a page group, not a bounded feature
- `features/word/` is a **full duplicate** of code already in `features/mandarin/` -- all 5 files are redundant
- The backend has **13 Prisma models but only 2 domain entities** (`QuizSession`, `Question`)
- **6 of 10 backend interfaces** are empty stubs with no method signatures
- 3 orphan pages (`Home.tsx`, `ReviewPage.tsx`, `Todo.tsx`) exist but aren't routed

### 1.2 Current Frontend Feature Sizes

| Feature        | Components | Hooks | Services | Reducers | Types       | Tests  | Calls Backend Domain(s)                                          |
| -------------- | ---------- | ----- | -------- | -------- | ----------- | ------ | ---------------------------------------------------------------- |
| `auth`         | 3          | 0     | 0        | 0        | 6 intf      | 0      | Auth                                                             |
| `dashboard`    | 1          | 0     | 1        | 0        | 0           | 0      | Learning (leeches)                                               |
| `gamification` | 6          | 1     | 0        | 0        | 24 types    | 7      | Gamification + Progress/streak                                   |
| `mandarin`     | **17**     | **7** | **5**    | **5**    | **8 files** | **16** | Learning + Progress + Conversation + TTS + Examples + Vocabulary |
| `quiz`         | 18         | 3     | 1        | 1        | 103 types   | 6      | QuizSession + Learning + AI Feedback                             |
| `word`         | 2          | 1     | 0        | 0        | 0           | 2      | Examples ([RED] duplicate)                                       |

### 1.3 Current Backend Module Boundaries

```
apps/backend/src/
+-- api/controllers/      10 controllers (1 per route group)
+-- api/routes/           12 route files (including examplesRoute)
+-- core/services/        12 services
+-- core/domain/
|   +-- entities/          2 entities (QuizSession, Question) [X] 11 missing
|   +-- constants/         1 file (BusinessRules.js)
+-- core/interfaces/      10 interfaces (6 are empty stubs)
+-- infrastructure/       Caches, DB, external clients, repos, security
+-- services/ (flat)       5 misplaced files (B4 audit finding)
```

### 1.4 Current Page <-> Feature Map

| Route       | Page Component               | Features It Composes                                                        |
| ----------- | ---------------------------- | --------------------------------------------------------------------------- |
| `/`         | `pages/Dashboard.tsx`        | `gamification` (streak, badges) + `dashboard` (leech widget)                |
| `/learn/*`  | `MandarinRoutes` -> multiple | `mandarin` (vocab, flashcards, conversations) + `quiz` + `pages/ReviewPage` |
| `/progress` | `pages/ProgressPage.tsx`     | (barely composes anything -- 2 symbols)                                     |
| `/auth/*`   | `AuthPage`                   | `auth` (login, register)                                                    |
| (unrouted)  | `pages/Home.tsx`             | -- Vite boilerplate                                                         |
| (unrouted)  | `pages/ReviewPage.tsx`       | -- Placeholder                                                              |
| (unrouted)  | `pages/Todo.tsx`             | -- Unknown                                                                  |

---

## 2. Target Architecture

### 2.1 Principle: Core Word Data Is Central, Everything Depends on It

After deeper codegraph analysis, the `mandarin/` super-feature contains code spanning **6 concerns**, but most are word-related. The key insight: **basic word data** (simplified, traditional, pinyin, english) is the core entity that every other module references by ID. Conversation and examples are non-recorded learning features layered on top of words. Progress/SRS tracks learning state for words but belongs with quiz.

**Target rule**: `WordModule` owns pure word data with zero dependencies. `VocabularyModule` owns categorization (lists, tags). All other modules depend on `WordModule`. Conversation and examples merge into vocabulary (they're all word-related UI). Progress/SRS state moves to quiz.

### 2.2 Full Domain Breakdown

**Feature <-> Module Mapping**

```
FRONTEND PAGES (orchestrators)   FRONTEND FEATURES              BACKEND MODULES
============================    ==================              ===============

DashboardPage                   gamification + dashboard        GamificationModule + QuizModule
AuthPage                        auth                            AuthModule
VocabularyListPage              vocabulary + quiz               VocabularyModule + QuizModule
FlashCardPage                   vocabulary + quiz               WordModule + VocabularyModule + QuizModule
QuizPage                        quiz + gamification             QuizModule + GamificationModule
ReviewPage                      quiz                            QuizModule
ProgressPage                    quiz + gamification             QuizModule + GamificationModule

PRISMA MODELS BY BACKEND MODULE

AuthModule:          User, Session
VocabularyModule:    VocabularyList, Category, WordCategory, WordList
WordModule (core):   VocabularyWord
QuizModule:          QuizSession, QuizSessionQuestion, QuizSessionAnswer,
                     QuizSessionSummary, Progress, StudyStreak
GamificationModule:  (no dedicated table -- inline badge data)
```

**Module Details** (features are pure -- no pages inside, only components/hooks/services/types/reducers/utils)

| Module                                       | FE Components/Hooks (owned by feature)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | BE Controllers/Services                                                                                                                  | BE Repositories/Entities                                                                                                                               | Properties / Notes                                                                                                                                                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AuthModule**                               | LoginForm, RegisterForm, ProtectedRoute, AuthContext                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | authController, AuthService, JwtService                                                                                                  | AuthRepository, User entity \*NEW                                                                                                                      | User: id, email, displayName, createdAt                                                                                                                                                                                 |
| **WordModule** (core, independent)           | (none directly -- consumed via vocabulary)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | wordController, WordService, WordSeeder                                                                                                  | IWordRepository, WordRepository, Word entity \*NEW                                                                                                     | VocabularyWord: id, simplified, traditional, pinyin, english, hskLevel. NO audioUrl, NO exampleSentence. GET /api/v1/words/\*, POST /api/v1/words/seed                                                                  |
| **VocabularyModule** (depends on WordModule) | VocabularyCard, FlashCard, ConversationBox, Turns, WordExamplesPanel, PlaybackControls, PlayButton, Basic, NavBar, Sidebar, WordDetails, AddForm, useAudioPlayback, useConversationGenerator, useExamples, audioService, examplesApi, vocabularyDataService, conversationService, Card/Vocabulary/Conversation/Setting types, listReducer, csvLoader, schemaLoader, vocabListHelpers                                                                                                                                                                                                                                                                                                                        | vocabularyController, VocabularyListService                                                                                              | VocabularyListRepository, VocabularyList entity \*NEW                                                                                                  | Handles lists, categories, tags. All word-related UI (conversation, examples, audio merged in).                                                                                                                         |
| **QuizModule** (depends on WordModule)       | QuestionDisplay, AnswerSection, FeedbackSection, ResultsLayout, StatsGrid, ResultsTable, BadgesDisplay, LeechWarning, DailyComplete, NextQuizCountdown, ErrorScreen, LoadingScreen, HintOverlay, ProgressBar, ExamLayout, QuestionSection, MultipleChoice, ChineseChar, PinyinTone inputs, QuizContext, quizReducer, ProgressContext, UserIdentityContext, useQuizSession, useAnswerSummary, useSessionSummary, useProgressState, useProgressActions, useProgressDispatch, useUserIdentity, quizService, progressService, progressReducer, uiReducer, userReducer, rootReducer \*DECOMPOSED, QuizTypes/Progress/State types, dateFormatting, pinyinConverter, quizTransformers, progressHelpers, validation | quizSessionController, learningController, progressController, QuizSessionService, LearningService (SRS), ProgressService, StreakService | QuizSessionRepository, QuizSessionAnswerRepository, QuizSessionSummaryRepository, ProgressRepository, Progress entity *NEW, StudyStreak entity *SHARED | QuizSession + Question entities (existing). rootReducer moves to quiz/ but Sidebar/NavBar refactor to use ListState directly (not RootState). Progress: userId, wordId, studyCount, confidence, nextReview, lapseCount. |
| **GamificationModule** (cross-cutting)       | StreakCounter, BadgeDisplay, XPProgressBar, MysteryBoxModal, BadgeCelebrationModal, useGamificationAPI, GamificationTypes, xpUtils                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | gamificationController, GamificationService                                                                                              | Badge entity \*NEW (inline data)                                                                                                                       | No dedicated table. Shares StudyStreak with QuizModule. Badge: id, name, streakRequired, icon.                                                                                                                          |
| **Dashboard** (composes quiz + gamification) | LeechWidget                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | leechService                                                                                                                             | --                                                                                                                                                     | Calls QuizModule for leech data. No dedicated backend module.                                                                                                                                                           |

**Pages** (orchestrators, separate from features): `pages/DashboardPage.tsx`, `pages/AuthPage.tsx`, `pages/VocabularyListPage.tsx`, `pages/FlashCardPage.tsx`, `pages/QuizPage.tsx`, `pages/ProgressPage.tsx`, `pages/ReviewPage.tsx` (WIP)
**Infrastructure** (cross-cutting, singleton): services/axiosClient.ts, components/ (Button, Input, ToggleSwitch), layouts/ (AppLayout, LearnLayout, Root), constants/, config/, types/

### 2.3 Why This Breakdown

| Component                  | Current Home | New Feature  | Rationale                                                       |
| -------------------------- | ------------ | ------------ | --------------------------------------------------------------- |
| VocabularyCard, FilterChip | `mandarin`   | `vocabulary` | Pure vocabulary browsing -- calls no APIs (static CSV data)     |
| FlashCard, WordDetails     | `mandarin`   | `vocabulary` | Tightly coupled to vocab data -- shows word details             |
| ConversationBox, Turns     | `mandarin`   | `vocabulary` | Non-recorded learning feature -- only rendered on FlashCardPage |
| WordExamplesPanel          | `mandarin`   | `vocabulary` | Non-recorded learning feature -- only rendered in WordDetails   |
| PlaybackControls           | `mandarin`   | `vocabulary` | Only consumed by vocabulary components, not cross-cutting       |
| useAudioPlayback           | `mandarin`   | `vocabulary` | Only consumed by vocabulary hooks, not cross-cutting            |
| examplesApi                | `services/`  | `vocabulary` | Only consumed by vocabulary's useExamples hook                  |
| audioService               | `services/`  | `vocabulary` | Only consumed by vocabulary's useAudioPlayback hook             |
| analyticsService           | `services/`  | `vocabulary` | Only consumed by WordExamplesPanel                              |
| ProgressContext, reducer   | `mandarin`   | `quiz`       | Progress/SRS state belongs with quiz, not vocabulary            |

### 2.4 Shared Infrastructure vs Feature Rules

```
Rule 1: Cross-cutting = shared/. Used by >=2 features -> shared hook/component
Rule 2: Feature-owned = feature/. Used by 1 feature -> lives inside that feature
Rule 3: A feature imports shared/ freely, but NOT another feature's internals
Rule 4: A page orchestrates data flow between features at the page level

Example:
  FlashCardPage (pages/FlashCardPage.tsx)
    +-- imports FlashCard from features/vocabulary           [x] own feature
    +-- imports WordExamplesPanel from features/vocabulary   [x] same feature (examples merged into vocab)
    +-- imports useAudioPlayback from features/vocabulary   [x] same feature (vocabulary owns audio)
    +-- imports useProgressState from features/quiz         [x] other feature (progress moved to quiz)
```

### 2.5 Module Dependency Rules

```
                    +-----------+
                    |   Page   |  (orchestrates)
                    +----+------+
                         |
          +------------------+------------------+
          v                  v                  v
    +-----------+   +-----------+   +-----------+
    | Feature  |   | Feature  |   | Feature  |
    |    A     |   |    B     |   |    C     |
    +----+------+   +----+------+   +----+------+
         |              |              |
         v              v              v
    +-----------+   +-----------+   +-----------+
    | Backend  |   | Backend  |   | Backend  |
    | Module 1 |   | Module 2 |   | Module 3 |
    +-----------+   +-----------+   +-----------+

Rules:
1. A feature calls ITS OWN backend module only (1:1 or 1:2)
2. A page composes MULTIPLE features (1:N)
3. Features NEVER call another feature's backend module
4. Cross-cutting features (auth, gamification) are exceptions -- any page can use them
```

---

## 3. Frontend Feature Restructure

### 3.1 What Changes (Final)

Instead of splitting `mandarin/` into 4 features + shared, we split into **just 2 features** (vocabulary + quiz), plus a **new `pages/` orchestrator layer**. Pages are separated from features: they compose multiple features and map 1:1 to routes. Features become pure bounded contexts (no pages inside).

| Current                                  | ->  | Target                                             | Size      | Backend Module   | Rationale                                                       |
| ---------------------------------------- | --- | -------------------------------------------------- | --------- | ---------------- | --------------------------------------------------------------- |
| `mandarin/components/VocabularyCard`     | ->  | `features/vocabulary`                              | ~30 files | VocabularyModule | Static CSV, conversations, examples, audio -- all word-related  |
| `mandarin/components/FlashCard`          | ->  | `features/vocabulary`                              |           | VocabularyModule | Tightly bound to vocab browsing flow                            |
| `mandarin/components/Conversation*`      | ->  | `features/vocabulary`                              |           | VocabularyModule | Conversation is deprecated -> stays with vocab (non-recorded)   |
| `mandarin/components/WordExamplesPanel*` | ->  | `features/vocabulary`                              |           | VocabularyModule | Examples are non-recorded vocab feature, not separate domain    |
| `mandarin/hooks/useAudioPlayback`        | ->  | `features/vocabulary`                              |           | VocabularyModule | Only consumed by vocabulary components -- not cross-cutting     |
| `mandarin/components/PlaybackControls`   | ->  | `features/vocabulary`                              |           | VocabularyModule | Only rendered in vocabulary context                             |
| `mandarin/services/audioService.ts`      | ->  | `features/vocabulary`                              |           | VocabularyModule | Only called by vocabulary hooks                                 |
| `mandarin/context/ProgressContext`       | ->  | `features/quiz`                                    | ~20 files | QuizModule       | Progress/SRS state moves to quiz domain                         |
| `mandarin/reducers/progress*`            | ->  | `features/quiz`                                    |           | QuizModule       | Reducers move with ProgressContext                              |
| `features/word/` (5 files)               | ->  | [DEL] **Delete**                                   | --        | --               | Full duplicate -- no consumers                                  |
| `services/audioService.ts` (shared)      | ->  | [DEL] **Delete**                                   | --        | --               | Superseded by vocab version                                     |
| `services/examplesApi.ts`                | ->  | `features/vocabulary`                              | --        | --               | Only consumed by vocab's useExamples hook                       |
| `pages/Dashboard.tsx` + `Dashboard.css`  | ->  | `pages/DashboardPage.tsx`                          | --        | --               | Move to pages/ orchestrator + rename component to DashboardPage |
| `pages/ProgressPage.tsx`                 | ->  | `pages/ProgressPage.tsx`                           | --        | --               | Progress page moves to pages/ orchestrator layer                |
| `pages/Home.tsx`                         | ->  | [DEL] **Delete**                                   | --        | --               | Vite boilerplate -- unused                                      |
| `pages/Todo.tsx`                         | ->  | [DEL] **Delete**                                   | --        | --               | Stale scaffolding -- no consumers                               |
| `pages/ReviewPage.tsx`                   | ->  | Keep (as WIP placeholder)                          | --        | --               | Move as-is to pages/ orchestrator layer                         |
| `features/auth/pages/AuthPage.tsx`       | ->  | `pages/AuthPage.tsx`                               | --        | AuthModule       | Page orchestrator layer (composes auth feature)                 |
| `features/auth/pages/LoginPage.tsx`      | ->  | [DEL] **Delete**                                   | --        | --               | Unused legacy -- AuthPage handles login/register                |
| `features/auth/pages/RegisterPage.tsx`   | ->  | [DEL] **Delete**                                   | --        | --               | Unused legacy -- AuthPage handles login/register                |
| `features/quiz/pages/QuizPage.tsx`       | ->  | `pages/QuizPage.tsx`                               | --        | QuizModule       | Page orchestrator layer (composes quiz + gamification)          |
| `features/quiz/contexts/`                | ->  | `features/quiz/context/`                           | --        | --               | Fix plural to singular (F3)                                     |
| `services/analyticsService.ts`           | ->  | `features/vocabulary/services/analyticsService.ts` | --        | --               | Only consumed by WordExamplesPanel -- move to vocabulary        |

### 3.2 Target Feature Directory Structure

```
apps/frontend/src/
+-- features/                  (pure bounded contexts -- NO pages inside)
|   +-- auth/                    (unchanged)
|   |   +-- components/          LoginForm, RegisterForm, ProtectedRoute
|   |   +-- context/             AuthContext
|   |   +-- types/
|   |   +-- index.ts
|   |
|   +-- vocabulary/              * CORE -- ALL word-related UI
|   |   +-- components/          VocabularyCard, FilterChip, Sidebar,
|   |   |                        AddForm, Basic, FlashCard, WordDetails,
|   |   |                        NavBar, ConversationBox, ConversationTurns,
|   |   |                        WordExamplesPanel, ExampleListItem,
|   |   |                        PlaybackControls, PlayButton
|   |   +-- hooks/               useConversationGenerator, useExamples,
|   |   |                        useAudioPlayback
|   |   +-- services/            vocabularyDataService, conversationService,
|   |   |                        audioService, examplesApi
|   |   +-- types/               Card, Vocabulary, Conversation, Setting,
|   |   |                        Word, State (renamed from word.ts, state.ts)
|   |   +-- reducers/            listReducer
|   |   +-- utils/               csvLoader, schemaLoader, vocabListHelpers
|   |   +-- index.ts
|   |
|   +-- quiz/                    * EXPANDED -- sessions + progress + SRS
|   |   +-- components/          (18 existing quiz components)
|   |   +-- context/             QuizContext *RENAMED from contexts/
|   |   |                        ProgressContext *MOVED from mandarin
|   |   |                        UserIdentityContext *MOVED from mandarin
|   |   +-- hooks/               useQuizSession, useAnswerSubmission,
|   |   |                        useSessionSummary,
|   |   |                        useProgressState *MOVED,
|   |   |                        useProgressActions *MOVED,
|   |   |                        useProgressDispatch *MOVED,
|   |   |                        useUserIdentity *MOVED
|   |   +-- reducers/            quizReducer,
|   |   |                        progressReducer *MOVED,
|   |   |                        uiReducer *MOVED,
|   |   |                        userReducer *MOVED,
|   |   |                        rootReducer *MOVED
|   |   +-- services/            quizService,
|   |   |                        progressService *MOVED
|   |   +-- types/               QuizTypes, QuizSessionTypes,
|   |   |                        Progress *MOVED, State *MOVED
|   |   +-- utils/               dateFormatting, pinyinConverter,
|   |   |                        quizTransformers,
|   |   |                        progressHelpers *MOVED,
|   |   |                        validation *MOVED
|   |   +-- index.ts
|   |
|   +-- gamification/            (unchanged -- cross-cutting)
|   |   +-- components/          StreakCounter, BadgeDisplay, XPProgressBar,
|   |   |                        MysteryBoxModal, BadgeCelebrationModal
|   |   +-- hooks/               useGamificationAPI
|   |   +-- types/               GamificationTypes
|   |   +-- utils/               xpUtils
|   |   +-- index.ts
|   |
|   +-- dashboard/               (expanded)
|   |   +-- components/          LeechWidget
|   |   +-- services/            leechService
|   |   +-- index.ts
|   |
|   +-- index.tsx                (updated exports)
|
+-- pages/                       * NEW -- orchestrators: 1 route -> 1 page
|   +-- DashboardPage.tsx        /          composes gamification + dashboard
|   +-- AuthPage.tsx             /auth/*    composes auth
|   +-- VocabularyListPage.tsx   /learn/... composes vocabulary + quiz
|   +-- FlashCardPage.tsx        /learn/... composes vocabulary + quiz
|   +-- QuizPage.tsx             /learn/... composes quiz + gamification
|   +-- ProgressPage.tsx         /progress  composes quiz + gamification
|   +-- ReviewPage.tsx           /learn/... (if kept) composes quiz
|
+-- components/                  (shared UI -- Button, Input, ToggleSwitch)
+-- services/                    (only axiosClient -- core HTTP)
|   +-- axiosClient.ts
|   +-- index.ts
|   +-- __tests__/
+-- layouts/                     AppLayout, LearnLayout, Root
+-- router/                      Router.tsx
+-- config/, constants/, types/
+-- App.tsx, main.tsx
```

### 3.3 File Manifest by Phase

The complete file manifest is now embedded in each phase's section below.
See [Phase 3](#phase-3-frontend-split) for the full list of files to create, move, rename, delete, and modify.

---

## 4. Page Composition Model

### 4.1 How Pages Compose Features (Final)

With the simplified split (vocabulary keeps everything word-related, progress moves to quiz):

`
/ (Dashboard)
Page: DashboardPage (pages/DashboardPage.tsx)
Composes: features/gamification (streak, badges, XP) + features/dashboard (leech widget)

/learn/\* (Learning Section)
/learn/vocabulary-list
Page: VocabularyListPage (pages/VocabularyListPage.tsx)
Composes: features/vocabulary (VocabularyCard, FilterChip, Sidebar) + features/quiz (useProgressState -- learned status)

/learn/flashcards/:listId
Page: FlashCardPage (pages/FlashCardPage.tsx)
Composes: features/vocabulary ? FlashCard, WordDetails,
ConversationBox, ConversationTurns,
WordExamplesPanel, useAudioPlayback,
PlaybackControls + features/quiz ? useProgressActions (mark learned)

/learn/quiz
Page: QuizPage (pages/QuizPage.tsx)
Composes: features/quiz + features/gamification

/learn/review (if implemented)
Page: ReviewPage (pages/ReviewPage.tsx)
Composes: features/quiz ? useProgressState

/progress
Page: ProgressPage (pages/ProgressPage.tsx)
Composes: features/quiz ? progressService (stats) + features/gamification ? XPProgressBar

/auth/\*
Page: AuthPage (pages/AuthPage.tsx)
Composes: features/auth ? LoginForm, RegisterForm
`

### 4.2 Page -> Feature -> Backend Module Matrix

| Page              | Features It Composes     | Backend Modules Called                     |
| ----------------- | ------------------------ | ------------------------------------------ |
| Dashboard         | dashboard + gamification | QuizModule + GamificationModule            |
| VocabularyList    | vocabulary + quiz        | VocabularyModule + QuizModule              |
| FlashCard         | vocabulary + quiz        | WordModule + VocabularyModule + QuizModule |
| Quiz              | quiz + gamification      | QuizModule + GamificationModule            |
| Review (if built) | quiz                     | QuizModule                                 |
| Progress          | quiz + gamification      | QuizModule + GamificationModule            |
| Auth              | auth                     | AuthModule                                 |

## 5. Migration Phases

---

## PHASE 0 � Decisions

### Story 0.1 � Architecture Decisions

| Step  | Decision                                | Recommended | Details                                                                                                                      |
| ----- | --------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 0.1.1 | Split mandarin/ into vocabulary + quiz? | yes         | Everything word-related -> vocabulary. Progress state -> quiz.                                                               |
| 0.1.2 | Create pages/ orchestrator layer?       | yes         | Pages move out of features into pages/.                                                                                      |
| 0.1.3 | Remove features/word/?                  | yes         | Full duplicate of mandarin code, no consumers.                                                                               |
| 0.1.4 | Remove pages/Home.tsx?                  | yes         | Vite boilerplate, unrouted.                                                                                                  |
| 0.1.5 | How to split rootReducer?               | Decompose   | rootReducer combines listReducer (vocab) + progress/user/ui (quiz). Move to quiz/, refactor Sidebar/NavBar to use ListState. |

### Story 0.2 � File Disposition Decisions

| Step  | File                                 | Decision            | Details                                                         |
| ----- | ------------------------------------ | ------------------- | --------------------------------------------------------------- |
| 0.2.1 | pages/ReviewPage.tsx                 | Keep as WIP         | Already a placeholder, move as-is to pages/ orchestrator layer. |
| 0.2.2 | pages/Todo.tsx                       | Delete              | Stale scaffolding, unrouted, no consumers.                      |
| 0.2.3 | pages/Home.tsx                       | Delete              | Vite boilerplate.                                               |
| 0.2.4 | services/analyticsService.ts         | Move to vocabulary/ | Only consumed by WordExamplesPanel.                             |
| 0.2.5 | features/auth/pages/LoginPage.tsx    | Delete              | Unused legacy -- AuthPage handles login/register.               |
| 0.2.6 | features/auth/pages/RegisterPage.tsx | Delete              | Unused legacy -- AuthPage handles login/register.               |

---

## PHASE 1 � Move to features/vocabulary/

### Story 1.1 � Move Components

| Step  | Action                                          | Details                                                                                                                                                                                   |
| ----- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1.1 | Create features/vocabulary/ directory structure | mkdir -p components/ hooks/ services/ types/ reducers/ utils/ **tests**/                                                                                                                  |
| 1.1.2 | Move all component files (14 files)             | AddForm, Basic, ConversationBox, ConversationTurns, ExampleListItem, FilterChip, FlashCard, NavBar, PlaybackControls, PlayButton, Sidebar, VocabularyCard, WordDetails, WordExamplesPanel |
| 1.1.3 | Move page files to pages/ (2 files)             | FlashCardPage.tsx, VocabularyListPage.tsx                                                                                                                                                 |
| 1.1.4 | Recreate barrel export                          | features/vocabulary/components/index.ts                                                                                                                                                   |

### Story 1.2 � Move Hooks

| Step  | Action                 | Details                                                          |
| ----- | ---------------------- | ---------------------------------------------------------------- |
| 1.2.1 | Move hooks (3 files)   | useConversationGenerator.ts, useExamples.ts, useAudioPlayback.ts |
| 1.2.2 | Recreate barrel export | features/vocabulary/hooks/index.ts                               |

### Story 1.3 � Move Services

| Step  | Action                                          | Details                                                                          |
| ----- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| 1.3.1 | Move mandarin/ services (4 files)               | conversationService.ts, vocabularyDataService.ts, audioService.ts, interfaces.ts |
| 1.3.2 | Move cross-cutting services/analyticsService.ts | To features/vocabulary/services/analyticsService.ts                              |
| 1.3.3 | Move services/examplesApi.ts                    | To features/vocabulary/services/examplesApi.ts                                   |
| 1.3.4 | Recreate barrel export                          | features/vocabulary/services/index.ts                                            |

### Story 1.4 � Move Types & Rename

| Step  | Action                        | Details                                                       |
| ----- | ----------------------------- | ------------------------------------------------------------- |
| 1.4.1 | Move type files (5 files)     | Card.ts, Vocabulary.ts, Conversation.ts, Setting.ts, index.ts |
| 1.4.2 | Rename word.ts -> Word.ts     | Update PascalCase naming convention                           |
| 1.4.3 | Rename state.ts -> State.ts   | Update PascalCase naming convention                           |
| 1.4.4 | Update types/index.ts exports | Point to new filenames                                        |

### Story 1.5 � Move Reducers & Utils

| Step  | Action                       | Details                                                         |
| ----- | ---------------------------- | --------------------------------------------------------------- |
| 1.5.1 | Move listReducer.ts          | To features/vocabulary/reducers/listReducer.ts                  |
| 1.5.2 | Recreate reducers barrel     | features/vocabulary/reducers/index.ts (export listReducer only) |
| 1.5.3 | Move utility files (3 files) | csvLoader.ts, schemaLoader.ts, vocabListHelpers.ts              |
| 1.5.4 | Recreate utils barrel        | features/vocabulary/utils/index.ts                              |

### Story 1.6 � Create Barrel & Move Tests

| Step  | Action                                 | Details                                                                                                                                                                                         |
| ----- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.6.1 | Create features/vocabulary/index.ts    | Export all public components, hooks, services, types                                                                                                                                            |
| 1.6.2 | Move mandarin tests (non-progress)     | **tests**/useExamples.test.tsx, WordExamplesPanel.test.tsx, ConversationTurns.test.tsx, Sidebar.test.tsx, VocabularyCard.test.tsx, plus service/reducer/utility tests (except progress-related) |
| 1.6.3 | Update import paths in all moved files | Fix relative imports between moved files                                                                                                                                                        |

**Verify:** All 35+ files moved to correct locations under features/vocabulary/. Barrel exports all public APIs. No broken imports.

---

## PHASE 2 � Move to features/quiz/

### Story 2.1 � Move Contexts

| Step  | Action                                  | Details                                          |
| ----- | --------------------------------------- | ------------------------------------------------ |
| 2.1.1 | Create features/quiz/context/ directory | Rename from contexts/ later (handled in Phase 3) |
| 2.1.2 | Move ProgressContext.tsx                | To features/quiz/context/ProgressContext.tsx     |
| 2.1.3 | Move UserIdentityContext.tsx            | To features/quiz/context/UserIdentityContext.tsx |
| 2.1.4 | Recreate barrel export                  | features/quiz/context/index.ts                   |

### Story 2.2 � Move Hooks

| Step  | Action                        | Details                                                            |
| ----- | ----------------------------- | ------------------------------------------------------------------ |
| 2.2.1 | Move progress hooks (3 files) | useProgressState.ts, useProgressActions.ts, useProgressDispatch.ts |
| 2.2.2 | Move useUserIdentity.ts       | To features/quiz/hooks/useUserIdentity.ts                          |
| 2.2.3 | Update quiz hooks barrel      | features/quiz/hooks/index.ts                                       |

### Story 2.3 � Move Reducers (rootReducer Decomposition)

| Step  | Action                         | Details                                                                                                                                       |
| ----- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.3.1 | Move progressReducer.ts        | To features/quiz/reducers/progressReducer.ts                                                                                                  |
| 2.3.2 | Move uiReducer.ts              | To features/quiz/reducers/uiReducer.ts                                                                                                        |
| 2.3.3 | Move userReducer.ts            | To features/quiz/reducers/userReducer.ts                                                                                                      |
| 2.3.4 | Move rootReducer.ts            | To features/quiz/reducers/rootReducer.ts. Refactor Sidebar.tsx and NavBar.tsx to import ListState from vocabulary types instead of RootState. |
| 2.3.5 | Recreate reducers barrel       | features/quiz/reducers/index.ts (export progress/ui/user/root)                                                                                |
| 2.3.6 | Normalize action type prefixes | Change PROGRESS*\* to QUIZ_PROGRESS*\* (F4 finding)                                                                                           |

### Story 2.4 � Move Services, Types, Utils

| Step  | Action                  | Details                                                   |
| ----- | ----------------------- | --------------------------------------------------------- |
| 2.4.1 | Move progressService.ts | To features/quiz/services/progressService.ts              |
| 2.4.2 | Move Progress.ts type   | To features/quiz/types/Progress.ts                        |
| 2.4.3 | Move utility files      | progressHelpers.ts, validation.ts to features/quiz/utils/ |
| 2.4.4 | Update barrel exports   | Recreate services/index.ts and feature index              |

### Story 2.5 � Move ProgressPage

| Step  | Action                | Details                                        |
| ----- | --------------------- | ---------------------------------------------- |
| 2.5.1 | Move ProgressPage.tsx | To pages/ProgressPage.tsx (orchestrator layer) |
| 2.5.2 | Verify import paths   | Ensure all page imports point to pages/        |

**Verify:** All 15+ files moved to features/quiz/. Progress reducer action types normalized. Existing quiz components unchanged.

---

## PHASE 3 � Rename, Delete & Cleanup

### Story 3.1 � Rename MandarinRoutes

| Step  | Action                                              | Details                                                                                  |
| ----- | --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 3.1.1 | Rename MandarinRoutes.tsx -> router/LearnRoutes.tsx | Move from features/mandarin/router/ to src/router/                                       |
| 3.1.2 | Update all imports referencing MandarinRoutes       | Router.tsx and any other consumers                                                       |
| 3.1.3 | Update LearnRoutes.tsx page imports                 | Point to pages/QuizPage, pages/VocabularyListPage, pages/FlashCardPage, pages/ReviewPage |

### Story 3.2 � Delete Dead Folders & Orphans

| Step  | Action                                      | Details                                                         |
| ----- | ------------------------------------------- | --------------------------------------------------------------- |
| 3.2.1 | Delete features/mandarin/ entire folder     | All files moved in Phases 1 and 2                               |
| 3.2.2 | Delete features/mandarin/layouts/           | Dead code -- LearnLayout already exists in layouts/, no callers |
| 3.2.3 | Delete features/word/ entire folder         | Full duplicate (5 files), no consumers                          |
| 3.2.4 | Delete pages/Home.tsx                       | Vite boilerplate                                                |
| 3.2.5 | Delete pages/Todo.tsx                       | Stale scaffolding, no consumers                                 |
| 3.2.6 | Delete features/auth/pages/LoginPage.tsx    | Unused legacy                                                   |
| 3.2.7 | Delete features/auth/pages/RegisterPage.tsx | Unused legacy                                                   |

### Story 3.3 � Rename Quiz Context Dir & Dashboard

| Step  | Action                                                                       | Details                                                         |
| ----- | ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 3.3.1 | Rename features/quiz/contexts/ (plural) -> features/quiz/context/ (singular) | Update all imports                                              |
| 3.3.2 | Rename pages/Dashboard.tsx + Dashboard.css -> pages/DashboardPage.tsx        | Rename component to DashboardPage, update imports in Router.tsx |
| 3.3.3 | Move pages/ReviewPage.tsx to pages/ orchestrator                             | Keep as-is, WIP placeholder                                     |

### Story 3.4 � Clean Up Shared Services

| Step  | Action                              | Details                          |
| ----- | ----------------------------------- | -------------------------------- |
| 3.4.1 | Delete services/audioService.ts     | Superseded by vocabulary version |
| 3.4.2 | Delete services/examplesApi.ts      | Moved to features/vocabulary/    |
| 3.4.3 | Delete services/analyticsService.ts | Moved to features/vocabulary/    |
| 3.4.4 | Update services/index.ts            | Export only axiosClient          |

**Verify:** features/mandarin/ deleted. features/word/ deleted. pages/Home.tsx, Todo.tsx deleted. services/ has only axiosClient. auth LoginPage/RegisterPage deleted. ReviewPage exists in pages/.

---

## PHASE 4 � Router & Layout Updates

### Story 4.1 � Update Router.tsx

| Step  | Action                       | Details                                       |
| ----- | ---------------------------- | --------------------------------------------- |
| 4.1.1 | Change MandarinRoutes import | import LearnRoutes from router/LearnRoutes    |
| 4.1.2 | Change Dashboard import      | import DashboardPage from pages/DashboardPage |
| 4.1.3 | Change ProgressPage import   | import ProgressPage from pages/ProgressPage   |

### Story 4.2 � Update LearnRoutes & LearnLayout

| Step  | Action                                | Details                                                                                                                  |
| ----- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 4.2.1 | Update LearnRoutes.tsx page imports   | QuizPage from pages/QuizPage, VocabularyListPage/FlashCardPage from pages/, ReviewPage from pages/ReviewPage             |
| 4.2.2 | Update LearnLayout.tsx context import | Change ../features/mandarin/context to ../features/quiz/context (ProgressContext + UserIdentityContext moved in Phase 2) |

### Story 4.3 � Update Features Barrel Export

| Step  | Action                           | Details                 |
| ----- | -------------------------------- | ----------------------- |
| 4.3.1 | Remove export \* from ./mandarin | From features/index.tsx |
| 4.3.2 | Add export \* from ./vocabulary  | New feature barrel      |
| 4.3.3 | Add export \* from ./quiz        | Expanded feature barrel |

**Verify:** npm test passes. All pages imported from pages/ not features/\*/pages/. features/index.tsx no longer exports mandarin.

---

## PHASE 5 � Verification & Audit

### Story 5.1 � Full Test Suite

| Step  | Action           | Details                                  |
| ----- | ---------------- | ---------------------------------------- |
| 5.1.1 | Run npm test     | All tests must pass                      |
| 5.1.2 | Run tsc --noEmit | TypeScript type checking (if configured) |

### Story 5.2 � Dead Reference & Audit Cleanup

| Step  | Action                                                 | Details                                                                |
| ----- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| 5.2.1 | Search for remaining imports referencing deleted files | Check for features/mandarin/, features/word/, services/audioService.ts |
| 5.2.2 | Update audit report checklists                         | Mark all frontend audit findings as completed                          |

**Verify:** npm test 100% pass. tsc --noEmit clean. No references to features/mandarin/ or features/word/. Audit report updated.

### Dependency Graph

```
Phase 0: Decisions (shared FE + BE)
  +-- Phase 1: Move to vocabulary/ (FE) ----+
  |     +-- Phase 2: Move to quiz/ (FE)     |
  |           +-- Phase 3: Rename/Delete (FE)|
  |                 +-- Phase 4: Router (FE) |
  |                       +-- Phase 5: Verify|
  +-- Backend Phases (BE only) -------------+
```

Frontend Phase 1 runs in parallel with Backend Phase 1. Frontend phases 1-4 are sequential within frontend. Backend and frontend converge at Phase 5 verification.
