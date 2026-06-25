# Epic 15: Learning Retention System

## Epic Summary

**Goal:** Implement daily review quizzes with spaced repetition testing, study streak tracking, and gamification to drive user engagement and improve vocabulary retention.

**Key Points:**

- Drives 50%+ retention improvement vs. current passive flashcards (active recall proven by cognitive science)
- Increases daily active users (DAU) through streak tracking and milestone badges (7/30/100-day)
- Provides objective learning metrics (accuracy rates, mastery levels) vs. subjective confidence ratings
- Reduces churn through gamification (XP, badges, mystery rewards) and social engagement features
- Addresses #1 user complaint ("why was I wrong?") with AI-powered personalized feedback
- Enables data-driven insights for team analytics and progress reporting
- Supports multiple difficulty levels (multiple choice â†’ type answers) for diverse learner preferences

**Status:** In Progress

**Last Update:** March 15, 2026

## Background

The current system supports passive vocabulary review via flashcards with manual confidence ratings. While spaced repetition calculates optimal review dates, users lack active recall practiceâ€”the most effective method for long-term retention.

Research shows active recall testing (retrieving information from memory) significantly outperforms passive review for retention. Additionally, gamification elements like streaks and badges drive daily active usage, a critical SaaS retention metric.

**Current Pain Points:**

- Users rate confidence subjectively (may overestimate understanding)
- No objective mastery validation
- No compelling reason to return daily (low DAU/MAU ratio)
- Passive review less effective than active testing
- Generic error feedback doesn't explain why mistakes happen or how to improve

**Business Impact:**

- Low user retention (avg 3 sessions, then churn)
- No viral growth mechanics (streaks enable social sharing)
- Cannot measure true vocabulary mastery for team analytics

This epic addresses these issues by implementing a daily review quiz system with objective testing, streak tracking, and gamification to drive engagement.

## User Stories

This epic consists of 12 user stories organized by implementation layer for parallel development:

### Backend Stories (API & Database)

1. [**Story 15.1: Progress System Adaptation**](./story-15-1-progress-system-adaptation.md) **[PREREQUISITE]**
   - As a **backend developer**, I want to **adapt the existing progress tracking system to support quiz-based testing**, so that **flashcard confidence ratings and quiz results can coexist without conflicts and enable gradual migration**.

2. [**Story 15.2: Core Quiz Backend Infrastructure**](./story-15-2-core-quiz-backend.md)
   - As a **backend developer**, I want to **expose API endpoints for due words, test results, and leech tracking**, so that **the frontend can fetch vocabulary requiring review and save quiz answers**.

3. [**Story 15.3: Streak & Gamification Backend APIs**](./story-15-3-streak-gamification-backend.md)
   - As a **backend developer**, I want to **implement streak tracking, badge awards, and XP calculation APIs**, so that **gamification features can drive user engagement**.

4. [**Story 15.4: AI Feedback Backend Service**](./story-15-4-ai-feedback-backend.md)
   - As a **backend developer**, I want to **integrate Gemini API for error explanations with Redis caching**, so that **users receive personalized feedback on incorrect answers**.

### Frontend Stories (UI Components)

5. [**Story 15.5: Core Quiz UI Components**](./story-15-5-core-quiz-ui-components.md)
   - As a **frontend developer**, I want to **build reusable quiz components (QuizCard, ToneInput, TypeAnswerInput)**, so that **learners can interact with multiple question types**.

6. [**Story 15.6: Quiz Container & State Management**](./story-15-6-quiz-container-state.md)
   - As a **frontend developer**, I want to **implement quiz state machine with interleaving logic**, so that **learners experience optimized question presentation for retention**.

7. [**Story 15.7: Gamification & Feedback Display UI**](./story-15-7-gamification-feedback-display-ui.md)
   - As a **frontend developer**, I want to **build display components for streaks, badges, XP, and AI feedback**, so that **learners see their achievements and receive contextual error explanations**.

### Integration Stories (Connect Frontend to Backend)

8. [**Story 15.8: Core Quiz Backend Integration**](./story-15-8-core-quiz-integration.md)
   - As a **learner**, I want to **start a daily review quiz from my dashboard**, so that **I can practice due vocabulary and see my accuracy results with real-time backend sync**.

