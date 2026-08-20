# Story 21.18: IME Simulator Phonetic Hints

**Last Update:** July 30, 2026

## Description

**As a** learner,
**I want to** receive phonetic hints when I answer incorrectly in the IME Simulator,
**So that** I can learn from mistakes by seeing the phonetic component relationship, with optional radical hints at a score penalty.

## Business Value

The IME Simulator (Epic 19 feature in `features/quiz/`) currently shows correct/incorrect feedback but does not provide learning support when the user gets an answer wrong. A learner who types the wrong character learns nothing except that they were wrong — a missed pedagogical opportunity. This story adds contextual phonetic hints: when the user answers incorrectly, the sim displays "Hint: This character contains phonetic component [X] (pinyin: [Y])", helping the learner connect the sound to the glyph. A "Show radical hint" toggle is added for when the phonetic hint isn't enough, consuming one hint and reducing the max score by 5%. Score is also broken down by character type (pictograph, phono-semantic, etc.), reinforcing classification awareness. Estimated effort is ~2-3 days.

## Acceptance Criteria

- [x] IME Simulator shows phonetic hint on wrong answer: "Hint: This character contains phonetic component [X] (pinyin: [Y])"
- [x] Phonetic component lookup uses the Characters Module API (Story 21.10) for phonetic component data
- [x] "Show radical hint" toggle available during quiz — consumes one hint, reduces max possible score by 5%
- [x] Score breakdown by character type shown in quiz results (e.g., "Pictographs: 3/3, Phono-semantic: 5/8, Compound ideographs: 2/2")
- [x] Classification badges (from Story 21.15) displayed alongside score breakdown
- [x] Unit tests for hint generation and score penalty logic
- [x] Storybook stories updated for hint UI states
- [x] 0 lint errors across all changed files

## Business Rules

1. **Phonetic Hint Generation** — When an answer is incorrect, the sim checks the target character for a phonetic component via the Characters Module API. If found, it displays: "Hint: This character contains phonetic component [glyph] (pinyin: [pinyin], meaning: [meaning]). Try to connect the sound!" If no phonetic component is found (pictographs, simple ideographs), the hint says: "This character doesn't have a phonetic component — try memorizing it by its visual structure."
2. **Radical Hint Toggle** — Below the phonetic hint, a "Show radical hint" link is available. Clicking it displays the character's radical and meaning, deducts one hint from the user's hint pool (max 3 per quiz), and applies a -5% penalty to the max possible score for that question. The penalty is applied to the question, not the overall quiz.
3. **Score by Type** — Quiz results include a classification breakdown table. This uses the same classification data and badge components from Story 21.15. The breakdown shows total correct / total attempted per classification type, helping the learner identify which character types they struggle with.
4. **Hint Pool** — The user starts each IME Simulator quiz with 3 hints. Each hint use (phonetic or radical) consumes one. Hints do not regenerate mid-quiz. Unused hints do not affect the score.
5. **Characters Module Dependency** — This story depends on Story 21.10 (Characters Module) for the phonetic component lookup API. If 21.10 is not yet complete, the hint falls back to the character's radical information available in existing frontend data.

## Related Issues

- Epic 21: Foundation Complete — Graded Readers & Character Practice — BR (`../README.md`) (epic parent)
- **Story 21.2: Character Content Generation** ([BR](story-21-2-character-content.md)) (dependency — classification + phoneticComponentId available)
- **Story 21.10: Characters Backend Module** ([BR](story-21-10-characters-module.md)) (dependency — characters API for phonetic component lookup)
- **Story 21.15: Pictograph Classification Badges** ([BR](story-21-15-pictograph-classification-badges.md)) (dependency — badge component and classification data)
- Epic 19: Radicals & Character Details (coordination — IME Simulator ownership in features/quiz/)

## Implementation Status

- **Status**: Implemented
- **PR**: N/A (direct commit — no PR)
- **Merge Date**: July 30, 2026
- **Key Commit**: `d6f6d560`

## Completed

- **Hint Service** — `hintService.ts` with Characters Module API integration for phonetic component lookup, radical detail fetching, and fallback messaging for characters without phonetic components
- **Quiz Engine/State Extension** — `quizSessionStore.ts` extended with hint pool (max 3), penalty tracking (-5% per radical hint), and score-by-character-type tracking
- **IME Question View** — `IMEQuestionView.tsx` updated to show phonetic hints on wrong answers with a "Show radical hint" toggle below
- **Results View** — `QuizResults.tsx` and `FeedbackView.tsx` updated with score breakdown by character type using `ClassificationBadge` from Story 21.15
- **Types** — New types in `session.ts`, `engine.ts`, and `types/index.ts` for hint state, penalty logic, and score-by-classification tracking
- **Barrel** — `index.ts` updated to export hint service
- **Storybook** — `QuizPageFull.stories.tsx` covering hint UI states
- **Tests** — 6 unit tests in `hintService.test.ts` covering phonetic hints, radical hints, character detail retrieval, fallback messaging, and error handling
