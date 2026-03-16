# Quiz State Management Guide

**Purpose**: Step-by-step guide for implementing quiz state machine with React reducer pattern, interleaving logic, and localStorage persistence.

**Related Stories**: [Story 15.6](../business-requirements/epic-15-learning-retention/story-15-6-quiz-container-state.md), [Story 15.8](../business-requirements/epic-15-learning-retention/story-15-8-core-quiz-integration.md)

**Target Audience**: Frontend developers implementing quiz container components

---

## Overview

The quiz state machine manages the flow of a daily review quiz session from initialization through completion. It handles:

- Loading due words from the backend API
- Randomizing question types per word (interleaving)
- Tracking user answers and progress
- Managing phase transitions (LOADING → QUESTION → ANSWER_FEEDBACK → COMPLETE)
- Persisting quiz session to localStorage (survives page refresh)
- Optimistic UI updates (show feedback immediately, save to backend asynchronously)

**Key Design Principle**: State machine ensures predictable phase transitions and prevents invalid states (e.g., can't submit answer while in LOADING phase).

---

## When to Use This Pattern

✅ **Use this quiz state management pattern when:**

- Building any multi-step form or quiz with complex transitions
- Need to persist incomplete sessions across page refreshes
- Implementing optimistic UI (show feedback before backend confirms)
- Managing async data fetching with loading/error states

❌ **Do NOT use this pattern when:**

- Building simple single-question forms (overkill for trivial cases)
- Quiz results don't need persistence (can use simpler useState)
- No async backend integration (consider simpler state management)

---

## State Machine Architecture

### Phase Definitions

```typescript
type QuizPhase = "LOADING" | "QUESTION" | "ANSWER_FEEDBACK" | "COMPLETE";
```

**Phase Transition Flow:**

```
LOADING (fetch due words)
    ↓
QUESTION (display current question + wait for answer)
    ↓
ANSWER_FEEDBACK (show correct/incorrect + save to backend)
    ↓
NEXT_QUESTION → back to QUESTION (if more questions remain)
    OR
COMPLETE_QUIZ → COMPLETE (show summary screen)
```

**Invalid Transitions Prevented:**

- Cannot submit answer during LOADING (button disabled)
- Cannot advance to next question from COMPLETE (quiz ended)
- Cannot go back to previous question (enforces forward momentum)

---

## Step 1: Define State and Actions

### State Interface

```typescript
// apps/frontend/src/features/quiz/types/QuizTypes.ts

export type QuestionMode = "multiple_choice" | "type_pinyin" | "type_character";

export interface QuizQuestion {
  wordId: string;
  word: string;
  pinyin: string;
  english: string;
  mode: QuestionMode;
  options?: string[]; // Required for multiple_choice mode
}

export interface QuizAnswer {
  wordId: string;
  questionType: QuestionMode;
  userAnswer: string;
  correct: boolean;
  timestamp: Date;
}

export interface QuizState {
  phase: QuizPhase;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: QuizAnswer[];
  error?: string; // For error handling
}
```

### Action Types

```typescript
// apps/frontend/src/features/quiz/reducers/quizReducer.ts

type QuizAction =
  | { type: "INITIALIZE_QUIZ"; questions: QuizQuestion[] }
  | { type: "SUBMIT_ANSWER"; answer: QuizAnswer }
  | { type: "NEXT_QUESTION" }
  | { type: "COMPLETE_QUIZ" }
  | { type: "RESTORE_SESSION"; session: QuizState }
  | { type: "ERROR"; message: string };
```

---

## Step 2: Implement Reducer Logic

```typescript
// apps/frontend/src/features/quiz/reducers/quizReducer.ts

const initialState: QuizState = {
  phase: "LOADING",
  questions: [],
  currentIndex: 0,
  answers: [],
};

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "INITIALIZE_QUIZ":
      return {
        ...state,
        phase: "QUESTION",
        questions: action.questions,
        currentIndex: 0,
        answers: [],
        error: undefined,
      };

    case "SUBMIT_ANSWER":
      return {
        ...state,
        phase: "ANSWER_FEEDBACK",
        answers: [...state.answers, action.answer],
      };

    case "NEXT_QUESTION":
      const nextIndex = state.currentIndex + 1;

      // Check if quiz complete
      if (nextIndex >= state.questions.length) {
        return { ...state, phase: "COMPLETE", currentIndex: nextIndex };
      }

      // Advance to next question
      return {
        ...state,
        phase: "QUESTION",
        currentIndex: nextIndex,
      };

    case "COMPLETE_QUIZ":
      return { ...state, phase: "COMPLETE" };

    case "RESTORE_SESSION":
      return {
        ...action.session,
        phase: "QUESTION", // Always resume in QUESTION phase
      };

    case "ERROR":
      return {
        ...state,
        phase: "LOADING", // Reset to LOADING on error (allows retry)
        error: action.message,
      };

    default:
      return state;
  }
}
```

**Key Implementation Notes:**

- **Immutability**: Always return new state object (use spread operator)
- **Phase Validation**: Check `currentIndex >= questions.length` to determine completion
- **Error Handling**: `ERROR` action resets to LOADING phase for retry
- **Session Restoration**: Always resume in QUESTION phase (not ANSWER_FEEDBACK)

---

## Step 3: Implement Interleaving Logic

Interleaving randomizes question types per word to create "desirable difficulty" that improves long-term retention.

**Research Insight**: Blocked practice (all multiple choice, then all pinyin, then all character) creates short-term gains but poor long-term retention. Interleaving forces contextual switching that strengthens memory.

```typescript
// apps/frontend/src/features/quiz/utils/interleaving.ts

import { QuizQuestion, QuestionMode } from "../types/QuizTypes";

const QUESTION_MODES: QuestionMode[] = ["multiple_choice", "type_pinyin", "type_character"];

/**
 * Generate interleaved questions (randomize mode per word)
 *
 * @param words - Array of due words from backend
 * @returns Array of QuizQuestion with randomized modes
 */
export function createInterleavedQuestions(words: any[]): QuizQuestion[] {
  return words.map((word) => {
    // Random mode selection for this specific word
    const randomMode = QUESTION_MODES[Math.floor(Math.random() * QUESTION_MODES.length)];

    return {
      wordId: word.id,
      word: word.chinese,
      pinyin: word.pinyin,
      english: word.english,
      mode: randomMode,
      options: randomMode === "multiple_choice" ? generateDistractors(word, words) : undefined,
    };
  });
}

/**
 * Generate 3 wrong answers + 1 correct answer for multiple choice
 */
function generateDistractors(correctWord: any, allWords: any[]): string[] {
  // Filter out correct word
  const candidates = allWords.filter((w) => w.id !== correctWord.id);

  // Shuffle and take 3 random wrong answers
  const wrongAnswers = candidates
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((w) => w.english);

  // Combine with correct answer and shuffle again
  const allOptions = [...wrongAnswers, correctWord.english];
  return allOptions.sort(() => Math.random() - 0.5);
}
```

**Best Practices:**

- **Per-Word Randomization**: Each word gets independent random mode (not session-wide pattern)
- **Distractor Quality**: Select from same vocabulary set (contextually relevant wrong answers)
- **Shuffle Twice**: Shuffle distractors, then shuffle final options (prevents correct answer position bias)

---

## Step 4: Implement localStorage Persistence

Quiz sessions persist to survive accidental page refreshes. Uses 24-hour TTL to auto-expire abandoned quizzes.

```typescript
// apps/frontend/src/features/quiz/utils/persistence.ts

const QUIZ_SESSION_KEY = "quiz_session";
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface QuizSession {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: { wordId: string; correct: boolean }[];
  timestamp: number;
}

/**
 * Save quiz session to localStorage
 */
export function saveQuizSession(session: Omit<QuizSession, "timestamp">) {
  const sessionWithTimestamp: QuizSession = {
    ...session,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(QUIZ_SESSION_KEY, JSON.stringify(sessionWithTimestamp));
  } catch (error) {
    console.error("Failed to save quiz session:", error);
    // Silent fail (quiz continues, just won't persist)
  }
}

/**
 * Load quiz session from localStorage
 * Returns null if session expired or invalid
 */
export function loadQuizSession(): QuizSession | null {
  const saved = localStorage.getItem(QUIZ_SESSION_KEY);
  if (!saved) return null;

  try {
    const session: QuizSession = JSON.parse(saved);

    // Check TTL
    const age = Date.now() - session.timestamp;
    if (age > SESSION_TTL) {
      clearQuizSession(); // Auto-cleanup expired session
      return null;
    }

    return session;
  } catch (error) {
    console.error("Error loading quiz session:", error);
    clearQuizSession(); // Cleanup corrupted data
    return null;
  }
}

/**
 * Clear quiz session from localStorage
 */
export function clearQuizSession() {
  localStorage.removeItem(QUIZ_SESSION_KEY);
}
```

**Edge Cases Handled:**

- **TTL Expiration**: Sessions older than 24 hours auto-delete
- **Parse Errors**: Corrupted data triggers cleanup
- **Storage Quota**: Silent fail if localStorage full (quiz continues without persistence)

---

## Step 5: Container Component Integration

> **Note (Story 15.11 Update):** The pattern below illustrates the reducer integration concept. The actual implementation uses the session-based architecture introduced in Story 15.11:
>
> - **Session hook**: `useQuizSession()` + `useAnswerSubmission()` instead of `useQuizAPI()`
> - **Current component names**: `QuestionSection` (was `QuizCard`), `ProgressBar` (was `QuizProgressBar`), `PinyinToneInput`/`ChineseCharacterInput` (were `TypeAnswerInput`)
> - **API**: `POST /api/v1/quiz/session/start` and `POST /api/v1/quiz/session/:id/answer`
>
> The architectural patterns (reducer, dispatch, phases) described here remain accurate.

Bring it all together in the `DailyReviewTest` container component.

```typescript
// apps/frontend/src/features/quiz/containers/DailyReviewTest.tsx

import React, { useReducer, useEffect, useState } from 'react';
import { quizReducer, initialState } from '../reducers/quizReducer';
import { createInterleavedQuestions } from '../utils/interleaving';
import { saveQuizSession, loadQuizSession, clearQuizSession } from '../utils/persistence';
import { useQuizAPI } from '../hooks/useQuizAPI';
import { QuizCard } from '../components/QuizCard';
import { TypeAnswerInput } from '../components/TypeAnswerInput';
import { QuizProgressBar } from '../components/QuizProgressBar';

export const DailyReviewTest: React.FC = () => {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { fetchDueWords, saveTestResult } = useQuizAPI();

  // Initialize quiz on mount
  useEffect(() => {
    initializeQuiz();
  }, []);

  const initializeQuiz = async () => {
    // Try to restore from localStorage first
    const savedSession = loadQuizSession();
    if (savedSession) {
      dispatch({ type: 'RESTORE_SESSION', session: savedSession });
      setStartTime(new Date());
      return;
    }

    // Fetch fresh due words from backend
    try {
      const dueWords = await fetchDueWords();
      if (dueWords.length === 0) {
        // No due words today
        dispatch({ type: 'ERROR', message: 'No words due for review today. Great job!' });
        return;
      }

      const questions = createInterleavedQuestions(dueWords);
      dispatch({ type: 'INITIALIZE_QUIZ', questions });
      setStartTime(new Date());
    } catch (error) {
      dispatch({ type: 'ERROR', message: 'Failed to load quiz. Please try again.' });
    }
  };

  // Handle answer submission
  const handleAnswer = async (userAnswer: string) => {
    const currentQuestion = state.questions[state.currentIndex];
    const correct = validateAnswer(userAnswer, currentQuestion);
    const timeSpent = startTime ? Date.now() - startTime.getTime() : 0;

    // Optimistic UI: show feedback immediately
    const answerData = {
      wordId: currentQuestion.wordId,
      questionType: currentQuestion.mode,
      userAnswer,
      correct,
      timestamp: new Date()
    };

    dispatch({ type: 'SUBMIT_ANSWER', answer: answerData });

    // Save to backend asynchronously (non-blocking)
    try {
      await saveTestResult({
        wordId: currentQuestion.wordId,
        correct,
        questionType: currentQuestion.mode,
        timeSpentMs: timeSpent
      });
    } catch (error) {
      console.error('Failed to save answer:', error);
      // TODO: Show retry toast notification
    }

    // Persist session to localStorage
    saveQuizSession({
      questions: state.questions,
      currentIndex: state.currentIndex,
      answers: state.answers.map(a => ({ wordId: a.wordId, correct: a.correct }))
    });

    // Auto-advance after 1.5 seconds (feedback display time)
    setTimeout(() => {
      dispatch({ type: 'NEXT_QUESTION' });
      setStartTime(new Date()); // Reset timer for next question
    }, 1500);
  };

  // Validate user answer based on question mode
  const validateAnswer = (userAnswer: string, question: QuizQuestion): boolean => {
    const normalized = userAnswer.toLowerCase().trim();

    switch (question.mode) {
      case 'multiple_choice':
        return normalized === question.english.toLowerCase();
      case 'type_pinyin':
        return userAnswer === question.pinyin; // Exact match (tone marks matter)
      case 'type_character':
        return userAnswer === question.word; // Exact match
      default:
        return false;
    }
  };

  // Clear localStorage when quiz completes
  useEffect(() => {
    if (state.phase === 'COMPLETE') {
      clearQuizSession();
    }
  }, [state.phase]);

  // Render loading state
  if (state.phase === 'LOADING') {
    return (
      <div className="quiz-container">
        {state.error ? (
          <div className="error-message">
            <p>{state.error}</p>
            <button onClick={initializeQuiz}>Retry</button>
          </div>
        ) : (
          <div className="loading-spinner">Loading your quiz...</div>
        )}
      </div>
    );
  }

  // Render completion state
  if (state.phase === 'COMPLETE') {
    const correctCount = state.answers.filter(a => a.correct).length;
    const accuracy = Math.round((correctCount / state.answers.length) * 100);

    return (
      <div className="quiz-complete">
        <h2>🎉 Quiz Complete!</h2>
        <div className="quiz-summary">
          <p>Correct: {correctCount} / {state.answers.length}</p>
          <p>Accuracy: {accuracy}%</p>
        </div>
        <button onClick={() => window.location.href = '/dashboard'}>Back to Dashboard</button>
      </div>
    );
  }

  // Render question state
  const currentQuestion = state.questions[state.currentIndex];

  return (
    <div className="quiz-container">
      <QuizProgressBar
        current={state.currentIndex + 1}
        total={state.questions.length}
      />

      <QuizCard
        question={currentQuestion}
        mode={currentQuestion.mode}
        options={currentQuestion.options}
        onAnswer={handleAnswer}
      />

      {/* Type answer input for non-multiple-choice modes */}
      {currentQuestion.mode !== 'multiple_choice' && (
        <TypeAnswerInput
          placeholder={currentQuestion.mode === 'type_pinyin' ? 'Type pinyin...' : 'Type character...'}
          mode={currentQuestion.mode}
          onAnswer={handleAnswer}
        />
      )}

      {/* Show feedback in ANSWER_FEEDBACK phase */}
      {state.phase === 'ANSWER_FEEDBACK' && (
        <div className={`feedback ${state.answers[state.answers.length - 1].correct ? 'correct' : 'incorrect'}`}>
          {state.answers[state.answers.length - 1].correct ? '✅ Correct!' : '❌ Incorrect'}
        </div>
      )}
    </div>
  );
};
```

---

## Common Issues and Solutions

### Problem: Quiz state resets unexpectedly during session

**Cause**: Parent component re-renders causing `useReducer` to reinitialize

**Solution**: Wrap `DailyReviewTest` in `React.memo()` or ensure parent doesn't pass new object references as props

### Problem: localStorage quota exceeded error

**Cause**: Browser storage limit reached (typically 5-10MB)

**Solution**: Catch `QuotaExceededError` in `saveQuizSession()` and continue without persistence (quiz still works, just won't restore on refresh)

### Problem: Answers submitted twice (duplicate API calls)

**Cause**: React StrictMode in development calls effects twice, or user rapidly clicks submit

**Solution**: Add debouncing in `handleAnswer()` or disable submit button while saving (use loading state)

---

## Testing Checklist

- [ ] Quiz initializes with due words from API
- [ ] Quiz restores from localStorage after page refresh
- [ ] Question types are randomized per word (verify distribution over 20+ words)
- [ ] Answers persist to localStorage after each submission
- [ ] Quiz completes and clears localStorage when finished
- [ ] Error state displays and allows retry if API fails
- [ ] Phase transitions follow valid state machine paths
- [ ] No duplicate API calls on answer submission

---

## Related Documentation

- [Story 15.6 BR](../business-requirements/epic-15-learning-retention/story-15-6-quiz-container-state.md) - Quiz container requirements
- [Story 15.8 BR](../business-requirements/epic-15-learning-retention/story-15-8-core-quiz-integration.md) - Backend integration requirements
- [Cognitive Science of Active Recall](../knowledge-base/cognitive-science-active-recall.md) - Why interleaving works
- [Code Conventions](./code-conventions.md) - React component best practices

---

**Last Updated**: January 20, 2025
