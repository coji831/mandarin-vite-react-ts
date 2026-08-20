# Implementation 21-17: Tone Sandhi Practice Quiz

> **BR Reference:** `docs/business-requirements/archive/epic-21-graded-readers/story-21-17-tone-sandhi-practice-quiz.md`

## Technical Scope

Create a backend SandhiDrillService that generates sandhi drill questions from the database word bank, served via a dedicated API endpoint. Results are posted to the existing quiz attempts endpoint with `quizType: "sandhi-drill"`. Extends `@mandarin/shared-utils` with bu/yi sandhi rules. Frontend provides the SandhiDrill widget embedded in TonesTab.

**Files:**

| Action | File                                                                                     |
| ------ | ---------------------------------------------------------------------------------------- |
| MODIFY | `packages/shared-utils/src/sandhi/toneSandhiUtils.ts`                                    |
| MODIFY | `packages/shared-utils/src/sandhi/__tests__/toneSandhiUtils.test.ts`                     |
| CREATE | `apps/backend/src/modules/quiz/strategies/SandhiDrillService.ts`                         |
| CREATE | `apps/backend/src/modules/quiz/strategies/__tests__/SandhiDrillService.test.ts`          |
| CREATE | `apps/backend/src/modules/quiz/api/SandhiDrillController.ts`                             |
| MODIFY | `apps/backend/src/modules/quiz/api/quizRoutes.ts`                                        |
| MODIFY | `packages/shared-constants/src/index.js`                                                 |
| CREATE | `apps/frontend/src/features/foundations/services/sandhiDrillService.ts`                  |
| CREATE | `apps/frontend/src/features/foundations/components/tones/SandhiDrill.tsx`                |
| CREATE | `apps/frontend/src/features/foundations/components/tones/SandhiDrill.css`                |
| CREATE | `apps/frontend/src/features/foundations/components/tones/__tests__/SandhiDrill.test.tsx` |
| CREATE | `apps/frontend/src/features/foundations/services/__tests__/sandhiDrillService.test.ts`   |
| MODIFY | `apps/frontend/src/mocks/handlers/quiz-handlers.ts`                                      |
| MODIFY | `apps/frontend/src/features/foundations/components/index.ts`                             |
| MODIFY | `apps/frontend/src/features/foundations/index.ts`                                        |
| MODIFY | `apps/frontend/src/pages/learn/foundations/TonesTab.tsx`                                 |

## Architecture Decisions

### Drill Widget Pattern (NOT full quiz strategy)

- **NOT registered** in the strategy registry (`registry.ts`).
- Has its own `<SandhiDrillController>` and route `GET /v1/quiz/sandhi-drill/questions?count=10`.
- Results are posted to the **existing** `POST /v1/quiz/attempts` with `quizType: "sandhi-drill"`.
- No Prisma schema changes needed — `QuizAttempt.quizType` is `String`, not an enum.

### Backend as Source of Truth

- `SandhiDrillService` queries the database (`Word` + `WordCharacter` + `Character` + `CharacterReading`) for 2-character words matching sandhi patterns.
- Generates 4 multiple-choice pinyin options per question (sandhi form + dictionary form + 2 distractors).
- Questions are distributed proportionally across all 4 sandhi rules.

## Implementation Details

### 1. shared-utils: `toneSandhiUtils.ts`

Extended `isSandhiAcceptable()` with 3 new sandhi rules:

- `"bu-before-4th"`: `bù` (tone 4) before 4th tone → `bú` (tone 2) — accepts `correctTone=4, selectedTone=2`
- `"yi-before-4th"`: `yī` (tone 1) before 4th tone → `yí` (tone 2) — accepts `correctTone=1, selectedTone=2`
- `"yi-before-non4th"`: `yī` (tone 1) before non-4th → `yì` (tone 4) — accepts `correctTone=1, selectedTone=4`

Also added `applyToneMark(pinyin: string, tone: number): string` helper to convert plain pinyin + tone number to pretty pinyin with tone marks.

### 2. Backend: `SandhiDrillService`

```typescript
interface DrillQuestion {
  id: string;
  characters: string; // e.g. "你好"
  dictionaryPinyin: string; // e.g. "nǐ hǎo"
  correctAnswer: string; // sandhi form, e.g. "ní hǎo"
  ruleId: string; // "3-3-sandhi" | "bu-before-4th" | "yi-before-4th" | "yi-before-non4th"
  options: string[]; // 4 shuffled pinyin options
}
```

**Question generation process:**

