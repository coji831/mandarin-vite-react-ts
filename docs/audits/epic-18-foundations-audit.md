# Epic 18 — Foundations, Review & Quiz: Full Audit Report

**Date:** 2026-06-25 | **Auditor:** GitHub Copilot (Solution Architect mode) | **Scope:** Full-stack Epic 18

## 1. Executive Summary

Epic 18 encompasses three connected features: **Foundations (Learn)** — pinyin/tones/strokes/animations reference, **Review** — SRS flip-card practice, and **Quiz** — audio-to-type gate assessment. The codebase spans ~70 files across frontend (React/TypeScript), backend (Express/Prisma), content registry (JSON files), and shared packages.

**Overall health: 🟢 Good** — Architecture is clean, data flows are well-structured, and recent migrations have improved maintainability. Key concerns: zero test coverage, incomplete content registry dataset (samples only). Several architectural issues found in initial audit have been resolved (see Section 10).

### Key Metrics

| Metric                   | Count                                      |
| ------------------------ | ------------------------------------------ |
| Frontend feature files   | ~60                                        |
| Backend module files     | ~15                                        |
| Content registry files   | 8                                          |
| Tests (Epic 18 specific) | **0**                                      |
| Console.\* calls         | ~15                                        |
| React.memo usage         | 1 of ~30 components                        |
| Data sources             | content/ (fs) + PinyinCombination (Prisma) |

---

## 2. File Structure Overview

### 2.1 Frontend — Learn Pages (`apps/frontend/src/pages/learn/`)

```
learn/
├── FoundationsPage.tsx       ← Main tab container (Pinyin/Tones/Strokes/Animations)
├── PinyinTab.tsx             ← Interactive pinyin chart with TTS
├── TonesTab.tsx              ← Tone contours, pair drills, change rules
├── StrokeReferenceTab.tsx    ← Static stroke reference (layouts BasicStrokesGrid + StrokeRulesList)
├── StrokeAnimationTab.tsx    ← Hanzi Writer animation with search + suggestions
├── ContentPlaceholderPage.tsx ← Generic "Coming soon" page
└── index.ts                  ← Feature barrel
```

### 2.2 Frontend — Foundations Feature (`apps/frontend/src/features/foundations/`)

```
foundations/
├── index.ts                           ← Feature barrel
├── components/
│   ├── index.ts                       ← Barrel (19 components)
│   ├── pinyin/                        ← 5 components (InitialsGrid, FinalsGrid, CombinationDisplay, PinyinCell, ToneCell)
│   ├── tones/                         ← 3 components (ToneContourCard, TonePairDrills, ToneChangeRules)
│   ├── strokes/                       ← 5 components (BasicStrokesGrid, StrokeBreakdown, StrokeReferenceContent, StrokeRulesDisplay, StrokeRulesList)
│   ├── animations/                    ← 5 components (AnimationCanvas, AnimationControls, AnimationPanel, CharacterSearchBar, SuggestionPanel)
│   └── shared/                        ← 1 component (FoundationsProgressBar)
├── hooks/                             ← 4 hooks (useFoundationsProgress, useHanziWriter, useCharacterSearch, useStrokeReferenceData)
├── services/
│   └── foundationsService.ts          ← API client with module-level cache
├── types/
│   ├── index.ts                       ← Re-exports from pool.ts + shared-types
│   └── pool.ts                        ← PinyinTonesPool + related types
└── utils/
    ├── index.ts                       ← Barrel
    ├── pinyinUtils.ts                 ← TONE_COLORS, getCombination, extractToneNumber, stripToneMarks, getToneVowelIndex
    ├── strokeDataLoader.ts            ← loadStrokeData, getCachedStrokeData, clearStrokeDataCache
    ├── strokeUtils.ts                 ← determineStrokeRules
    └── toneUtils.ts                   ← parseSpokenPinyinForAudio
```

### 2.3 Frontend — Review Feature (`apps/frontend/src/features/review/`)

