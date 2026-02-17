# Epic 15: Learning Retention System

## Epic Summary

**Goal:** Build daily review quiz system with active recall testing, streak tracking, and gamification to drive engagement and measure objective vocabulary mastery.

**Key Points:**

- Quiz state machine with Fisher-Yates interleaving per word (randomized question types for contextual interference)
- REST API layer: `GET /api/progress/due`, `POST /api/progress/test-result`, `GET /api/progress/streak`, `POST /api/quiz/feedback`
- PostgreSQL schema extensions: `study_streaks` table, `quiz_results` audit table, `progress.lapseCount` column
- Unified spaced repetition algorithm with performance multipliers (quiz correct: 2.0x, incorrect: 0.0x, flashcard: confidence²)
- Gemini API integration with Redis cache layer (24h TTL, ~70% hit rate) for error feedback generation
- React components: `DailyReviewTest` container, `QuizCard`, `ToneInput` (numeric notation support), `AIFeedbackPanel`
- Leech detection algorithm: flag words after 5 consecutive failures (`lapseCount >= 5`)
- Backward compatibility layer ensures flashcard/quiz coexistence without algorithm conflicts

**Status:** In Progress

**Last Update:** February 17, 2026

## Technical Overview

This epic implements a quiz-based retention system using active recall methodology, proven by cognitive science research to improve retention by 50%+ compared to passive review. The system integrates with existing spaced repetition infrastructure while adding objective testing and gamification layers.

**Key Technical Components:**

1. **Backend Quiz API** (Express + Prisma)
   - `GET /api/progress/due?date=YYYY-MM-DD` - Fetch words where `nextReviewDate <= date`
   - `POST /api/progress/test-result` - Save quiz answer, adjust spaced repetition
   - `GET /api/progress/streak` - Fetch current/longest streak
   - `POST /api/quiz/feedback` - Generate AI explanation for incorrect answer (Gemini API)
   - `GET /api/progress/leeches` - Fetch flagged struggling words (5+ consecutive failures)

2. **Database Schema Extensions** (PostgreSQL)

   ```sql
   CREATE TABLE study_streaks (
     id SERIAL PRIMARY KEY,
     user_id INTEGER REFERENCES users(id),
     current_streak INTEGER DEFAULT 0,
     longest_streak INTEGER DEFAULT 0,
     streak_freezes INTEGER DEFAULT 0,
     last_activity_date DATE,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE quiz_results (
     id SERIAL PRIMARY KEY,
     user_id INTEGER REFERENCES users(id),
     word_id VARCHAR(255),
     correct BOOLEAN,
     time_spent_ms INTEGER,
     question_type VARCHAR(50), -- 'multiple_choice', 'type_pinyin', 'type_character'
     created_at TIMESTAMP DEFAULT NOW()
   );

   ALTER TABLE progress ADD COLUMN lapse_count INTEGER DEFAULT 0;
   ```

3. **Frontend Quiz Components** (React + TypeScript)
   - `DailyReviewTest.tsx` - Container managing quiz state and API calls
   - `QuizCard.tsx` - Question display with multiple choice UI
   - `TypeAnswerInput.tsx` - Input validation for pinyin/character modes
   - `ToneInput.tsx` - Tone mark input with numeric notation support (ma3 → mǎ)
   - `QuizProgressBar.tsx` - Visual progress indicator (X/Y completed)
   - `StreakCounter.tsx` - Animated streak display with flame icon
   - `AIFeedbackPanel.tsx` - Displays LLM-generated error explanations
   - `MysteryBoxReward.tsx` - Variable reward UI for milestone achievements
   - `LeechIndicator.tsx` - Flags struggling words in dashboard

4. **Spaced Repetition Adjustments**

   ```javascript
   // Existing algorithm: delay = min(30, 1 * 2^(confidence * 5))
   // New adjustment for quiz results:
   function adjustNextReviewDate(currentDelay, correct) {
     if (correct) {
       return Math.min(30, currentDelay * 2); // Double delay
     } else {
       return 1; // Reset to 1 day
     }
   }

   // Lapse tracking for leech identification:
   function updateLapseCount(correct, currentLapses) {
     return correct ? 0 : currentLapses + 1; // Reset on success
   }
   ```

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

6. **Unified spaced repetition algorithm** — Technical choice: Refactor `calculateNextReview(delay, performanceMultiplier)`
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
