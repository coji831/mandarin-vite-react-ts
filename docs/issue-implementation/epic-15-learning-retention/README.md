# Epic 15: Learning Retention System

## Epic Summary

**Goal:** Build daily review quiz system with active recall testing, streak tracking, and gamification to drive engagement and measure objective vocabulary mastery.

**Key Points:**

- Quiz state machine with Fisher-Yates interleaving per word (randomized question types for contextual interference)
- REST API layer: `POST /api/v1/quiz/session/start`, `POST /api/v1/quiz/session/:sessionId/answer`, `GET /api/v1/quiz/session/:sessionId/summary`; supplementary: `GET /api/v1/learning/due`, `POST /api/v1/learning/result`
- PostgreSQL schema extensions: `study_streaks` table, `QuizSession`/`QuizSessionAnswer`/`QuizSessionSummary` tables, `progress.lapseCount` column
- Exponential backoff spaced repetition (Story 15.11: quiz correct doubles interval, incorrect resets to 1 day, max 365 days)
- Gemini API integration with Redis cache layer (24h TTL, ~70% hit rate) for error feedback generation
- React components: `QuizPage` container, `QuestionSection`, `PinyinToneInput`/`ChineseCharacterInput` (numeric tone notation), `AIFeedbackPanel`
- Leech detection algorithm: flag words after 5 consecutive failures (`lapseCount >= 5`)
- Backward compatibility layer ensures flashcard/quiz coexistence without algorithm conflicts

**Status:** In Progress

**Last Update:** March 15, 2026

## Technical Overview

This epic implements a quiz-based retention system using active recall methodology, proven by cognitive science research to improve retention by 50%+ compared to passive review. The system integrates with existing spaced repetition infrastructure while adding objective testing and gamification layers.

**Key Technical Components:**

1. **Backend Quiz API** (Express + Prisma)
   - `POST /api/v1/quiz/session/start` - Start or resume a quiz session (returns 10 questions)
   - `POST /api/v1/quiz/session/:sessionId/answer` - Submit answer, receive feedback + AI explanation if incorrect
   - `GET /api/v1/quiz/session/:sessionId/summary` - Retrieve completed session metrics (XP, accuracy, badges)
   - `GET /api/v1/learning/leeches` - Fetch flagged struggling words (5+ lapses)
   - `GET /api/v1/learning/due` / `POST /api/v1/learning/result` - Stateless supplementary endpoints
   - `GET /api/v1/progress/streak`, `POST /api/v1/progress/streak/freeze`, `GET /api/v1/gamification/badges` - Gamification

2. **Database Schema** (PostgreSQL via Prisma)
   - `study_streaks` table: streak tracking with freeze currency
   - `QuizSession` / `QuizSessionQuestion` / `QuizSessionAnswer` / `QuizSessionSummary` tables: session-based quiz state
   - `progress.lapseCount`: consecutive failure counter for leech detection
   - `user_badges`, `GamificationEvent`: badge awards and XP tracking

3. **Frontend Quiz Components** (React + TypeScript)
   - `QuizPage.tsx` - Container managing quiz session lifecycle
   - `QuestionSection.tsx` - Question display (mode icon + hint + word content)
   - `AnswerSection.tsx` - Answer input (multiple choice buttons, PinyinToneInput, ChineseCharacterInput)
   - `PinyinToneInput.tsx` - Tone mark input with numeric notation support (ma3 → mǎ)
   - `ProgressBar.tsx` - Visual progress indicator (X/Y completed)
   - `StreakCounter.tsx` - Animated streak display
   - `AIFeedbackPanel.tsx` - Displays AI-generated error explanations
   - `MysteryBoxModal.tsx` - Variable reward UI for milestone achievements
   - `LeechWidget.tsx` - Dashboard widget flagging struggling words

4. **Spaced Repetition Adjustments (Story 15.11 - Exponential Backoff)**

   ```javascript
   // Story 15.11: Refactored to quiz-only exponential backoff system
   // Previous: Binary (1 day or 30 days) with 0 delay bug
   // Current: Exponential backoff (1→2→4→8→... up to 365 days)

   function calculateNextReview(currentDelay, correct) {
     const maxDays = 365; // Increased from 30 to 365 days
     const delayDays = correct ? Math.min(maxDays, currentDelay * 2) : 1;
     return new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000);
   }

   // Fixed bug: recordQuizResult now passes currentDelay instead of 0
   async function recordQuizResult({ userId, wordId, correct }) {
     const progress = await repository.findByUserAndWord(userId, wordId);
     const currentDelay = progress?.currentDelay || 1;
     const nextReview = calculateNextReview(currentDelay, correct); // Was: calculateNextReview(0, multiplier)
     // ...
   }

   // Lapse tracking for leech identification (unchanged):
   function updateLapseCount(correct, currentLapses) {
     return correct ? 0 : currentLapses + 1; // Reset on success
   }
   ```

