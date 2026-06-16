# Implementation 17-4: Zustand Migration (Quiz + Vocabulary)

## Technical Scope

**Files to create:**

- `apps/frontend/src/features/quiz/stores/quizSessionStore.ts` — Zustand store from quizReducer
- `apps/frontend/src/features/quiz/stores/index.ts` — barrel
- `apps/frontend/src/features/vocabulary/stores/listStore.ts` — Zustand store from listReducer
- `apps/frontend/src/features/vocabulary/stores/index.ts` — barrel

**Files to modify:**

- `apps/frontend/src/features/quiz/context/QuizContext.tsx` — delegate to Zustand store
- `apps/frontend/src/features/quiz/hooks/useQuizSession.ts` — use Zustand store directly
- `apps/frontend/src/features/quiz/hooks/useAnswerSubmission.ts` — use Zustand store
- `apps/frontend/src/features/quiz/pages/QuizPage.tsx` — use Zustand store
- `apps/frontend/src/features/quiz/index.ts` — add store exports
- `apps/frontend/src/features/vocabulary/index.ts` — add store exports
- All quiz/vocabulary components that consume state directly

**Files to retain (transitional):**

- `features/quiz/reducers/quizReducer.ts` — kept until Story 17.6
- `features/quiz/context/QuizContext.tsx` — kept as wrapper until Story 17.6
- `features/vocabulary/reducers/listReducer.ts` — kept until Story 17.6

## Implementation Details

### Step 1: Create `quizSessionStore.ts`

```typescript
// features/quiz/stores/quizSessionStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { QuizPhase, QuizQuestion, QuizAnswer, QuizSessionSummary } from "../types";

interface QuizSessionState {
  // Core quiz state
  phase: QuizPhase;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: QuizAnswer[];
  error?: string;
  sessionId?: string;

  // Derived
  currentQuestion?: QuizQuestion;

  // UI state
  answerValue: string;
  showHint: boolean;

  // AI feedback
  aiFeedback?: string;
  feedbackLoading: boolean;

  // Session metadata
  expiresAt?: string;
  isFreshCompletion: boolean;

  // Actions
  initializeSession: (questions: QuizQuestion[], sessionId: string) => void;
  submitAnswer: (answer: QuizAnswer) => void;
  nextQuestion: () => void;
  completeSession: (summary: QuizSessionSummary) => void;
  resetSession: () => void;
  setAnswerValue: (value: string) => void;
  toggleHint: () => void;
  setAiFeedback: (feedback: string | undefined) => void;
  setFeedbackLoading: (loading: boolean) => void;
}

export const useQuizSessionStore = create<QuizSessionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      phase: "LOADING" as QuizPhase,
      questions: [],
      currentIndex: 0,
      answers: [],
      error: undefined,
      sessionId: undefined,
      currentQuestion: undefined,
      answerValue: "",
      showHint: false,
      aiFeedback: undefined,
      feedbackLoading: false,
      expiresAt: undefined,
      isFreshCompletion: false,

      initializeSession: (questions, sessionId) =>
        set({
          phase: "QUESTION",
          questions,
          sessionId,
          currentIndex: 0,
          answers: [],
          currentQuestion: questions[0],
          answerValue: "",
          showHint: false,
          aiFeedback: undefined,
          feedbackLoading: false,
          error: undefined,
        }),

      submitAnswer: (answer) =>
        set((state) => ({
          answers: [...state.answers, answer],
          phase: "ANSWER_FEEDBACK" as QuizPhase,
        })),

      nextQuestion: () =>
        set((state) => {
          const nextIndex = state.currentIndex + 1;
          const isComplete = nextIndex >= state.questions.length;
          return {
            currentIndex: nextIndex,
            phase: isComplete ? ("RESULTS" as QuizPhase) : ("QUESTION" as QuizPhase),
            currentQuestion: isComplete ? undefined : state.questions[nextIndex],
            answerValue: "",
            showHint: false,
            aiFeedback: undefined,
          };
        }),

      completeSession: (summary) => set({ phase: "RESULTS" as QuizPhase, isFreshCompletion: true }),

      resetSession: () =>
        set({
          phase: "LOADING" as QuizPhase,
          questions: [],
          currentIndex: 0,
          answers: [],
          sessionId: undefined,
          currentQuestion: undefined,
          answerValue: "",
          showHint: false,
          aiFeedback: undefined,
          feedbackLoading: false,
          error: undefined,
          isFreshCompletion: false,
        }),

      setAnswerValue: (value) => set({ answerValue: value }),
      toggleHint: () => set((state) => ({ showHint: !state.showHint })),
      setAiFeedback: (feedback) => set({ aiFeedback: feedback }),
      setFeedbackLoading: (loading) => set({ feedbackLoading: loading }),
    }),
    { name: "quiz-session" },
  ),
);
```

