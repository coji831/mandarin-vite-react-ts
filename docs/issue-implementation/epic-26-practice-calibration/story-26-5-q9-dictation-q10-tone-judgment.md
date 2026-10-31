---
purpose: Dictation and tone judgment are pinned by their own suites, the store announces the strategy's authored verdict unsplit, and four page stories drive each new format end to end
status: completed
last-verified: 2026-10-31
type: implementation
---

**Last Updated:** October 31, 2026

# Implementation 26-5: Q9 Listening Dictation and Q10 Tone Judgment

> **BR Reference:** `docs/business-requirements/epic-26-practice-calibration/story-26-5-q9-dictation-q10-tone-judgment.md`
> **Epic Implementation:** [README.md](README.md)
> **Status:** Completed
> **Last Update:** October 31, 2026
> **Key Commit:** `82305f24` (feat(epic-26): story-26-5 Q9 dictation and Q10 tone judgment)

## Implementation Summary

**Attribution first.** The two view shells landed in `5b27ff9a` (26-4's commit, which created all four
surfaces). This commit supplies the proofs and the one behaviour those surfaces were missing:

1. **`DictationQuestion.test.tsx` (3 cases)** and **`ToneJudgmentQuestion.test.tsx` (2 cases)** — including
   the assertion that makes Q10's distinctness falsifiable: the rendered surface contains neither a play
   control nor an audio element.
2. **The authored-verdict announcement** — `submittedAnnouncement()` now branches on
   `AUTHORED_ANNOUNCEMENT_STRATEGIES`: for the four practice formats the strategy writes the whole sentence
   ("Incorrect. The answer is 把.") and the store announces it **unsplit**, because there is no tone number
   to phrase it from. Two store tests pin it.
3. **Four page stories** — `ClozeFormat`, `SentenceBuildingFormat`, `DictationFormat`, `ToneJudgmentFormat`
   drive each format end to end through the real store and the real page, so the page gate covers the wired
   path rather than four isolated shells.
4. **A `QuizPage` route case** — a registered id mounts a session, not the empty entry.

Q10's distinctness is the claim most likely to erode, because "tone judgment" sounds like the existing
`audio-to-tone`. The difference is the stimulus: `audio-to-tone` plays audio and asks for the tone heard;
`tone-judgment` has **no audio**, shows a written phrase with its sandhi rule, and asks for the **surface**
tone of one marked syllable. A learner who hears perfectly can fail it, which is the whole reason it is a
separate Phase-1 format.

## Technical Scope

Prove the two formats, give the store an authored-verdict branch, and cover the wired path with page stories.

**Files:**

- `apps/frontend/src/features/quiz/components/formats/__tests__/DictationQuestion.test.tsx` — **NEW**:
  3 tests.
- `apps/frontend/src/features/quiz/components/formats/__tests__/ToneJudgmentQuestion.test.tsx` — **NEW**:
  2 tests.
- `apps/frontend/src/features/quiz/stores/quizSessionStore.ts` — update: `submittedAnnouncement()` branches on
  `AUTHORED_ANNOUNCEMENT_STRATEGIES`.
- `apps/frontend/src/features/quiz/stores/__tests__/quizSessionStore.test.ts` — update: +2 cases
  ("announces the cloze verdict the strategy authored, not a tone", "announces the tone-judgment verdict in
  words").
- `apps/frontend/src/pages/practices/QuizPageFull.stories.tsx` — update: the four format stories.
- `apps/frontend/src/pages/practices/__tests__/QuizPage.test.tsx` — update: one route case.

## Implementation Details

### The verdict, authored rather than derived

```typescript
function submittedAnnouncement(
  strategyType: StrategyType,
  verdict: AnswerResult,
  question: QuizQuestion,
) {
  if (AUTHORED_ANNOUNCEMENT_STRATEGIES.has(strategyType)) return verdict.feedback;
  return verdictAnnouncement(
    verdict.correct,
    question.displayPinyin || question.correctPinyin,
    verdict.correctTone,
  );
}
```

A tone verdict can be phrased from a number ("Correct. Tone 2."). A practice verdict cannot: the answer is a
token, an ordered sentence or a transcription, so the strategy that knew the answer authors the sentence and
the store does not re-word it. That keeps one phrasing per format instead of two that can disagree.

### What each test asserts

| Test file                       | Cases | The assertion that matters                                                                                                            |
| ------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `DictationQuestion.test.tsx`    | 3     | no glyph is rendered; the replay control stays operable while playing (`aria-disabled`); the replay count reaches the accessible name |
| `ToneJudgmentQuestion.test.tsx` | 2     | **no play control and no audio element**; selecting does not grade, the commit does                                                   |
| `quizSessionStore.test.ts`      | +2    | the announced sentence is the strategy's own text, for cloze and for tone-judgment                                                    |
| `QuizPage.test.tsx`             | +1    | `?type=cloze` mounts a session, not the entry surface                                                                                 |

## Architecture Integration

```
QuizPage ── ?type=<new id> ── parse(getStrategy) ──▶ QuizSessionPage
                                                        ├── QuizRouter → QUESTION_VIEWS[id]
                                                        └── announcement ◀── store.submittedAnnouncement
                                                                              └─ authored branch
                                                                                 (4 practice formats)
QuizPageFull.stories ── ClozeFormat | SentenceBuildingFormat | DictationFormat | ToneJudgmentFormat
                        (each drives the real store end to end)
```

## Technical Challenges & Solutions

```
Problem:  "Q10 is distinct from audio-to-tone" is easy to assert in prose and easy to break by rendering a
          shared audio component "for consistency". A colour or prop assertion would not catch a play button
          appearing.
Solution: the test asserts the ABSENCE of a play control and of an audio element in the rendered surface —
          the one assertion that fails the moment someone reuses the audio primitive.
```

```
Problem:  Announcement phrasing was derived from a tone number. For a token/sentence/transcription answer
          that derivation produces a wrong sentence, and writing a second phrasing table per format would
          drift from the strategy's own feedback text.
Solution: the strategy authors the whole sentence in `AnswerResult.feedback` and the store announces it
          unsplit, selected by one shared set (`AUTHORED_ANNOUNCEMENT_STRATEGIES`) declared in
          `engine/constants.ts`.
```

## Testing Implementation

| Suite                           | Result                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| `DictationQuestion.test.tsx`    | 3 tests                                                                                    |
| `ToneJudgmentQuestion.test.tsx` | 2 tests                                                                                    |
| `quizSessionStore.test.ts`      | 6 tests at close (4 announcement classes + guest path + 2 authored-verdict cases)          |
| `QuizPage.test.tsx`             | route case: a registered id is a session                                                   |
| Storybook                       | 421 tests pass at epic close; the four format stories are collected through `QuizPageFull` |

### Doc Truth-Check

- [x] No endpoint documented — frontend only.
- [x] Names verified on disk: `DictationQuestion`, `DictationQuestionView`, `ToneJudgmentQuestion`,
      `ToneJudgmentView`, `quizSessionStore`, `QuizPageFull`.
- [x] Data source: questions arrive from `GET /v1/quiz/questions`; the Q10 stimulus is written pinyin from
      the anchored corpus row (no TTS).
- [x] Relative links resolve.
- [x] `last-verified` / Last Update = 2026-10-31.
