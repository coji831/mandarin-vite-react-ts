# Implementation 15-5: Core Quiz UI Components

## Technical Scope

Build reusable pure UI components for quiz interaction: QuizCard, TypeAnswerInput, ToneInput. Zero API coupling.

**Files Created:**

- `apps/frontend/src/features/quiz/components/QuizCard.tsx`
- `apps/frontend/src/features/quiz/components/TypeAnswerInput.tsx`
- `apps/frontend/src/features/quiz/components/ToneInput.tsx`
- `apps/frontend/src/features/quiz/components/QuizCard.module.css`
- `apps/frontend/src/features/quiz/types/QuizTypes.ts`

**Component Props:**

- All components accept `onAnswer(answer: string)` callback
- QuizCard: `{ question, mode, options?, onAnswer }`
- TypeAnswerInput: `{ placeholder, mode, onAnswer }`
- ToneInput: `{ value, onChange }` (converts ma3 → mǎ)

## Implementation Details

### QuizCard Component

```typescript
// apps/frontend/src/features/quiz/components/QuizCard.tsx

import React from 'react';
import styles from './QuizCard.module.css';

type QuestionMode = 'multiple_choice' | 'type_pinyin' | 'type_character';

interface QuizCardProps {
  question: {
    word: string;
    pinyin?: string;
    english?: string;
  };
  mode: QuestionMode;
  options?: string[]; // Required for multiple_choice mode
  onAnswer: (answer: string) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ question, mode, options, onAnswer }) => {
  const renderModeIndicator = () => {
    const labels = {
      multiple_choice: '📝 Multiple Choice',
      type_pinyin: '🔤 Type Pinyin',
      type_character: '✏️ Type Character'
    };
    return <div className={styles.modeIndicator}>{labels[mode]}</div>;
  };

  const renderQuestion = () => {
    switch (mode) {
      case 'multiple_choice':
        return (
          <div className={styles.question}>
            <h2>{question.word}</h2>
            <p className={styles.pinyin}>({question.pinyin})</p>
            <p>What does this mean?</p>
          </div>
        );
      case 'type_pinyin':
        return (
          <div className={styles.question}>
            <h2>{question.word}</h2>
            <p>Type the pinyin:</p>
          </div>
        );
      case 'type_character':
        return (
          <div className={styles.question}>
            <p className={styles.pinyin}>{question.pinyin}</p>
            <p>{question.english}</p>
            <p>Type the Chinese character:</p>
          </div>
        );
    }
  };

  const renderAnswerInput = () => {
    if (mode === 'multiple_choice' && options) {
      return (
        <div className={styles.options}>
          {options.map((option, idx) => (
            <button
              key={idx}
              className={styles.optionButton}
              onClick={() => onAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
      );
    }
    return null; // Type inputs handled by parent container
  };

  return (
    <div className={styles.quizCard}>
      {renderModeIndicator()}
      {renderQuestion()}
      {renderAnswerInput()}
    </div>
  );
};
```

### ToneInput Component with Numeric Notation Conversion

```typescript
// apps/frontend/src/features/quiz/components/ToneInput.tsx

import React, { useState, ChangeEvent } from 'react';
import styles from './ToneInput.module.css';

interface ToneInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const ToneInput: React.FC<ToneInputProps> = ({ value, onChange }) => {
  const [displayValue, setDisplayValue] = useState(value);

  const convertToneMarks = (input: string): string => {
    // ma1 → mā, hao3 → hǎo, liu2 → liú
    const toneMap = {
      'a1': 'ā', 'a2': 'á', 'a3': 'ǎ', 'a4': 'à',
      'o1': 'ō', 'o2': 'ó', 'o3': 'ǒ', 'o4': 'ò',
      'e1': 'ē', 'e2': 'é', 'e3': 'ě', 'e4': 'è',
      'i1': 'ī', 'i2': 'í', 'i3': 'ǐ', 'i4': 'ì',
      'u1': 'ū', 'u2': 'ú', 'u3': 'ǔ', 'u4': 'ù',
      'ü1': 'ǖ', 'ü2': 'ǘ', 'ü3': 'ǚ', 'ü4': 'ǜ'
    };

    let result = input.toLowerCase();

    // Replace tone numbers with marks (priority: a > o > e > i/u)
    Object.entries(toneMap).forEach(([key, value]) => {
      result = result.replace(key, value);
    });

    // Remove remaining numbers (neutral tone)
    return result.replace(/[0-9]/g, '');
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);

    // Convert and pass to parent
    const converted = convertToneMarks(raw);
    onChange(converted);
  };

  return (
    <div className={styles.toneInputContainer}>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder="Type pinyin (e.g., ma3)"
        className={styles.toneInput}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      <div className={styles.preview}>
        Preview: <strong>{convertToneMarks(displayValue)}</strong>
      </div>
    </div>
  );
};
```

### TypeAnswerInput Component

```typescript
// apps/frontend/src/features/quiz/components/TypeAnswerInput.tsx

import React, { useState, KeyboardEvent } from 'react';
import { ToneInput } from './ToneInput';
import styles from './TypeAnswerInput.module.css';

type InputMode = 'type_pinyin' | 'type_character';

interface TypeAnswerInputProps {
  placeholder: string;
  mode: InputMode;
  onAnswer: (answer: string) => void;
}

export const TypeAnswerInput: React.FC<TypeAnswerInputProps> = ({ placeholder, mode, onAnswer }) => {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return; // Prevent empty submissions

    onAnswer(trimmed.toLowerCase());
    setValue(''); // Clear after submission
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className={styles.typeAnswerContainer}>
      {mode === 'type_pinyin' ? (
        <ToneInput value={value} onChange={setValue} />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className={styles.answerInput}
          autoComplete="off"
          autoCorrect="off"
        />
      )}
      <button
        onClick={handleSubmit}
        disabled={value.trim().length === 0}
        className={styles.submitButton}
      >
        Submit
      </button>
    </div>
  );
};
```

### TypeScript Types

```typescript
// apps/frontend/src/features/quiz/types/QuizTypes.ts

export type QuestionMode = "multiple_choice" | "type_pinyin" | "type_character";

export interface QuizQuestion {
  wordId: string;
  word: string;
  pinyin: string;
  english: string;
  mode: QuestionMode;
  options?: string[]; // For multiple choice
}

export interface QuizAnswer {
  wordId: string;
  questionType: QuestionMode;
  userAnswer: string;
  correct: boolean;
  timestamp: Date;
}
```

## Architecture Integration

```
DailyReviewTest (Parent Container, Story 15.6)
    ↓
Renders QuizCard with question data
    ↓
User interacts with:
  - Multiple choice: clicks button → onAnswer('answer')
  - Type pinyin: ToneInput → converts ma3 → mǎ → submit → onAnswer('mǎ')
  - Type character: TypeAnswerInput → submit → onAnswer('你好')
    ↓
Parent validates answer & updates state
```

## Technical Challenges & Solutions

### Challenge: Tone Mark Placement Rules

**Problem:** Tone marks have priority rules (a > o > e > i/u). Simple regex replacement breaks: "liu2" should be "liú" not "lí".

**Solution:** Order replacements by vowel priority; use comprehensive tone map covering all valid combinations; validate against known pinyin syllables.

---

**Related Documentation:**

- [Story 15.5 BR](../../business-requirements/epic-15-learning-retention/story-15-5-core-quiz-ui-components.md)
- [Epic 15 Implementation](./README.md)