```
apps/frontend/src/features/review/
├── index.ts
├── components/
│   ├── index.ts
│   ├── ReviewView.tsx                 ← Session orchestrator
│   ├── ReviewPicker.tsx               ← Type + source picker
│   ├── ReviewCard.tsx                 ← Step-based card container (strategies determine flow)
│   ├── ReviewCardPinyinInput.tsx      ← Pinyin typing step (was ReviewCardFront)
│   ├── ReviewCardToneSelect.tsx       ← Tone selection step (was ReviewCardBackTone)
│   ├── ReviewCardResult.tsx           ← Result + rating step (was ReviewCardBackResult)
│   ├── RatingButtons.tsx              ← Again/Good/Easy
│   └── ReviewComplete.tsx             ← Session summary
├── engine/
│   ├── index.ts                       ← Barrel
│   ├── types.ts                       ← ReviewStrategy interface, ReviewInput, ReviewEvaluation
│   └── strategies/
│       ├── index.ts                   ← REVIEW_STRATEGIES registry + getReviewStrategy()
│       ├── PinyinReviewStrategy.ts    ← Evaluates pinyin input for pinyin-syllable items
│       └── ToneReviewStrategy.ts      ← Evaluates tone selection for tone-syllable items
├── hooks/
│   ├── index.ts
│   ├── useReview.ts                   ← Strategy-powered state machine
│   └── useReviewSources.ts            ← Source availability checker
├── services/
│   ├── index.ts
│   └── reviewService.ts               ← 3 methods (fetchItems, recordRating, getDueCount)
└── types/
    ├── index.ts
    └── review.ts                      ← ReviewItem, Rating, ReviewSource, ReviewStep, etc.
```

### 2.4 Frontend — Quiz Feature (`apps/frontend/src/features/quiz/`)

```
quiz/
├── index.ts
├── components/
│   ├── QuizRouter.tsx                 ← Phase-based UI switch
│   ├── QuestionView.tsx               ← Current question display
│   ├── AnswerInput.tsx                ← Auto-submit on pinyin+tone
│   ├── FeedbackView.tsx               ← Correct/incorrect feedback
│   ├── AudioPlayer.tsx                ← TTS playback button
│   ├── QuizProgressBar.tsx            ← Score + threshold line
│   ├── Timer.tsx                      ← Countdown display
│   ├── inputs/PinyinToneInput.tsx     ← Pinyin text + 5 tone buttons
│   └── results/
│       ├── QuizResults.tsx            ← Final score + pass/fail
│       ├── CategoryBreakdown.tsx      ← Per-category scores
│       └── PhaseGateBadge.tsx         ← Pass/fail badge
├── engine/
│   ├── constants.ts                   ← Shared TONE_DESCRIPTIONS (extracted from strategies)
│   ├── types.ts                       ← Re-exports
│   └── strategies/
│       ├── index.ts                   ← Strategy registry
│       └── AudioToPinyinAndToneStrategy.ts  ← Combined: evaluates BOTH pinyin + tone
├── hooks/
│   ├── index.ts
│   └── useQuizEngine.ts               ← Init + timer
├── services/
│   └── quizService.ts                 ← API client + strategy delegation
├── stores/
│   ├── index.ts
│   └── quizSessionStore.ts            ← Zustand store (phase machine, question state, timer)
└── types/
    ├── api.ts                         ← API request/response types
    ├── engine.ts                      ← StrategyType, QuizPhase, QuizQuestion, QuizStrategy interface
    ├── index.ts
    └── session.ts                     ← QuizSession, createInitialSession
```

### 2.5 Backend Modules

