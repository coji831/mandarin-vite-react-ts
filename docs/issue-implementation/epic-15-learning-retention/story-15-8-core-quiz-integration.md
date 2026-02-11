# Implementation 15-8: Core Quiz Backend Integration

## Technical Scope

Connect quiz UI (Stories 15.5-15.6) to backend APIs (Stories 15.1-15.2). Implement optimistic UI, localStorage persistence, and error handling.

**Files Modified:**

- `apps/frontend/src/features/quiz/containers/DailyReviewTest.tsx` - Replace mocked data with API calls
- `apps/frontend/src/features/quiz/hooks/useQuizAPI.ts` - API client hook
- `apps/frontend/src/features/quiz/utils/persistence.ts` - localStorage persistence
- `apps/frontend/src/features/dashboard/components/Dashboard.tsx` - Add "Start Daily Review" button

**API Integration:**

- `GET /api/progress/due` - Fetch due words on quiz start
- `POST /api/progress/test-result` - Save after each answer

## Implementation Details

### API Client Hook

```typescript
// apps/frontend/src/features/quiz/hooks/useQuizAPI.ts

import { useCallback } from "react";
import { apiClient } from "../../../utils/apiClient";

export function useQuizAPI() {
  const fetchDueWords = useCallback(async (date?: string) => {
    try {
      const response = await apiClient.get("/api/progress/due", {
        params: { date },
      });
      return response.data.words;
    } catch (error) {
      console.error("Error fetching due words:", error);
      throw error;
    }
  }, []);

  const saveTestResult = useCallback(
    async (result: {
      wordId: string;
      correct: boolean;
      questionType: string;
      timeSpentMs: number;
    }) => {
      try {
        const response = await apiClient.post("/api/progress/test-result", result);
        return response.data;
      } catch (error) {
        console.error("Error saving test result:", error);
        throw error;
      }
    },
    [],
  );

  return { fetchDueWords, saveTestResult };
}
```

### Updated DailyReviewTest with API Integration

```typescript
// apps/frontend/src/features/quiz/containers/DailyReviewTest.tsx (updated)

import React, { useReducer, useEffect, useState } from "react";
import { useQuizAPI } from "../hooks/useQuizAPI";
import { saveQuizSession, loadQuizSession, clearQuizSession } from "../utils/persistence";

export const DailyReviewTest: React.FC = () => {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { fetchDueWords, saveTestResult } = useQuizAPI();

  useEffect(() => {
    initializeQuiz();
  }, []);

  const initializeQuiz = async () => {
    // Try to restore from localStorage first
    const savedSession = loadQuizSession();
    if (savedSession) {
      dispatch({ type: "RESTORE_SESSION", session: savedSession });
      return;
    }

    // Fetch fresh due words
    try {
      const dueWords = await fetchDueWords();
      const questions = createInterleavedQuestions(dueWords);
      dispatch({ type: "INITIALIZE_QUIZ", questions });
    } catch (error) {
      // Show error UI
      dispatch({ type: "ERROR", message: "Failed to load quiz" });
    }
  };

  const handleAnswer = async (userAnswer: string) => {
    const currentQuestion = state.questions[state.currentIndex];
    const correct = validateAnswer(userAnswer, currentQuestion);
    const timeSpent = startTime ? Date.now() - startTime.getTime() : 0;

    // Optimistic UI: show feedback immediately
    dispatch({
      type: "SUBMIT_ANSWER",
      answer: {
        wordId: currentQuestion.wordId,
        questionType: currentQuestion.mode,
        userAnswer,
        correct,
        timestamp: new Date(),
      },
    });

    // Save to backend asynchronously
    try {
      await saveTestResult({
        wordId: currentQuestion.wordId,
        correct,
        questionType: currentQuestion.mode,
        timeSpentMs: timeSpent,
      });
    } catch (error) {
      // Store failed save for retry
      console.error("Failed to save answer:", error);
      // Show retry toast
    }

    // Save session to localStorage
    saveQuizSession({
      questions: state.questions,
      currentIndex: state.currentIndex,
      answers: [...state.answers, { wordId: currentQuestion.wordId, correct }],
    });

    // Auto-advance after feedback
    setTimeout(() => {
      dispatch({ type: "NEXT_QUESTION" });
      setStartTime(new Date()); // Reset timer for next question
    }, 1500);
  };

  // Clear localStorage on completion
  useEffect(() => {
    if (state.phase === "COMPLETE") {
      clearQuizSession();
    }
  }, [state.phase]);

  // ... rest of component (render logic same as Story 15.6)
};
```

