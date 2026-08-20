# Implementation 19.7: Radical Review & Quiz Strategies

**Last Updated:** June 28, 2026

## Technical Scope

Adds two new quiz strategies to the existing strategy-based quiz engine:

- **Radical Splitter** (`radical-splitter`): Multiple-choice review variant — identify which radical gives a character its meaning
- **Radical Gate Quiz** (`radical-gate`): Phase 2→3 gate quiz with Tier 1 (core lockdown) and Tier 2 (radical predictor)

## Files Changed

### Backend (6 files)

- `apps/backend/src/modules/quiz/strategies/RadicalSplitterStrategy.js` — NEW: Generates MC questions from radical content hsk_characters
- `apps/backend/src/modules/quiz/strategies/RadicalGateStrategy.js` — NEW: Generates 20 mixed Tier 1+2 questions
- `apps/backend/src/modules/quiz/strategies/index.js` — EDITED: Registered both new strategies
- `apps/backend/src/modules/quiz/services/QuizService.js` — EDITED: Added radical-gate pass threshold (0.85) + Tier 1 100% enforcement
- `apps/backend/src/modules/quiz/strategies/__tests__/RadicalSplitterStrategy.test.js` — NEW
- `apps/backend/src/modules/quiz/strategies/__tests__/RadicalGateStrategy.test.js` — NEW

### Frontend (10 files)

- `apps/frontend/src/features/quiz/types/engine.ts` — EDITED: Added `"radical-splitter"` and `"radical-gate"` to `StrategyType`, added `QuizOption` interface, added `options` and `prompt` to `QuizQuestion`
- `apps/frontend/src/features/quiz/types/index.ts` — EDITED: Exported `QuizOption`
- `apps/frontend/src/features/quiz/engine/strategies/RadicalSplitterStrategy.ts` — NEW
- `apps/frontend/src/features/quiz/engine/strategies/RadicalGateQuizStrategy.ts` — NEW
- `apps/frontend/src/features/quiz/engine/strategies/index.ts` — EDITED: Registered both
- `apps/frontend/src/features/quiz/engine/strategies/__tests__/RadicalSplitterStrategy.test.ts` — NEW
- `apps/frontend/src/features/quiz/engine/strategies/__tests__/RadicalGateQuizStrategy.test.ts` — NEW
- `apps/frontend/src/features/quiz/components/MultipleChoiceView.tsx` — NEW: Shared MC component
- `apps/frontend/src/features/quiz/components/QuizRouter.tsx` — EDITED: Route MC strategies to `MultipleChoiceView`
- `apps/frontend/src/features/quiz/stores/quizSessionStore.ts` — EDITED: Trust local eval for MC strategies
- `apps/frontend/src/pages/practices/PracticesPage.tsx` — EDITED: Added Radical Splitter and Radical Gate Quiz buttons

## Architecture Integration

```
PracticesPage
  ├── "Radical Splitter Practice" → ?type=radical-splitter ─┐
  └── "Radical Gate Quiz"        → ?type=radical-gate      ─┤
                                                              ▼
                                                    QuizPage (existing)
                                                              │
                                              ?type= → QuizSessionPage
                                                              │
                                                    useQuizEngine → quizSessionStore
                                                              │
                                                    QuizRouter → MultipleChoiceView
                                                              │
                                              submitAnswer → evaluateAnswer (local)
                                                              │
                                                    quizService.submitAnswer → backend
                                                              │
                                              completeAttempt → QuizService.completeQuizAttempt
                                                              │
                                              ProgressionService.updatePhaseGate (if passed)
```

### Multiple-Choice Answer Flow

For MC strategies, the `QuizQuestion.options` array holds the choices. The `correctPinyin` field stores the correct option ID. `evaluateAnswer` compares the user's selected option ID against `correctPinyin`. Backend `submitAnswer` also compares `pinyinInput === correctPinyin` (both are option IDs, both are 0 for tone).

### Tier 1 100% Enforcement

In `QuizService.completeQuizAttempt()`, after calculating overall accuracy:

1. Filter answers by `category === "radical-core-lockdown"`
2. If any Tier 1 answer is incorrect, force `passed = false` regardless of overall accuracy
3. Phase gate only advances when `passed = true`

## Technical Challenges & Solutions

```
Problem: QuizQuestion type was designed for pinyin/tone input — no support for multiple choice options
Solution: Added optional `options?: QuizOption[]` to QuizQuestion. MC strategies pass the selected option ID
         as the `pinyin` parameter to `evaluateAnswer`. The existing `correctPinyin` field doubles as the
         correct option ID. Backend's submitAnswer already compares `pinyinInput === correctPinyin`, which
         works naturally for option ID matching.

Problem: Mnemonic Recall variant cannot be implemented — no mnemonic story data exists yet
Solution: Deferred. Blocked on Epic 20 (Mnemonic Stories) which provides the story content needed for
         multiple-choice story selection questions.
```

## Testing

- **27 new tests** (13 frontend + 14 backend) covering:
  - Strategy type/metadata correctness
  - `evaluateAnswer` correct/incorrect paths for both tiers
  - Option selection vs correctPinyin matching
  - Backend `generateQuestions` with mock radical data
  - Backend `validateAnswer` correct/incorrect
  - Edge cases: missing options, wrong option IDs

## Implementation Status

- **Status**: ✅ Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD

## Close Checklist

- [x] All 12 acceptance criteria met
- [x] 27 new tests passing (13 frontend + 14 backend)
- [x] Full test suite: 45 frontend files, 387 tests passing
- [x] BR doc updated: AC checkboxes checked, Status ✅ Completed
- [x] Implementation doc updated: Status ✅ Completed
