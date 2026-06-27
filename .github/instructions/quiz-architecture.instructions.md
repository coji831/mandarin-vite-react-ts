---
description: "Use when creating or modifying quiz modes, quiz strategies, quiz pages, or quiz routing. Covers strategy pattern compliance, routing conventions, and component reuse rules."
applyTo: "**/quiz/**/*.ts,**/quiz/**/*.tsx,**/pages/practices/**/*.tsx,**/router/PracticesRoutes.tsx,**/shared/constants/paths.ts"
---

# Quiz System Architecture Rules

## Rule

ALL quiz modes MUST follow the established **Quiz Strategy Pattern**. Never build standalone quiz pages.

## Pattern: Strategy-Based Quiz Architecture

The quiz system uses a strategy pattern. Every quiz mode is a `QuizStrategy` implementation that plugs into:

```
QuizPage (?type=) → QuizSessionPage → useQuizEngine → quizSessionStore → QuizRouter → QuestionView/FeedbackView/QuizResults
```

### Adding a New Quiz Mode

1. **Extend `StrategyType`** — Add the new type string to `features/quiz/types/engine.ts`
2. **Create strategy** — New file in `features/quiz/engine/strategies/<Name>Strategy.ts` implementing `QuizStrategy` interface
3. **Register strategy** — Add to `QUIZ_STRATEGIES` in `features/quiz/engine/strategies/index.ts`
4. **Create custom input view** (if needed) — New component in `features/quiz/components/<name>/`, add to `QuizRouter.tsx`
5. **Route via query param** — Use `?type=<strategy-type>` via existing `QuizPage.tsx`

### Routing Conventions

- ✅ DO use `?type=` query param: `/practices/quiz?type=ime-simulator`
- ✅ DO navigate from `PracticesPage.tsx` via: ``navigate(`${practices_quiz}?type=...`)``
- ❌ DON'T create standalone routes like `/practices/quiz/ime-simulator`
- ❌ DON'T create standalone quiz page components

### Data Sources

- ✅ DO use `quizService.fetchQuestions(type, count)` to get questions from the backend API
- ✅ DO let the backend strategy generate questions from content files
- ❌ DON'T hardcode question data in frontend services
- ❌ DON'T embed character/word data in frontend code

### Component Reuse

Always reuse these existing quiz components instead of reimplementing:

| Component         | File                                                  | Purpose                                 |
| ----------------- | ----------------------------------------------------- | --------------------------------------- |
| `Timer`           | `features/quiz/components/Timer.tsx`                  | Countdown timer display                 |
| `QuizProgressBar` | `features/quiz/components/QuizProgressBar.tsx`        | Progress bar                            |
| `QuizResults`     | `features/quiz/components/results/QuizResults.tsx`    | Score/pass/fail/results screen          |
| `FeedbackView`    | `features/quiz/components/FeedbackView.tsx`           | Answer feedback display                 |
| `PhaseGateBadge`  | `features/quiz/components/results/PhaseGateBadge.tsx` | Pass/fail badge with configurable phase |
| `QuizRouter`      | `features/quiz/components/QuizRouter.tsx`             | Phase-based component routing           |

### Dynamic Values (Not Hardcoded)

The quiz system supports dynamic values per strategy:

- `QuizResults.tsx` — Reads `passThreshold` from the strategy (NOT hardcoded 90%)
- `QuizSessionPage.tsx` — Renders dynamic header: `"Phase {strategy.phase} Quiz — {strategy.label}"`
- `PhaseGateBadge` — Supports `unlockedPhase` prop for correct phase number on pass
- `Timer` — Gets initial value from `strategy.timeLimitMinutes * 60`

## ✅ DO

```typescript
// features/quiz/engine/strategies/IMEQuizStrategy.ts
export const imeQuizStrategy: QuizStrategy = {
  type: "ime-simulator",
  generateQuestions() {
    return quizService.fetchQuestions("ime-simulator", 25);
  },
  evaluateAnswer(question, pinyin, tone) {
    /* NFKC comparison */
  },
};
```

## ❌ DON'T

```typescript
// features/radicals/components/IMESimulatorPage.tsx — ❌ Standalone page
// features/radicals/services/imeQuizService.ts — ❌ Hardcoded data
```

## File Location Rules

- Quiz strategy files → `features/quiz/engine/strategies/`
- Quiz custom input views → `features/quiz/components/<name>/`
- Quiz pages → `pages/practices/` (only QuizPage, QuizSessionPage)
- Quiz services → `features/quiz/services/`
- Quiz stores → `features/quiz/stores/`