```
modules/foundations/
├── index.js
├── api/
│   ├── FoundationsController.js       ← 3 handlers (getPinyinTonesPool, getPinyinCharacterMap, getStrokesReference)
│   └── foundationsRoutes.js           ← 3 routes
└── services/
    └── FoundationsService.js          ← Reads content/ files + PinyinCombination (Prisma)

modules/review/
├── index.js
├── api/
│   ├── ReviewController.js            ← 4 handlers (getReviewItems, recordRating, getDueCount, getPoolReviewItems)
│   └── reviewRoutes.js                ← 4 routes
├── repositories/
│   └── ReviewRepository.js            ← Prisma data access (7 methods)
└── services/
    └── ReviewService.js               ← SRS logic, seeding, source routing

modules/quiz/
├── index.js
├── api/
│   ├── QuizController.js              ← 5 handlers (createAttempt, submitAnswer, completeAttempt, getAttempts, getQuestions)
│   ├── quizRoutes.js                  ← 5 routes
│   ├── AIFeedbackController.js        ← 1 handler
│   └── aiFeedbackRoutes.js            ← 1 route (rate-limited)
├── repositories/
│   └── QuizRepository.js              ← Prisma data access (7 methods)
├── services/
│   └── QuizService.js                 ← Strategy delegation + scoring
├── strategies/
│   ├── AudioToPinyinAndToneStrategy.js  ← Combined: generates from PinyinCombination, validates both
│   └── index.js                         ← Strategy registry
└── use-cases/
    └── AIFeedbackService.js           ← Gemini-based error feedback
```

### 2.6 Content Registry

```
content/
├── manifest.json                      ← v2, 4 pinyin + 2 tones (sample)
├── pinyin/
│   ├── init_b.json, init_m.json       ← 2 sample initials
│   └── fin_a.json, fin_o.json         ← 2 sample finals
├── tones/
│   ├── tn_1.json, tn_4.json           ← 2 sample tones
└── references/
    ├── strokes.json                   ← 8 strokes + 4 rules
    └── tone-reference.json            ← 6 tone pairs + 3 rules
```

### 2.7 Prisma Schema (relevant models)

```
PinyinCombination     ← Junction: init × fin × tone (domain cols: syllable, character, meaning)
ReviewItem            ← SRS tracking (userId, itemType, itemId, intervalDays, nextReview, ...)
QuizAttempt           ← Session record (quizType, phase, totalScore, maxScore, passed)
QuizAttemptAnswer     ← Per-question answer (pinyinInput, selectedTone, correct)
FoundationProgress    ← Per-section progress (sectionId, completed)
PhaseGate             ← Global phase progression (currentPhase, phase1Passed, etc.)
```

---

## 3. Component/Function Inventory

### 3.1 Foundations Components (19 total)

| Component              | Type      | Memo'd  | Props                                                            | Purpose                                               |
| ---------------------- | --------- | ------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| InitialsGrid           | Grid      | No      | initials[], selected, onSelect                                   | 21 initials clickable grid                            |
| FinalsGrid             | Grid      | No      | finals[], selected, onSelect                                     | 39 finals grid by type group                          |
| CombinationDisplay     | Display   | No      | initial, final, tones[], onPlayTone, loadingPinyin               | 5-tone row for selected combo                         |
| PinyinCell             | Cell      | No      | id, label, secondary, isSelected, ariaLabel, onSelect            | Reusable grid cell button                             |
| ToneCell               | Cell      | No      | pinyin, isLoading, loadingText, onPlay                           | Tone-colored cell with play (useMemo for vowel split) |
| ToneContourCard        | Card      | No      | tone, onPlay, isLoading                                          | SVG pitch contour + play button                       |
| TonePairDrills         | List      | No      | drills[], onPlay, loadingPinyin                                  | Dictionary vs spoken comparison                       |
| ToneChangeRules        | Rules     | No      | rules[], onPlay, loadingPinyin                                   | Sandhi + yi + bu rules                                |
| BasicStrokesGrid       | Grid      | No      | strokes[]                                                        | 8 stroke glyph grid                                   |
| StrokeBreakdown        | Display   | **Yes** | totalStrokes, strokePaths, currentStroke, onStrokeSelect         | SVG stroke thumbnails                                 |
| StrokeReferenceContent | Container | No      | none (self-loading)                                              | Data orchestrator                                     |
| StrokeRulesDisplay     | Display   | No      | appliedRules[]                                                   | Current-char rule badges                              |
| StrokeRulesList        | List      | No      | rules[]                                                          | All stroke order rules                                |
| AnimationCanvas        | Canvas    | No      | canvasRef, isReady, error, character, onClick                    | Hanzi writer container                                |
| AnimationControls      | Controls  | No      | isReady, isPlaying, currentStroke, totalStrokes, speed, handlers | Play/pause/step/speed                                 |
| AnimationPanel         | Container | No      | character, onCharacterClick                                      | Full animation orchestrator                           |
| CharacterSearchBar     | Input     | No      | onCharacterSelect                                                | Hanzi search with validation                          |
| SuggestionPanel        | Panel     | No      | onSelect, currentCharacter                                       | Suggested chars from stroke data                      |
| FoundationsProgressBar | Bar       | No      | none (self-loading)                                              | X/4 completed indicator                               |

