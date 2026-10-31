---
purpose: One QUESTION_VIEWS dispatch map replaces the duplicated single-select set, the four FE strategies register, and the cloze and sentence-building surfaces grade only on explicit commit
status: completed
last-verified: 2026-10-31
type: implementation
---

**Last Updated:** October 31, 2026

# Implementation 26-4: Q6 Cloze and Q7 Sentence Building

> **BR Reference:** `docs/business-requirements/epic-26-practice-calibration/story-26-4-q6-cloze-q7-sentence-building.md`
> **Epic Implementation:** [README.md](README.md)
> **Status:** Completed
> **Last Update:** October 31, 2026
> **Key Commit:** `5b27ff9a` (feat(epic-26): story-26-4 dispatch map and the Q6/Q7 practice formats)

## Implementation Summary

This commit is larger than its title. It ships the dispatch contract and **all four** format view shells —
cloze, sentence builder, dictation and tone judgment — with their CSS, their stories and their store
wrappers. Story 26.5 then supplied the dictation and tone-judgment _tests_, the authored-verdict
announcement and the four page stories. The reason is structural rather than stylistic: the four views
share the option/token primitives and the 12-state vocabulary, so building two and adding two later would
have re-derived the same surfaces from a slightly different template.

What this commit settles:

- **Dispatch is total.** `QUESTION_VIEWS: Record<StrategyType, ComponentType>` (9 keys) replaces `QuizRouter`'s
  if-chain and both copies of `MULTIPLE_CHOICE_STRATEGIES`. A format's view is now a required member of a
  closed record, so adding a `StrategyType` without naming a view fails to compile.
- **`SELECT_ONE_STRATEGIES` is declared once** in `engine/constants.ts` (`radical-gate`, `cloze`,
  `tone-judgment`) and read by both the router-side decisions and `FeedbackView`. So is
  `AUTHORED_ANNOUNCEMENT_STRATEGIES` (the four new formats), whose verdict sentence is written by the
  strategy rather than derived from a tone number.
