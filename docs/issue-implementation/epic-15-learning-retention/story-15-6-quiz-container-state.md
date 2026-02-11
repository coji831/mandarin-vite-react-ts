# Implementation 15-6: Quiz Container & State Management

## Technical Scope

Implement quiz state machine and interleaving logic using React reducer pattern. Manages question flow without API calls.

**Files Created:**

- `apps/frontend/src/features/quiz/containers/DailyReviewTest.tsx`
- `apps/frontend/src/features/quiz/reducers/quizReducer.ts`
- `apps/frontend/src/features/quiz/components/QuizProgressBar.tsx`
- `apps/frontend/src/features/quiz/utils/interleaving.ts`

**State Machine Phases:**

- LOADING → QUESTION → ANSWER_FEEDBACK → NEXT | COMPLETE

**Interleaving Algorithm:**

- Randomize question type per word (not blocked)
- Ensure each word gets random mode: ['multiple_choice', 'type_pinyin', 'type_character']

## Implementation Details

### Quiz Reducer

```typescript
// apps/frontend/src/features/quiz/reducers/quizReducer.ts

import { QuizQuestion, QuizAnswer } from "../types/QuizTypes";

type QuizPhase = "LOADING" | "QUESTION" | "ANSWER_FEEDBACK" | "COMPLETE";

interface QuizState {
  phase: QuizPhase;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: QuizAnswer[];
}

type QuizAction =
  | { type: "INITIALIZE_QUIZ"; questions: QuizQuestion[] }
  | { type: "SUBMIT_ANSWER"; answer: QuizAnswer }
  | { type: "NEXT_QUESTION" }
  | { type: "COMPLETE_QUIZ" };

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
      };

    case "SUBMIT_ANSWER":
      return {
        ...state,
        phase: "ANSWER_FEEDBACK",
        answers: [...state.answers, action.answer],
      };

    case "NEXT_QUESTION":
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, phase: "COMPLETE" };
      }
      return {
        ...state,
        phase: "QUESTION",
        currentIndex: nextIndex,
      };

    case "COMPLETE_QUIZ":
      return { ...state, phase: "COMPLETE" };

    default:
      return state;
  }
}
```

### Interleaving Logic

```typescript
// apps/frontend/src/features/quiz/utils/interleaving.ts

import { QuizQuestion, QuestionMode } from "../types/QuizTypes";

const QUESTION_MODES: QuestionMode[] = ["multiple_choice", "type_pinyin", "type_character"];

/**
 * Generate interleaved questions (randomize mode per word)
 */
export function createInterleavedQuestions(words: any[]): QuizQuestion[] {
  return words.map((word) => {
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

function generateDistractors(correctWord: any, allWords: any[]): string[] {
  // Select 3 random wrong answers + correct answer
  const wrongAnswers = allWords
    .filter((w) => w.id !== correctWord.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((w) => w.english);

  // Shuffle with correct answer
  const allOptions = [...wrongAnswers, correctWord.english];
  return allOptions.sort(() => Math.random() - 0.5);
}
```

### DailyReviewTest Container

```typescript
// apps/frontend/src/features/quiz/containers/DailyReviewTest.tsx

import React, { useReducer, useEffect } from 'react';
import { quizReducer } from '../reducers/quizReducer';
import { QuizCard } from '../components/QuizCard';
import { TypeAnswerInput } from '../components/TypeAnswerInput';
import { QuizProgressBar } from '../components/QuizProgressBar';
import { createInterleavedQuestions } from '../utils/interleaving';

const MOCK_DUE_WORDS = [
  { id: '1', chinese: '你好', pinyin: 'nǐhǎo', english: 'hello' },
  { id: '2', chinese: '谢谢', pinyin: 'xièxie', english: 'thank you' },
  { id: '3', chinese: '再见', pinyin: 'zàijiàn', english: 'goodbye' }
];

export const DailyReviewTest: React.FC = () => {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  useEffect(() => {
    // Initialize with interleaved questions
    const questions = createInterleavedQuestions(MOCK_DUE_WORDS);
    dispatch({ type: 'INITIALIZE_QUIZ', questions });
  }, []);

  const handleAnswer = (userAnswer: string) => {
    const currentQuestion = state.questions[state.currentIndex];
    const correct = validateAnswer(userAnswer, currentQuestion);

    dispatch({
      type: 'SUBMIT_ANSWER',
      answer: {
        wordId: currentQuestion.wordId,
        questionType: currentQuestion.mode,
        userAnswer,
        correct,
        timestamp: new Date()
      }
    });

    // Auto-advance after 1.5 seconds
    setTimeout(() => {
      dispatch({ type: 'NEXT_QUESTION' });
    }, 1500);
  };

  const validateAnswer = (userAnswer: string, question: QuizQuestion): boolean => {
    switch (question.mode) {
      case 'multiple_choice':
        return userAnswer.toLowerCase() === question.english.toLowerCase();
      case 'type_pinyin':
        return userAnswer === question.pinyin;
      case 'type_character':
        return userAnswer === question.word;
      default:
        return false;
    }
  };

  if (state.phase === 'LOADING') {
    return <div>Loading quiz...</div>;
  }

  if (state.phase === 'COMPLETE') {
    return (
      <div>
        <h2>Quiz Complete!</h2>
        <p>Correct: {state.answers.filter(a => a.correct).length} / {state.answers.length}</p>
      </div>
    );
  }

  const currentQuestion = state.questions[state.currentIndex];

  return (
    <div>
      <QuizProgressBar current={state.currentIndex + 1} total={state.questions.length} />

      <QuizCard
        question={currentQuestion}
        mode={currentQuestion.mode}
        options={currentQuestion.options}
        onAnswer={handleAnswer}
      />

      {currentQuestion.mode !== 'multiple_choice' && (
        <TypeAnswerInput
          placeholder={currentQuestion.mode === 'type_pinyin' ? 'Type pinyin...' : 'Type character...'}
          mode={currentQuestion.mode}
          onAnswer={handleAnswer}
        />
      )}

      {state.phase === 'ANSWER_FEEDBACK' && (
        <div className="feedback">
          {state.answers[state.answers.length - 1].correct ? '✅ Correct!' : '❌ Incorrect'}
        </div>
      )}
    </div>
  );
};
```

### Progress Bar Component

```typescript
// apps/frontend/src/features/quiz/components/QuizProgressBar.tsx

import React from 'react';
import styles from './QuizProgressBar.module.css';

interface QuizProgressBarProps {
  current: number;
  total: number;
}

export const QuizProgressBar: React.FC<QuizProgressBarProps> = ({ current, total }) => {
  const percentage = (current / total) * 100;

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressText}>{current} / {total}</div>
      <div className={styles.progressBarBackground}>
        <div className={styles.progressBarFill} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};
```

## Architecture Integration

```
DailyReviewTest Container
    ↓
Initialize: createInterleavedQuestions(MOCK_WORDS)
    ↓
State machine: quizReducer manages phases
    ↓
Render: QuizCard (Story 15.5) + TypeAnswerInput (Story 15.5)
    ↓
User answers → validate → dispatch SUBMIT_ANSWER → show feedback
    ↓
Auto-advance after 1.5s → dispatch NEXT_QUESTION
    ↓
Complete: show summary with accuracy
```

---

**Related Documentation:**

- [Story 15.6 BR](../../business-requirements/epic-15-learning-retention/story-15-6-quiz-container-state.md)
- [Story 15.5 Implementation](./story-15-5-core-quiz-ui-components.md)
- [Epic 15 Implementation](./README.md)