### 3.2 Review Components (8 total)

| Component             | Memo'd | Props                                                                                                 | Purpose                     |
| --------------------- | ------ | ----------------------------------------------------------------------------------------------------- | --------------------------- |
| ReviewView            | No     | onBack, presetType, presetSource                                                                      | Session orchestrator        |
| ReviewPicker          | No     | onStart, presetType                                                                                   | 2-step type+source selector |
| ReviewCard            | No     | item, step, userPinyin, pinyinCorrect, toneCorrect, onSubmitPinyin, onSelectTone, onRate, onPlayAudio | Step-based card container   |
| ReviewCardPinyinInput | No     | item, onSubmitPinyin, onPlayAudio                                                                     | Pinyin typing step          |
| ReviewCardToneSelect  | No     | item, onSelectTone, onPlayAudio                                                                       | Tone selection step         |
| ReviewCardResult      | No     | item, pinyinCorrect, toneCorrect, onRate                                                              | Result + rating step        |
| RatingButtons         | No     | onRate, disabled                                                                                      | Again/Good/Easy             |
| ReviewComplete        | No     | result, totalItems, onReviewAgain, onBack                                                             | Session stats               |

### 3.3 Quiz Components (12 total)

| Component         | Memo'd | Props                                                | Purpose                      |
| ----------------- | ------ | ---------------------------------------------------- | ---------------------------- |
| QuizRouter        | No     | none (reads store)                                   | Phase-based UI switch        |
| QuestionView      | No     | none (reads store)                                   | Current question             |
| AnswerInput       | No     | none (local state)                                   | 500ms debounce auto-submit   |
| FeedbackView      | No     | none (reads store)                                   | Correct/incorrect comparison |
| AudioPlayer       | No     | audioKey, character, label                           | TTS playback button          |
| QuizProgressBar   | No     | current, total                                       | Score + 90% threshold        |
| Timer             | No     | none (reads store)                                   | Countdown                    |
| PinyinToneInput   | No     | pinyin, tone, onPinyinChange, onToneSelect, disabled | Combined input               |
| QuizResults       | No     | none (reads store)                                   | Score + pass/fail            |
| CategoryBreakdown | No     | answers[]                                            | Per-category bars            |
| PhaseGateBadge    | No     | passed                                               | Pass/fail badge              |

### 3.4 Backend Services (4 total)

| Service            | Methods                                                                                                | Data Sources                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| FoundationsService | getPinyinTonesPool(), getPinyinCharacterMap(), getStrokesReference()                                   | content/ files (fs) + PinyinCombination (Prisma)         |
| ReviewService      | getReviewItems(), recordRating(), getAllPhase1Items(), ensureReviewItemsExist()                        | content/ files + PinyinCombination + ReviewItem (Prisma) |
| QuizService        | createQuizAttempt(), submitAnswer(), completeQuizAttempt(), getUserQuizAttempts(), generateQuestions() | QuizRepository + single AudioToPinyinAndToneStrategy     |
| AIFeedbackService  | generateFeedback(), generateAIFeedback()                                                               | WordRepository + Gemini AI                               |

---

## 4. Data Flow Analysis

### 4.1 Foundations Data Flow

