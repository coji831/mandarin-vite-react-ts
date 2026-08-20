# Implementation 21-16: Audio-to-Type Neutral Tone & Sandhi Extension

**Last Update:** July 30, 2026

> **BR Reference:** `docs/business-requirements/archive/epic-21-graded-readers/story-21-16-audio-to-type-neutral-tone-sandhi.md`

## Technical Scope

Extend the Audio-to-Type phase gate quiz with neutral tone (tone 5) support and sandhi-aware scoring logic.

**Files:**

- `packages/shared-utils/src/sandhi/toneSandhiUtils.ts` — **NEW**: shared sandhi scoring utility
- `apps/backend/src/modules/quiz/strategies/AudioToPinyinAndToneStrategy.ts` — update: add neutral-tone question generation, sandhi question flags
- `apps/frontend/src/features/quiz/engine/strategies/AudioToPinyinAndToneStrategy.ts` — update: sandhi-aware evaluateAnswer()
- `apps/backend/src/modules/quiz/services/QuizService.ts` — update: sandhi-aware submitAnswer()
- `apps/backend/prisma/schema.prisma` — update: add `metadata Json?` to QuizAttempt model
- `packages/shared-types/src/index.ts` — update: add `metadata?: { neutralToneTested: boolean; sandhiQuestions: number } | null` to QuizAttempt interface
- `apps/frontend/src/features/quiz/stores/quizSessionStore.ts` — update: track neutralToneTested/sandhiQuestions on init
- `apps/frontend/src/features/quiz/services/quizService.ts` — update: pass metadata in createQuizAttempt
- `apps/backend/src/modules/quiz/repositories/QuizRepository.ts` — update: accept metadata in createQuizAttempt
- `apps/frontend/src/features/quiz/components/PinyinToneInput.tsx` — **no change needed** (neutral-tone 0 button already exists)

## Implementation Details

### Sandhi Utility

```typescript
// packages/shared-utils/src/sandhi/toneSandhiUtils.ts
export function isSandhiAcceptable(
  expectedTone: number,
  userTone: number,
  isSandhiQuestion: boolean,
  sandhiRule?: string,
): boolean {
  if (!isSandhiQuestion) return false;
  if (userTone === expectedTone) return true;
  // 3-3 sandhi: accept tone 2 or 3
  const rule = SANSHI_RULES.find((r) => r.pattern === sandhiRule);
  if (!rule) return false;
  return rule.spokenTones.includes(userTone) && rule.dictionaryTones.includes(expectedTone);
}
```

### Backend Strategy — Neutral-Tone Question Generation

The backend `AudioToPinyinAndToneStrategy.generateQuestions()` should:

- Query `PinyinSyllable` for syllables
- If a syllable's character is in the neutral-tone particle whitelist (吗, 了, 的, 着, 过, 们, 子), set `correctTone: 0`
- Flag sandhi questions: if the question involves a known sandhi pattern, set `isSandhiQuestion: true` and `sandhiRule: "3-3"`

### Frontend Strategy — Sandhi-Aware Scoring

```typescript
evaluateAnswer(question: QuizQuestion, pinyin: string, tone: number): AnswerResult {
  const pinyinCorrect = pinyin.trim().toLowerCase() === question.correctPinyin.toLowerCase();
  const toneCorrect = tone === question.correctTone;
  const sandhiAccepted = isSandhiAcceptable(question.correctTone, tone, !!question.isSandhiQuestion, question.sandhiRule);
  const correct = pinyinCorrect && (toneCorrect || sandhiAccepted);
  // ... feedback generation ...
}
```

### QuizAttempt Metadata Flow

```
quizSessionStore.initialize()
  → compute neutralToneTested (any question with correctTone === 0)
  → compute sandhiQuestions (count of questions with isSandhiQuestion === true)
  → pass to quizService.createQuizAttempt({ ...metadata })
  → backend QuizRepository stores in QuizAttempt.metadata Json field
```

## Architecture Integration

```
[Story 21.16: Neutral Tone & Sandhi Extension]
├── Shared Utility (NEW)
│   └── packages/shared-utils/src/sandhi/toneSandhiUtils.ts — isSandhiAcceptable()
├── Backend
│   ├── AudioToPinyinAndToneStrategy — neutral-tone question gen + sandhi flags
│   └── QuizService.submitAnswer() — sandhi-aware scoring
├── Frontend
│   ├── AudioToPinyinAndToneStrategy.evaluateAnswer() — sandhi-aware scoring
│   ├── quizSessionStore — metadata tracking
│   └── quizService — pass metadata to backend
├── Database
│   └── Prisma QuizAttempt.metadata Json? — analytics persistence
└── Downstream
    └── Story 21.17 — reuses sandhi utility for dedicated sandhi quiz
```

## No UI Changes Needed

The following components require **no modifications** for this story:

- `PinyinToneInput.tsx` — neutral-tone **0** button (label "0") already exists via `TONE_BUTTONS_BASE`; tone 0 mapping already exists
- Quiz UI components (question display, feedback display) — no layout changes needed
- Storybook — no new stories needed unless `PinyinToneInput` gets a new variant in a future story

## Technical Challenges & Solutions

### Neutral tone representation (0 vs 5)

**Problem:** The neutral tone is conventionally "tone 5", but the UI tone button is labeled "0" and `correctTone` is stored as `0` for neutral particles.

**Root Cause:** The quiz model uses `0` for neutral; "5" is an internal/legacy convention.

**Solution:** Neutral-tone particles (吗, 了, 的, 着, 过, 们, 子) set `correctTone: 0`; the existing `PinyinToneInput` tone-0 button is reused (no UI change), and tone equivalence is handled internally.

### Sandhi-aware scoring without false positives

**Problem:** Accepting tone-2 for a 3-3 sandhi could wrongly pass any wrong tone-2 answer.

**Root Cause:** Blindly accepting alternate tones rewards incorrect answers on non-sandhi questions.

**Solution:** `isSandhiAcceptable()` only applies when `isSandhiQuestion` is true AND the rule's `spokenTones` contain the user tone AND its `dictionaryTones` contain the expected tone; otherwise strict equality wins.

✅ Implemented (July 30, 2026)

### Doc Truth-Check (Verify Against Code)

- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
