---
purpose: The backend registers the four Phase-B formats from one STRATEGY_MAP, widens QuizAttemptType to nine, and persists every format by encoding onto the existing answer columns with no migration
status: completed
last-verified: 2026-10-31
type: story
---

# Story 26.6: Backend Format Contract — Four Strategies, One Registry, No Migration

**Last Updated:** October 31, 2026

## Description

**As the** platform,
**I want** the four new formats accepted and persisted by the same submit path as every existing format,
**So that** a registered learner's practice counts toward their progress without a schema change.

## Business Value

A format exists in two runtimes, and they are independent literals. The frontend decides whether
`?type=<id>` renders a session or the empty entry surface; the backend decides whether a submitted answer
can be evaluated and persisted. A format registered on one side and not the other is the worst state
available: the learner sees a question, answers it, and the submit fails — or, worse, the session renders
nothing at all because `QuizPage`'s `parse` rejects an unknown id and silently shows the entry surface.

The backend half had two structural problems beyond the missing strategies:

- **The registry was written twice.** `registry.ts` rebuilt the same five-key literal inside both
  `getStrategy` and `getRegisteredTypes`, so a strategy could be registered for lookup and absent from the
  config list (or the reverse) with no test noticing. It is now one module-level `STRATEGY_MAP`, and both
  functions derive from it.
- **`QuizAttemptType` was not the frontend's union and never had been.** It held the three gate formats
  plus the two backend-only ids (`comprehension`, `qualification`), while the FE union also carries the
  legacy aliases `audio-to-pinyin` and `audio-to-tone`. The backend is now the superset — nine ids — and
  the difference is recorded in **one** comment rather than two documents quietly disagreeing.

Persistence needed no schema change at all. `QuizAttempt.quizType` is an unconstrained `String`, and
`QuizAttemptAnswer`'s five answer columns are already NOT NULL, so each format is a **value convention on
existing columns**: cloze puts the chosen token in `pinyinInput`; sentence building puts the ordered
tokens joined by a single ASCII space; dictation puts the transcription as typed; tone judgment puts the
syllable in `pinyinInput` and the chosen tone in `selectedTone`. `category` carries the format so the
existing breakdown keeps working, and `0` is the sentinel for "not a tone answer" — which is only safe to
read because `0` is also a legal neutral tone, so a consumer must key off `category`/`quizType`.

## Acceptance Criteria

- [x] `getStrategy` and `getRegisteredTypes` read one `STRATEGY_MAP`; the four new ids are registered.
      _Verified: `apps/backend/src/modules/quiz/strategies/registry.ts` — 9 entries, both functions derive
      from the map._
- [x] `QuizAttemptType` is the backend superset of the frontend union, with the deliberate differences
      recorded once. _Verified: `apps/backend/src/modules/quiz/types/quiz.ts` — nine members plus the
      comment that names both unions and lists the BE-only and FE-only ids._
- [x] Each of the four formats generates questions from the corpus that already exists, and prefers a
      curated bank anchor when one is present, failing open to the generated path when it is not. _Verified:
      `ClozeStrategy`, `SentenceBuildingStrategy`, `ListeningDictationStrategy`, `ToneJudgmentStrategy` each
      document and implement the read path via `quizFormatFilter()`; `quiz-format-seed.test.ts` "serves the
      banked anchors through the real generators (read path)"._
- [x] Submit and complete accept the four ids with the same route status codes as every other format
      (201 / 200 / 200). _Verified: `quiz-nest.controller.test.ts` "keeps the route status codes the FE
      depends on (201 / 200 / 200)"._
- [x] The answer encoding is pinned per format, including the `0` sentinel and the neutral-tone case.
      _Verified: `services/__tests__/quiz-format-answer-encoding.test.ts` — six cases (cloze, sentence
      building ×2, dictation, tone judgment ×2)._
- [x] A registered learner's four-format answer persists to `QuizAttemptAnswer`; a guest's does not (the
      guard is untouched). _Verified: the encoding suite persists through the service; the controller guest
      cases still assert no service call._
- [x] No Prisma migration, no new column, no new enum. _Verified: the story commit touches no file under
      `apps/backend/prisma/migrations/`; `quizType` remains `String`._
- [x] Question generation is deterministic for the same input (a stable hash / seeded shuffle), so a
      re-run serves the same order. _Verified: `formatUtils.ts` exports `stableHash` / `seededShuffle`, used
      by the cloze distractor selection and the sentence-builder bank._

## Business Rules

1. **Two registries, one contract.** An id registered on only one side is an incomplete format; the
   submit path is the gate, not the render path.
2. **No migration for a format.** A new format is a strategy plus a value convention on existing columns.
3. **`0` is a value, not an absence.** Consumers key off `category` / `quizType`.
4. **The bank never stores an answer.** A bank item names an anchor and an index; the answer is read from
   the anchored row.
5. **The guest lane is untouched.** `OptionalAuthGuard` still writes zero rows.

## Related Issues

- **Epic 26: Practice Calibration** _(link to [`../epic-26-practice-calibration/README.md`](../epic-26-practice-calibration/README.md))_ (Parent)
- **Story 26.4 and 26.5** _(link to [`story-26-4-q6-cloze-q7-sentence-building.md`](story-26-4-q6-cloze-q7-sentence-building.md))_ (Siblings — the frontend halves of the same four ids)
- **Story 26.7: Curated Banks** _(link to [`story-26-7-curated-banks-seed-verification.md`](story-26-7-curated-banks-seed-verification.md))_ (Successor — seeds the anchors these strategies prefer)
- **Story 24.13: Quiz and Progression Port** _(link to [`../epic-24-nestjs-shell-migration/story-24-13-quiz-progression-circular-di.md`](../epic-24-nestjs-shell-migration/story-24-13-quiz-progression-circular-di.md))_ (Predecessor — established the Nest quiz shape and the guest mock this story extends)
- **Epic 28: Review & SRS Integrity + Comprehension** (Successor — quiz-failure review routing and the Q8 typed-answer rule)

## Implementation Status

- **Status**: Completed
- **PR**: not yet opened (epic branch `epic-26-practice-calibration` unmerged)
- **Merge Date**: pending
- **Key Commit**: `a7fa1ae1` (feat(epic-26): story-26-6 backend accepts the four Phase-B quiz formats)