```
Content files (content/pinyin/, content/tones/, content/references/)
    │
    ├──► FoundationsService._readContentFiles()  ──► build initials[], finals[], toneInfo[]
    ├──► FoundationsService._readSingleReferenceFile() ──► tonePairs, toneRules
    │
PinyinCombination (Prisma)
    │
    └──► FoundationsService.getPinyinTonesPool() ──► merge into PinyinTonesPool shape
         │
         └──► FoundationsController ──► GET /v1/foundations/data/pinyin-tones
              │
              └──► foundationsService.getPinyinTonesPool() (frontend, cached)
                   │
                   ├──► PinyinTab (initials + finals grids + combination display)
                   └──► TonesTab (tone contours + pair drills + change rules)

PinyinCombination (Prisma) ──► getPinyinCharacterMap() ──► GET /v1/foundations/data/pinyin-character-map
                                                        ──► PinyinTab/TonesTab audio (character lookup)

content/references/strokes.json ──► getStrokesReference() ──► GET /v1/foundations/data/strokes
                                                          ──► StrokeReferenceTab (grid + rules)
```

### 4.2 Review Data Flow

```
PinyinCombination + content/pinyin/ + content/tones/
    │
    └──► ReviewService.getAllPhase1Items() ──► generates ReviewItem[] (seeds DB on first access)
         │
         └──► ReviewService.getReviewItems() ──► ReviewController ──► GET /v1/review/items
              │
              └──► reviewService.fetchItems() ──► useReview().startReview() ──► ReviewCard (3 steps)
                   │
                   User rates item ──► useReview().rateItem() ──► POST /v1/review/result
                        │
                        └──► ReviewService.recordRating() ──► SRS calc ──► ReviewRepository.upsert()
```

### 4.3 Quiz Data Flow

```
PinyinCombination (Prisma)
    │
    └──► AudioToTypeStrategy.generateQuestions() ──► QuizService ──► GET /v1/quiz/questions
         │
         └──► quizService.generateQuestionPool() ──► quizSessionStore.initialize()
              │
              User types + selects tone ──► 500ms debounce ──► store.submitAnswer()
                   │
                   ├──► local evaluateAnswer() (optimistic)
                   └──► POST /v1/quiz/attempts/:id/answers (backend verdict, overrides local)
                        │
                        Last question ──► store.completeAttempt() ──► PUT /v1/quiz/attempts/:id/complete
                             │
                             └──► QuizService.completeQuizAttempt() ──► if passed → PhaseGate update
```

---

## 5. User Flow Analysis

### 5.1 Learn Flow

```
1. Navigate to /learn/foundations
2. FoundationsPage renders 4-tab bar + progress bar
3. Default: Pinyin tab → fetch pool → grid + combo display
4. Click initial → highlight; click final → highlight + find combo
5. Combo found → show 5-tone row with play buttons
6. Click tone → TTS audio (backend TTS, fallback browser)
7. Switch to Tones tab → same pool data → contours + drills + rules
8. Switch to Strokes tab → stroke reference (grid + rules)
9. Switch to Animations tab → default "水" → hanzi-writer canvas
10. Type character → validate → new hanzi-writer instance
11. Click character in canvas → open Character Detail Hub
```

**Observations:**

- ✅ Tab switching is smooth with service-level caching
- ✅ All data loaded once, shared across tabs
- ⚠️ No loading timeout — if fetch fails, user sees "Loading..." indefinitely
- ⚠️ No retry mechanism on error (page refresh required)

### 5.2 Review Flow

```
1. Navigate to /practices/review
2. Pick content type (Pinyin 🔤 / Tones 🎵)
3. Pick source (Due / Recent / All)
4. Strategy determines first step:
   - Pinyin items → step "pinyin": see character + meaning → type pinyin → result
   - Tone items → step "tone": see character + meaning → select tone → result
5. Result card shows per-type feedback (labeled by strategy.feedbackLabel)
6. Rate (Again/Good/Easy) → advance to next item
7. Repeat until all items reviewed
8. See completion summary (conditional: shows pinyin accuracy OR tone accuracy)
9. "Review Again" or "Back to Practices"
```

**Observations:**

- ✅ Strategy-driven flow: each item type has exactly one input step, evaluated by its strategy
- ✅ Conditional results: ReviewComplete only shows stats relevant to the session type
- ⚠️ Audio available but not forced — user must click play button
- ⚠️ Source "all" returns ALL items regardless of due status (defeats SRS purpose)

