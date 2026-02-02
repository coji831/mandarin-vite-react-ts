# Epic 15: Learning Retention System

## Epic Summary

**Goal:** Build daily review quiz system with active recall testing, streak tracking, and gamification to drive engagement and measure objective vocabulary mastery.

**Key Points:**

- Active recall quiz system with 3 question modes (multiple choice, type pinyin, type character) for different difficulty levels
- Backend API endpoints for due words query, test result saving, and streak tracking with PostgreSQL persistence
- Spaced repetition algorithm adjustments based on quiz performance (correct/incorrect) vs. subjective confidence ratings
- Study streak tracking with 48-hour grace period and visual indicators when streak at risk
- Gamification layer with badges (7/30/100-day milestones) and XP points (+10 per correct answer) to increase daily active usage

**Status:** Planned

**Last Update:** February 2, 2026

## Technical Overview

This epic implements a quiz-based retention system using active recall methodology, proven by cognitive science research to improve retention by 50%+ compared to passive review. The system integrates with existing spaced repetition infrastructure while adding objective testing and gamification layers.

**Key Technical Components:**

1. **Backend Quiz API** (Express + Prisma)
   - `GET /api/progress/due?date=YYYY-MM-DD` - Fetch words where `nextReviewDate <= date`
   - `POST /api/progress/test-result` - Save quiz answer, adjust spaced repetition
   - `GET /api/progress/streak` - Fetch current/longest streak

2. **Database Schema Extensions** (PostgreSQL)

   ```sql
   CREATE TABLE study_streaks (
     id SERIAL PRIMARY KEY,
     user_id INTEGER REFERENCES users(id),
     current_streak INTEGER DEFAULT 0,
     longest_streak INTEGER DEFAULT 0,
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
   ```

3. **Frontend Quiz Components** (React + TypeScript)
   - `DailyReviewTest.tsx` - Container managing quiz state and API calls
   - `QuizCard.tsx` - Question display with multiple choice UI
   - `TypeAnswerInput.tsx` - Input validation for pinyin/character modes
   - `QuizProgressBar.tsx` - Visual progress indicator (X/Y completed)
   - `StreakCounter.tsx` - Animated streak display with flame icon

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
   ```

## Architecture Decisions

1. **Immediate API calls per answer vs. batch save on completion** — Per-answer saves enable real-time leaderboards and prevent data loss; tradeoff: higher API volume (mitigated with request batching and Redis caching)

2. **PostgreSQL for streak storage vs. localStorage** — Cross-device persistence critical for multi-user features; enables team analytics; tradeoff: backend complexity vs. localStorage simplicity

3. **Three question modes vs. single multiple choice** — Accommodates learning preferences and difficulty levels; tests different recall depths (recognition vs. production); tradeoff: UI complexity vs. engagement variety

4. **48-hour grace period for streaks vs. 24-hour** — Reduces frustration from missed days due to time zones or weekend travel; balances leniency with accountability

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
Quiz State Machine:
  - LOADING → QUESTION → ANSWER_FEEDBACK → NEXT | COMPLETE
    ↓
QuizCard.tsx (display question + options)
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
  - Increment user XP (+10)
  - Update study streak if first activity today
    ↓
Frontend: Show feedback, advance to next question
    ↓
[Quiz complete]
    ↓
QuizSummary.tsx
  - Display accuracy (15/20 correct)
  - Display XP earned (+150 XP)
  - Display current streak (7 days 🔥)
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

**GET /api/progress/streak**

**Response:**

```json
{
  "currentStreak": 7,
  "longestStreak": 12,
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

### Dependencies

**New Dependencies:**

- None (uses existing Axios client from Epic 14)

**Database Migrations:**

- `001_create_study_streaks_table.sql`
- `002_create_quiz_results_table.sql`

**Impacted Files:**

- `apps/backend/src/core/services/ProgressService.js` (add quiz methods)
- `apps/backend/src/controllers/progressController.js` (add routes)
- `apps/frontend/src/features/mandarin/components/DailyReviewTest.tsx` (new)
- `apps/frontend/src/features/mandarin/components/QuizCard.tsx` (new)
- `apps/frontend/src/features/mandarin/components/StreakCounter.tsx` (new)
- `apps/frontend/src/features/mandarin/hooks/useQuizState.ts` (new)

### Testing Strategy

**Unit Tests:**

- `ProgressService.test.js` - Test spaced repetition adjustment logic for quiz results
- `QuizCard.test.tsx` - Test multiple choice option selection
- `TypeAnswerInput.test.tsx` - Test pinyin input validation with tone marks

**Integration Tests:**

- `quiz-flow.test.ts` - Mock API, test complete quiz flow (fetch words → answer → save → summary)
- `streak-tracking.test.js` - Test streak increment logic across date boundaries

**E2E Tests:**

- User completes daily quiz → verify streak increments
- User answers incorrectly → verify `nextReviewDate` resets to 1 day
- User completes quiz on mobile → verify responsive UI

**Manual Testing:**

- Test all 3 question modes (multiple choice, type pinyin, type character)
- Verify streak counter updates in real-time
- Test "Review Incorrect Answers" flow
- Verify mobile responsiveness

### Performance Considerations

**Optimizations:**

- Cache due words query result (Redis, 5-minute TTL)
- Batch API calls: Save 5 answers in one request (reduce round-trips)
- Lazy load quiz components (code-split `DailyReviewTest.tsx`)
- Use React.memo for `QuizCard` to prevent unnecessary re-renders

**Tradeoffs:**

- Per-answer API calls increase backend load (mitigated with batching)
- Streak queries on every page load (mitigated with caching)

**Monitoring:**

- Track quiz completion rate (start vs. finish)
- Track average time per question (detect difficulty issues)
- Track API latency for `/api/progress/due` (optimize if >200ms p95)

### Security Considerations

- Validate `wordId` exists and belongs to user's studied words (prevent cheating)
- Rate limit quiz result endpoint (prevent XP farming: max 100 answers/hour)
- Sanitize user input for type answer modes (prevent XSS via malicious pinyin)

### Migration Strategy

**Phase 1 (Story 15.1):**

- Add database tables, API endpoints
- No UI changes (foundation only)

**Phase 2 (Story 15.2-15.3):**

- Build quiz UI components
- Integrate with backend APIs
- Add streak tracking

**Phase 3 (Story 15.4-15.5):**

- Complete end-to-end flow
- Add gamification layer
- Mobile optimization

**Rollback Plan:**

- Disable quiz feature flag (hide "Start Daily Review" button)
- Revert database migrations if schema issues
- Fall back to flashcard-only mode

### Documentation Updates

- Add quiz system architecture to `docs/architecture.md`
- Document API endpoints in `apps/backend/docs/api-spec.md`
- Add quiz UI patterns to `docs/guides/code-conventions.md`
- Create user guide: `docs/guides/daily-review-quiz-guide.md`

---

**Related Documentation:**

- [Epic 15 BR](../../business-requirements/epic-15-learning-retention/README.md)
- [Story 15.1 Implementation](./story-15-1-due-words-api.md)
- [Story 15.2 Implementation](./story-15-2-quiz-ui-components.md)
- [Story 15.3 Implementation](./story-15-3-study-streak-tracking.md)
- [Story 15.4 Implementation](./story-15-4-test-mode-integration.md)
- [Story 15.5 Implementation](./story-15-5-gamification-badges-xp.md)
- [Epic 14: API Modernization](../epic-14-api-modernization/README.md) (dependency)
- [Architecture Overview](../../architecture.md)
