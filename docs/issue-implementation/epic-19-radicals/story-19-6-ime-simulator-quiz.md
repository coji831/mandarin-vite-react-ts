# Implementation 19-6: IME Simulator Quiz (Phase 2 Gate)

**Last Updated:** June 26, 2026

## Technical Scope

Build the IME Simulator Quiz page with browser native IME input, 25 randomized questions, instant feedback, progress bar, pass/fail results, and integration with existing QuizAttempt and PhaseGate backend infrastructure.

**Files to create:**

- `apps/frontend/src/features/radicals/components/IMEQuizPage.tsx` — main quiz page
- `apps/frontend/src/features/radicals/components/QuizQuestion.tsx` — single question display (clue + IME input)
- `apps/frontend/src/features/radicals/components/QuizResults.tsx` — pass/fail results screen
- `apps/frontend/src/features/radicals/hooks/useIMEQuiz.ts` — quiz state machine + API calls

**Files to modify:**

- `apps/backend/src/modules/progression/api/ProgressionController.js` — add "ime-simulator" to quizType validation
- `apps/backend/src/modules/progression/api/ProgressionController.js` — if needed, add PhaseGate update logic on quiz pass

## Implementation Details

### Browser Native IME Input

```typescript
// IMEInput uses standard text input with IME-enabling attributes
function IMEInput({ onSubmit, disabled }: IMEInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount to activate IME
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      const value = inputRef.current?.value.trim();
      if (value) {
        onSubmit(value);
        inputRef.current!.value = ''; // Clear for next question
      }
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      className="ime-input"
      lang="zh"
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
```

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
```

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