## Business Rules Implementation Reference

This section maps business rules from [Epic 15 BR README](../../business-requirements/epic-15-learning-retention/README.md#business-rules) to actual code locations and implementation patterns.

### 1. Spaced Repetition Algorithm (Story 15.11 - Exponential Backoff)

**Files:**

- `apps/backend/src/core/services/LearningService.js` → `calculateNextReview(currentDelay, correct)`
- `apps/backend/src/core/services/LearningService.js` → `recordQuizResult()`
- `prisma/schema.prisma` → `Progress` model with `nextReview`, `currentDelay`, `lapseCount`

**Key Code Patterns:**

```javascript
// Exponential backoff: double on correct, reset to 1 on incorrect
function calculateNextReview(currentDelay, correct) {
  const maxDays = 365;
  const delayDays = correct ? Math.min(maxDays, currentDelay * 2) : 1;
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + delayDays);
  return nextReview;
}

// Progression example: 1 → 2 → 4 → 8 → 16 → 32 → 64 → 128 → 256 → 365 days
```

**Tests:**

- `apps/backend/tests/unit/LearningService.test.js` → Algorithm validation and recordQuizResult tests

---

### 2. Interleaving Practice

**Files:**

- `apps/backend/src/core/services/QuizSessionService.js` → `createSession()` generates question ordering
- `apps/frontend/src/features/quiz/reducers/quizReducer.ts` → `LOAD_QUESTIONS` action processes session questions

**Note:** The frontend `interleaving.ts` utility was removed (Story 15.11 Phase 8). Question type interleaving is now handled server-side within `QuizSessionService.createSession()`, which generates the ordered question set for the session.

**Tests:**

- `apps/backend/tests/unit/QuizSessionService.test.js` → Session creation and question ordering

---

### 3. Streak Tracking & Reset Logic

**Files:**

- `apps/backend/src/services/StreakService.ts` (lines 1-180) → Full streak logic
- `prisma/schema.prisma` (lines 120-132) → `StudyStreak` model
- `apps/frontend/src/features/gamification/components/StreakDisplay.tsx` → UI display

**Key Code Patterns:**

```typescript
// Streak increment logic (48-hour grace period)
function updateStreak(userId: string, activityDate: Date): StreakUpdateResult {
  const lastActivity = await getLastActivity(userId);
  const hoursSinceLastActivity = differenceInHours(activityDate, lastActivity);

  if (hoursSinceLastActivity > 48) {
    return resetStreak(userId); // Reset to 0
  } else if (isSameDay(activityDate, lastActivity)) {
    return { ...existingStreak, alreadyIncremented: true }; // No change
  } else {
    return incrementStreak(userId); // +1 streak
  }
}
```

**Tests:**

- `apps/backend/tests/unit/services/StreakService.test.ts` → 48h reset, same-day logic

---

### 4. Leech Detection & Focus Words

**Files:**

- `apps/backend/src/services/ProgressService.ts` (lines 266-295) → `updateLapseCount()`
- `prisma/schema.prisma` (lines 88) → `Progress.lapseCount` column
- `apps/frontend/src/features/quiz/components/results/LeechWarning.tsx` → Display component

**Key Code Patterns:**

```typescript
function updateLapseCount(wordId: string, correct: boolean): number {
  const currentLapseCount = await getProgress(wordId).lapseCount;
  const newLapseCount = correct ? 0 : currentLapseCount + 1;

  if (newLapseCount >= 5) {
    await flagAsLeech(wordId); // Trigger "Focus Word" status
  }

  return newLapseCount;
}
```

---

### 5. XP & Mystery Box Rewards

**Files:**

- `apps/backend/src/services/GamificationService.ts` (lines 45-88) → `calculateXP()`
- `apps/backend/src/services/GamificationService.ts` (lines 120-155) → `rollMysteryBox()`
- `apps/frontend/src/features/quiz/components/results/StatsGrid.tsx` → XP display

**Key Code Patterns:**

```typescript
function calculateXP(correct: boolean, currentStreak: number): number {
  const BASE_XP = 10;
  const STREAK_BONUS = currentStreak >= 7 ? 5 : 0;
  return correct ? BASE_XP + STREAK_BONUS : 0;
}

function rollMysteryBox(): MysteryBox | null {
  const DROP_RATE = 0.05; // 5%
  return Math.random() < DROP_RATE ? generateReward() : null;
}
```

---

### 6. AI-Powered Error Feedback

**Files:**

- `apps/backend/src/services/AIFeedbackService.ts` (lines 1-220) → Gemini API integration
- `apps/backend/src/utils/redisClient.ts` → Caching layer
- `apps/frontend/src/features/quiz/hooks/useAIFeedback.ts` → Async fetch with timeout

**Key Code Patterns:**

```typescript
// Redis caching with 24h TTL
async function generateFeedback(wordId: string, userAnswer: string): Promise<string> {
  const cacheKey = `quiz:feedback:${wordId}:${userAnswer}`;
  const cached = await redis.get(cacheKey);

  if (cached) return JSON.parse(cached);

  const feedback = await callGeminiAPI(wordId, userAnswer);
  await redis.setex(cacheKey, 86400, JSON.stringify(feedback)); // 24h TTL

  return feedback;
}

// Frontend: 3s timeout with fallback
const { data, error } = useAIFeedback(wordId, userAnswer, { timeout: 3000 });
```

---

### 7. Multiple Choice Distractor Generation

**Files:**

- `apps/backend/src/utils/distractorGenerator.ts` (lines 1-145) → Distractor algorithms
- `apps/backend/src/services/QuizService.ts` (lines 88-120) → Integration with due words API

**Key Code Patterns:**

```typescript
// Plausible distractor generation
function generateDistractors(correctAnswer: string, questionType: "english" | "pinyin"): string[] {
  if (questionType === "english") {
    // Select 3 random English translations from database (exclude correct)
    return await vocabularyDB.random(3, { exclude: correctAnswer });
  } else {
    // Select characters with similar tones (e.g., mā, má, mà for mǎ)
    return await vocabularyDB.findSimilarTones(correctAnswer, 3);
  }
}
```

---

### 8. Quiz Results Retention

**Files:**

- `apps/backend/prisma/schema.prisma` → `quiz_results` table with `userId`, `wordId`, `correct`, `questionType`, `timeSpentMs`, `createdAt`
- `apps/backend/src/core/services/LearningService.js` → `recordQuizResult()` persists each answer
- `apps/frontend/src/features/quiz/contexts/QuizContext.tsx` → `sessionSummary` state holds in-session results for the summary screen

**Note:** The frontend `quizStorage.ts` localStorage utility and the "Review Mistakes" button were removed (Story 15.11 Phase 8). Quiz result retention is now handled server-side via the `quiz_results` table, and the session summary screen uses `sessionSummary` from QuizContext for the in-session results display.

**Tests:**

- `apps/backend/tests/unit/LearningService.test.js` → `recordQuizResult` test block

---

### Cross-Story Implementation Map

| Business Rule          | Implementation Files                        | Test Coverage          | Story Dependencies |
| ---------------------- | ------------------------------------------- | ---------------------- | ------------------ |
| Spaced Repetition      | `LearningService.js`                        | 30/30 unit tests       | Story 15.1, 15.2   |
| Interleaving           | `QuizSessionService.js` (server-side)       | Session creation tests | Story 15.5, 15.6   |
| Streak Tracking        | `StreakService.ts` (180 lines)              | 25/25 unit tests       | Story 15.3         |
| Leech Detection        | `LearningService.js` (`getLeechesByUser`)   | 8/8 unit tests         | Story 15.2         |
| XP/Rewards             | `GamificationService.ts` (155 lines)        | 18/18 unit tests       | Story 15.3         |
| AI Feedback            | `AIFeedbackService.ts` (220 lines)          | 15/15 unit tests       | Story 15.4         |
| Distractors            | `distractorGenerator.ts` (145 lines)        | 10/10 unit tests       | Story 15.5, 15.6   |
| Quiz Results Retention | `quiz_results` table + `LearningService.js` | Backend unit tests     | Story 15.11        |

**Test Command:** `npm test -- --run src/features/quiz/ apps/backend/tests/`

## Architecture Decisions

1. **Immediate API calls per answer vs. batch save** — Technical choice: POST after each answer with optimistic UI updates
   - Implementation: `useMutation` hook with onSuccess/onError handlers; rollback on network failure
   - Tradeoff: 20-30 API calls per quiz vs. 1 batch call; mitigated with request coalescing (debounce 500ms, max 5 answers per batch)
   - Benefits: State consistency; enables real-time features (leaderboards, live progress)

2. **PostgreSQL streak tracking** — Technical choice: `study_streaks` table with UNIQUE constraint on `user_id`
   - Schema: `currentStreak INT`, `longestStreak INT`, `lastActivityDate DATE`, `freezeCount INT`
   - Query optimization: Index on `user_id`; daily cron job resets expired streaks (WHERE `lastActivityDate` < NOW() - INTERVAL '48 hours')
   - Tradeoff: DB load vs. cross-device reliability

3. **Three question modes implementation** — Technical choice: Union type `QuestionType = 'multiple_choice' | 'type_pinyin' | 'type_character'`
   - Component pattern: Polymorphic `QuizCard` with mode-specific renderers; shared validation logic
   - Input validation: Tone mark regex `/[āáǎàēéěèīíǐìōóǒòūúǔù]/`, character regex `/[\u4e00-\u9fa5]/`
   - Tradeoff: 3 separate test suites vs. unified UX

4. **Interleaving algorithm** — Technical choice: Fisher-Yates shuffle per word (not per quiz session)
   - Implementation: `const shuffled = ['multiple_choice', 'type_pinyin', 'type_character'].sort(() => Math.random() - 0.5)`
   - State management: Memoize shuffle result per word to prevent re-shuffle on re-render
   - Tradeoff: Slightly more complex state vs. 20-30% retention boost

5. **Gemini API integration with Redis caching** — Technical choice: Hash-based cache keys `quiz:feedback:{wordId}:{userAnswer}`
   - Cache strategy: Write-through (generate → cache → return); 24h TTL; LRU eviction
   - Latency mitigation: 3s timeout with fallback to static template; async loading (don't block quiz progression)
   - Cost optimization: ~70% cache hit rate reduces API calls by $0.003/day per active user
   - Tradeoff: Cache invalidation complexity vs. performance

6. **Exponential backoff spaced repetition** (Story 15.11) — Refactored from binary (1 or 30 days) to exponential doubling (1→2→4→8→16→32→64→128→256→365 days); fixed critical delay compounding bug
   - Formula: `newDelay = Math.max(1, Math.min(30, delay * performanceMultiplier))`
   - Multipliers: Quiz correct = 2.0, incorrect = 0.0, flashcard = confidence²
   - Backward compatibility: Feature detection via `quiz_results` table; existing flashcard calls pass `confidence²` as multiplier
   - Migration: Zero retroactive updates; new algorithm applies only to future reviews

## Technical Implementation

### Architecture

```
Frontend: Daily Review Dashboard
    ↓
[User clicks "Start Daily Review"]
    ↓
DailyReviewTest.tsx (container)
    ↓
Fetch due words: GET /api/progress/due
    ↓
Interleave question types (randomize per word)
    ↓
Quiz State Machine:
  - LOADING → QUESTION → ANSWER_FEEDBACK → [AI_FEEDBACK] → NEXT | COMPLETE
    ↓
QuizCard.tsx (display question + options)
ToneInput.tsx (if type_pinyin mode, numeric notation support)
    ↓
[User answers]
    ↓
Save result: POST /api/progress/test-result
  {
    wordId: "abc123",
    correct: true,
    timeSpent: 3500,
    questionType: "multiple_choice"
  }
    ↓
Backend: ProgressService.recordTestResult()
  - Update word progress (nextReviewDate adjusted)
  - Increment lapse_count if incorrect (flag leech after 5)
  - Increment user XP (+10)
  - Update study streak if first activity today
  - Check for perfect quiz streak (award freeze every 10)
    ↓
[If incorrect] → POST /api/quiz/feedback (async)
  - Generate AI explanation via Gemini API
  - Cache common errors in Redis (24h TTL)
    ↓
Frontend: Show feedback + AI explanation, advance to next question
    ↓
[Quiz complete]
    ↓
QuizSummary.tsx
  - Display accuracy (15/20 correct)
  - Display XP earned (+150 XP)
  - Display current streak (7 days 🔥)
  - Display mystery box reward (if milestone reached)
  - Option: "Review Incorrect Answers"
```

### API Endpoints

**GET /api/progress/due**

**Parameters:**

- `date` (optional): ISO date string (defaults to today)
- `limit` (optional): Max words to return (default 20, max 50)

**Response:**

```json
{
  "dueWords": [
    {
      "id": "word123",
      "chinese": "你好",
      "pinyin": "nǐ hǎo",
      "english": "hello",
      "nextReviewDate": "2026-02-02",
      "confidence": 3
    }
  ],
  "totalDue": 45
}
```

**POST /api/progress/test-result**

**Body:**

```json
{
  "wordId": "word123",
  "correct": true,
  "timeSpent": 3500,
  "questionType": "multiple_choice"
}
```

**Response:**

```json
{
  "wordProgress": {
    "nextReviewDate": "2026-02-04",
    "confidence": 4
  },
  "xpEarned": 10,
  "streak": {
    "current": 7,
    "longest": 12
  }
}
```

**POST /api/quiz/feedback**

**Body:**

```json
{
  "wordId": "word123",
  "userAnswer": "má",
  "correctAnswer": "mǎ",
  "questionType": "type_pinyin"
}
```

**Response:**

```json
{
  "explanation": "You confused tone 2 (rising, má) with tone 3 (dipping, mǎ). Remember: tone 3 starts mid, dips low, then rises slightly. Practice: mǎ (horse) vs má (hemp).",
  "similarWords": [
    { "chinese": "麻", "pinyin": "má", "english": "hemp" },
    { "chinese": "妈", "pinyin": "mā", "english": "mother" }
  ],
  "cached": false
}
```

**GET /api/progress/leeches**

**Response:**

```json
{
  "leeches": [
    {
      "wordId": "word456",
      "chinese": "买",
      "pinyin": "mǎi",
      "english": "buy",
      "lapseCount": 7,
      "lastAttempt": "2026-02-10"
    }
  ]
}
```

**GET /api/progress/streak**

**Response:**

```json
{
  "currentStreak": 7,
  "longestStreak": 12,
  "streakFreezes": 3,
  "lastActivityDate": "2026-02-02",
  "streakAtRisk": false,
  "hoursUntilReset": 36
}
```

### Component Relationships

```
MandarinDashboard.tsx
    ↓
<button>Start Daily Review</button>
    ↓
DailyReviewTest.tsx
    ├─ StreakCounter.tsx (header)
    ├─ QuizProgressBar.tsx (progress)
    ├─ QuizCard.tsx
    │   ├─ MultipleChoiceOptions.tsx
    │   └─ TypeAnswerInput.tsx
    └─ QuizSummary.tsx (on completion)
```

---

**Related Documentation:**

- [Epic 15 BR](../../business-requirements/epic-15-learning-retention/README.md)
- [Story 15.1 Implementation: Progress System Adaptation](./story-15-1-progress-system-adaptation.md) **[PREREQUISITE]**
- [Story 15.2 Implementation: Core Quiz Backend Infrastructure](./story-15-2-core-quiz-backend.md)
- [Story 15.3 Implementation: Streak & Gamification Backend APIs](./story-15-3-streak-gamification-backend.md)
- [Story 15.4 Implementation: AI Feedback Backend Service](./story-15-4-ai-feedback-backend.md)
- [Story 15.5 Implementation: Core Quiz UI Components](./story-15-5-core-quiz-ui-components.md)
- [Story 15.6 Implementation: Quiz Container & State Management](./story-15-6-quiz-container-state.md)
- [Story 15.7 Implementation: Gamification & Feedback Display UI](./story-15-7-gamification-feedback-display-ui.md)
- [Story 15.8 Implementation: Core Quiz Backend Integration](./story-15-8-core-quiz-integration.md)
- [Story 15.9 Implementation: Gamification & AI Integration](./story-15-9-gamification-ai-integration.md)
- [Story 15.10 Implementation: Quiz UX Polish & Results Enhancement](./story-15-10-quiz-ux-polish.md)
- [Story 15.11 Implementation: Feature Extensions & Future Adaptability](./story-15-11-feature-extensions.md)
- [Story 15.12 Implementation: Documentation Finalization & Code Quality](./story-15-12-documentation-finalization.md)
- [Epic 14: API Modernization](../epic-14-api-modernization/README.md) (dependency)
- [Architecture Overview](../../architecture.md)
