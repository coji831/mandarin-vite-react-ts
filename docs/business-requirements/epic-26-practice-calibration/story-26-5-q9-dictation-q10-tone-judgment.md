---
purpose: Q9 listening dictation types what it hears and Q10 tone judgment reads a written syllable and names its surface tone, as two distinct formats with four page stories
status: completed
last-verified: 2026-10-31
type: story
---

# Story 26.5: Q9 Listening Dictation and Q10 Tone Judgment

**Last Updated:** October 31, 2026

## Description

**As a** learner,
**I want** to transcribe what I hear and to state the tone a written syllable actually surfaces as,
**So that** ear training and the sandhi rules are practised as the different skills they are.

## Business Value

The two remaining Phase-B formats look alike from a distance — both are about tones — and they are not.
`audio-to-tone` is **perception from audio**: hear a syllable, name its tone. Q10 `tone-judgment` has
**no audio at all**: the learner reads a written phrase in tone-marked pinyin, sees the sandhi rule the
phrase triggers, and states the **surface** tone of one marked syllable. Different stimulus, different
corpus anchor (`ToneRule` plus a grammar example), different failure mode — a learner who hears perfectly
can still fail it, which is exactly why it is a Phase-1 format of its own rather than an `audio-to-tone`
sub-mode.

Q9 `listening-dictation` is the opposite discipline: audio plays on demand, and the learner produces the
transcription. Two details decide whether it is usable for a real Mandarin learner:

- **The glyph is never printed.** A dictation question whose character is visible is a reading exercise.
  The strategy declares `promptGlyph: "hide"`, so the view has no character slot at all.
- **Enter must not submit a half-composed IME string.** A learner typing pinyin through an input method
  presses Enter to commit the candidate; without a composition guard, that keystroke submits the
  half-typed word. `keyGuard.ts` is shared with the other typed surfaces for exactly this.

The story also closes the page gate: four page-level stories drive each new format end to end through the
real store, so the gate covers the wired path rather than four isolated shells.

## Acceptance Criteria

- [x] Q10 is a distinct Phase-1 format: written stimulus, rule badge, base tones shown, surface tone asked,
      and **no audio**. _Verified: `ToneJudgmentView` (props include syllable list with `baseTone` /
      `surfaceTone`, `ruleId`, question text); `ToneJudgmentQuestion.test.tsx` asserts the rendered surface
      contains neither a play control nor an audio element; `PHASE_CONFIGS[1]` lists `tone-judgment` beside
      `audio-to-pinyin-tone`._
- [x] Q10 grades the **surface** tone, not the dictionary tone, and neutral `0` is a real answer. _Verified:
      `practiceFormatStrategies.test.ts` "grades the surface tone, not the dictionary tone"; BE
      `quiz-format-answer-encoding.test.ts` "tone-judgment → neutral 0 is a real tone answer, and 0 vs 2 is
      wrong"._
- [x] Q10 uses one composite single-select (one tab stop, arrow keys, digits 0–4, Enter commits) and shows
      the whole-phrase surface-tone reveal on both outcomes. _Verified: `ToneJudgmentView` reuses
      `RadioGroup` + `Badge` + `Box variant="pass"|"fail"`; `ToneJudgmentOutcome` carries
      `chosenLabel`/`answerLabel`/phrase sequence._
- [x] Q9 never autoplays, prints no glyph, accepts tone digits, and offers a replay control whose accessible
      name carries the replay count. _Verified: `DictationQuestionView` props (`instruction`, `fieldLabel`,
      `answer`, `onReplay`, `replaying`/`playing`, `replayCount`), reuse of `Input` + `Button(icon)`; no
      character slot exists in the view. **Attribution note:** the view shell landed in `5b27ff9a` (26-4's
      commit, which created all four shells); the test that pins it landed in `82305f24`._
- [x] Q9's replay and in-flight states stay operable: `aria-disabled` plus an early return, never the
      `disabled` attribute, so the control that was just activated keeps focus. _Verified:
      `DictationQuestionView` header contract and the `Button` `aria-disabled` prop added in story 26.2;
      `DictationQuestion.test.tsx` covers the guard and the replay count._
- [x] Enter is guarded against IME composition on both typed surfaces. _Verified: `formats/keyGuard.ts`
      (`isComposingKey`), used by `DictationQuestionView`, `ClozeQuestionView` and `ToneJudgmentView`._
- [x] Both formats render all 12 states as stories; dictation carries one extra story for a failed
      generation, so the set is 13 there. _Verified: `ToneJudgmentView.stories.tsx` 12 exports;
      `DictationQuestionView.stories.tsx` 13 exports (the 12 plus `ErrorGeneration`)._
- [x] Four page-level stories drive each new format end to end. _Verified: `QuizPageFull.stories.tsx`
      `ClozeFormat`, `SentenceBuildingFormat`, `DictationFormat`, `ToneJudgmentFormat`._
- [x] Both formats grade on explicit commit and announce through the session's single status region; the
      store announces the strategy's authored verdict unsplit. _Verified: the authored-verdict branch in
      `quizSessionStore.submittedAnnouncement`; `quizSessionStore.test.ts` "announces the cloze verdict the
      strategy authored, not a tone" and "announces the tone-judgment verdict in words"._

## Business Rules

1. **A format is defined by its stimulus.** Written sandhi judgement and audio perception are two formats,
   even when both ask for a tone number.
2. **The glyph is hidden when it is the answer.** Dictation shows no character.
3. **Audio plays on demand only.** No autoplay, and a blocked playback is an inline retry, not a page
   error.
4. **Typed answers respect composition.** Enter inside an IME composition must not submit.
5. **`0` is a tone.** Neutral tone is a legal answer; nothing may treat `0` as "no answer".

## Related Issues

- **Epic 26: Practice Calibration** _(link to [`../epic-26-practice-calibration/README.md`](../epic-26-practice-calibration/README.md))_ (Parent)
- **Story 26.4: Q6/Q7** _(link to [`story-26-4-q6-cloze-q7-sentence-building.md`](story-26-4-q6-cloze-q7-sentence-building.md))_ (Predecessor — established `QUESTION_VIEWS` and the single-select group this story reuses)
- **Story 26.6: Backend Format Contract** _(link to [`story-26-6-backend-format-contract.md`](story-26-6-backend-format-contract.md))_ (Sibling — the backend strategies these views submit to)
- **Story 26.7: Curated Banks** _(link to [`story-26-7-curated-banks-seed-verification.md`](story-26-7-curated-banks-seed-verification.md))_ (Successor — the anchors these formats read)

## Implementation Status

- **Status**: Completed
- **PR**: not yet opened (epic branch `epic-26-practice-calibration` unmerged)
- **Merge Date**: pending
- **Key Commit**: `82305f24` (feat(epic-26): story-26-5 Q9 dictation and Q10 tone judgment) — the two unit
  suites, the authored-verdict announcement branch and the four page stories; the two view shells are
  `5b27ff9a` (26-4), recorded in the
  [implementation](../../issue-implementation/epic-26-practice-calibration/story-26-5-q9-dictation-q10-tone-judgment.md)
