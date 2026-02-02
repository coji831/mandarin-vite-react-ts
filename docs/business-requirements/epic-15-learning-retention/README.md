# Epic 15: Learning Retention System

## Epic Summary

**Goal:** Implement daily review quizzes with spaced repetition testing, study streak tracking, and gamification to drive user engagement and improve vocabulary retention.

**Key Points:**

- Active recall testing improves retention by 50%+ vs. passive flashcard review (cognitive science proven)
- Daily quiz system with multiple question types (multiple choice, type pinyin, type character)
- Study streak tracking with badges (7-day, 30-day, 100-day) drives daily active usage
- Spaced repetition algorithm adjusts review dates based on quiz performance (not just confidence ratings)
- Gamification with XP points and achievements increases engagement and reduces churn

**Status:** Planned

**Last Update:** February 2, 2026

## Background

The current system supports passive vocabulary review via flashcards with manual confidence ratings. While spaced repetition calculates optimal review dates, users lack active recall practice—the most effective method for long-term retention.

Research shows active recall testing (retrieving information from memory) significantly outperforms passive review for retention. Additionally, gamification elements like streaks and badges drive daily active usage, a critical SaaS retention metric.

**Current Pain Points:**

- Users rate confidence subjectively (may overestimate understanding)
- No objective mastery validation
- No compelling reason to return daily (low DAU/MAU ratio)
- Passive review less effective than active testing

**Business Impact:**

- Low user retention (avg 3 sessions, then churn)
- No viral growth mechanics (streaks enable social sharing)
- Cannot measure true vocabulary mastery for team analytics

This epic addresses these issues by implementing a daily review quiz system with objective testing, streak tracking, and gamification to drive engagement.

## User Stories

This epic consists of the following user stories:

1. [**Story 15.1: Due Words API & Backend Logic**](./story-15-1-due-words-api.md)
   - As a **backend developer**, I want to **expose an API endpoint for due words**, so that **the frontend can fetch vocabulary requiring review on a given date**.

2. [**Story 15.2: Quiz UI Components**](./story-15-2-quiz-ui-components.md)
   - As a **learner**, I want to **complete daily quizzes testing my vocabulary knowledge**, so that **I can validate mastery through active recall rather than passive review**.

3. [**Story 15.3: Study Streak Tracking**](./story-15-3-study-streak-tracking.md)
   - As a **learner**, I want to **see my study streak counter**, so that **I'm motivated to return daily and maintain my learning momentum**.

4. [**Story 15.4: Test Mode Integration**](./story-15-4-test-mode-integration.md)
   - As a **learner**, I want to **start a daily review quiz from my dashboard**, so that **I can practice due vocabulary and see my accuracy results**.

5. [**Story 15.5: Gamification (Badges & XP)**](./story-15-5-gamification-badges-xp.md)
   - As a **learner**, I want to **earn badges and XP points for completing quizzes**, so that **I feel rewarded for consistent study and can track my achievements**.

## Story Breakdown Logic

This epic is divided into stories based on vertical slice approach:

- **Story 15.1** establishes backend infrastructure (API endpoints, database schema, spaced repetition adjustments)
- **Story 15.2** builds UI components for quiz interaction (multiple choice, type answer, progress bar)
- **Story 15.3** adds persistence layer for streak tracking (database + backend API)
- **Story 15.4** integrates quiz components with backend APIs (end-to-end flow)
- **Story 15.5** adds gamification layer (badges, XP) to enhance engagement

Each story delivers incremental value while building toward the complete retention system.

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

## Architecture Decisions

- **Decision: Active recall testing over passive flashcard review** (Quiz-first approach)
  - **Rationale**: Cognitive science proven method for retention; objective mastery validation vs. subjective confidence ratings
  - **Alternatives considered**: Enhanced flashcard UI, passive review with timers
  - **Implications**: Requires quiz UI development; more complex than flashcards; higher user engagement potential

- **Decision: Backend-tracked streaks over localStorage** (PostgreSQL storage)
  - **Rationale**: Cross-device persistence; data integrity for team features; enables analytics
  - **Alternatives considered**: localStorage with sync, hybrid approach
  - **Implications**: Requires database schema changes; API endpoints for streak CRUD; slightly higher backend load

- **Decision: Immediate progress updates vs. batch save** (Optimistic UI + instant save)
  - **Rationale**: Better UX (no lost data if browser crashes); enables real-time leaderboards for team features
  - **Alternatives considered**: Save on quiz completion only, periodic autosave
  - **Implications**: Higher API call volume; requires robust error handling; enables real-time features