9. [**Story 15.9: Gamification & AI Integration**](./story-15-9-gamification-ai-integration.md)
   - As a **learner**, I want to **earn badges, XP, and streak rewards with AI-powered feedback**, so that **I feel rewarded for consistent study and understand my mistakes**.

### Polish & Closure Stories

10. [**Story 15.10: Quiz UX Polish & Results Enhancement**](./story-15-10-quiz-ux-polish.md)

- As a **learner**, I want to **experience a polished quiz with stable layouts, clear instructions, and enhanced results display**, so that **the quiz feels professional and provides actionable feedback without visual jarring**.

11. [**Story 15.11: Feature Extensions & Future Adaptability**](./story-15-11-feature-extensions.md)

- As a **developer**, I want to **implement advanced quiz features and add architectural hooks for future enhancements**, so that **the quiz system handles multi-meaning words, provides better input methods, and supports planned expansions**.

12. [**Story 15.12: Documentation Finalization & Code Quality**](./story-15-12-documentation-finalization.md)

- As a **development team**, I want to **finalize Epic 15 with clean code, accurate documentation, and verified business rules**, so that **the codebase is maintainable and ready for production deployment**.

## Story Breakdown Logic

This epic is divided into 12 user stories using **UI/API separation principle** to enable parallel development and minimize coupling:

**Backend Group (Stories 15.1-15.4):**

- **Story 15.1** (Prerequisite): Adapts existing progress system to support quiz-based testing **without breaking flashcard functionality**; enables gradual migration via feature detection and backward compatibility
- **Story 15.2**: Implements core quiz APIs (due words, test results, leech tracking)
- **Story 15.3**: Implements gamification backend (streaks, badges, XP, mystery boxes)
- **Story 15.4**: Implements AI feedback service (Gemini API + Redis caching)

**Frontend Group (Stories 15.5-15.7):**

- **Story 15.5**: Builds pure UI components (QuizCard, ToneInput, TypeAnswerInput) with zero API calls
- **Story 15.6**: Implements quiz state machine and interleaving logic (container components)
- **Story 15.7**: Builds gamification display components (streaks, badges, XP, AI feedback)

**Integration Group (Stories 15.8-15.9):**

- **Story 15.8**: Connects quiz UI to backend APIs (fetch due words, save results, analytics)
- **Story 15.9**: Connects gamification UI to backend APIs (streaks, rewards, AI feedback)

**Polish & Closure Group (Stories 15.10-15.12):**

- **Story 15.10**: UX polish addressing layout stability, guidance features, results enhancements (19 UX improvements from user feedback)
- **Story 15.11**: Feature extensions (multi-meaning support, pinyin conversion, quiz retention, UI component migration) and future architecture hooks (filters, distractors, feedback providers)
- **Story 15.12**: Documentation finalization, ESLint cleanup, type safety audits, business rule verification

**Benefits of This Structure:**

