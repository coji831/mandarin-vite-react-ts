# Story 19.6: IME Simulator Quiz (Phase 2 Gate)

## Description

**As a** learner,
**I want to** pass an IME-based quiz testing my ability to type characters using radicals,
**So that** I can prove Phase 2 readiness and unlock Phase 3.

## Business Value

The IME Simulator Quiz serves as the Phase 2 gate — the milestone that separates radical browsing (Phase 2) from radical tree exploration and character composition (Phase 3). It tests practical IME typing skill using the 25 most common HSK characters, ensuring learners can produce characters before exploring deeper composition concepts. Passing this quiz provides a clear sense of achievement and progression through the learning roadmap.

## Acceptance Criteria

- [x] IME Simulator quiz accessible from Practices page for Phase 1+ users (verify: navigate to quiz)
- [x] Quiz uses browser native IME input for character typing (verify: IME activates on input field)
- [x] Prompt shows a meaning clue → user types the corresponding character via IME (verify: clue renders, IME input works)
- [x] 25 randomized questions per attempt (verify: 25 questions presented, randomized each attempt)
- [x] Instant correct/incorrect feedback with correct character revealed (verify: wrong answer shows correct character)
- [x] Progress bar shows current score vs 70% pass target (verify: bar updates after each answer)
- [x] Score ≥70% displays pass result, "Continue to Phase 3" CTA (verify: pass flow works)
- [x] Score <70% displays fail result, retry option with explanation (verify: fail flow works)
- [x] Quiz results recorded via existing QuizAttempt API with quizType "ime-simulator" (verify: POST to quiz-attempts, results persist)
- [x] Passing quiz updates PhaseGate.currentPhase to 3 (verify: GET phase-gate → currentPhase=3)

## Business Rules

1. 70% pass threshold (18/25 correct)
2. Browser native IME input — standard text input with `lang="zh"` and `inputMode` attributes
3. 25 randomized questions per attempt
4. Answer normalization using Unicode NFKC (handles simplified/traditional variants)
5. QuizAttempt API uses quizType "ime-simulator"
6. Passing updates PhaseGate.currentPhase from 2 to 3

## Related Issues

- Epic 19 / **Radicals & Character Composition** ([README.md](README.md)) (Parent epic)
- Story 19.1 / **Radicals Browser Structure** ([story-19-1-radicals-browser-structure.md](story-19-1-radicals-browser-structure.md)) (Depends on — for content reference)
- Story 19.3 / **Backend RadicalProgress + SRS Review Integration** ([story-19-3-backend-radical-progress.md](story-19-3-backend-radical-progress.md)) (Depends on — for progress infrastructure)

## Implementation Status

- **Status**: ✅ Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
