# Story 21.9: Phase Gate Calibration

**Last Update:** July 24, 2026

## Description

**As a** learner,
**I want to** phase gates to accurately assess my readiness before unlocking new content,
**So that** I progress at the right pace and don't skip foundational knowledge.

## Business Value

The technical redesign (Part 2) identified three calibration gaps in the current phase gating system:

1. **IME threshold too low** — The IME Simulator requires 70% (18/25) to pass Phase 2. At this level, learners may not have reliable character recall. Raising to 80% (20/25) ensures "Core 300" mastery before reading content unlocks.
2. **Missing comprehension gate** — Phase 3→4 has no comprehension requirement. Learners can progress to advanced material (grammar, composition) without demonstrating they can read connected text. Adding a comprehension gate with a graded passage fills this gap.
3. **Character count gating** — Phase 2→3 requires character knowledge but has no minimum character count check. Adding a ≥500 character gate ensures learners have sufficient glyph coverage before intensive vocabulary building.

Together, these changes ensure learners have the foundational knowledge needed to benefit from each phase's content. The calibration uses existing infrastructure (PhaseGate model, QuizAttempt, Character table) — no new dependencies required.

## Acceptance Criteria

- [ ] IME Simulator minimum score threshold raised from 70%→80%
- [ ] Phase 3→4 comprehension gate implemented: learner must score ≥60% on 5 passage comprehension questions AND have ≥90% known words in the passage
- [ ] Character count ≥500 gate check implemented for Phase 2→3 transition
- [ ] Comprehension gate uses `QuizAttempt.quizType = "comprehension"` for tracking
- [ ] Passage selection for comprehension gate: one passage at the learner's current HSK level, auto-selected from cached passage pool
- [ ] If no cached passage exists at the learner's level, a qualification quiz option is presented (5 general HSK-level-appropriate questions)
- [ ] PhaseGate model's `gateCriteria` field updated to support "comprehension" as a value
- [ ] Existing phase gate upgrades remain intact (retroactive — calibrations apply to in-progress users)
- [ ] Phase gate service unit tests: threshold changes, comprehension gate scoring, character count gate
- [ ] All existing phase gate tests pass with new thresholds
- [ ] 0 lint errors across all changed files

## Business Rules

1. **IME Simulator threshold: 80%** — Minimum 20/25 correct on IME Simulator quiz to pass Phase 2. The 70%→80% change is retroactive: in-progress users must achieve 80% on retry.
2. **Phase 3→4 comprehension gate** — Two-part gate: (a) ≥60% correct on 5 passage comprehension questions, AND (b) ≥90% of words in the passage marked as known (based on the user's CharacterProgress). Both conditions must be satisfied.
3. **Passage selection for comprehension gate** — The system selects one passage at the learner's current HSK level from the cached passage pool. If multiple passages exist, the least-recently-accessed passage is selected to distribute load.
4. **Qualification quiz fallback** — If no cached passage exists at the learner's level, present a 5-question general HSK-level-appropriate quiz. Otherwise block the comprehension gate entirely (no passage = cannot pass).
5. **Character count gate: ≥500 characters** — Before Phase 2→3 transition, query `Character.count()`. If <500 characters in the DB, the gate fails. This is a system-level check (not user-level — all users share the same character pool).
6. **QuizAttempt.quizType = "comprehension"** — New quiz type value for comprehension gate tracking. Existing quiz types remain unchanged.
7. **Configuration constants** — All threshold values live in a single config file (`apps/backend/src/config/gate-thresholds.ts`). No magic numbers in service code.
8. **Retroactive application** — Calibrations apply to in-progress users. A user already at Phase 3 with a Phase 2 pass at 70% is NOT regressed. Only future attempts use new thresholds.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.3: Passage Generation Backend** ([BR](story-21-3-passage-generation.md)) (passage pool for comprehension gate — requires cached passages)
- **Story 21.1: Data Lifecycle** ([BR](story-21-1-data-lifecycle.md)) (Character table for character count gate)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
