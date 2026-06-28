# Implementation Story 19.6: IME Simulator Quiz (Phase 2 Gate)

**Last Updated:** June 28, 2026

## Technical Scope

IME Simulator Quiz — a strategy-based quiz mode testing learners' ability to type Chinese characters using browser native IME input. Built following the existing Quiz Strategy Pattern, not as a standalone page.

### Frontend Files Created

| File                                                                       | Purpose                                                                                                                       |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `apps/frontend/src/features/quiz/engine/strategies/IMEQuizStrategy.ts`     | IME Simulator strategy implementing `QuizStrategy` — generates 25 questions via backend API, evaluates via NFKC normalization |
| `apps/frontend/src/features/quiz/components/ime-input/IMEQuestionView.tsx` | IME-specific question view with meaning-only clue + IME text input + candidate step guidance                                  |
| `apps/frontend/src/features/quiz/components/ime-input/IMEQuestionView.css` | BEM-styled IME input styles using CSS variables                                                                               |
| `apps/frontend/src/features/quiz/components/ime-input/index.ts`            | Barrel export                                                                                                                 |

### Frontend Files Modified

| File                                               | Change                                                                                                                      |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `features/quiz/types/engine.ts`                    | Added `"ime-simulator"` to `StrategyType`; relaxed `category` to `string`                                                   |
| `features/quiz/engine/strategies/index.ts`         | Registered `imeQuizStrategy`                                                                                                |
| `features/quiz/components/QuizRouter.tsx`          | Routes to `IMEQuestionView` for IME strategy                                                                                |
| `features/quiz/components/FeedbackView.tsx`        | IME-specific character feedback rendering                                                                                   |
| `features/quiz/components/QuizProgressBar.tsx`     | Made `passThreshold` dynamic (was hardcoded 90%)                                                                            |
| `features/quiz/components/results/QuizResults.tsx` | Dynamic pass threshold from strategy; dynamic phase label; uses `store.score` for fallback; hides CategoryBreakdown for IME |
| `features/quiz/stores/quizSessionStore.ts`         | IME strategy trusts local evaluation (backend pinyin comparison doesn't apply to character input)                           |
| `pages/practices/QuizSessionPage.tsx`              | Dynamic header: `"Phase {strategy.phase} Quiz — {strategy.label}"`                                                          |
| `pages/practices/PracticesPage.tsx`                | IME button navigates to `?type=ime-simulator`                                                                               |
| `router/PracticesRoutes.tsx`                       | Removed standalone route (uses existing `?type=` pattern)                                                                   |
| `shared/constants/paths.ts`                        | Removed `practices_quiz_ime` constant                                                                                       |
| `shared/services/phaseGateService.ts`              | Added localStorage caching for offline resilience                                                                           |
| `features/quiz/index.ts`                           | Added `IMEQuestionView` export                                                                                              |
| `features/radicals/components/index.ts`            | Removed `IMESimulatorPage` export                                                                                           |

### Backend Files Created

| File                                                               | Purpose                                                                                                                                      |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/backend/src/modules/quiz/strategies/ImeSimulatorStrategy.js` | Backend strategy — reads radical content files, extracts unique HSK characters, generates 25 randomized questions, NFKC-based validateAnswer |

### Backend Files Modified

| File                      | Change                                                    |
| ------------------------- | --------------------------------------------------------- |
| `strategies/index.js`     | Registered `imeSimulatorStrategy`                         |
| `services/QuizService.js` | Dynamic pass threshold per quizType (70% IME, 90% others) |

### Files Deleted

| File                                                     | Reason                                                     |
| -------------------------------------------------------- | ---------------------------------------------------------- |
| `features/radicals/components/IMESimulatorPage.tsx`      | Replaced by strategy pattern + IMEQuestionView             |
| `features/radicals/components/IMESimulatorPage.css`      | Replaced by IMEQuestionView.css                            |
| `features/radicals/components/IMESimulatorPage.test.tsx` | Replaced by strategy pattern tests                         |
| `features/radicals/services/imeQuizService.ts`           | Replaced by backend API via `quizService.fetchQuestions()` |

## Implementation Details

### Strategy Pattern

The IME Simulator follows the existing `QuizStrategy` pattern:

```typescript
// features/quiz/engine/strategies/IMEQuizStrategy.ts
export const imeQuizStrategy: QuizStrategy = {
  type: "ime-simulator",
  label: "IME Simulator",
  icon: "⌨️",
  phase: 2,
  questionCount: 25,
  passThreshold: 0.7,
  timeLimitMinutes: 10,

  async generateQuestions(): Promise<QuizQuestion[]> {
    return quizService.fetchQuestions("ime-simulator", this.questionCount);
  },

  evaluateAnswer(question: QuizQuestion, pinyin: string, tone: number): AnswerResult {
    const userGlyph = (pinyin ?? "").trim().normalize("NFKC");
    const correctGlyph = (question.character ?? "").normalize("NFKC");
    const correct = userGlyph === correctGlyph;
    // Returns AnswerResult with feedback showing character + pinyin + meaning
  },
};
```

### Routing

Uses existing `?type=` query param pattern — no standalone route:

```
/practices/quiz?type=ime-simulator
```

### IME Input Component

Custom `IMEQuestionView` with:

- Meaning-only clue (no pinyin — learner must recall)
- Text input with `lang="zh"` `inputMode="text"`
- Step guidance: ① Type pinyin ② Select from IME candidates

## Architecture Integration

```
PracticesPage → /practices/quiz?type=ime-simulator
  → QuizPage (route by ?type= query param)
    → QuizSessionPage + useQuizEngine
      → quizSessionStore (Zustand)
        → IMEQuizStrategy.generateQuestions() → quizService.fetchQuestions()
        → IMEQuizStrategy.evaluateAnswer() → NFKC normalization
      → QuizRouter → IMEQuestionView (question phase)
      → FeedbackView (IME variant)
      → QuizResults (dynamic threshold)
      → QuizProgressBar (dynamic threshold)
    → Backend: QuizAttempt API (fire-and-forget)
```

## Technical Challenges & Solutions

### Problem: Backend submitAnswer compares pinyin strings, not characters

For the audio-to-pinyin-tone quiz, `submitAnswer` compares `pinyinInput === correctPinyin`. For IME, `pinyinInput` is a character glyph (e.g., "玩") while `correctPinyin` is pinyin (e.g., "wán") — comparison always fails.

**Solution:** Added `strategyType !== "ime-simulator"` guard in `quizSessionStore.submitAnswer` so IME trusts local NFKC-based evaluation. Backend's `completeQuizAttempt` uses 70% threshold for IME type.

### Problem: Results screen showed 0/25 despite live counter showing correct score

`QuizResults` used `answers.filter((a) => a.correct).length` as fallback, but the `correct` field wasn't accessible in stored answers.

**Solution:** Changed fallback to `store.score` which was tracking correctly throughout the quiz.

### Problem: Hardcoded 90% pass threshold in QuizProgressBar

The progress bar had `const threshold = 90` hardcoded, showing "Need 23/25 to pass" instead of "Need 18/25" for IME.

**Solution:** Made `passThreshold` a prop (default 0.9) with dynamic value from `strategy.passThreshold`.

### Problem: System architecture audit — 4 pattern violations

1. **Pattern unawareness**: Initial implementation created standalone page instead of following QuizStrategy pattern
2. **Structure unawareness**: Files placed in `features/radicals/` instead of `features/quiz/`
3. **Routing unawareness**: Created standalone route instead of `?type=` query param
4. **Data unawareness**: Hardcoded 173 characters instead of using backend API

**Solution:** Full refactor to follow strategy pattern. Created `.github/instructions/quiz-architecture.instructions.md` and updated `.github/instructions/project-workflow.instructions.md` with pre-implementation investigation checklist.

## Testing

- **Frontend tests**: 374 passed (43 files)
- **Backend tests**: 178 passed (16 files) — 5 pre-existing failures (unrelated: examples/auth/hmac)
- **Browser verification**: All user flow checks passed against `learning-roadmap-usecases.md` UC-08/UC-11
  inputMode="text"
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="off"
  spellCheck={false}
  placeholder="Type character via IME..."
  onKeyDown={handleKeyDown}
  disabled={disabled}
  />
  );
  }

````

### Answer Normalization (NFKC)

```typescript
// Normalize both expected and typed characters
function normalizeAnswer(input: string): string {
  return input.trim().normalize("NFKC");
}

// Variant mapping for common simplified ↔ traditional pairs
const VARIANT_MAP: Record<string, string[]> = {
  着: ["著"], // simplified → accept traditional variant
  // ... additional pairs as needed
};

function isAnswerCorrect(expected: string, typed: string): boolean {
  const normalizedExpected = normalizeAnswer(expected);
  const normalizedTyped = normalizeAnswer(typed);

  if (normalizedExpected === normalizedTyped) return true;

  // Check variant map
  const variants = VARIANT_MAP[normalizedExpected] || [];
  return variants.includes(normalizedTyped);
}
````

### QuizAttempt API Reuse

```typescript
// Integration with existing QuizAttempt infrastructure
async function startQuiz(): Promise<QuizAttempt> {
  return apiClient.post("/api/v1/progression/quiz-attempts", {
    quizType: "ime-simulator",
  });
}

async function submitAnswer(attemptId: string, answer: Answer): Promise<void> {
  return apiClient.post(`/api/v1/progression/quiz-attempts/${attemptId}/answers`, answer);
}

async function completeQuiz(attemptId: string): Promise<QuizResult> {
  return apiClient.put(`/api/v1/progression/quiz-attempts/${attemptId}/complete`);
}
```

## Architecture Integration

```
IMEQuizPage (route: /practices/quiz?type=ime-simulator)
  ├── QuizHeader (question X of 25)
  ├── ClueDisplay (pinyin/meaning prompt)
  ├── IMEInput (lang="zh", inputMode="text")
  ├── FeedbackDisplay (correct/incorrect)
  ├── ProgressBar (score vs 70% target)
  └── QuizResults (pass → Phase 3, fail → retry)

API calls:
  POST   /api/v1/progression/quiz-attempts             → start quiz
  POST   /api/v1/progression/quiz-attempts/:id/answers → submit answer
  PUT    /api/v1/progression/quiz-attempts/:id/complete → complete + calculate
  PUT    /api/v1/progression/phase-gate                → update phase (on pass)
```

## Technical Challenges & Solutions

### Challenge: IME Input Normalization for Answer Matching

**Problem:** Browser IMEs can produce different character forms (simplified vs traditional, full-width vs half-width, variant glyphs). The quiz needs to match the user's input against the expected character, but naive string comparison would fail on variants.

**Solution:** Normalize both expected and typed characters using Unicode NFKC normalization. Maintain a small mapping of common variant pairs (simplified ↔ traditional) and accept both. If normalization doesn't match, check the variant map before marking incorrect. This handles the vast majority of real-world cases without a full dictionary.