### 5.3 Quiz Flow

```
1. Navigate to /practices/quiz?type=audio-to-pinyin-tone
2. Quiz initializes: fetch questions + create backend attempt
3. Phase: INPUT → show AudioPlayer + pinyin input + tone buttons
4. Listen to audio → type pinyin → select tone → 500ms auto-submit
5. Phase: FEEDBACK → show correct/incorrect + answer comparison
6. Click "Next Question" → repeat 10 questions
7. Phase: RESULTS → show score + pass/fail + category breakdown
8. Pass → "Continue to Phase 2" → /learn
9. Fail → "Try Again" → re-initialize same quiz
```

**Observations:**

- ✅ Previously split into two separate quiz types (Audio-to-Pinyin + Audio-to-Tone). Merged into a single combined strategy that evaluates BOTH dimensions per question. Each question scores pinyin AND tone independently — overall correct only if both are right.
- ✅ Backend is authoritative for answer verdict
- ✅ Phase gate integration (pass = unlock Phase 2)
- ⚠️ 500ms debounce may fire before user finishes typing multi-syllable pinyin
- ⚠️ No "time's up" transition — timer silently stops at 0
- ⚠️ Fallback to 16 hardcoded questions if backend unavailable

---

## 6. Test Coverage

### 6.1 Current State: ZERO tests

| Feature Area           | Unit Tests | Component Tests | Integration Tests |
| ---------------------- | ---------- | --------------- | ----------------- |
| Foundations (frontend) | ❌         | ❌              | ❌                |
| Review (frontend)      | ❌         | ❌              | ❌                |
| Quiz (frontend)        | ❌         | ❌              | ❌                |
| Foundations (backend)  | ❌         | —               | ❌                |
| Review (backend)       | ❌         | —               | ❌                |
| Quiz (backend)         | ❌         | —               | ❌                |

### 6.2 Critical Untested Paths

| Priority  | Path                                                              | Risk                                                 |
| --------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| 🔴 High   | `FoundationsService.getPinyinTonesPool()` — merges 4 data sources | Content file changes could break pool shape silently |
| 🔴 High   | `ReviewService.recordRating()` — SRS calculation                  | Wrong interval math corrupts learning data           |
| 🔴 High   | `quizSessionStore.submitAnswer()` — optimistic + backend verdict  | Client/server score divergence                       |
| 🟡 Medium | `useHanziWriter()` — hanzi-writer lifecycle                       | Library upgrade breaks canvas rendering              |
| 🟡 Medium | `ReviewService.ensureReviewItemsExist()` — seeding logic          | New users get empty review                           |
| 🟡 Medium | `AudioToTypeStrategy.generateQuestions()` — fallback questions    | Silent quality degradation                           |

---

## 7. Violations & Bad Patterns

### 7.1 🔴 High Severity

| #   | Issue                        | Location                                               | Description                                                                                                                               |
| --- | ---------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | **Zero test coverage**       | All Epic 18 features                                   | No unit/component/integration tests exist for any Epic 18 code. Critical business logic (SRS, quiz evaluation, data merging) is untested. |
| H2  | **Dead code: QuizEngine.ts** | `apps/frontend/src/features/quiz/engine/QuizEngine.ts` | ✅ **RESOLVED** — File was deleted. Zustand store handles all quiz lifecycle.                                                             |

### 7.2 🟡 Medium Severity

| #   | Issue                                        | Location                                                             | Description                                                                                                                                                      |
| --- | -------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | **Dead hook: useCharacterSearch.ts**         | `apps/frontend/src/features/foundations/hooks/useCharacterSearch.ts` | Hook is exported but no consumer imports it. StrokeAnimationTab manages character state manually. Only `isValidHanzi` utility is used (imported directly).       |
| M2  | **Cross-contamination: useProgressState.ts** | `apps/frontend/src/features/quiz/hooks/useProgressState.ts`          | ✅ **RESOLVED** — Moved to `features/vocabulary/hooks/`.                                                                                                         |
| M3  | **~15 console.\* calls**                     | Scattered across all 3 features                                      | No centralized logging. Mix of debug leftovers and intentional fallback warnings. Filterable `[Foundations]` prefix added recently but not consistently applied. |
| M4  | **Missing React.memo on 29/30 components**   | All Epic 18 components except StrokeBreakdown                        | ReviewCard re-creates inner helpers on every step. TonePairDrills/ToneChangeRules re-compute ColorizedPinyin on every render.                                    |

