# Story 19.7: Radical Review & Quiz Strategies

## Description

**As a** learner in Phase 2,
**I want to** practice radical decomposition and take a Radical Gate Quiz,
**So that** I can actively recognize how radicals form characters and qualify for Phase 3.

## Business Value

This story adds two complementary mechanics based on `docs/knowledge-base/adult-mandarin-learning-roadmap.md`'s Phase 2 "Shortcut" framework. **Radical Splitter** (review variant) trains active recall: given a character, identify which radical gives it meaning. **Radical Gate Quiz** (Phase 2→3 gate) has two tiers: Tier 1 tests core radical↔meaning mapping (must get 100%), and Tier 2 tests the "Radical Predictor" skill — infer a character's meaning category from its radical. Together they ensure learners can use radicals as a decoding system before entering Phase 3's phonetic clusters and radical trees.

## Acceptance Criteria

- [x] Radical Splitter accessible from Practices page for Phase 2+ users (verify: navigate to `?type=radical-splitter`)
- [x] Radical Splitter shows an HSK character → user picks which radical gives it meaning from 3 options (verify: question renders, 3 options clickable)
- [x] Radical Splitter uses characters from `content/radicals/*.json` `hsk_characters` data (verify: characters appear per radical file content)
- [x] Radical Splitter instant correct/incorrect feedback with radical name revealed (verify: feedback shows radical glyph + meaning)
- [x] Radical Gate Quiz accessible from Practices page for Phase 2+ users (verify: navigate to `?type=radical-gate`)
- [x] Radical Gate Quiz has 20 questions mixed Tier 1 (core lockdown) + Tier 2 (predictor) (verify: 20 total, both categories present)
- [x] Tier 1 questions: match radical glyph to meaning (verify: radical glyph shown, 4 meaning options)
- [x] Tier 2 questions: show unfamiliar character → predict meaning category from radical (verify: character + "category" prompt + 4 options)
- [x] Score ≥85% overall with 100% Tier 1 displays pass result, advances Phase 3 gate (verify: pass updates PhaseGate.currentPhase to 3)
- [x] Score <85% or any Tier 1 incorrect displays fail result with retry option (verify: fail flow works)
- [x] Both strategies use the existing `?type=` query param routing pattern (verify: no new routes)
- [x] Both strategies use the existing `QuizAttempt` API for recording answers (verify: backend records attempts)

## Business Rules

1. **Radical Splitter**: 20 questions, 70% pass threshold (review practice, not gate)
2. **Radical Gate Quiz**: 20 questions, 85% pass threshold overall, **100% on Tier 1 mandatory**
3. Tier 1 questions have category `radical-core-lockdown`; Tier 2 have `radical-predictor`
4. Answer selection via option ID matching (not pinyin/tone)
5. Backend `QuizService.completeQuizAttempt()` enforces the Tier 1 100% rule
6. Passing the Radical Gate Quiz updates `PhaseGate.currentPhase` from 2 to 3

## Notes

- **Mnemonic Recall variant** (proposed in `verification-artifacts/radical-review-quiz-strategy.md`) is deferred — blocked on Epic 20 (Mnemonic Stories) which provides the story data needed for multiple-choice story selection.

## Related Issues

- Epic 19 / **Radicals & Character Composition** ([README.md](README.md)) (Parent epic)
- Story 19.6 / **IME Simulator Quiz** ([story-19-6-ime-simulator-quiz.md](story-19-6-ime-simulator-quiz.md)) (Related — also uses strategy pattern for Phase 2)
- `verification-artifacts/radical-review-quiz-strategy.md` (Proposal doc)

## Implementation Status

- **Status**: ✅ Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