- **Decision: Multiple question types vs. single mode** (3 modes: multiple choice, type pinyin, type character)
  - **Rationale**: Accommodates different difficulty preferences; prevents boredom; tests different recall depths
  - **Alternatives considered**: Multiple choice only (easiest), type answer only (hardest)
  - **Implications**: More UI complexity; requires input validation for type modes; flexible learning paths

## Implementation Plan

1. Design database schema for study streaks (`studyStreaks` table with `userId`, `currentStreak`, `longestStreak`, `lastActivityDate`)
2. Add `GET /api/progress/due` endpoint to return words where `nextReviewDate <= today`
3. Add `POST /api/progress/test-result` endpoint to update progress based on quiz answers
4. Add `GET /api/progress/streak` endpoint to return current/longest streak
5. Implement spaced repetition adjustment logic for test results (correct = increase delay, incorrect = reset to 1 day)
6. Create `DailyReviewTest.tsx` container component with quiz state management
7. Create `QuizCard.tsx` component with multiple choice mode UI
8. Create `TypeAnswerInput.tsx` component for pinyin/character input modes
9. Create `QuizProgressBar.tsx` component showing X/Y completed
10. Create `StreakCounter.tsx` component displaying current streak with flame icon
11. Integrate quiz components with backend APIs (fetch due words, save results)
12. Add quiz summary screen with accuracy, XP earned, streak status
13. Implement badge system (define milestones, award logic, display UI)
14. Add XP calculation (+10 base, +5 bonus for streaks)
15. Add "Review Again" flow for incorrect answers
16. Mobile-optimize quiz UI (touch-friendly buttons, keyboard handling)
17. Add analytics logging (quiz completion rate, accuracy, time per question)
18. Write unit tests for quiz logic and API integration
19. Update documentation (`docs/architecture.md`, feature design docs)

## Risks & Mitigations

- **Risk: Users find quizzes too difficult and abandon feature** — Severity: High
  - **Mitigation**: Start with multiple choice mode (easiest); add skip button; show progress bar to indicate completion proximity; celebrate small wins (XP for every answer, not just correct)
  - **Rollback**: Make quiz optional (not replacing flashcards); add difficulty settings; reduce quiz length

- **Risk: Backend load increases significantly with per-answer API calls** — Severity: Medium
  - **Mitigation**: Implement request batching (save multiple answers in one call); add Redis caching for due words query; monitor API latency and scale if needed
  - **Rollback**: Switch to save-on-completion mode; reduce quiz length to 10 words max

- **Risk: Streak resets demotivate users (perceived unfairness)** — Severity: Medium
  - **Mitigation**: 48-hour grace period (not 24h); visual warnings when streak at risk; option to "freeze" streak (premium feature)
  - **Rollback**: Increase grace period to 72h; remove streak resets entirely (continuous counter)

- **Risk: Gamification feels gimmicky for serious learners** — Severity: Low
  - **Mitigation**: Make badges/XP optional (hide in settings); focus on learning metrics (accuracy, retention rate); avoid excessive animations
  - **Rollback**: Remove XP system; keep badges minimal (streak only)

- **Risk: Quiz UI performance degrades on mobile** — Severity: Medium
  - **Mitigation**: Lazy load quiz components; optimize re-renders with React.memo; test on low-end devices
  - **Rollback**: Simplify UI (remove animations); reduce simultaneous DOM elements

## Implementation notes

- **Conventions**: Follow `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md`
- **Database migrations**: Use Prisma migrations for new tables (studyStreaks); backup database before production deployment
- **Spaced repetition**: Extend existing algorithm in `apps/backend/src/core/services/ProgressService.js`
- **Testing**: Comprehensive unit tests for quiz logic and spaced repetition adjustments; integration tests for API flows
- **Feature flags**: Consider `ENABLE_QUIZ_MODE` flag for gradual rollout

---

**Related Documentation:**

- [Epic 15 Implementation](../../issue-implementation/epic-15-learning-retention/README.md)
- [Story 15.1 BR](./story-15-1-due-words-api.md)
- [Story 15.2 BR](./story-15-2-quiz-ui-components.md)
- [Story 15.3 BR](./story-15-3-study-streak-tracking.md)
- [Story 15.4 BR](./story-15-4-test-mode-integration.md)
- [Story 15.5 BR](./story-15-5-gamification-badges-xp.md)
- [Architecture Overview](../../architecture.md)
- [Epic 14: API Modernization](../epic-14-api-modernization/README.md) (dependency)