- Backend team and frontend team can work in parallel (40% faster delivery)
- Zero file overlap until integration stories (fewer merge conflicts)
- Pure UI components are reusable across features
- Each story has clear, focused acceptance criteria
- Story 15.1 ensures independent operation (quiz system won't break existing flashcard users)
- Story 15.11 adds extensibility hooks without implementing full features (YAGNI principle)
- Story 15.12 ensures production-ready code with comprehensive documentation

## Business Rules

This section maps core learning principles and gamification mechanics to their technical implementations across the epic.

### 1. Spaced Repetition Algorithm (Story 15.1, 15.2, 15.11)

**Rule:** Words are scheduled for review using exponential backoff spaced repetition.

**Formula (Story 15.11 - Exponential Backoff):**

```
newDelay = correct ? min(365, currentDelay * 2) : 1
```

**Progression:** 1 â†’ 2 â†’ 4 â†’ 8 â†’ 16 â†’ 32 â†’ 64 â†’ 128 â†’ 256 â†’ 365 days (max)

**Performance Multipliers:**

- **Quiz correct answer:** Double the interval (exponential backoff), capped at 365 days
- **Quiz incorrect answer:** Reset to 1 day (immediate review)

**Implementation:**

- Backend: `apps/backend/src/core/services/ProgressService.js` â†’ `calculateNextReview(currentDelay, correct)`
- Database: `progress.nextReview`, `progress.currentDelay` columns, updated after each quiz answer
- API: `POST /api/progress/record-quiz-result` adjusts nextReview based on correctness
- **Bug Fix (Story 15.11)**: Fixed critical bug where delay compounding wasn't working (was passing 0 instead of currentDelay)

**Business Rationale:** Active recall (quizzes) provides objective validation; exponential backoff efficiently spaces well-mastered words (up to yearly reviews) while quickly re-exposing challenging words. Increased max from 30 to 365 days for long-term retention.

---

### 2. Interleaving Practice (Story 15.6)

**Rule:** Question types are randomized per word (not blocked), creating "desirable difficulty" that improves long-term retention by 20-30%.

**Algorithm:**

- For each word: randomly select from `['multiple_choice', 'type_pinyin', 'type_character']`
- Shuffle occurs per word (e.g., Word A â†’ MC, Word B â†’ type pinyin, Word A again tomorrow â†’ type character)
- NOT blocked practice (e.g., all MC first, then all pinyin)

**Implementation:**

- Frontend: `apps/frontend/src/features/quiz/utils/interleaving.ts` â†’ `createInterleavedQuestions()`
- State: `apps/frontend/src/features/quiz/reducers/quizReducer.ts` â†’ stores question sequence
- Component: `apps/frontend/src/features/quiz/pages/QuizPage.tsx` â†’ renders mode-specific inputs

**Business Rationale:** Cognitive science research (Rohrer & Taylor 2007) shows interleaving forces learners to discriminate between concepts, strengthening memory retrieval vs. blocked practice which feels easier but produces weaker retention.

---

### 3. Streak Tracking & Reset Logic (Story 15.3)

**Rule:** Study streaks motivate daily active usage through loss aversion mechanics.

**Mechanics:**

- **Increment:** Streak increases by 1 on first quiz activity of the day (midnight-to-midnight UTC)
- **Reset:** Streak resets to 0 after 48 hours of inactivity (not 24h, to allow one missed day)
- **Freeze Currency:** Earn 1 freeze per 10 consecutive perfect quizzes; spend to protect streak for 24h
- **Badges:** Awarded at 7, 30, 100-day milestones (one-time, non-repeating)

**Implementation:**

- Backend: `apps/backend/src/services/StreakService.ts` â†’ `updateStreak()`, `checkStreakReset()`
- Database: `study_streaks` table with `currentStreak`, `longestStreak`, `lastActivityDate`, `streakFreezes`
- API: `GET /api/progress/streak`, `POST /api/progress/test-result` (auto-increments streak)
- Frontend: `apps/frontend/src/features/gamification/components/StreakDisplay.tsx`

**Business Rationale:** 48-hour window balances motivational urgency with user forgiveness; streak freezes reduce frustration from unavoidable missed days (travel, illness).

---

### 4. Leech Detection & Focus Words (Story 15.2)

**Rule:** Words with 5+ consecutive incorrect answers are flagged as "leeches" to identify struggling vocabulary requiring extra attention.

**Algorithm:**

- Track `lapseCount` (increments on incorrect, resets to 0 on correct)
- Flag word as leech when `lapseCount >= 5`
- Reset lapse count on first correct answer (celebrate mastery)

**Implementation:**

- Backend: `apps/backend/src/services/ProgressService.ts` â†’ `updateLapseCount()`
- Database: `progress.lapseCount` column (integer, default 0)
- API: `GET /api/progress/leeches` returns flagged words
- Frontend: `apps/frontend/src/features/quiz/components/results/LeechWarning.tsx` (displays as "Focus Words")

**Business Rationale:** Positive framing ("Focus Words" not "Leeches") avoids demotivation while surfacing words that need mnemonic strategies or simplified review; prevents learners from wasting time on impossible words.

---

### 5. XP & Mystery Box Rewards (Story 15.3)

**Rule:** Variable reward schedules (unpredictable bonuses) drive engagement via operant conditioning principles.

**Mechanics:**

- **Base XP:** +10 XP per correct answer (immediate feedback)
- **Streak Bonus:** +5 XP per correct answer when streak >= 7 days
- **Mystery Box:** 5% drop rate after completing quiz session (random cosmetic rewards)

**Implementation:**

- Backend: `apps/backend/src/services/GamificationService.ts` â†’ `calculateXP()`, `rollMysteryBox()`
- API: `POST /api/progress/test-result` returns `xpEarned` field
- Frontend: `apps/frontend/src/features/quiz/components/results/StatsGrid.tsx` (displays XP)
- Frontend: `apps/frontend/src/features/gamification/components/MysteryBoxAnimation.tsx` (5% trigger)

**Business Rationale:** Fixed rewards (XP) provide consistent validation; variable rewards (mystery boxes) create anticipation and excitement per behavioral psychology research (Skinner 1953).

---

### 6. AI-Powered Error Feedback (Story 15.4)

**Rule:** Personalized explanations for incorrect answers address the #1 user complaint: "Why was I wrong?"

**Mechanics:**

- **Trigger:** Generated only for incorrect quiz answers (not correct answers or skips)
- **Generation:** Gemini API analyzes user answer vs. correct answer, provides contextual explanation
- **Caching:** Redis stores common errors with 24h TTL (~70% cache hit rate reduces API costs)
- **Timeout:** 3-second timeout with fallback to generic template if API slow/unavailable
- **Display:** Async loading (doesn't block quiz progression; loads in background panel)

**Implementation:**

- Backend: `apps/backend/src/services/AIFeedbackService.ts` â†’ `generateFeedback()`
- Caching: Redis key format: `quiz:feedback:{wordId}:{userAnswer}` (hash-based)
- API: `POST /api/quiz/feedback` returns `{ explanation, similarWords, cached }`
- Frontend: `apps/frontend/src/features/quiz/hooks/useAIFeedback.ts` â†’ async fetch
- Component: `apps/frontend/src/features/quiz/components/exams/FeedbackSection.tsx`

**Business Rationale:** Generic error messages ("Incorrect, the answer is X") don't explain confusion; AI feedback identifies mistake type (tone confusion, similar character mix-up) and provides learning strategy, accelerating understanding vs. repeated trial-and-error.

---

### 7. Multiple Choice Distractor Generation (Story 15.5, 15.6)

**Rule:** Multiple choice questions must include plausible distractors (wrong answers that seem reasonable) to prevent guessing.

**Algorithm:**

- For **Chinese â†’ English**: Select 3 incorrect English translations from vocabulary database (random sampling)
- For **Pinyin â†’ Chinese**: Select 3 characters with similar pronunciation or tone variations (e.g., mÄ vs mÃ¡ vs mÇŽ vs mÃ  for horse)
- For **English â†’ Chinese**: Select 3 characters with similar meaning categories (e.g., food words if correct answer is food word)
- **Shuffle:** Randomize correct answer position (not always option A)

**Implementation:**

- Backend: `apps/backend/src/utils/distractorGenerator.ts` â†’ `generateDistractors()`
- API: `GET /api/progress/due` returns words with pre-generated options
- Frontend: `apps/frontend/src/features/quiz/components/inputs/MultipleChoiceInput.tsx` â†’ renders options

**Business Rationale:** Weak distractors (obviously wrong answers) allow learners to guess correctly without actually knowing the answer, invalidating assessment; plausible distractors force genuine recall.

---

### 8. Quiz Results Retention (Story 15.11)

**Rule:** Quiz results persist to the backend `quiz_results` table, enabling result review and spaced repetition calculations without relying on localStorage.

**Mechanics:**

- **Storage:** Each quiz answer saved to `quiz_results` table via `POST /api/v1/learning/result`
- **Data:** Store `{ userId, wordId, correct, questionType, timeSpentMs, createdAt }`
- **In-Session Summary:** The session summary screen uses `sessionSummary` from QuizContext for immediate post-quiz display
- **Retrieval:** Summary data returned by `GET /api/v1/quiz/session/:sessionId/summary`

**Implementation:**

- Service: `apps/backend/src/core/services/LearningService.js` â†’ `recordQuizResult()` persists each answer
- Context: `apps/frontend/src/features/quiz/contexts/QuizContext.tsx` â†’ `sessionSummary` state holds in-session results
- Endpoint: `GET /api/v1/quiz/session/:sessionId/summary` â†’ returns full session results

**Business Rationale:** Backend-persisted results enable cross-device access, analytics, and permanent audit trail. The `quiz_results` table supports leech detection (lapseCount) and spaced repetition adjustments.

---

### Cross-Story Rule Dependencies

| Business Rule          | Primary Story | Dependent Stories  | Technical Components                     |
| ---------------------- | ------------- | ------------------ | ---------------------------------------- |
| Spaced Repetition      | 15.1, 15.2    | All (foundation)   | ProgressService, progress table          |
| Interleaving           | 15.6          | 15.5, 15.8         | interleaving.ts, quizReducer             |
| Streak Tracking        | 15.3          | 15.9 (display)     | StreakService, study_streaks table       |
| Leech Detection        | 15.2          | 15.9 (display)     | ProgressService.updateLapseCount()       |
| XP/Rewards             | 15.3          | 15.9 (display)     | GamificationService, MysteryBoxAnimation |
| AI Feedback            | 15.4          | 15.9 (integration) | AIFeedbackService, Redis, Gemini API     |
| Distractors            | 15.5, 15.6    | 15.2 (backend gen) | distractorGenerator.ts                   |
| Quiz Results Retention | 15.11         | 15.10 (UI polish)  | quiz_results table, LearningService      |

## Acceptance Criteria

- [ ] Backend API returns words due for review based on `nextReviewDate` field
- [ ] Quiz UI displays one word at a time with multiple question modes (multiple choice, type pinyin, type character)
- [ ] User can skip or flag words during quiz for later review
- [ ] Quiz results saved to backend after each answer (progress updated immediately)
- [ ] Spaced repetition algorithm adjusts `nextReviewDate` based on correct/incorrect answers
- [ ] Study streak increments on first review activity of the day
- [ ] Study streak resets after 48 hours of inactivity
- [ ] Study streak persists across devices (backend-tracked, not localStorage)
- [ ] Badges awarded automatically on milestone streaks (7, 30, 100 days)
- [ ] XP points awarded per correct answer (+10 XP base, bonus for streaks)
- [ ] Quiz summary screen shows accuracy percentage, XP earned, current streak
- [ ] "Review Again" option available for incorrect answers
- [ ] Mobile-responsive quiz UI (optimized for phone usage)
- [ ] Quiz performance metrics logged for analytics (accuracy rate, time per question)
- [ ] Question types interleaved per word (randomized, not blocked by type)
- [ ] Tone input supports numeric notation (ma3 â†’ mÇŽ) and validates tone mark rules (a>o>e>i/u)
- [ ] Streak freeze currency system (earn 1 per 10 perfect quizzes, spend to protect streak)
- [ ] Error feedback explains confusion with AI-generated context (phonetic vs semantic errors)
- [ ] Mystery boxes drop random rewards after milestone quizzes (5% drop rate)
- [ ] Leech tracking flags words after 5 consecutive failures ("struggling words" indicator)

## Architecture Decisions

- **Decision: Active recall testing over passive flashcard review** (Quiz-first approach)
  - **Rationale**: Cognitive science proves active recall improves retention by 50%+; provides objective mastery metrics vs. subjective ratings; drives higher engagement
  - **Alternatives considered**: Enhanced flashcards, passive review timers
  - **Implications**: Increases user retention (DAU/MAU improvement); enables team analytics; higher development effort

- **Decision: Backend-tracked streaks** (PostgreSQL storage)
  - **Rationale**: Cross-device persistence essential for mobile users; supports future social features; enables retention analytics
  - **Alternatives considered**: localStorage only, hybrid sync
  - **Implications**: Reliable streak tracking across devices; slight backend load increase

- **Decision: Multiple question types** (3 modes: multiple choice, type pinyin, type character)
  - **Rationale**: Accommodates learner preferences; prevents boredom; flexibility drives engagement
  - **Alternatives considered**: Single difficulty mode
  - **Implications**: Broader user appeal; more UI development

- **Decision: Interleaved practice** (Randomized question types per word)
  - **Rationale**: Research shows 20-30% retention improvement long-term despite initial difficulty perception
  - **Alternatives considered**: Blocked practice (easier short-term)
  - **Implications**: Superior learning outcomes; may confuse users initially (mitigate with onboarding)

- **Decision: AI-powered feedback** (Gemini explanations for errors)
  - **Rationale**: Addresses #1 user complaint ("why was I wrong?"); accelerates learning vs. generic messages
  - **Alternatives considered**: Static templates, community tips
  - **Implications**: Competitive differentiator; adds API cost (mitigated with caching)

- **Decision: Unified spaced repetition algorithm** (Performance multiplier approach)
  - **Rationale**: CRITICAL - prevents flashcard/quiz systems from conflicting and destroying review schedules; protects existing 100k+ progress records
  - **Alternatives considered**: Separate systems (REJECTED - data corruption), replace flashcards (REJECTED - breaks existing users)
  - **Implications**: Enables gradual migration; backward compatible; requires prerequisite refactor (Story 15.1)

## Implementation Plan

1. **Story 15.1 - Progress System Adaptation (Prerequisite)**: Refactor progress tracking to support unified spaced repetition algorithm; add database schema for quiz results, streaks, and leech tracking; ensure backward compatibility with flashcard system
2. **Story 15.2 - Core Quiz Backend APIs**: Implement REST endpoints for due words query, test result saving, and leech retrieval
3. **Story 15.3 - Gamification Backend**: Build streak tracking, badge award system, XP calculation, and mystery box reward APIs
4. **Story 15.4 - AI Feedback Service**: Integrate Gemini API for error explanations with Redis caching layer
5. **Story 15.5 - Quiz UI Components**: Build reusable components (QuizCard, ToneInput, TypeAnswerInput) with zero backend coupling
6. **Story 15.6 - Quiz State Management**: Implement quiz container with interleaving logic and progress tracking UI
7. **Story 15.7 - Gamification UI**: Build display components for streaks, badges, XP, and AI feedback panels
8. **Story 15.8 - Core Quiz Integration**: Connect quiz UI to backend APIs with analytics logging
9. **Story 15.9 - Gamification Integration**: Connect rewards and AI feedback UI to backend services; mobile optimization
10. **Testing & Documentation**: Comprehensive unit/integration tests; update architecture and API documentation

## Risks & Mitigations

- **Risk: Users find quizzes too difficult and abandon feature** â€” Severity: High
  - **Mitigation**: Start with multiple choice mode (easiest); add skip button; show progress bar to indicate completion proximity; celebrate small wins (XP for every answer, not just correct)
  - **Rollback**: Make quiz optional (not replacing flashcards); add difficulty settings; reduce quiz length

- **Risk: Backend load increases significantly with per-answer API calls** â€” Severity: Medium
  - **Mitigation**: Implement request batching (save multiple answers in one call); add Redis caching for due words query; monitor API latency and scale if needed
  - **Rollback**: Switch to save-on-completion mode; reduce quiz length to 10 words max

- **Risk: Streak resets demotivate users (perceived unfairness)** â€” Severity: Medium
  - **Mitigation**: 48-hour grace period (not 24h); visual warnings when streak at risk; option to "freeze" streak (premium feature)
  - **Rollback**: Increase grace period to 72h; remove streak resets entirely (continuous counter)

- **Risk: Gamification feels gimmicky for serious learners** â€” Severity: Low
  - **Mitigation**: Make badges/XP optional (hide in settings); focus on learning metrics (accuracy, retention rate); avoid excessive animations
  - **Rollback**: Remove XP system; keep badges minimal (streak only)

- **Risk: AI feedback latency delays quiz flow** â€” Severity: Medium
  - **Mitigation**: Cache common error explanations (Redis, 24h TTL); show feedback asynchronously (answer â†’ next question â†’ feedback loads in background); set 3s timeout with fallback to static message
  - **Rollback**: Disable AI feedback; use pre-written error templates only

- **Risk: Leech tracking demotivates users seeing "struggling" label** â€” Severity: Low
  - **Mitigation**: Use positive framing ("Focus words" instead of "leeches"); provide actionable tips (mnemonic generator link); celebrate when leech is mastered
  - **Rollback**: Remove leech UI indicator; keep backend tracking for analytics only

- **Risk: Quiz UI performance degrades on mobile** â€” Severity: Medium
  - **Mitigation**: Lazy load quiz components; optimize re-renders with React.memo; test on low-end devices
  - **Rollback**: Simplify UI (remove animations); reduce simultaneous DOM elements

## Implementation notes

- **Conventions**: Follow `docs/guides/conventions/backend.md` and `docs/guides/solid-principles.md`
- **Database migrations**: Use Prisma migrations for new tables (studyStreaks); backup database before production deployment
- **Spaced repetition**: Extend existing algorithm in `apps/backend/src/core/services/ProgressService.js`
- **Testing**: Comprehensive unit tests for quiz logic and spaced repetition adjustments; integration tests for API flows
- **Feature flags**: Consider `ENABLE_QUIZ_MODE` flag for gradual rollout

---

**Related Documentation:**

- [Epic 15 Implementation](../../issue-implementation/epic-15-learning-retention/README.md)
- [Story 15.1 BR: Progress System Adaptation](./story-15-1-progress-system-adaptation.md) **[PREREQUISITE]**
- [Story 15.2 BR: Core Quiz Backend Infrastructure](./story-15-2-core-quiz-backend.md)
- [Story 15.3 BR: Streak & Gamification Backend APIs](./story-15-3-streak-gamification-backend.md)
- [Story 15.4 BR: AI Feedback Backend Service](./story-15-4-ai-feedback-backend.md)
- [Story 15.5 BR: Core Quiz UI Components](./story-15-5-core-quiz-ui-components.md)
- [Story 15.6 BR: Quiz Container & State Management](./story-15-6-quiz-container-state.md)
- [Story 15.7 BR: Gamification & Feedback Display UI](./story-15-7-gamification-feedback-display-ui.md)
- [Story 15.8 BR: Core Quiz Backend Integration](./story-15-8-core-quiz-integration.md)
- [Story 15.9 BR: Gamification & AI Integration](./story-15-9-gamification-ai-integration.md)
- [Story 15.10 Implementation: Quiz UX Polish & Results Enhancement](./story-15-10-quiz-ux-polish.md)
- [Story 15.11 Implementation: Feature Extensions & Future Adaptability](./story-15-11-feature-extensions.md)
- [Story 15.12 Implementation: Documentation Finalization & Code Quality](./story-15-12-documentation-finalization.md)
- [Enhancements from Research](./enhancements-from-research.md) (research mapping)
- [Architecture Overview](../../architecture.md)
- [Epic 14: API Modernization](../epic-14-api-modernization/README.md) (dependency)

**Knowledge Base Articles:**

- [Vocabulary Retention Research](../../knowledge-base/learning-theory/vocabulary-retention-research.md) - Full research document (cognitive science, FSRS, gamification theory)
- [Cognitive Science of Active Recall](../../knowledge-base/learning-theory/cognitive-science-active-recall.md) - Testing effect, desirable difficulty, interleaving
- [Spaced Repetition Algorithms](../../knowledge-base/learning-theory/spaced-repetition-algorithms.md) - FSRS vs SM-2 comparison, DSR model
- [Gamification Psychology](../../knowledge-base/learning-theory/gamification-psychology-learning.md) - Loss aversion, variable rewards, ethical design
- [Chinese Character Structure](../../knowledge-base/learning-theory/chinese-character-structure.md) - Radicals, phonetic components, decomposition

**Implementation Guides:**

- [State Management Patterns](../../guides/conventions/state-management.md) - React reducer patterns, interleaving logic
- [Gemini API Integration Guide](../../guides/integrations/gemini-api.md) - AI feedback setup, rate limiting, caching
- [Frontend Conventions](../../guides/conventions/frontend.md) - Tone mark conversion, validation rules
- [Spaced Repetition Algorithms](../../knowledge-base/learning-theory/spaced-repetition-algorithms.md) - Algorithm theory and research basis
- [Redis Setup Guide](../../guides/setup/redis.md) - Cache strategies for AI feedback and due words
- [Troubleshooting Guide](../../guides/operations/troubleshooting.md) - Common issues and solutions
