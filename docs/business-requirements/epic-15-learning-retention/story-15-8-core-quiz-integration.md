# Story 15.8: Core Quiz Backend Integration

## Description

**As a** learner,
**I want to** start a daily review quiz from my dashboard,
**So that** I can practice due vocabulary and see my accuracy results with real-time backend sync.

## Business Value

This integration story connects the quiz UI (Stories 15.5-15.6) to backend APIs (Stories 15.1-15.2), delivering the end-to-end core quiz functionality. Users can now fetch their due vocabulary, complete quizzes with real progress updates, and see objective mastery metrics—the foundation of the active recall learning system.

**Impact:**

- Completes core quiz flow from "Start Daily Review" button to results summary
- Real-time progress updates prevent data loss (vs. localStorage-only solutions)
- Accuracy analytics provide objective mastery validation (vs. subjective confidence ratings)
- Leech identification enables targeted review for struggling vocabulary

## Acceptance Criteria

- [x] Quiz fetches due words via `GET /api/progress/due` and initializes with real vocabulary data
- [x] Quiz displays real vocabulary data (not mocked) with interleaved question types (pinyin/character/english)
- [x] After each answer, `POST /api/progress/test-result` saves result and captures nextReview/lapseCount
- [x] Optimistic UI: answer feedback shown immediately before backend save completes
- [x] Quiz summary screen displays: total questions, correct count, accuracy %, detailed results table
- [x] "Review Again" button on summary allows restarting quiz flow
- [x] Leech indicator (🔴) shown for words with `lapseCount >= 5` in results table
- [x] Loading states during API calls (QuizLoading component with skeleton loaders)
- [x] Error handling: network failures show QuizError with retry button, displays user-friendly messages
- [x] Results table shows: word, pinyin, english, user answer, correct answer, next review, lapse count
- [x] ToneInput enhanced with 32 nasal finals patterns (an, en, in, un, ang, eng, ing, ong)
- [x] ToneMap refactored to centralized constants with pre-sorted keys for performance

**Deferred to future stories:**

- [ ] Dashboard "Start Daily Review" button with due count badge (Story 15.9 integration)
- [ ] Quiz state persistence in localStorage (Story 15.10 offline support)
- [ ] Analytics logging for quiz start/completion/abandonment (Story 15.11 metrics)

## Business Rules

1. **Due Word Filtering:** Only fetch words where `nextReview <= today`; default to maximum 20 words per quiz session to prevent fatigue; user can configure limit in settings (future story)

2. **Answer Submission:** Save each answer individually (not batch); enables real-time leaderboards and prevents data loss on crash; rate limit: max 100 answers/hour per user

3. **Optimistic UI Pattern:**
   - User answers → show feedback immediately → save to backend asynchronously
   - If save fails → show error toast → allow retry or continue (answer stored locally)
   - On quiz completion → retry any failed saves before showing summary

4. **Quiz Summary Calculations:**
   - Accuracy = (correctCount / totalQuestions) \* 100%
   - XP Earned = correctCount \* 10 (base) + streak bonus (calculated by backend)
   - Leeches = words with lapseCount >= 5 after this quiz

5. **Review Again Flow:**
   - Filter quiz results to incorrectAnswers array
   - Re-initialize quiz state with only incorrect words
   - Question types re-randomized (not same type as first attempt)
   - Progress updates normally (can reduce lapseCount if correct on second attempt)

6. **Persistence Strategy:** Save quiz session to localStorage on each answer; restore on page load if session incomplete; clear localStorage on quiz completion; TTL: 24 hours (abandoned quizzes auto-clear)

## Related Issues

- [**Story 15.2: Core Quiz Backend Infrastructure**](./story-15-2-core-quiz-backend.md) (Depends on: needs due words and test result APIs)
- [**Story 15.5: Core Quiz UI Components**](./story-15-5-core-quiz-ui-components.md) (Depends on: uses UI components)
- [**Story 15.6: Quiz Container & State Management**](./story-15-6-quiz-container-state.md) (Depends on: uses quiz state machine)
- [**Story 15.9: Gamification & AI Integration**](./story-15-9-gamification-ai-integration.md) (Blocks: gamification integration builds on this foundation)
- [**Epic 15 BR**](./README.md) (Parent epic)

## Implementation Status

- **Status**: Completed
- **PR**: Pending (awaiting review)
- **Completion Date**: February 15, 2026
- **Last Updated**: February 15, 2026