- **The four FE strategies register**, which is the switch that makes `?type=<id>` a session instead of the
  empty entry surface (`QuizPage`'s `parse` validates against `getStrategy`).
- **Selecting never grades.** Both new surfaces report a choice and commit explicitly; a radio `onChange`
  never submits. The per-question commit is the view's primary at the bottom of the task card.
- **Q7 has no drag path at all.** Enter appends from the bank; `Move left` / `Move right` / `Remove` icon
  buttons carry the accessible names. Drag is neither implemented nor a fallback, because a pointer-only
  assembly step would fail WCAG 2.1.1 / 2.5.7.

## Technical Scope

Replace the dispatch, centralise the two shared sets, register four strategies, and build the four format
surfaces with their stories.

**Files:**

- `apps/frontend/src/features/quiz/components/questionViews.ts` — **NEW**: `QUESTION_VIEWS`.
- `apps/frontend/src/features/quiz/components/QuizRouter.tsx` — update: renders `QUESTION_VIEWS[strategyType]`.
- `apps/frontend/src/features/quiz/engine/constants.ts` — update: `SELECT_ONE_STRATEGIES`,
  `AUTHORED_ANNOUNCEMENT_STRATEGIES`.
- `apps/frontend/src/features/quiz/components/FeedbackView.tsx` — update: reads the shared sets.
- `apps/frontend/src/features/quiz/types/engine.ts` — update: `StrategyType` widened to 9;
  `QuizQuestion` gains the flat optional fields the four formats need (`segments`, `blankIndex`, `tokens`,
  `answerLength`, `dictionaryPinyin`, `targetIndex`, `targetGlyph`, `targetSyllable`, `baseTone`, `ruleId`,
  `ruleTitle`, `patternName`, `patternStructure`, `explanation`, `chinese`, `english`).
- `apps/frontend/src/features/quiz/engine/strategies/{ClozeStrategy,SentenceBuildingStrategy,ListeningDictationStrategy,ToneJudgmentStrategy}.ts`
  — **NEW**: question generation + verdict authoring per format.
- `apps/frontend/src/features/quiz/engine/strategies/quizStrategyRegistry.ts` — update: four ids registered.
- `apps/frontend/src/features/quiz/components/formats/ClozeQuestionView.tsx` / `.css` / `.stories.tsx` —
  **NEW**: 12 stories.
- `apps/frontend/src/features/quiz/components/formats/SentenceBuilderView.tsx` / `.css` / `.stories.tsx` —
  **NEW**: 12 stories.
- `apps/frontend/src/features/quiz/components/formats/DictationQuestionView.tsx` / `.css` / `.stories.tsx` —
  **NEW**: 13 stories (see [26-5](story-26-5-q9-dictation-q10-tone-judgment.md) for the wiring proof).
- `apps/frontend/src/features/quiz/components/formats/ToneJudgmentView.tsx` / `.css` / `.stories.tsx` —
  **NEW**: 12 stories.
- `apps/frontend/src/features/quiz/components/formats/{ClozeQuestion,SentenceBuilderQuestion,DictationQuestion,ToneJudgmentQuestion}.tsx`
  — **NEW**: store wrappers (question → view props, commit → `submitAnswer`, verdict → `announce`).
- `apps/frontend/src/features/quiz/components/formats/keyGuard.ts` — **NEW**: `isComposingKey`,
  `optionIndexFromKey`.
- `apps/frontend/src/features/quiz/components/Quiz.css` — update: the single-select option block, including
  the token-coloured `box-shadow` focus ring.
- `apps/frontend/src/features/quiz/components/formats/__tests__/formatDispatch.test.tsx` — **NEW**: 5 tests.
- `apps/frontend/src/features/quiz/engine/strategies/__tests__/practiceFormatStrategies.test.ts` — **NEW**:
  7 tests.

## Implementation Details

### The dispatch map, and what it replaces

```typescript
export const QUESTION_VIEWS: Record<StrategyType, ComponentType> = {
  "audio-to-pinyin": QuestionView,
  "audio-to-tone": QuestionView,
  "audio-to-pinyin-tone": QuestionView,
  "ime-simulator": IMEQuestionView,
  "radical-gate": MultipleChoiceView,
  cloze: ClozeQuestion,
  "sentence-building": SentenceBuilderQuestion,
  "listening-dictation": DictationQuestion,
  "tone-judgment": ToneJudgmentQuestion,
};
```

Before: an if-chain over a set that contained exactly `"radical-gate"` — duplicated in `FeedbackView`.
After: one record keyed by the union. `QuizRouter` still ends with `?? QuestionView`, which is defence in
depth for an untyped string; for a typed id it is unreachable.

### The commit is explicit, and the in-flight lock keeps focus

```tsx
// Selecting reports only; nothing is graded here (WCAG 3.2.2).
<RadioGroup options={options} selected={selected} onChange={onSelect} />
…
<Button variant="primary" aria-disabled={submitting || undefined}
        onClick={() => { if (submitting) return; onSubmit(); }}>Check</Button>
```

`aria-disabled` plus an early return, never the `disabled` attribute: a control that holds focus must not
leave the tab order (this is why `Button` gained the prop in 26-2). Enter is guarded with
`isComposingKey(event)` so an IME candidate commit is not an answer submit — shared by all three typed
surfaces.

### The focus ring, and why it is a `box-shadow`

```css
.quiz-select__options .radio-group__option:has(.radio-group__input:focus-visible) {
  /* Focus lands on the opacity:0 input inside the row, so `focus-ring-primary`
     (which targets the focused element) can never match. The ring is drawn on the
     ROW with the utility's own geometry and token. */
  box-shadow: 0 0 0 2px var(--focus-ring);
}
```

No new token, no raw colour, no page-scoped layout — which is why the full design audit stays at the main
baseline (219 errors) rather than gaining a `hardcoded-color` finding per format.

## Architecture Integration

```
?type=<id> ── QuizPage.parse: getStrategy(raw) ? raw : null
                │  (unregistered id ⇒ empty entry surface, no error — "silent-fallback trap")
                ▼
        QUIZ_STRATEGIES (9 ids) ── generateQuestions / evaluateAnswer
                │
QuizSessionPage ── QuizRouter ── QUESTION_VIEWS[strategyType]
                                   └── formats/*Question.tsx  ── props ──▶ formats/*View.tsx
                                                                          (12 states; no live region)
```

The views are pure: they take data and callbacks and never read the store. The `*Question` wrapper is the
seam — it maps `QuizQuestion` + store state onto the view's props, and pushes the verdict sentence into
`announce()` when the strategy authors one.

## Technical Challenges & Solutions

```
Problem:  The 12-state contract is declared per surface, but the canonical enumeration exists nowhere in
          the repo, so "all 12 states exist" is unfalsifiable unless the set is written down.
Solution: the design spec §26.1 item 3 declares the set (default, hover, focus-visible, active, selected,
          disabled, submitting, pass, fail, empty, error, edge) and every view's stories are named after
          it exactly, so a missing state shows as a missing export. Dictation adds a 13th
          (`ErrorGeneration`) because audio generation can fail without the question failing.
```

```
Problem:  A photo of the old code: two `new Set(["radical-gate"])` literals in two files, agreeing by luck.
          Any fix that only touched the router would leave `FeedbackView` rendering a tone-based verdict for
          a token answer.
Solution: both sets moved to `engine/constants.ts` with the reasons in their doc comments, and the
          verdict path was split by authored-vs-derived sentence rather than by a second id list.
```

## Testing Implementation

| Suite                              | Result                                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| `formatDispatch.test.tsx`          | 5 tests: a view exists for every id; cloze → cloze (never pinyin); sentence-building → builder |
| `practiceFormatStrategies.test.ts` | 7 tests: registration over the four ids; cloze/sentence verdicts                               |
| `SentenceBuilderQuestion.test.tsx` | 3 tests: the keyboard append/remove path                                                       |
| Storybook                          | all four views' stories collected and green (70 files / 421 tests at epic close)               |

### Doc Truth-Check

- [x] No endpoint documented — frontend only.
- [x] Component names verified on disk under `features/quiz/components/formats/`.
- [x] Data source: question payloads come from the backend (`GET /v1/quiz/questions`,
      `ROUTE_PATTERNS.quizQuestions`); the views never read content files.
- [x] Relative links resolve.
- [x] `last-verified` / Last Update = 2026-10-31.