### 7.3 🟢 Low Severity

| #   | Issue                           | Location                                   | Description                                                                                                     |
| --- | ------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| L1  | **Private API usage**           | `useHanziWriter.ts` — `writer._options`    | Accessing `_options` (private hanzi-writer API). Documented with `@warning` but still fragile on version bumps. |
| L2  | **Inconsistent error messages** | Backend controllers                        | "Failed to load" vs "Failed to fetch" vs "Failed to create" — no standard format.                               |
| L3  | **CSS import bypass**           | `QuizSessionPage.tsx`, `QuizDebugPage.tsx` | Uses `// eslint-disable-next-line no-restricted-imports` to import CSS directly from components folder.         |
| L4  | **Sample data only**            | `content/pinyin/` + `content/tones/`       | Only 4 pinyin files + 2 tone files. Not enough to exercise full quiz/review flows.                              |
| L5  | **No loading timeout**          | `PinyinTab.tsx`, `TonesTab.tsx`            | If API fails, user sees "Loading..." indefinitely with no timeout or retry.                                     |

### 7.4 ✅ Resolved Issues (2026-06-25)

| #   | Issue                                             | Resolution                                                                                                                      |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Dead code: QuizEngine.ts** (H2)                 | Deleted — Zustand store handles all quiz lifecycle                                                                              |
| R2  | **Cross-contamination: useProgressState.ts** (M2) | Moved to `features/vocabulary/hooks/`                                                                                           |
| R3  | **ReviewCard inner helpers not extractable** (M5) | Extracted to `ReviewCardPinyinInput.tsx`, `ReviewCardToneSelect.tsx`, `ReviewCardResult.tsx` — independently importable         |
| R4  | **Duplicated constants**                          | `TONE_DESCRIPTIONS` extracted to `quiz/engine/constants.ts`; `TONE_BUTTONS_BASE` extracted to `shared/constants/toneMap.ts`     |
| R5  | **Quiz strategies artificially split**            | Merged `AudioToPinyin` + `AudioToTone` → single `AudioToPinyinAndToneStrategy` evaluating both dimensions                       |
| R6  | **Review promoted to strategy pattern**           | Created `review/engine/` with `ReviewStrategy` interface + `PinyinReviewStrategy` + `ToneReviewStrategy` + registry             |
| R7  | **`apiClient` called without service layer**      | `useGamificationAPI` → uses existing service; `usePhaseGate` → new `phaseGateService.ts`; quiz strategies → use `quizService`   |
| R8  | **Dead API methods**                              | Removed `getPoolReviewItems` and `rateReviewItem` from `reviewService.ts` — never called                                        |
| R9  | **Barrel file pollution**                         | Inline types extracted from `foundations/types/`, `auth/types/`, `progress/types/`, `gamification/services/` to dedicated files |
| R10 | **24 `interface` → `type` conversions**           | All `interface` declarations across 23 files converted to `type` for consistency                                                |
| R11 | **Review crash on tones**                         | Added missing `await` before `readContentDir("tones")` in `ReviewService.js` — was returning Promise, causing 500 error         |
| R12 | **Review tone item data contract**                | Added `pinyinPlain` + `correctTone` fields to `buildToneItem()` for correct evaluation                                          |
| R13 | **Dead `userPinyin` prop in ReviewCardResult**    | Removed from interface and passthrough — was never consumed                                                                     |
| R14 | **Hardcoded "pinyin" in error/complete paths**    | ReviewView "Try Again" + ReviewComplete "Review Again" now use dynamic `source` + `contentType`                                 |

---

## 8. Recommendations

### 8.1 Immediate (Before Epic 19)

