# Story 21.9: Phase Gate Calibration

**Last Update:** July 30, 2026

## Description

**As a** learner,
**I want to** phase gates to accurately assess my readiness before unlocking new content,
**So that** I progress at the right pace and don't skip foundational knowledge.

## Business Value

The technical redesign (Part 2) identified three calibration gaps in the current phase gating system:

1. **IME threshold too low** — The IME Simulator requires 70% (18/25) to pass Phase 2. At this level, learners may not have reliable character recall. Raising to 80% (20/25) ensures "Core 300" mastery before reading content unlocks.
2. **Missing comprehension gate** — Phase 3→4 has no comprehension requirement. Learners can progress to advanced material (grammar, composition) without demonstrating they can read connected text. Adding a comprehension gate with a graded passage fills this gap.
3. **Character count gating** — Phase 2→3 requires character knowledge but has no minimum character count check. Adding a ≥500 character gate ensures learners have sufficient glyph coverage before intensive vocabulary building.

Together, these changes ensure learners have the foundational knowledge needed to benefit from each phase's content. The calibration uses existing infrastructure (PhaseGate model, QuizAttempt, CharacterProgress) — no new models required.

## Acceptance Criteria

- [x] IME Simulator minimum score threshold raised from 70%→80%
- [x] Phase 3→4 comprehension gate implemented: learner must score ≥60% on 5 passage comprehension questions AND have ≥90% known words in the passage
- [x] Character count ≥500 gate check implemented for Phase 2→3 transition — checks `CharacterProgress` (user-level: distinct characters where `CharacterProgress.confidence > 0`), not system-level `Character` table
- [x] Comprehension questions are generated from passage text via a new `ComprehensionQuizStrategy` (template-based who/what/where/why extraction from passage sentences)
- [x] `QuizAttempt.passageId` field added to link comprehension quizzes to passages
- [x] Comprehension gate uses `QuizAttempt.quizType = "comprehension"` for tracking
- [x] Passage selection for comprehension gate: one passage at the learner's current HSK level, auto-selected from cached passage pool
- [x] Qualification quiz fallback: creates a `QuizAttempt` with `quizType = "qualification"` when no passage exists; uses `QualificationQuizStrategy` for 5 HSK-level-appropriate multiple-choice questions
- [x] PhaseGate model's `gateCriteria` field updated to support "comprehension" as a value
- [x] Existing phase gate upgrades remain intact (retroactive — calibrations apply to in-progress users; already-passed users are grandfathered)
- [x] Phase gate service unit tests: threshold changes, comprehension gate scoring, character count gate
- [x] All existing phase gate tests pass with new thresholds
- [x] 0 lint errors across all changed files

## Business Rules

1. **IME Simulator threshold: 80%** — Minimum 20/25 correct on IME Simulator quiz to pass Phase 2. The 70%→80% change is retroactive: in-progress users must achieve 80% on retry. Already-passed users are grandfathered.

2. **Phase 3→4 comprehension gate** — Two-part gate: (a) ≥60% correct on 5 passage comprehension questions, AND (b) ≥90% of words in the passage marked as known (based on the user's `CharacterProgress`). Both conditions must be satisfied.

3. **Passage selection for comprehension gate** — The system selects one passage at the learner's current HSK level from the cached passage pool. If multiple passages exist, the least-recently-accessed passage is selected to distribute load.

4. **Qualification quiz fallback** — If no cached passage exists at the learner's level, present a 5-question general HSK-level-appropriate quiz using `QualificationQuizStrategy`. The quiz is recorded as `QuizAttempt` with `quizType = "qualification"`. This prevents blocking the gate entirely when no passage is available.

5. **Character count gate: ≥500 characters** — Before Phase 2→3 transition, query `CharacterProgress.count()` where `confidence > 0`. This is a user-level check — counts the distinct characters the user has learned. Different users may have different character counts.

6. **Comprehension question generation** — Questions are generated on-the-fly by `ComprehensionQuizStrategy` using template-based extraction from passage sentences. Question types include "What is the subject of sentence X?", "What action is described?", etc. Distractors are drawn from other elements in the same passage.

7. **Qualification quiz strategy** — `QualificationQuizStrategy` generates 5 HSK-level-appropriate multiple-choice questions (basic vocabulary/character recognition at the learner's HSK level). Used only as fallback when no passage exists for comprehension gate.

8. **QuizAttempt.quizType = "comprehension" | "qualification"** — New quiz type values for comprehension gate and qualification fallback tracking. Existing quiz types remain unchanged.

9. **QuizAttempt.passageId** — New optional `String` field on `QuizAttempt` model. Links comprehension quiz attempts to the passage they were generated from. Allows `QuizService.getComprehensionQuizResult(userId, passageId)` to look up the specific attempt.

10. **Configuration constants** — All threshold values live in a single config file (`apps/backend/src/config/gate-thresholds.ts`). No magic numbers in service code.

11. **Retroactive application** — Calibrations apply to in-progress users. A user already at Phase 3 with a Phase 2 pass at 70% is NOT regressed. Only future attempts use new thresholds.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.3: Passage Generation Backend** ([BR](story-21-3-passage-generation.md)) (passage pool for comprehension gate — requires cached passages)
- **Story 21.1: Data Lifecycle** ([BR](story-21-1-data-lifecycle.md)) (CharacterProgress table for character count gate)

## Implementation Status

- **Status**: Implemented
- **PR**: N/A (direct commit — no PR)
- **Merge Date**: N/A
- **Key Commit**: `5a136f77`
