---
purpose: Strategy pattern on the frontend
status: active
last-verified: 2026-10-31
type: guide
---

# Strategy Pattern on the Frontend

**Last Updated:** October 31, 2026

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

### Quiz System (7 frontend formats)

Each strategy implements the `QuizStrategy` interface and is registered in `QUIZ_STRATEGIES`. Numeric configuration (question count, pass threshold, time limit) is owned by the **backend** and read at runtime; the frontend strategy only declares its id, phase and prompt-shape. The backend registers nine ids in one `STRATEGY_MAP` — the seven below plus `comprehension` and `qualification`, which are backend-only until their UI ships.

| Strategy               | Phase | Questions | Threshold | Time Limit | Surface                   | Purpose              |
| ---------------------- | ----- | --------- | --------- | ---------- | ------------------------- | -------------------- |
| `audio-to-pinyin-tone` | 1     | 10        | 85%       | 2:30       | `QuestionView`            | Phase 1 gate         |
| `tone-judgment`        | 1     | 5         | 60%       | 10:00      | `ToneJudgmentQuestion`    | Written sandhi drill |
| `ime-simulator`        | 2     | 25        | 80%       | 4:00       | `IMEQuestionView`         | Phase 2 gate         |
| `radical-gate`         | 2     | 10        | 85%       | 8:00       | `MultipleChoiceView`      | Phase 2 gate         |
| `listening-dictation`  | 2     | 5         | 60%       | 10:00      | `DictationQuestion`       | Typed dictation      |
| `cloze`                | 3     | 5         | 60%       | 10:00      | `ClozeQuestion`           | Grammar cloze        |
| `sentence-building`    | 3     | 5         | 60%       | 10:00      | `SentenceBuilderQuestion` | Word order           |

The four practice formats share one `FORMAT_QUIZ_DEFAULTS`, borrowed from the comprehension thresholds (`COMPREHENSION_QUESTION_COUNT` = 5, `COMPREHENSION_QUIZ_MIN_SCORE` = 0.6, 10 minutes) — a placeholder calibration, not a measured one.

The `radical-gate` strategy enforces tier-specific rules: Tier 1 (Core Lockdown) requires 100% accuracy — any mistake fails the gate regardless of overall score. **Consequence worth knowing:** because the server applies `tierRules`, a client must never announce a pass/fail verdict from its own score. The quiz session therefore announces facts only ("9 of 10, 90 percent") and lets the server-derived badge carry the verdict.

### Dispatch: make the map exhaustive, not the chain of `if`s

`QuizRouter` used to dispatch by string equality and read a `MULTIPLE_CHOICE_STRATEGIES` set that was **declared twice** (router + feedback view). Adding two single-select formats to a duplicated set is how a cloze question ends up rendered by the audio+pinyin view, with nothing failing.

The fix that generalises: dispatch through a map keyed by the closed union, so the compiler enforces coverage.

```typescript
export const QUESTION_VIEWS: Record<StrategyType, ComponentType> = {
  "audio-to-pinyin-tone": QuestionView,
  "ime-simulator": IMEQuestionView,
  "radical-gate": MultipleChoiceView,
  cloze: ClozeQuestion,
  // …
};
```

What this buys, and what it costs:

- **A new union member without its view is a type error.** That is the whole point; a `Record<K, V>` over a closed union cannot be partially filled.
- **One declaration per fact.** A `Set` used by two consumers drifts the moment one consumer changes it; a shared map cannot.
- **The cost is coupling in the commit.** An exhaustive map forces every view to exist in the same change that widens the union, so a "one format per story" split is not available — record the boundary in the story rather than faking the split.

### PhaseStrategyRegistry

A higher-level table maps phases to available review types and quizzes. The frontend `PHASE_CONFIGS` defines structure; the backend supplies numeric config at runtime.

```typescript
PHASE_CONFIGS = {
  1: {
    review: { itemTypes: ["pinyin-syllable", "tone-syllable"], strategies: ["pinyin", "tone"] },
    quizzes: [{ quizType: "audio-to-pinyin-tone" }, { quizType: "tone-judgment" }],
  },
  2: {
    review: {
      itemTypes: ["radical", "character-radical"],
      strategies: ["radical", "character-radical"],
    },
    quizzes: [
      { quizType: "ime-simulator" },
      { quizType: "radical-gate" },
      { quizType: "listening-dictation" },
    ],
  },
  3: {
    review: { itemTypes: [], strategies: [] },
    quizzes: [{ quizType: "cloze" }, { quizType: "sentence-building" }],
  },
  4: {
    /* the Phase-2 formats re-run at a higher tier */
    quizzes: [
      { quizType: "ime-simulator", tier: 2 },
      { quizType: "radical-gate", tier: 2 },
    ],
  },
};
```

