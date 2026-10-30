---
purpose: One dispatch map replaces the duplicated single-select set, and Q6 cloze plus Q7 sentence building render, grade on explicit commit, and announce through the session region
status: completed
last-verified: 2026-10-31
type: story
---

# Story 26.4: Q6 Cloze and Q7 Sentence Building

**Last Updated:** October 31, 2026

## Description

**As a** Phase-3 learner,
**I want** to fill a blank in a real sentence and to assemble one from its words,
**So that** grammar practice tests production rather than recognition.

## Business Value

Phase 3 ("The Network — Reading & Grammar") had no quiz to sit. Q6 cloze and Q7 sentence building are
its two formats, and both are anchored to grammar examples that already exist in the corpus, so the
question is a real sentence rather than generated filler.

The story could not be only two views, because the dispatch beneath them was broken. `QuizRouter` chose
the question surface with an if-chain over a `MULTIPLE_CHOICE_STRATEGIES` set that was declared **twice**
— once in `QuizRouter`, once in `FeedbackView` — and both copies contained exactly `["radical-gate"]`.
Adding two single-select formats to that arrangement would have silently routed a cloze question through
the pinyin `QuestionView`: audio playback plus a typed-pinyin field for a format that has no audio. The
dispatch is now one `Record<StrategyType, ComponentType>` over a closed union, so a format cannot be
added without naming its view.

The other contract the story establishes is that **selecting never grades**. A radio group's `onChange`
only reports the choice; the commit is an explicit Submit / Enter. A keyboard user arrowing through four
options must not be graded for passing over them (WCAG 3.2.2). The same applies to the sentence builder:
placing a token is not an answer, and "Check" is the commit.

## Acceptance Criteria

- [x] One dispatch map, keyed by the closed `StrategyType` union, replaces both `MULTIPLE_CHOICE_STRATEGIES`
      copies; `SELECT_ONE_STRATEGIES` (`radical-gate`, `cloze`, `tone-judgment`) is declared once in
      `engine/constants.ts` and `FeedbackView` reads it. _Verified: `components/questionViews.ts`
      (`QUESTION_VIEWS`, 9 keys) and `engine/constants.ts`; `formatDispatch.test.tsx` "names a view for every
      strategy id in the union"._
- [x] `?type=cloze` and `?type=sentence-building` mount their own surface, never the pinyin one, and a
      registered id turns the route into a session rather than the empty entry. _Verified:
      `formatDispatch.test.tsx` "routes a cloze session to the cloze view, never the pinyin one" and "routes
      sentence-building to the builder"; the four FE strategies are registered in
      `engine/strategies/quizStrategyRegistry.ts`; `practiceFormatStrategies.test.ts` covers registration and
      `QuizPage.test.tsx` adds the route case._
- [x] Q6 renders the pattern context, the sentence with a dashed blank, the gloss and the option list,
      with no audio. _Verified: `ClozeQuestionView` (props `patternName`, `gloss`, sentence segments,
      `SelectOption[]`), reusing `Box variant="dashed"`, `RadioGroup`, `Badge`, `Icon`, `EmptyState`,
      `ErrorScreen`._
- [x] Q6 grades only on explicit commit and renders pass/fail with the token echoed and the correct token
      shown on fail. _Verified: `ClozeQuestionView` radio `onChange` reports only; `ClozeQuestion.tsx` wires
      the commit to `submitAnswer`; `ClozeQuestionView.stories.tsx` carries all 12 states._
- [x] Q7 is tap-to-place and keyboard-first, with **no drag path**: Enter appends from the bank, and
      explicit `Move left` / `Move right` / `Remove` icon buttons express order. _Verified:
      `SentenceBuilderView` props `onAppend`/`onRemove`/`onMove`/`onReset` and the comment stating drag is
      neither implemented nor a fallback; `SentenceBuilderQuestion.test.tsx` covers the keyboard path._
- [x] Q7's wrong-order feedback shows the canonical token row, and the announcement says what happened
      ("Added 我, position 1 of 4."). _Verified: `SentenceBuilderOutcome.canonical` rendered under the answer
      row on fail; `SentenceBuilderQuestion.tsx` calls the store's `announce()` on add and remove; the
      strategy's authored verdict is announced unsplit (`AUTHORED_ANNOUNCEMENT_STRATEGIES`)._
- [x] Both formats render all 12 states as stories and reuse only existing registry primitives. _Verified:
      `ClozeQuestionView.stories.tsx` 12 exports (default, hover, focus-visible, active, selected, disabled,
      submitting, pass, fail, empty, error, edge); `SentenceBuilderView.stories.tsx` 12 exports of the same
      names. Measurement (b) in the verification artifact._
- [x] No live region is added in either view; the verdict travels through the session's single status
      region. _Verified: both view headers state it and neither renders `role="status"`; measurement (e)._

## Business Rules

1. **Selecting is not answering.** Grading happens on an explicit commit only.
2. **No pointer-only path.** Every interaction is reachable with Tab and Enter/Space; drag is not
   implemented and is not a fallback (WCAG 2.1.1 / 2.5.7).
3. **The commit is the primary.** The per-question commit sits at the bottom of the task card and is the
   only saturated fill in the viewport.
4. **The glyph is a prompt here.** Both formats show the sentence (`promptGlyph: "show"`) — unlike the
   audio formats, where the glyph is the answer.
5. **A format is not a system primitive.** A sortable list is a format, not a shared component; if a
   future epic needs one it lands there with an ADR.

## Related Issues

- **Epic 26: Practice Calibration** _(link to [`../epic-26-practice-calibration/README.md`](../epic-26-practice-calibration/README.md))_ (Parent)
- **Story 26.1: Engine Truth** _(link to [`story-26-1-engine-phase-truth.md`](story-26-1-engine-phase-truth.md))_ (Predecessor — added `PHASE_CONFIGS[3]` with these two ids)
- **Story 26.2: Completion Slot** _(link to [`story-26-2-completion-slot-position-locked-cta.md`](story-26-2-completion-slot-position-locked-cta.md))_ (Predecessor — the completion region these sessions end in)
- **Story 26.5: Q9 Dictation and Q10 Tone Judgment** _(link to [`story-26-5-q9-dictation-q10-tone-judgment.md`](story-26-5-q9-dictation-q10-tone-judgment.md))_ (Successor — reuses this dispatch map and the single-select group)
- **Story 26.6 and 26.7** _(link to [`story-26-6-backend-format-contract.md`](story-26-6-backend-format-contract.md))_ (Siblings — the backend registry and the curated banks these views consume)

## Implementation Status

- **Status**: Completed
- **PR**: not yet opened (epic branch `epic-26-practice-calibration` unmerged)
- **Merge Date**: pending
- **Key Commit**: `5b27ff9a` (feat(epic-26): story-26-4 dispatch map and the Q6/Q7 practice formats) — also
  creates all four format view shells, so 26-5's dictation and tone-judgment views share this commit; see
  the [implementation](../../issue-implementation/epic-26-practice-calibration/story-26-4-q6-cloze-q7-sentence-building.md)