| Order | Action                             | Rationale                                                                          |
| ----- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| 1     | **Evaluate useCharacterSearch.ts** | Either adopt into StrokeAnimationTab or delete the hook (keep isValidHanzi export) |
| 2     | **Expand content files**           | Populate all 21 initials + 37 finals + 5 tones from existing pool data             |

### 8.2 Short-Term (During Epic 19)

| Order | Action                              | Rationale                                                                                       |
| ----- | ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| 3     | **Add tests for critical paths**    | SRS calculation, pool reconstruction, quiz answer evaluation                                    |
| 4     | **Standardize error messages**      | Consistent `"Failed to {action} {resource}"` format across all controllers                      |
| 5     | **Add loading timeout + retry**     | For all data-fetching components (PinyinTab, TonesTab, StrokeReferenceTab)                      |
| 6     | **Add tests for review strategies** | PinyinReviewStrategy and ToneReviewStrategy evaluateAnswer() logic is now isolated and testable |

### 8.3 Medium-Term

| Order | Action                          | Rationale                                                                       |
| ----- | ------------------------------- | ------------------------------------------------------------------------------- |
| 9     | **Audit and add React.memo**    | Focus on ReviewCard (re-renders on every step), TonePairDrills, ToneChangeRules |
| 10    | **Centralize frontend logging** | Replace scattered console.\* with a shared logger utility                       |
| 11    | **Replace CSS import bypass**   | Move CSS to proper import pattern or configure eslint rule                      |

---

## 9. Open Items

| Item                                         | Status         | Notes                                                                               |
| -------------------------------------------- | -------------- | ----------------------------------------------------------------------------------- |
| Content files — full dataset                 | 🟡 Sample only | 4/58 pinyin files, 2/5 tone files. Need population before quiz/review work at scale |
| PinyinCombination — full dataset             | 🟡 Sample only | 16/1855 combos seeded. Enough for flow validation but not full quiz                 |
| Test coverage                                | 🔴 None        | Deferred by user. Critical path to address before production                        |
| `strokes.json` in content/references/        | ✅ Complete    | Full dataset (8 strokes, 4 rules, 10 suggested chars)                               |
| `tone-reference.json` in content/references/ | ✅ Complete    | 6 tone pairs, 3 tone rules                                                          |

---

## 10. Change Log

| Date       | Change                                                                                | Author             |
| ---------- | ------------------------------------------------------------------------------------- | ------------------ |
| 2026-06-24 | Initial audit report                                                                  | Solution Architect |
| 2026-06-25 | Fixed review crash on tones (missing await)                                           | Solution Architect |
| 2026-06-25 | Fixed tone item data contract (pinyinPlain + correctTone)                             | Solution Architect |
| 2026-06-25 | Type-aware review step flow (pinyin→result, tone→result)                              | Solution Architect |
| 2026-06-25 | Renamed review components (Front→PinyinInput, BackTone→ToneSelect, BackResult→Result) | Solution Architect |
| 2026-06-25 | Promoted review to strategy pattern (review/engine/ + 2 strategies)                   | Solution Architect |
| 2026-06-25 | Merged quiz strategies into single AudioToPinyinAndTone (evaluates both)              | Solution Architect |
| 2026-06-25 | Extracted TONE_DESCRIPTIONS to quiz/engine/constants.ts                               | Solution Architect |
| 2026-06-25 | Extracted TONE_BUTTONS_BASE to shared/constants/toneMap.ts                            | Solution Architect |
| 2026-06-25 | Removed dead API methods from reviewService.ts                                        | Solution Architect |
| 2026-06-25 | Routed apiClient calls through service layer (gamification, phaseGate, quiz)          | Solution Architect |
| 2026-06-25 | Cleaned barrel files (foundations, auth, progress, gamification types)                | Solution Architect |
| 2026-06-25 | Converted 24 interface declarations to type across 23 files                           | Solution Architect |
| 2026-06-25 | Removed dead userPinyin prop from ReviewCardResult                                    | Solution Architect |
| 2026-06-25 | Fixed hardcoded type/source in error + complete paths                                 | Solution Architect |

---