Two rules that keep this table honest:

- **A phase entry is a payload, not just a key.** Phase 4 originally re-declared Phase 2's two quizzes byte-for-byte, so "Phase 4 has its own formats" was false while the key existed. A `tier` discriminator makes the payload genuinely distinct; a test asserts it.
- **Aggregate, don't replace.** The Practices card reads `getQuizzesUpToPhase(currentPhase)` — every quiz for `phase <= currentPhase` — so a passed phase keeps its assessments as optional practice. Reading only the current phase silently deletes a learner's earlier formats the moment they pass a gate.

### Review System (4 strategies)

Each strategy implements the `ReviewStrategy` interface and is registered in `REVIEW_STRATEGIES`.

| Strategy                         | itemType          | initialStep | showMeaning | Data Source              |
| -------------------------------- | ----------------- | ----------- | ----------- | ------------------------ |
| `PinyinReviewStrategy`           | pinyin-syllable   | pinyin      | true        | content/pinyin/\*.json   |
| `ToneReviewStrategy`             | tone-syllable     | tone        | false       | content/tones/\*.json    |
| `RadicalMeaningReviewStrategy`   | radical           | pinyin      | true        | content/radicals/\*.json |
| `CharacterRadicalReviewStrategy` | character-radical | pinyin      | true        | content/radicals/\*.json |

## Question Format Reference

### Input Encoding

The `evaluateAnswer(question, pinyin, tone)` function uses its parameters differently per strategy. Every format's answer is encoded onto these two arguments and persisted on the existing `QuizAttemptAnswer` columns — there is no per-format payload column.

| Strategy               | `pinyin` param                                | `tone` param | Persisted as                                                  |
| ---------------------- | --------------------------------------------- | ------------ | ------------------------------------------------------------- |
| `audio-to-pinyin-tone` | Plain pinyin string                           | 0–4          | `pinyinInput` + `selectedTone`                                |
| `ime-simulator`        | Character glyph                               | 0            | `pinyinInput` (NFKC-normalised)                               |
| `radical-gate`         | Selected option ID                            | 0            | `pinyinInput` holds the option id, `correctPinyin` the answer |
| `cloze`                | The filled token                              | 0            | `pinyinInput` = token, `correctPinyin` = expected token       |
| `sentence-building`    | Ordered tokens joined by a single ASCII space | 0            | `pinyinInput` = order, `correctPinyin` = canonical order      |
| `listening-dictation`  | The transcription, trimmed                    | 0            | `pinyinInput` = transcription, `correctPinyin` = expected     |
| `tone-judgment`        | The syllable judged                           | chosen 0–4   | `selectedTone` / `correctTone`; `pinyinInput` = the syllable  |

Two consequences a reader must not get wrong:

- **`tone === 0` is not "no tone answer".** `0` is a legal neutral tone, so the discriminator is `quizType`/`category`, never the tone value.
- **The unused tone slots carry a `0` sentinel** because the columns are `NOT NULL`. Never infer a format from a zero.

For multiple-choice strategies, `correctPinyin` stores the correct option ID. `selectedTone === correctTone = 0` always passes.

### Generation Sources

| Strategy             | Data Source                                               | Generation Logic                                                                          |
| -------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Audio-to-Pinyin-Tone | Pinyin syllable + character-mapping tables                | Combinations of initials + finals                                                         |
| IME Simulator        | Radical content                                           | Extract unique HSK characters                                                             |
| Radical Gate T1      | Radical content                                           | Recommended radicals; 3 meaning distractors                                               |
| Radical Gate T2      | Radical content                                           | Reverse char→radical map; 3 category distractors                                          |
| Cloze                | `GrammarPattern` + `GrammarExample`                       | Blank one example segment; distractors from other patterns' same-length segments          |
| Sentence-Building    | `GrammarExample`                                          | Word bank = that example's segments, deterministically shuffled; answer = canonical order |
| Listening-Dictation  | `Character` (character-level; words deferred)             | Prompt = the character's audio key, glyph hidden                                          |
| Tone-Judgment        | `TonePair` + `ToneRule`, falling back to `PinyinSyllable` | Written syllable + its sandhi rule; answer = the surface tone                             |
| Review (all)         | Content files + SRS join                                  | SM-2 filtering                                                                            |

**Bank-first, corpus-fallback.** The four practice formats read anchored questions from `metadata.quizFormats` on the anchor row first (`content/seed/phase2/quiz-formats.json` seeds them) and fall back to generating from the corpus when a bank is absent or too thin. The bank is a _selection layer_: it pins row ids, never copies answer text, so there is one place for pinyin to drift. Generation is fail-open — thin content returns fewer questions, never a 500.

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