### Step 2: Create `listStore.ts`

```typescript
// features/vocabulary/stores/listStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ListState } from "../types";

interface ListStoreState extends ListState {
  init: () => void;
  reset: () => void;
}

export const useListStore = create<ListStoreState>()(
  devtools(
    (set) => ({
      itemsById: {},
      itemIds: [],

      init: () => {
        // Placeholder — will be populated with real data loading
        set({ itemsById: {}, itemIds: [] });
      },

      reset: () => set({ itemsById: {}, itemIds: [] }),
    }),
    { name: "vocab-list" },
  ),
);
```

### Step 3: Update QuizContext to Delegate

```typescript
// features/quiz/context/QuizContext.tsx — simplified to delegate to Zustand
// The context becomes a thin wrapper for backward compatibility
import { createContext, ReactNode, useContext } from "react";
import { useQuizSessionStore } from "../stores/quizSessionStore";
import { QuizQuestion, QuizAnswer, QuizSessionSummary } from "../types";

// Context just provides the same API but delegates to Zustand
// Will be removed entirely in Story 17.6
```

### Step 4: Update Quiz Components

Components currently using `useQuizState()` and `useQuizActions()` from QuizContext are updated to use `useQuizSessionStore()` directly. The store selectors ensure re-renders only happen when relevant state changes:

```typescript
// Before:
const { phase, currentQuestion } = useQuizState();

// After:
const phase = useQuizSessionStore((s) => s.phase);
const currentQuestion = useQuizSessionStore((s) => s.currentQuestion);
```

## Architecture Integration

```
Before:
  QuizContext (Context Provider)
    → quizReducer (useReducer) → QuizPage + components use useQuizState/useQuizActions

After:
  useQuizSessionStore (Zustand) → QuizPage + components use store selectors directly
  QuizContext (thin wrapper, transitional) → removed in Story 17.6
```

## Technical Challenges & Solutions

```
Problem: Components subscribe to entire context state, causing unnecessary re-renders
Solution: Zustand's selector-based subscriptions let each component subscribe to only
the state slices it needs. This is a performance improvement over Context.

Problem: QuizContext currently wraps the quiz page and provides actions like handleAnswer
that orchestrate multiple steps
Solution: Keep the orchestration logic in hooks (useQuizSession, useAnswerSubmission) but
have them read/write to Zustand store instead of Context. The hooks are then importable
without any Context provider.
```

## Testing Implementation

- Adapt `quizReducer.test.ts` → `quizSessionStore.test.ts`: Test store actions directly
- Adapt `listReducer.test.ts` → `listStore.test.ts`: Test store actions directly
- Store tests are simpler — no `useReducer` wrapper, no context:

  ```typescript
  import { useQuizSessionStore } from "../stores/quizSessionStore";

  beforeEach(() => {
    useQuizSessionStore.setState(useQuizSessionStore.getInitialState());
  });

  it("should initialize session", () => {
    const { initializeSession } = useQuizSessionStore.getState();
    initializeSession(mockQuestions, "session-1");
    expect(useQuizSessionStore.getState().phase).toBe("QUESTION");
  });
  ```
