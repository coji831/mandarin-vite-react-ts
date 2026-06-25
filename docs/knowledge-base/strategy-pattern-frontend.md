# Strategy Pattern on the Frontend

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

- **Quiz**: `QuizStrategy` interface with `AudioToPinyinAndToneStrategy`
- **Review**: `ReviewStrategy` interface with `PinyinReviewStrategy` + `ToneReviewStrategy`

## Related

- `docs/knowledge-base/solid-principles.md` — Open/Closed Principle
