# Implementation 21-16: Audio-to-Type Neutral Tone & Sandhi Extension

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-16-audio-to-type-neutral-tone-sandhi.md`

## Technical Scope

Extend the Audio-to-Type quiz with neutral tone (tone 5) support and sandhi-aware scoring logic.

**Files:**

- `apps/frontend/src/features/foundations/components/AudioToTypeQuiz.tsx` — update: add tone 5 button, neutral-tone question generation, sandhi scoring
- `apps/frontend/src/features/foundations/services/audioToTypeService.ts` — update: add neutral-tone question generation, sandhi scoring logic
- `apps/frontend/src/features/foundations/services/__tests__/audioToTypeService.test.ts` — update: tests for new features
- `apps/frontend/src/features/foundations/stores/quizStore.ts` — update: extend QuizAttempt metadata with neutralToneTested/sandhiQuestions
- `apps/frontend/src/features/foundations/components/__stories__/AudioToTypeQuiz.stories.tsx` — update: stories with tone 5 UI

## Implementation Details

### Tone 5 Button

```typescript
const TONE_BUTTONS = [
  { tone: 1, label: "ˉ", color: "var(--color-tone-1)" },
  { tone: 2, label: "ˊ", color: "var(--color-tone-2)" },
  { tone: 3, label: "ˇ", color: "var(--color-tone-3)" },
  { tone: 4, label: "ˋ", color: "var(--color-tone-4)" },
  { tone: 5, label: "轻声", color: "var(--color-tone-5)" }, // NEW
];
```

### Sandhi-Aware Scoring

```typescript
function scoreAnswer(question: Question, userAnswer: number): boolean {
  // Standard tone match
  if (userAnswer === question.correctTone) return true;

  // Sandhi check: if question involves 3-3 sandhi, accept either 2 or 3
  if (question.isSandhiQuestion && question.sandhiRule === "3-3") {
    return userAnswer === 2 || userAnswer === 3;
  }

  return false;
}
```

### QuizAttempt Metadata Extension

```typescript
interface QuizAttemptMetadata {
  neutralToneTested: boolean;
  sandhiQuestions: number;
  // ...existing metadata fields
}
```

## Architecture Integration

```
[Story 21.16: Neutral Tone & Sandhi Extension]
├── Frontend — features/foundations/
│   ├── AudioToTypeQuiz — tone 5 button added to tone selector
│   ├── audioToTypeService — sandhi-aware scoring, neutral question gen
│   └── quizStore — extended metadata
└── Backend Dependency
    └── 21.3 ToneSandhiService — sandhi rules for scoring logic
```
