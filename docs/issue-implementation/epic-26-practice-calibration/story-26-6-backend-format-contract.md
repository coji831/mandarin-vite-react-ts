---
purpose: Four backend strategies generated from the corpus, one STRATEGY_MAP behind both registry functions, QuizAttemptType widened to nine, and persistence as a value convention on the existing answer columns
status: completed
last-verified: 2026-10-31
type: implementation
---

**Last Updated:** October 31, 2026

# Implementation 26-6: Backend Format Contract — Four Strategies, One Registry, No Migration

> **BR Reference:** `docs/business-requirements/epic-26-practice-calibration/story-26-6-backend-format-contract.md`
> **Epic Implementation:** [README.md](README.md)
> **Status:** Completed
> **Last Update:** October 31, 2026
> **Key Commit:** `a7fa1ae1` (feat(epic-26): story-26-6 backend accepts the four Phase-B quiz formats)

## Implementation Summary

Four new strategies, one registry literal instead of two, a widened `QuizAttemptType`, and **no migration**.

- **The strategy registry was written twice.** `registry.ts` rebuilt the same five-key literal inside
  `getStrategy` and again inside `getRegisteredTypes`. Both now read one module-level `STRATEGY_MAP` with
  nine entries (insertion order is config order), so a strategy cannot be findable but unlisted, or listed
  but unloadable.
- **`QuizAttemptType` is now the superset of both runtimes** — nine ids — with the deliberate differences
  recorded in one comment: `comprehension` and `qualification` are backend-only, `audio-to-pinyin` and
  `audio-to-tone` are frontend-only legacy aliases. `quizType` therefore stays a pass-through `String`:
  rejecting an unknown type at the route would break those aliases.
- **Each strategy derives its questions from the corpus that already exists.** Cloze blanks one segment of a
  `GrammarExample` and draws distractors of the _same character length_ from other patterns' examples;
  sentence building shuffles the example's segments with a seeded shuffle and shows only the English gloss;
  dictation asks for a `Character`'s primary reading in tone-marked pinyin with `promptGlyph: "hide"`;
  tone judgment reads a written phrase and derives the surface tone from the labelled segments, falling
  back to `TonePair` (the only row that stores a surface tone beside the dictionary tone) and then to
  `PinyinSyllable`.
- **Persistence is a value convention.** No column, no enum, no new table. `quizType` is already a `String`
  and the five answer columns are already NOT NULL, so the encoding is the contract.

## Technical Scope

Register four strategies, fold the duplicated registry literal, widen the attempt union, and pin the answer
encoding per format.

**Files:**

- `apps/backend/src/modules/quiz/strategies/ClozeStrategy.ts` — **NEW**: 233 lines.
- `apps/backend/src/modules/quiz/strategies/SentenceBuildingStrategy.ts` — **NEW**: 133 lines.
- `apps/backend/src/modules/quiz/strategies/ListeningDictationStrategy.ts` — **NEW**: 132 lines.
- `apps/backend/src/modules/quiz/strategies/ToneJudgmentStrategy.ts` — **NEW**: 278 lines.
- `apps/backend/src/modules/quiz/strategies/formatUtils.ts` — **NEW**: `FORMAT_QUIZ_DEFAULTS`,
  `parseGrammarSegments`, `stableHash`, `seededShuffle`, `tokenLength`.
- `apps/backend/src/modules/quiz/strategies/quizFormatBank.ts` — **NEW**: the bank contract,
  `QUIZ_FORMAT_METADATA_KEY = "quizFormats"`, `quizFormatFilter()`.
- `apps/backend/src/modules/quiz/strategies/registry.ts` — update: one `STRATEGY_MAP`, both functions derive.
- `apps/backend/src/modules/quiz/strategies/index.ts` — update: export the four strategies.
- `apps/backend/src/modules/quiz/types/quiz.ts` — update: `QuizAttemptType` widened to 9 + the union note.
- `apps/backend/src/modules/quiz/nest/quiz-nest.controller.ts` — update: route/status documentation for the
  four ids (the guest branch is unchanged).
- `apps/backend/src/modules/quiz/strategies/__tests__/{ClozeStrategy,SentenceBuildingStrategy,ListeningDictationStrategy,ToneJudgmentStrategy}.test.ts`
  — **NEW**: 8 + 7 + 6 + 8 = 29 tests.
- `apps/backend/src/modules/quiz/services/__tests__/quiz-format-answer-encoding.test.ts` — **NEW**: 6 tests.
- `apps/backend/src/modules/quiz/nest/__tests__/quiz-nest.controller.test.ts` — update: an "Epic 26 practice
  formats — AC4" block asserting the 201/200/200 status codes are unchanged.
- `apps/backend/src/nest/guards/__tests__/optional-auth-coverage.test.ts` — update: four
  `OPTIONAL_USER_ID_SIGNATURES` rows for the new generators, each dispositioned
  `guest-safe-no-user-scope` with a live asserted source line (the `_userId` parameter is accepted to
  satisfy `QuizStrategy.generateQuestions` and never read). No new route, so the 15-route inventory is
  unchanged.
- `apps/backend/tests/integration/nest/quiz-progression-parity.test.ts` — update: parity across the
  widened set.

## Implementation Details

### The encoding table, as the tests pin it

| Format                | `pinyinInput`                       | `selectedTone`  | `correctPinyin`               | `correctTone`         | `category`          |
| --------------------- | ----------------------------------- | --------------- | ----------------------------- | --------------------- | ------------------- |
| `cloze`               | the filled token                    | `0` (sentinel)  | expected token                | `0`                   | `cloze`             |
| `sentence-building`   | ordered tokens, **one ASCII space** | `0`             | canonical order, same join    | `0`                   | `sentence-building` |
| `listening-dictation` | the transcription as typed          | `0`             | expected pinyin (tone-marked) | `0`                   | `dictation`         |
| `tone-judgment`       | the syllable judged                 | chosen tone 0–4 | correct syllable              | expected surface tone | `tone-judgment`     |

