# Implementation 15-8: Core Quiz Backend Integration

## Technical Scope

Connect quiz UI (Stories 15.5-15.6) to backend APIs (Stories 15.1-15.2). Implement optimistic UI, backend response capture, error handling, and code cleanup.

**Files Modified:**

Frontend:

- `apps/frontend/src/features/quiz/containers/DailyReviewQuiz.tsx` - Enhanced handleAnswer to async, capture backend response, enrich QuizAnswer with word details
- `apps/frontend/src/features/quiz/reducers/quizReducer.ts` - Added UPDATE_ANSWER_METADATA action
- `apps/frontend/src/features/quiz/components/QuizComplete.tsx` - Added "Your Answer" column to results table
- `apps/frontend/src/features/quiz/components/ToneInput.tsx` - Refactored to use centralized toneMap
- `apps/frontend/src/constants/toneMap.ts` - **NEW** Centralized tone map with pre-sorted keys (96 patterns including nasal finals)

Backend:

- `apps/backend/src/core/services/ProgressService.js` - Changed default quiz limit from 20 to 10, removed debug console.logs
- `apps/backend/src/infrastructure/repositories/ProgressRepository.js` - Removed debug console.logs
- `apps/backend/prisma/seed.js` - Removed sample progress creation logic (50 lines)
- `apps/backend/scripts/check-db-data.js` - **DELETED** (diagnostic script)
- `apps/backend/scripts/test-due-words-api.js` - **DELETED** (debugging script)

**API Integration:**

- `GET /api/progress/due` - Fetch due words on quiz start (70/30 backfill strategy, 10-word limit)
- `POST /api/progress/test-result` - Save after each answer (returns nextReviewDate, lapseCount)

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

### Challenge 1: QuizAnswer Objects Missing Word Details

**Problem:** Results table showed "just its id" instead of actual words. QuizAnswer objects only contained wordId, not word/pinyin/english fields.

**Root Cause:** `handleAnswer()` in DailyReviewQuiz.tsx only passed minimal data when creating QuizAnswer:

```typescript
// Before: Only 5 fields
{
  wordId: currentQuestion.wordId,
  questionType: currentQuestion.mode,
  userAnswer,
  correct,
  timestamp: new Date(),
}
```

**Solution:** Enhanced QuizAnswer creation to include full word details from currentQuestion:

```typescript
// After: 8 fields (added word, pinyin, english)
{
  wordId: currentQuestion.wordId,
  word: currentQuestion.word,           // NEW
  pinyin: currentQuestion.pinyin,       // NEW
  english: currentQuestion.english,     // NEW
  questionType: currentQuestion.mode,
  userAnswer,
  correct,
  timestamp: new Date(),
}
```

**Impact:** Results table now displays actual vocabulary instead of IDs. No schema changes required.

---

### Challenge 2: Backend Response Metadata Not Captured

**Problem:** `nextReview` and `lapseCount` from backend appeared as "N/A" and 0 in quiz results.

**Root Cause:** `saveTestResult()` was called without `await`, so response containing nextReviewDate and lapseCount was never captured.

**Solution:**

1. Made `handleAnswer()` async
2. Awaited `saveTestResult()` response
3. Added new reducer action `UPDATE_ANSWER_METADATA` to merge backend data:

```typescript
case "UPDATE_ANSWER_METADATA": {
  const updatedAnswers = state.answers.map((answer, index) =>
    index === state.answers.length - 1 && answer.wordId === action.wordId
      ? { ...answer, nextReview: action.nextReview, lapseCount: action.lapseCount }
      : answer
  );
  return { ...state, answers: updatedAnswers };
}
```

4. Dispatched metadata update after receiving response:

```typescript
const result = await saveTestResult({...});
dispatch({
  type: "UPDATE_ANSWER_METADATA",
  wordId: currentQuestion.wordId,
  nextReview: result.nextReviewDate,
  lapseCount: result.lapseCount,
});
```

**Impact:** Quiz results now show accurate nextReview dates and lapseCount for progress tracking.

---

### Challenge 3: ToneInput Nasal Finals Not Converting

