# Story 15.6: Quiz Container & State Management

## Description

**As a** frontend developer,
**I want to** implement quiz state machine with interleaving logic,
**So that** learners experience optimized question presentation for retention.

## Business Value

This story implements the core quiz logic and state management that orchestrates the learning experience. Interleaving (randomized question types per word) is a cognitive science-proven technique that improves long-term retention by 20-30% compared to blocked practice, despite feeling more difficult to learners.

**Impact:**

- State machine ensures smooth quiz flow (loading → question → feedback → next/complete)
- Interleaving creates "desirable difficulty" that strengthens memory formation
- Progress tracking provides completion feedback (motivates users to finish)
- Pure state management (no API calls) enables independent frontend development

## Acceptance Criteria

- [x] `DailyReviewTest.tsx` container component manages quiz state with reducer pattern
- [x] State machine phases: LOADING → QUESTION → ANSWER_FEEDBACK → NEXT | COMPLETE
- [x] Quiz session initialized with array of due words (mocked data for this story, real API in Story 15.8)
- [x] Question type interleaving: for each word, randomly select from ['multiple_choice', 'type_pinyin', 'type_character']
- [x] Interleaving happens per word (not blocked by type: not "all MC, then all pinyin, then all character")
- [x] `QuizProgressBar.tsx` component shows "X / Y completed" with visual progress bar
- [x] Progress bar updates after each answer (increments X counter)
- [x] State tracks current question index, total questions, user answers array
- [x] User answers stored as { wordId, questionType, userAnswer, correct, timestamp }
- [x] Quiz completion triggered when currentIndex === totalQuestions
- [x] Component composition: DailyReviewTest wraps QuizCard/TypeAnswerInput/ToneInput from Story 15.5
- [x] TypeScript quiz state interface defined with strict types (no `any`)

## Business Rules

1. **Interleaving Algorithm:** For each word in due words array:
   - Randomly select question type: `Math.random() * 3` → [0, 1) = MC, [1, 2) = pinyin, [2, 3) = character
   - Ensure randomness per word (not per quiz session: same word can be different type on different days)
   - Store selected type in question session data: `{ word, questionType }`

2. **Multiple Choice Distractor Generation:**
   - For Chinese → English: select 3 random wrong English translations from vocabulary list
   - For Pinyin → Chinese: select 3 characters with different tones/meanings
   - Shuffle correct answer position (not always first)

3. **Answer Validation:**
   - Multiple choice: exact match with selected option
   - Type pinyin: lowercase, trim whitespace, exact match (tone marks matter: mā ≠ ma)
   - Type character: exact match (simplified Chinese only)

4. **Progress Bar Behavior:**
   - Progress = currentIndex / totalQuestions \* 100%
   - Visual feedback: green fill animates on each correct answer
   - Completion: show celebratory animation at 100%

5. **State Persistence:** Quiz state held in memory only (not localStorage); if user refreshes, quiz restarts (acceptable for MVP; persistence in future story)

## Related Issues

- [**Story 15.5: Core Quiz UI Components**](./story-15-5-core-quiz-ui-components.md) (Depends on: needs QuizCard, TypeAnswerInput, ToneInput components)
- [**Story 15.8: Core Quiz Backend Integration**](./story-15-8-core-quiz-integration.md) (Blocks: integration replaces mocked data with real API)
- [**Epic 15 BR**](./README.md) (Parent epic)

## Implementation Status

- **Status**: Completed
- **PR**: N/A (committed directly to epic-15-learning-retention branch)
- **Merge Date**: February 13, 2026
- **Last Update**: February 13, 2026