Two consequences are load-bearing and are asserted rather than described: `0` is **both** the "not a tone
answer" sentinel **and** the legal neutral tone, so a consumer keying off `tone === 0` is wrong and must key
off `category`/`quizType`; and `sentence-building` grades whitespace-tolerantly (the canonical join is one
ASCII space, the comparison normalises it).

### One registry, two functions

```typescript
const STRATEGY_MAP: Record<string, QuizStrategy> = {
  "audio-to-pinyin-tone": audioToPinyinAndToneStrategy,
  "ime-simulator": imeSimulatorStrategy,
  "radical-gate": radicalGateStrategy,
  comprehension: comprehensionQuizStrategy,
  qualification: qualificationQuizStrategy,
  cloze: clozeStrategy,
  "sentence-building": sentenceBuildingStrategy,
  "listening-dictation": listeningDictationStrategy,
  "tone-judgment": toneJudgmentStrategy,
};
```

`getStrategy` is `STRATEGY_MAP[type] ?? null`; `getRegisteredTypes()` is `Object.keys(STRATEGY_MAP)` — so the
config list and the lookup cannot disagree, and insertion order is the order `/v1/quiz/config` returns.

### Bank preference without a runtime JSON read

```typescript
// quizFormatBank.ts — the read path contract
export function quizFormatFilter(format: string) {
  return { metadata: { path: [QUIZ_FORMAT_METADATA_KEY], array_contains: [{ format }] } };
}
```

Each strategy queries anchors carrying `metadata.quizFormats[]` for its own format first — those rows are
what the seed wrote (story 26-7) — and falls open to the generated corpus path when the bank is absent or
yields nothing. The bank file itself is never read at request time.

## Architecture Integration

```
POST /v1/quiz/attempts            ─┐
POST /v1/quiz/attempts/:id/answers ─┼─ OptionalAuthGuard ─ guest: mock, 0 rows
PUT  /v1/quiz/attempts/:id/complete┘                     └ registered: QuizService → Prisma
                                                                    │
GET /v1/quiz/config ── getRegisteredTypes() ── STRATEGY_MAP ────────┤
GET /v1/quiz/questions ── getStrategy(type).generateQuestions()     │
                                  ├─ quizFormatFilter (banked anchors, preferred)
                                  └─ generated corpus (GrammarExample | Character | TonePair | PinyinSyllable)

QuizAttempt.quizType         String  ── the four ids persist as-is (no enum)
QuizAttemptAnswer            the five existing columns carry the encoded answer
```

## Technical Challenges & Solutions

```
Problem:  `QuizAttemptType` and the FE `StrategyType` were never equal, and both files looked authoritative.
          Making them "match" would require either BE strategies for two FE aliases that must never create an
          attempt, or dropping two BE-only ids that the comprehension/qualification paths rely on.
Solution: declare the backend the superset of nine and record both unions plus the deliberate differences in
          ONE comment in `types/quiz.ts`. `quizType` stays a pass-through String, which is also why the route
          cannot validate it without breaking the aliases.
```

```
Problem:  A NOT NULL tone column plus formats with no tone needs a sentinel, and the obvious one (`0`) is
          also a real answer (neutral tone). A reader cannot distinguish "no tone" from "neutral".
Solution: `category`/`quizType` carries the format, so the sentinel is only ever read in context; the
          encoding suite asserts both readings explicitly, including "neutral 0 is a real tone answer, and
          0 vs 2 is wrong".
```

```
Problem:  Cloze distractors that differ in length from the blank give the answer away (and read as noise).
Solution: `tokenLength()` + `stableHash()` in `formatUtils.ts`: distractors are drawn from segments of the
          same character length in other patterns' examples, and selection is deterministic, so the same
          blank yields the same options on every run.
```

## Testing Implementation

| Suite                                 | Result                                                                                                                            |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Backend quiz unit (targeted)          | `npx vitest run src/modules/quiz` → **12 files / 118 tests pass**                                                                 |
| Four strategy suites                  | 29 tests (8 cloze, 7 sentence building, 6 dictation, 8 tone judgment)                                                             |
| `quiz-format-answer-encoding.test.ts` | 6 tests, one per encoding row + the neutral-tone case                                                                             |
| Controller suite                      | guest mock cases + the AC4 status-code block                                                                                      |
| Quiz/progression parity (integration) | `npx vitest run tests/integration/nest/quiz-progression-parity.test.ts --config vitest.integration.config.ts` → **41 tests pass** |
| Backend full unit suite (epic close)  | 60 files / 689 tests pass                                                                                                         |
| Backend type-check                    | `tsc --noEmit` → exit 0                                                                                                           |

### Doc Truth-Check

- [x] Routes match `ROUTE_PATTERNS`: `quizAttempts: "/v1/quiz/attempts"`, `quizAttemptAnswer(id)`,
      `quizAttemptComplete(id)`, `quizConfig: "/v1/quiz/config"`, `quizQuestions: "/v1/quiz/questions"`.
      Module named `quiz` exists under `apps/backend/src/modules/`.
- [x] Data source verified in the strategies: Prisma reads of `GrammarExample`, `Character`, `TonePair`,
      `PinyinSyllable` — no runtime JSON read.
- [x] No migration added; `prisma/migrations/` is untouched by this commit.
- [x] Relative links resolve.
- [x] `last-verified` / Last Update = 2026-10-31.