**Problem:** User reported "fen3" wasn't converting to "fěn" (and similar patterns: ban1, ming2, zhong1).

**Root Cause:** Original toneMap only had single-vowel and multi-vowel diphthongs, missing nasal finals pattern matching.

**Solution:** Added 32 new patterns for nasal finals (an, en, in, un, ang, eng, ing, ong):

```typescript
// Added to toneMap
an1: "ān", an2: "án", an3: "ǎn", an4: "àn",
en1: "ēn", en2: "én", en3: "ěn", en4: "èn",
in1: "īn", in2: "ín", in3: "ǐn", in4: "ìn",
un1: "ūn", un2: "ún", un3: "ǔn", un4: "ùn",
ang1: "āng", ang2: "áng", ang3: "ǎng", ang4: "àng",
eng1: "ēng", eng2: "éng", eng3: "ěng", eng4: "èng",
ing1: "īng", ing2: "íng", ing3: "ǐng", ing4: "ìng",
ong1: "ōng", ong2: "óng", ong3: "ǒng", ong4: "òng",
```

**Impact:** ToneInput now correctly handles ban1→bān, fen1→fēn, ming2→míng, zhong1→zhōng patterns.

---

### Challenge 4: ToneMap Performance - Runtime Sorting on Every Keystroke

**Problem:** `convertToneMarks()` called `Object.keys(toneMap).sort()` on every input change, creating 96-key array and sorting it repeatedly.

**Root Cause:** Sorting was necessary to match longest patterns first (ang1 before an1), but doing it runtime was inefficient.

**Solution:**

1. Moved toneMap to `src/constants/toneMap.ts` for reusability
2. Created pre-sorted export:

```typescript
export const toneMapKeys = Object.keys(toneMap).sort((a, b) => b.length - a.length);
```

3. Updated ToneInput to use pre-sorted keys:

```typescript
// Before
const sortedKeys = Object.keys(toneMap).sort((a, b) => b.length - a.length);

// After
import { toneMapKeys } from "../../../constants/toneMap";
toneMapKeys.forEach((key) => { ... });
```

**Impact:** Eliminated O(n log n) sort operation on every keystroke; now O(1) array lookup. Sorting happens once at module load.

---

### Challenge 5: Quiz Limit Mismatch with User Expectations

**Problem:** 20-word default quiz limit caused fatigue during testing; user wanted shorter sessions (10 words).

**Root Cause:** Backend `getDueWords()` defaulted to `limit = 20`; 70/30 backfill strategy calculated 6 new words (30% of 20).

**Solution:** Changed default limit parameter in ProgressService:

```javascript
// Before
async getDueWords(userId, date = new Date(), limit = 20)

// After
async getDueWords(userId, date = new Date(), limit = 10)
```

**Impact:** Quizzes now default to 10 words with 3 new words backfill (30% of 10). Tests updated to reflect new limit.

---

### Challenge 6: Production Code Cluttered with Debugging Artifacts

**Problem:** Obsolete debugging code remained from development: sample progress seed logic, diagnostic scripts, 14 console.log statements in production paths.

**Root Cause:** Debugging artifacts not cleaned up after bug resolution.

**Solution:**

1. Removed sample progress seed loop (50 lines) from `seed.js` - no longer needed with 70/30 backfill auto-creating progress
2. Deleted `check-db-data.js` (73 lines) - diagnostic script for verifying seeded data
3. Deleted `test-due-words-api.js` (89 lines) - debugging script for "NO DUE WORDS" bug
4. Removed 11 console.logs from `ProgressService.js` (getDueWords, getUnlearnedWords)
5. Removed 3 console.logs from `ProgressRepository.js` (findDueByUserAndDate)

**Impact:** Clean production codebase; faster seed times; no console noise in prod logs.

---

**Related Documentation:**

- [Story 15.8 BR](../../business-requirements/epic-15-learning-retention/story-15-8-core-quiz-integration.md)
- [Story 15.6 Implementation](./story-15-6-quiz-container-state.md) (base container)
- [Story 15.2 Implementation](./story-15-2-core-quiz-backend.md) (API endpoints)
- [Epic 15 Implementation](./README.md)