1. Query `Word` table for all words with `simplified` not null
2. Filter to exactly 2-character words via `WordCharacter` (sequenceOrder 0, 1)
3. Get individual character pinyin and tones via `CharacterReading` (primary reading)
4. Classify candidates into 4 sandhi rule buckets based on tone patterns
5. Round-robin across buckets for proportional distribution
6. Generate 4 options per question (correct sandhi form + dictionary form + 2 plausible distractors)
7. Shuffle and return

### 3. Backend: `SandhiDrillController`

- `GET /v1/quiz/sandhi-drill/questions?count=10` — returns `DrillQuestion[]`
- Clamps count between 5 and 25
- Error responses follow `backend-error-messages.instructions.md` format

### 4. Route

Added to `apps/backend/src/modules/quiz/api/quizRoutes.ts`:

```typescript
router.get(
  "/v1/quiz/sandhi-drill/questions",
  optionalAuth,
  asyncHandler((req, res) => sandhiDrillController.getQuestions(req, res)),
);
```

### 5. QuizService

No changes needed — `createQuizAttempt` already accepts any string `quizType` and stores `metadata` as JSON. `"sandhi-drill"` works without modification.

## Architecture Integration

```
[Story 21.17: Tone Sandhi Practice Quiz]
├── Backend — modules/quiz/
│   ├── SandhiDrillService (strategies/) — question generation engine
│   ├── SandhiDrillController (api/) — HTTP endpoint
│   └── quizRoutes — route registration
├── Shared — packages/shared-utils/
│   └── toneSandhiUtils — extended with bu/yi sandhi rules + applyToneMark
└── Dependencies
    ├── Prisma models: Word, WordCharacter, Character, CharacterReading
    └── 21.16 isSandhiAcceptable — tone-level sandhi validation reused
```

### Frontend — SandhiDrill Component

The SandhiDrill component lives in `apps/frontend/src/features/foundations/components/tones/SandhiDrill.tsx` and manages 5 distinct states:

1. **Rules (intro)** — Displays rule explanation cards for the 4 sandhi patterns (3-3 sandhi, bu-before-4th, yi-before-4th, yi-before-non4th) with examples. The learner reviews before starting the drill.
2. **Drill (active)** — Renders a 10-question multiple-choice drill. Each question shows characters and dictionary pinyin; the learner selects the correct spoken (sandhi) pinyin from 4 options. Tracks progress (question X of 10) and current score.
3. **Results (complete)** — After all 10 questions, shows the final score (e.g., "8/10"), pass/fail status (≥70% passing threshold defined as a local constant), option to retry, and rule-specific breakdown.
4. **Loading** — Shows `LoadingScreen` while fetching questions from `GET /v1/quiz/sandhi-drill/questions?count=10`.
5. **Error** — Shows `ErrorScreen` with retry button if the API call fails.

Component delegates data fetching to `sandhiDrillService.ts` (service layer pattern) and posts results via `submitSandhiDrillAttempt()` to the existing `POST /v1/quiz/attempts` endpoint with `quizType: "sandhi-drill"`.

## Verification

- `packages/shared-utils`: 31 tests pass (17 existing + 14 new)
- `apps/backend` quiz module: 17 tests pass (9 existing + 8 new)
- `npx tsc --noEmit`: 0 errors
- Pre-existing `RadicalCharacterService` test failures are unrelated and unchanged

## Technical Challenges & Solutions

### Sandhi drill as a non-registry exception

**Problem:** The drill is a "quiz" but must NOT be registered as a quiz strategy (no `StrategyType` union, no quiz page routing).

**Root Cause:** It's a standalone micro-widget embedded in `TonesTab`, not a full quiz mode.

**Solution:** Kept it out of the strategy registry with its own `SandhiDrillController` + `GET /v1/quiz/sandhi-drill/questions?count=10` route; results are posted to the existing `POST /v1/quiz/attempts` with `quizType: "sandhi-drill"` (a plain `String` — no enum, no schema change).

### Question generation from the DB word bank

**Problem:** Building 10 balanced multiple-choice sandhi questions from real vocabulary.

**Root Cause:** Questions need genuine 2-character words that exhibit the 4 sandhi rules.

**Solution:** `SandhiDrillService` queries `Word` + `WordCharacter` + `Character` + `CharacterReading`, filters to 2-character words, buckets candidates by tone pattern into the 4 sandhi rules, distributes round-robin, and generates 4 options (sandhi form + dictionary form + 2 distractors).

### Doc Truth-Check (Verify Against Code)

- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
