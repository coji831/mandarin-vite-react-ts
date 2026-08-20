# Story 15.1: Progress System Adaptation

## Description

**As a** backend developer,
**I want to** adapt the existing progress tracking system to support quiz-based testing,
**So that** flashcard confidence ratings and quiz results can coexist without conflicts and enable gradual migration.

## Business Value

This prerequisite story resolves critical compatibility issues between the existing flashcard system (manual confidence ratings) and the new quiz system (objective correct/incorrect). Without this adaptation, the two systems would override each other's spaced repetition calculations, destroying learning consistency for users.

**Impact:**

- Prevents data corruption for 100k+ existing progress records
- Enables gradual migration from flashcards to quizzes without breaking existing workflows
- Supports hybrid users who want both flashcard review and quiz testing
- Provides foundation for leech tracking and streak systems (Stories 15.2-15.4)

**Estimated Time Savings:** Prevents 8-10 hours of debugging conflicts in later stories

## Acceptance Criteria

- [x] `lapseCount` column added to progress table (default: 0) to track consecutive failures
- [x] `study_streaks` table created with userId, currentStreak, longestStreak, lastActivityDate, freezeCount fields
- [x] `quiz_results` audit table created with userId, wordId, questionType, correct, answeredAt fields
- [x] `ProgressService.calculateNextReview()` refactored to accept `performanceMultiplier` parameter (default: confidence²)
- [x] `ProgressService.recordQuizResult()` method implemented with quiz-specific multipliers (correct: 1.0, incorrect: 0.0) *Note: Normalized to 0.0-1.0 scale for unified formula compatibility*
- [x] Backward compatibility layer ensures existing flashcard API calls continue using confidence² multiplier
- [x] Feature detection logic: if `quiz_results` row exists for word → prioritize quiz algorithm, else use flashcard algorithm (timestamp-based comparison)
- [x] Migration script runs without errors and creates new tables/columns with appropriate indexes (via `prisma db push`)
- [x] API documentation updated with unified algorithm formula: `days = 1 + (30-1) * performanceMultiplier`
- [x] Unit tests verify flashcard and quiz systems use correct multipliers without conflicts (30/30 passing)
- [x] Zero retroactive changes to existing progress records (progressive migration only - `currentDelay` NULL for existing records)

## Business Rules

1. **Unified Algorithm:** All spaced repetition calculations use formula `days = 1 + (30-1) * performanceMultiplier` where multipliers are:
   - Flashcard review: `confidence²` (0.0 to 1.0)
   - Quiz correct: `1.0` (max spacing - 30 days) *[Implementation: Normalized scale]*
   - Quiz incorrect: `0.0` (reset to 1 day)

2. **Feature Detection:** System determines algorithm priority by checking if `quiz_results` table has entries for a given word:
   - If quiz results exist → use quiz-based multiplier
   - If no quiz results → use flashcard confidence multiplier
   - Hybrid approach: most recent activity type wins

3. **No Retroactive Updates:** Existing progress records keep their current `nextReview` dates; new algorithm applies only to future updates

4. **Backward Compatibility:** Existing flashcard API endpoints (`POST /api/progress/update`) continue to work unchanged; new quiz endpoints (`POST /api/progress/test-result`) use new multiplier logic

5. **Lapse Tracking:** `lapseCount` increments only on quiz incorrect answers (not flashcard low confidence); resets to 0 on first correct answer; flags as leech after reaching 5

6. **Streak Independence:** Study streaks track daily activity regardless of flashcard vs. quiz mode (any progress update counts)

## Related Issues

- [**Epic 15 BR**](./README.md) (Parent epic)
- [**Story 15.2: Core Quiz Backend Infrastructure**](./story-15-2-core-quiz-backend.md) (Blocks: needs `lapseCount` column and `quiz_results` table)
- [**Story 15.3: Streak & Gamification Backend APIs**](./story-15-3-streak-gamification-backend.md) (Blocks: needs `study_streaks` table)
- [**Story 15.4: AI Feedback Backend Service**](./story-15-4-ai-feedback-backend.md) (Blocks: needs `quiz_results` table for feedback context)

## Implementation Status

- **Status**: Completed
- **PR**: Pending
- **Merge Date**: February 11, 2026
- **Key Commit**: feat(epic-15): implement story 15-1 progress system adaptation
