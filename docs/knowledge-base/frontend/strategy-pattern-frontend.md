# Strategy Pattern on the Frontend

**Last Updated:** June 30, 2026

**Summary:** Using the Strategy pattern to encapsulate per-type evaluation logic in React/TypeScript features, enabling clean extension for new item types without modifying existing code.

## When to Use

- A feature processes multiple item types with different evaluation logic per type
- New item types are expected to be added over time
- You need to keep the state machine (hook/store) clean of per-type branching

## When NOT to Use

- Only one item type exists with no plans for more
- The branching logic is trivial (single if/else in one file)

## Implementation Pattern

### 1. Define the interface

```typescript
export interface ReviewStrategy {
  itemType: string;
  initialStep: "pinyin" | "tone";
  feedbackLabel: string;
  evaluate(item: ReviewItem, input: ReviewInput): ReviewEvaluation;
}
```

### 2. Implement per-type strategies

Each strategy lives in its own file under `engine/strategies/`.

### 3. Create a registry

```typescript
export const REVIEW_STRATEGIES: Record<string, ReviewStrategy> = { ... };
export function getReviewStrategy(type: string): ReviewStrategy | undefined {
  return REVIEW_STRATEGIES[type];
}
```

### 4. Use in the hook

The hook calls `strategy.evaluate()` and `strategy.initialStep` instead of inline `if/else` on item type.

## Benefits

- **Open/Closed principle** — add new types without modifying existing code
- **Single Responsibility** — each strategy owns its evaluation logic
- **Testability** — strategies are pure functions, easy to unit test
- **Discoverability** — registry makes all supported types visible in one place

## Tradeoffs

- More files (interface + N strategies + registry)
- Overhead for features with only 2 types that won't grow

## Applied In

### Quiz System (4 strategies)

Each strategy implements the `QuizStrategy` interface and is registered in `QUIZ_STRATEGIES`. All numeric configuration (question count, pass threshold, time limit) is returned from the backend at runtime.

| Strategy               | Phase | Questions | Threshold | Time Limit | View Type          | Purpose          |
| ---------------------- | ----- | --------- | --------- | ---------- | ------------------ | ---------------- |
| `audio-to-pinyin-tone` | 1     | 10        | 90%       | 2:30       | QuestionView       | Phase 1 gate     |
| `ime-simulator`        | 2     | 25        | 70%       | 10:00      | IMEQuestionView    | Phase 2 gate     |
| `radical-splitter`     | 2     | 20        | 70%       | 10:00      | MultipleChoiceView | Radical practice |
| `radical-gate`         | 2     | 20        | 85%       | 15:00      | MultipleChoiceView | Phase 2→3 gate   |

The `radical-gate` strategy enforces tier-specific rules: Tier 1 (Core Lockdown) requires 100% accuracy — any mistake fails the gate regardless of overall score.

### Review System (4 strategies)

Each strategy implements the `ReviewStrategy` interface and is registered in `REVIEW_STRATEGIES`.

| Strategy                         | itemType          | initialStep | showMeaning | Data Source              |
| -------------------------------- | ----------------- | ----------- | ----------- | ------------------------ |
| `PinyinReviewStrategy`           | pinyin-syllable   | pinyin      | true        | content/pinyin/\*.json   |
| `ToneReviewStrategy`             | tone-syllable     | tone        | false       | content/tones/\*.json    |
| `RadicalMeaningReviewStrategy`   | radical           | pinyin      | true        | content/radicals/\*.json |
| `CharacterRadicalReviewStrategy` | character-radical | pinyin      | true        | content/radicals/\*.json |

### PhaseStrategyRegistry

A higher-level registry maps phases to available review types, quizzes, and practice modes. The frontend `PHASE_CONFIGS` defines structure; backend supplies numeric config at runtime.

```typescript
PHASE_CONFIGS = {
  1: {
    review: { itemTypes: ["pinyin-syllable", "tone-syllable"], strategies: ["pinyin", "tone"] },
    quizzes: [{ strategies: ["audio-to-pinyin-tone"], contentScope: ["pinyin", "tone"] }],
  },
  2: {
    review: {
      itemTypes: ["radical", "character-radical"],
      strategies: ["radical", "character-radical"],
    },
    quizzes: [
      { strategies: ["ime-simulator"], contentScope: ["character"] },
      { strategies: ["radical-gate"], contentScope: ["radical"] },
    ],
    practices: [{ strategies: ["radical-splitter"], contentScope: ["radical"] }],
  },
};
```

## Question Format Reference

### Input Encoding

The `evaluateAnswer(question, pinyin, tone)` function uses its parameters differently per strategy:

| Strategy                | `pinyin` param      | `tone` param | Comparison                                         |
| ----------------------- | ------------------- | ------------ | -------------------------------------------------- |
| Audio-to-Pinyin-Tone    | Plain pinyin string | 0-4          | `pinyin === correctPinyin && tone === correctTone` |
| IME Simulator           | Character glyph     | 0            | NFKC normalization                                 |
| Radical Splitter / Gate | Selected option ID  | 0            | `pinyin === correctPinyin` (option ID)             |

For multiple-choice strategies, `correctPinyin` stores the correct option ID. `selectedTone === correctTone = 0` always passes.

### Generation Sources

| Strategy             | Data Source              | Generation Logic                                 |
| -------------------- | ------------------------ | ------------------------------------------------ |
| Audio-to-Pinyin-Tone | content/pinyin/\*.json   | Combinations of initials + finals                |
| IME Simulator        | content/radicals/\*.json | Extract unique HSK characters                    |
| Radical Splitter     | content/radicals/\*.json | Map HSK chars to their radical; 2 distractors    |
| Radical Gate T1      | content/radicals/\*.json | Recommended radicals; 3 meaning distractors      |
| Radical Gate T2      | content/radicals/\*.json | Reverse char→radical map; 3 category distractors |
| Review (all)         | Content files + SRS join | SM-2 filtering                                   |

## Quiz → Review Feedback Loop

On quiz completion, incorrect answers automatically create review items. This bridges the two systems:

```
QuizService.completeQuizAttempt()
  ├── For each answer where correct = false:
  │     If failedItemType and failedItemId are populated:
  │       ReviewService.recordRating("again", "quiz_failure")
  └── Evaluate pass/fail via strategy-defined thresholds
      If passed → ProgressionService.updatePhaseGate()
```

## Related

- [Quiz & Review System](../architecture.md#quiz--review-system) — High-level architecture overview
- [SOLID Principles](../practices/solid-principles.md) — Open/Closed Principle