### localStorage Persistence

```typescript
// apps/frontend/src/features/quiz/utils/persistence.ts

const QUIZ_SESSION_KEY = "quiz_session";
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface QuizSession {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: { wordId: string; correct: boolean }[];
  timestamp: number;
}

export function saveQuizSession(session: Omit<QuizSession, "timestamp">) {
  const sessionWithTimestamp = {
    ...session,
    timestamp: Date.now(),
  };
  localStorage.setItem(QUIZ_SESSION_KEY, JSON.stringify(sessionWithTimestamp));
}

export function loadQuizSession(): QuizSession | null {
  const saved = localStorage.getItem(QUIZ_SESSION_KEY);
  if (!saved) return null;

  try {
    const session: QuizSession = JSON.parse(saved);

    // Check TTL
    if (Date.now() - session.timestamp > SESSION_TTL) {
      clearQuizSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error("Error loading quiz session:", error);
    return null;
  }
}

export function clearQuizSession() {
  localStorage.removeItem(QUIZ_SESSION_KEY);
}
```

### Dashboard Integration

```typescript
// apps/frontend/src/features/dashboard/components/Dashboard.tsx (updated)

import React, { useEffect, useState } from 'react';
import { useQuizAPI } from '../../quiz/hooks/useQuizAPI';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [dueCount, setDueCount] = useState<number>(0);
  const { fetchDueWords } = useQuizAPI();
  const navigate = useNavigate();

  useEffect(() => {
    loadDueCount();
  }, []);

  const loadDueCount = async () => {
    try {
      const dueWords = await fetchDueWords();
      setDueCount(dueWords.length);
    } catch (error) {
      console.error('Error loading due count:', error);
    }
  };

  const handleStartQuiz = () => {
    navigate('/quiz/daily-review');
  };

  return (
    <div className="dashboard">
      <h1>Welcome back!</h1>

      <button
        onClick={handleStartQuiz}
        disabled={dueCount === 0}
        className="start-quiz-button"
      >
        Start Daily Review
        {dueCount > 0 && <span className="badge">{dueCount} due</span>}
      </button>

      {/* Other dashboard widgets */}
    </div>
  );
};
```

## Architecture Integration

```
Dashboard
    ↓
GET /api/progress/due → display "15 due" badge
    ↓
User clicks "Start Daily Review"
    ↓
DailyReviewTest.initializeQuiz()
    ↓
loadQuizSession() → if exists, restore; else fetchDueWords() → createInterleavedQuestions()
    ↓
User answers → Optimistic UI (show feedback) + saveTestResult() async
    ↓
saveQuizSession() to localStorage after each answer
    ↓
Quiz complete → clearQuizSession() → show summary
```

## Technical Challenges & Solutions

### Challenge: Race Condition with Multiple Answer Submissions

**Problem:** User rapidly clicks answers before previous save completes; duplicate API calls or state conflicts.

**Solution:** Disable submit button while saving; add request debouncing; use React.useTransition for concurrent rendering.

---

**Related Documentation:**

- [Story 15.8 BR](../../business-requirements/epic-15-learning-retention/story-15-8-core-quiz-integration.md)
- [Story 15.6 Implementation](./story-15-6-quiz-container-state.md) (base container)
- [Story 15.2 Implementation](./story-15-2-core-quiz-backend.md) (API endpoints)
- [Epic 15 Implementation](./README.md)
