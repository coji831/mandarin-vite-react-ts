---
purpose: Practices lane correctness — phase aggregation, one position-locked completion CTA, the guest scoring lane, and four Phase-B quiz formats on curated banks
status: completed
last-verified: 2026-10-31
type: epic
---

# Epic 26: Practice Calibration — Engine Fixes, Guest Lane & Phase-B Formats

## Epic Summary

**Goal:** Make the Practices lane tell the truth about phases, give a guest a real scored session with one honest next step, and add the four Phase-B quiz formats (Q6, Q7, Q9, Q10) to the plan's ten-format taxonomy — taking the registered strategy set from **five to nine** on the backend and **three to seven** on the frontend, with the new formats scored on curated content rather than generated filler. (Q8 comprehension is the tenth, and it is epic 28's.)

**Key Points:**

- **The engine was mislabelling the learner's own phase.** Phase 3 had no entry at all, so "a Phase 3 quiz" did not exist; Phase 4 re-declared Phase 2's two formats with nothing to distinguish them; and `useQuizCard` read only the learner's current phase, so a passed phase's assessments vanished. All three are fixed at the registry and the hook, not papered over in the card.
- **One card, one labelled CTA per assessment.** The card used to offer a single CTA hardwired to `quizzes[0]`, so in a two-assessment phase the second format was unreachable from the UI. It now renders one CTA per assessment, and the timeline states "passed" / "current" / "not passed" / "later" as words rather than an aria-hidden icon.
- **A26's premise was two-thirds stale.** The rail-collapse and the `window.location.href` escape hatch it named as preconditions were already gone before this epic opened — they landed with PR #61. What actually remained unbuilt was the **completion slot**: the results surface still ended in a free-floating `flex-wrap` row where the primary was decided inline and could move with the score state and the viewport.
- **A guest's score is real and the primary is the persistence ask.** The server returns a stub for a guest attempt, and the results surface preferred it, so a guest who scored 9/10 read `0/0 (0%) — Not passed`. The guest lane now scores from local state, and the slot's single primary is "Create an account to save your progress" — the value moment — with "Back to Practices" as the ghost.
- **Four formats, two runtimes, no migration.** `cloze`, `sentence-building`, `listening-dictation` and `tone-judgment` are registered on both sides, dispatched from one map, and persisted by encoding onto the answer columns that already exist. The curated banks are a selection layer over the corpus: forty pinned anchors, no new table, answers derived from the anchor row.

**Status:** Completed

**Scope — two milestones (`epics-25-40.md` §Epic 26):**

- **M1 — engine + guest lane.** `PHASE_CONFIGS[3]` added; the duplicate-of-2 removed from key 4; `useQuizCard`
  aggregates every quiz for `p <= currentPhase`; the card stops mislabelling the lowest-phase quiz as
  current; `QUIZ_LABELS` covers the format set; the guest practice lane is session-local with a value-moment
  CTA. _Stories 26.1–26.3._
- **M2 — Phase-B format expansion.** Q6 cloze, Q7 sentence-building, Q9 listening-dictation and Q10
  tone-judgment as a distinct Phase-1 format, on curated banks derived from the word and graded-reader
  corpus; the Q8 typed-answer authoring rule is recorded for epic 28 rather than implemented. _Stories
  26.4–26.7._

**Out of scope, unchanged:** quiz-failure → review wiring, interleaving and guest session-local review
(epic 28); Q8 comprehension and the P3→4 gate (epic 28); demo-quota server counters (epic 29);
`srs-core`/ts-fsrs (epic 34).

**PR:** [#62](https://github.com/coji831/mandarin-vite-react-ts/pull/62) (single epic PR, open) · **Branch:** `epic-26-practice-calibration` — the nine story commits are listed in the [epic implementation](../../issue-implementation/epic-26-practice-calibration/README.md)

**Last Update:** October 31, 2026

> **Scope authority — A26 amendment, and its corrected premise.**
> `docs/planning/epics-25-40.md` §"2026 Audit Amendments" **A26** is the binding text: `/practices/quiz`
> fails the Focus chrome law "today (rail open, completion CTA outside a completion slot,
> `window.location.href` escape hatch)", and the shell must be fixed "before multiplying its surface by
> four formats".
>
> **Measured against the code at epic open, two of those three named defects no longer existed.**
> The rail collapse is `AppLayout`'s archetype-driven mode (`isFocusMode` collapses the rail and recesses
> the top bar), and `window.location.href` appears **nowhere** in `features/quiz/**` or
> `pages/practices/**` — every exit uses `useNavigate`. Both landed with the guest-identity epic
> (PR #61, merged 2026-10-30, commit `6e84c12e`), which is also where the shell's chrome law was
> enforced. A26 was written against a snapshot that predates that merge.
>
> **The unbuilt half was the completion slot, and that is the real finding.** The quiz session's chrome
> was already conforming; its _completion region_ was not. `QuizResults` ended in a
> `<div className="flex-center gap-md flex-wrap">` action row in which "Review what you missed",
> "Back to Practices" and "Create an account…" were peers, and which one was primary was decided by an
> inline ternary inside the component. The design spec's own Step 0 revalidation
> ([`design.md`](../../../apps/frontend/src/features/quiz/docs/design.md) §26.0) scored that region
> FAIL on contract items 3 and 5 and PASS on the rest, which is the correct reading: **an epic-wide
> rebuild was not warranted; one region was.** Story 26-2 rebuilt that region and nothing else in the
> shell, and it shipped the registry entry for the region before using it.

## Background

PinyinPal's Practices lane is the learner's own progress check: a phase card on `/practices`, then a
bounded ten-question session at `/practices/quiz?type=<id>`. Three separate problems made that lane
untrustworthy.

**First, the phase data was wrong in a way no test covered.** `PHASE_CONFIGS` had entries for phases 1,
2 and 4 and none for 3, so the phase whose label is "The Network — Reading & Grammar" offered nothing
to sit. Phase 4 duplicated Phase 2's `ime-simulator` and `radical-gate` entries verbatim, so a Phase-4
learner's payload was byte-identical to a Phase-2 learner's — the "duplicate-of-2" defect. And
`useQuizCard` read `getPhaseQuizzes(currentPhase)`, current-only, so the moment a learner passed Phase 1
its two assessments disappeared from the card. The hook had zero tests, which is why all three survived.

**Second, the completion region had no contract.** BM-1's one-task/one-CTA law and the `detail`
archetype's declared `completion` region ("rating / next-action cluster at the natural completion
point") existed as prose only — no registry entry implemented it. With three peer buttons in a wrap row,
the primary moved with the score state, and the guest's persistence ask competed with "Back to
Practices" for the same visual weight. A26 named this; epic 26 built it.

**Third, the guest lane was scoring the wrong facts.** The backend's `OptionalAuthGuard` correctly
returns a session-local stub for a guest — `{ totalScore: 0, maxScore: 0, passed: false }` — and
`QuizResults` preferred `completionResult` over local state whenever it existed. A guest who answered
9 of 10 correctly was therefore told they scored zero and failed. Nothing was ever written server-side
(the stub is honest), but the surface the learner reads was not.

The fourth and largest piece is scope the roadmap already carried: four more quiz formats, Q6 cloze,
Q7 sentence-building, Q9 listening-dictation and Q10 tone-judgment, with Q10 declared a **separate
Phase-1 format** rather than a sub-mode of `audio-to-tone`. Those four are what turn the Phase-3 entry
from a label into a session, and they are the reason the dispatch contract had to be fixed before any
of them could be wired.

## User Stories

This epic consists of the following user stories:

1. **Engine Truth: Phase Configs, Aggregation, and the Practice Card** _(link to [`story-26-1-engine-phase-truth.md`](story-26-1-engine-phase-truth.md))_
   - As a learner on any phase, I want every assessment at or below my phase listed once, with a CTA that starts the one I chose, so that practice matches the progress I actually made.

2. **Completion Slot: One Position-Locked Primary (the A26 residual)** _(link to [`story-26-2-completion-slot-position-locked-cta.md`](story-26-2-completion-slot-position-locked-cta.md))_
   - As a learner finishing a session, I want exactly one primary next step in a fixed place, so that I never have to work out which of three buttons the app thinks is next.

3. **Guest Lane: Local Score and the Value Moment** _(link to [`story-26-3-guest-lane-value-moment.md`](story-26-3-guest-lane-value-moment.md))_
   - As a guest, I want the score I earned and one honest next step, so that a good session shows me why an account is worth creating instead of showing me a fabricated zero.

4. **Q6 Cloze and Q7 Sentence Building** _(link to [`story-26-4-q6-cloze-q7-sentence-building.md`](story-26-4-q6-cloze-q7-sentence-building.md))_
   - As a Phase-3 learner, I want to fill a blank in a real sentence and to assemble one from its words, so that grammar practice tests production rather than recognition.

5. **Q9 Listening Dictation and Q10 Tone Judgment** _(link to [`story-26-5-q9-dictation-q10-tone-judgment.md`](story-26-5-q9-dictation-q10-tone-judgment.md))_
   - As a learner, I want to transcribe what I hear and to state the tone a written syllable actually surfaces as, so that ear training and the sandhi rules are practised as the different skills they are.

6. **Backend Format Contract: Four Strategies, One Registry, No Migration** _(link to [`story-26-6-backend-format-contract.md`](story-26-6-backend-format-contract.md))_
   - As the platform, I want the four new formats accepted and persisted by the same submit path as every existing format, so that a registered learner's practice counts toward their progress without a schema change.

7. **Curated Banks and Seed Verification** _(link to [`story-26-7-curated-banks-seed-verification.md`](story-26-7-curated-banks-seed-verification.md))_
   - As the product owner, I want the four formats anchored to real corpus rows and verified at seed time, so that a question can never outlive the content it was built from.

8. **Docs and Verification Artifact** _(link to [`story-26-8-docs-verification-artifact.md`](story-26-8-docs-verification-artifact.md))_
   - As the next workstream, I want the epic's claims measured and recorded against shipped code, so that the evidence is auditable without re-running the pipeline.

## Story Breakdown Logic

This epic is divided into stories based on the following approach:

- Story **26.1** lands first because everything downstream renders from the registry and the card: a
  mislabelled phase would have been multiplied by four new formats. It is the only story that changes
  what a learner sees before a session starts.
- Story **26.2** is second, and deliberately before any new format: A26's instruction was to fix the
  shell before multiplying its surface, and the story that survives that test is this region. The four
  formats were never built into the failing completion region.
- Story **26.3** is third because it is a defect inside the region 26.2 had just rebuilt — the guest
  score and the guest's primary both live in the slot. Doing it before the formats meant the guest path
  was correct before it had ten formats to be correct about.
- Stories **26.4** and **26.5** carry the formats in two pairs, not four: 26.4 establishes the dispatch
  map and the two option/token primitives (cloze, sentence-building), 26.5 reuses them (dictation needs
  audio plus a field, tone-judgment needs the same single-select group as cloze).
- Story **26.6** is backend and independent of the FE ordering; it lands before the banks are consumed.
  It is separable because the two runtimes are independent: the FE renders a format the BE has not yet
  registered, and the session fails on submit rather than at render, so the BE contract is a gate on
  content, not on UI.
- Story **26.7** needs the four registered ids on both sides, so it comes after 26.4, 26.5 and 26.6.
- Story **26.8** closes: it records the as-built deltas, the gate results, and the five measurements.

Each story is independently committable on the epic branch; together they satisfy the six epic ACs.

**Story table.**

| Story | Scope                                                                                                                           | AC            | Depends on                   | Status    | Close criterion                                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------- | --------- | -------------------------------------------------------------------------------------------- |
| 26-1  | `PHASE_CONFIGS[3]`, `tier: 2` phase 4, `getQuizzesUpToPhase`, card rebuilt with one CTA per assessment                          | AC1           | —                            | Completed | 14 hook tests + 4 card tests green; Storybook states for the card                            |
| 26-2  | `CompletionSlot` (registry entry first), results reordered value → slot → review, one session `role="status"`, focus management | AC1, AC6, A26 | 26-1 (labels, aggregation)   | Completed | registry-stories + design-audit:foundation green; one-node region pinned by 26-3/26-5 suites |
| 26-3  | Guest local score, register owns the slot primary, no client auth branch, guest copy                                            | AC2           | 26-2 (slot owns the primary) | Completed | 5 results tests incl. the `0/0` regression; controller guest cases green                     |
| 26-4  | `SELECT_ONE_STRATEGIES`, `QUESTION_VIEWS`, four strategies registered, four format surface shells                               | AC3 (a)       | 26-1                         | Completed | dispatch test over every id; 12 states per view as stories                                   |
| 26-5  | Dictation and tone-judgment proofs, authored-verdict announcement, four page stories                                            | AC3 (b)       | 26-4 (views), 26-6 (BE ids)  | Completed | Q10 renders no play control / no audio element; storybook green                              |
| 26-6  | Four backend strategies, one `STRATEGY_MAP`, `QuizAttemptType` widened, encoding pinned, no migration                           | AC4           | 26-1 (ids)                   | Completed | backend quiz slice + 6 encoding tests + parity suite green; `tsc` exit 0                     |
| 26-7  | Forty curated pins, `syncQuizFormats` (resolve-before-write), manifest entry, seed suite                                        | AC5           | 26-4, 26-5, 26-6             | Completed | 9/9 seed tests unskipped against a real DB; manifest count + hash re-derived                 |
| 26-8  | Epic BR + story BRs + as-built record + the five measurements                                                                   | AC6, close    | all                          | Completed | links resolve; system map regenerated; no invented changelog entry                           |

## Acceptance Criteria

- [x] **AC1 — FE contract: phases aggregate.** `PHASE_CONFIGS[3]` exists with its formats, key 4 is not a duplicate of key 2, and Practices renders assessments for every phase `<= currentPhase`. _Verified: `getQuizzesUpToPhase()` in `engine/PhaseStrategyRegistry.ts` filters `phase <= currentPhase` and flattens in phase order; `PHASE_CONFIGS[4]` carries `tier: 2` on both entries. Pinned by [`useQuizCard.test.tsx`](../../../apps/frontend/src/features/quiz/hooks/__tests__/useQuizCard.test.tsx) (14 tests, including "gives phase 4 a payload distinct from phase 2", "gives a phase 3 learner the reading formats rather than an empty list" and "accumulates earlier phases instead of replacing them") and [`QuizCard.test.tsx`](../../../apps/frontend/src/features/quiz/components/__tests__/QuizCard.test.tsx) (4 tests)._
- [x] **AC2 — Guest lane: session-local score, value-moment CTA, no rows.** A guest completes a Phase-1 quiz, the result is session-local, the register CTA owns the slot's single primary, and the server writes no `QuizAttempt` / `QuizAttemptAnswer` row. _Verified: the local-score rule in `QuizResults.tsx` (`usesLocalScore = isGuest || attemptMaxScore <= 0`); the register-owns-primary branch; `QuizResults.test.tsx` "renders a guest's local score after a real completeAttempt, never the stub's 0/0"; `quizSessionStore.test.ts` "asks for an attempt once — no client-side auth branch"; and the controller's three guest cases, all asserting `mockQuizService.* not.toHaveBeenCalled()`. Measurement (a) in the verification artifact._
- [x] **AC3 — Four formats render and score; Q10 is distinct.** Q6/Q7/Q9/Q10 render their own surface, grade only on explicit commit, and Q10 is a Phase-1 format with no audio, not an `audio-to-tone` sub-mode. _Verified: `QUESTION_VIEWS: Record<StrategyType, ComponentType>` (`components/questionViews.ts`, 9 keys) replaces the duplicated `MULTIPLE_CHOICE_STRATEGIES` set; `formatDispatch.test.tsx` proves `?type=cloze` mounts the cloze surface and never the pinyin one; `ToneJudgmentQuestion.test.tsx` asserts the surface renders neither a play control nor an audio element. Measurement (b) in the verification artifact: 12 states per format as stories._
- [x] **AC4 — BE contract: four types accepted and persisted for registered users.** The submit/complete path accepts the four ids and persists `QuizAttempt` / `QuizAttemptAnswer` for a signed-in learner. _Verified: `STRATEGY_MAP` (9 entries) in `apps/backend/src/modules/quiz/strategies/registry.ts` is the single registry literal behind both `getStrategy` and `getRegisteredTypes`; `QuizAttemptType` widened to nine; `quiz-format-answer-encoding.test.ts` (6 cases) pins the column encoding per format; `quiz-nest.controller.test.ts` keeps 201/200/200._
- [x] **AC5 — Content: banks pass seed verification and manifest counts.** The curated banks resolve every anchor, are idempotent, and the manifest entry matches the file; the Q8 typed-answer authoring rule is recorded for epic 28. _Verified: `tests/integration/quiz-format-seed.test.ts` (9 tests, DB-backed, run at close — all pass); `content/seed/phase2/quiz-formats.json` = 40 items, 10 per bank; manifest entry `entries: 40` with SHA-256 `7244e453…`, matching the file bytes. Measurement (c) in the verification artifact._
- [x] **AC6 — No regression.** Existing quiz flows pass the full suite after the engine fixes, and the design gates hold at the pre-existing baseline. _Verified at close: frontend full suite 167 files / 1245 tests pass; storybook 70 files / 421 tests pass; backend unit 60 files / 689 tests pass; backend `tsc --noEmit` exit 0; `design-audit:foundation` PASS with 0 page-anatomy findings; full design audit 219 errors / 420 warnings in 639 findings — the same count as the main baseline, no new finding in an epic-26 file; `check:page-inventory` PASS (20 entries: 18 conforms, 2 diverges); `check:registry-stories` PASS (39 shared components)._

## Architecture Decisions

1. **The completion region is a shared component, not a `PageShell` prop and not "a child of `PageStack`".**
   Rationale: the `detail` archetype already declares a `completion` region and nothing in the registry implemented it; being a child of `PageStack` buys rhythm, never position lock, which was the exact failure. Four Focus families in the plan (quiz, review, speaking, exam) need the same contract, so the region is named once as `CompletionSlot` with a closed (empty) variant set and one `primary` ReactNode prop — "exactly one primary" is then structural rather than policed.
   Alternatives considered: a `PageShell` prop (would let any Browse page mount a completion slot and would make the anatomy ledger describe behaviour it does not gate); a `PageStack` child as the contract (today's shape).
   Implications: `QuizResults` passes the primary and at most one ghost into the slot; the old three-peer row cannot be reconstructed without editing the slot, and a story pins the three identities (misses / perfect / guest).

2. **A guest's attempt still calls `createQuizAttempt`; the client never branches on auth.**
   Rationale: the server's `OptionalAuthGuard` mock and its zero-row guarantee are the contract L1 rests on. Branching in the client would hide that contract from every run and quietly diverge from the server. The client's job is to _read_ local state when the stub's `maxScore` is not a real denominator, which is a display rule, not an auth branch.
   Alternatives considered: skip the attempt call for guests (loses the contract exercise, and the store would need `useAuth`); trust the stub (that is the defect: `0/0`).
   Implications: `usesLocalScore = isGuest || attemptMaxScore <= 0` also rescues any non-guest attempt whose completion never lands, and the row-level proof stays where it belongs — in the controller test.

3. **Dispatch is one `Record<StrategyType, ComponentType>`, and the strategy union is the gate.**
   Rationale: `MULTIPLE_CHOICE_STRATEGIES` was declared twice (`QuizRouter`, `FeedbackView`) as `new Set(["radical-gate"])`. With cloze and tone-judgment both single-select, that duplication would have routed them through the pinyin `QuestionView` — audio plus typed pinyin for a format that has no audio. A `Record` over a closed union makes "add a format without naming its view" a type error.
   Alternatives considered: a third `if` branch per format (repeats the trap); deriving dispatch from `SELECT_ONE_STRATEGIES` (conflates "answered by choosing" with "which component draws it").
   Implications: `SELECT_ONE_STRATEGIES` (`radical-gate`, `cloze`, `tone-judgment`) and `AUTHORED_ANNOUNCEMENT_STRATEGIES` (the four new formats) are each declared exactly once in `engine/constants.ts`, and `FeedbackView` reads them instead of keeping a second list.

4. **Persistence is a value convention on existing columns — no migration, no enum, no `response Json`.**
   Rationale: `QuizAttempt.quizType` is already an unconstrained `String`, `QuizAttemptAnswer`'s five answer columns are already NOT NULL, and the FE already sends exactly `{questionIndex, pinyinInput, selectedTone, correctPinyin, correctTone, category}`. Each format encodes onto those columns (`cloze`: the token in `pinyinInput`; `sentence-building`: space-joined ordered tokens; `listening-dictation`: the transcription, `category: "dictation"`; `tone-judgment`: syllable in `pinyinInput`, chosen tone in `selectedTone`), with `0` as the "not a tone answer" sentinel.
   Alternatives considered: a `response Json?` column (a schema change for four formats, and a second place for the payload to drift); a Prisma `StrategyType` enum (an enum for a value the route must keep accepting as a pass-through, since the FE carries legacy aliases the BE has no strategy for).
   Implications: a reader must key off `category`/`quizType`, never off "tone = 0" — `0` is a legal neutral tone. The BE/FE union difference is recorded in one comment in `modules/quiz/types/quiz.ts` rather than pretended away.

5. **The banks are a selection layer over the corpus, seeded into the anchor's existing `metadata`.**
   Rationale: `GrammarExample` already stores per-segment `{text, pinyin, gloss}` and `Character` already stores `pinyin` + glyph — every field Q6/Q7/Q9/Q10 needs. A question table would duplicate the corpus and create a second place for pinyin to drift, so an item names an anchor plus an index and the answer is derived at read time.
   Alternatives considered: a `QuizQuestion` table (duplication); generating the four formats from nothing (the reason the formats were empty in the first place).
   Implications: `syncQuizFormats` resolves every anchor **before** writing and throws on a dangling id, so a bank cannot outlive its content; the seed is idempotent by canonical-JSON diff. It also fixes dictation at **character** level, because `Word` has no `metadata` column and adding one is out of scope.

6. **The polish stays inside the token system so the audit count does not move.** The option-row focus ring is a token-coloured `box-shadow: 0 0 0 2px var(--focus-ring)` rather than a new outline rule, because the `focus-ring-primary` utility targets the focused element while focus lands on the `opacity: 0` radio inside the row. No new token, no raw colour, no page-scoped CSS: the full design audit reports the same 219 errors as the main baseline, with zero findings in an epic-26 file.

## Implementation Plan

1. Fix the phase registry and the card (story 26-1): `PHASE_CONFIGS[3]`, `tier: 2` on phase 4, `getQuizzesUpToPhase()`, timeline text states, one CTA per assessment.
2. Build the completion region (story 26-2): registry entry, `CompletionSlot`, results reordered value → slot → review, one session-level `role="status"` region, focus across QUESTION/FEEDBACK/RESULTS.
3. Correct the guest lane (story 26-3): local-score rule, register owns the slot primary, no client auth branch.
4. Establish dispatch and the first two formats (story 26-4): `SELECT_ONE_STRATEGIES`, `QUESTION_VIEWS`, `ClozeQuestionView`, `SentenceBuilderView`.
5. Add the second pair (story 26-5): `DictationQuestionView`, `ToneJudgmentView`, and the page stories that drive each format end to end.
6. Extend the backend contract (story 26-6): four strategies generated from the corpus, one `STRATEGY_MAP`, `QuizAttemptType` widened, encoding pinned by tests.
7. Anchor the content (story 26-7): `quiz-formats.json` with 40 pins, `syncQuizFormats`, manifest entry, seed verification suite.
8. Record the as-built state and the five measurements (story 26-8).

## Risks & mitigations

- Risk: **the formats render but never persist**, because the BE registry and the FE registry are separate literals. — Severity: High
  - Mitigation: both registries carry all nine ids, the encoding is pinned per format by `quiz-format-answer-encoding.test.ts`, and the four ids round-trip through the real generators in the seed suite's read-path case.
  - Rollback: remove the FE ids from `QUIZ_STRATEGIES` — the route falls back to the entry surface with no error (the documented silent-fallback trap), so a bad format is never half-live.

- Risk: **a bank pins an anchor the corpus later drops**, leaving a generator with nothing to select. — Severity: Medium
  - Mitigation: `syncQuizFormats` resolves every anchor before writing and throws on a dangling id; the four generators fail open to the generated corpus when the bank is absent or empty.
  - Rollback: delete the item from `quiz-formats.json` and re-run the seed — the loader prunes an item that is no longer authored (pinned by test).

- Risk: **the completion slot becomes a second primary on a surface that already has one.** — Severity: Medium
  - Mitigation: the slot takes a single `primary` ReactNode, so there is no second slot to fill; `GuestUpsell` is deliberately not mounted in the completion position (it ships its own CTA); `QuizResults.test.tsx` asserts one primary plus one ghost per identity.
  - Rollback: revert `QuizResults` to the previous action row — the slot stays unused with its registry entry, so nothing else breaks.

- Risk: **a new format passes the design gates by adding page-scoped CSS or a raw colour.** — Severity: Low
  - Mitigation: all four views place structural CSS only (min-height, `overflow-wrap`, `min-width` on the blank) in their own files, reuse `Box variant="dashed" | "pass" | "fail"` for the reveal, and the full design audit is re-run at close against the main baseline.
  - Rollback: the audit count is the tripwire; a regression shows as a number above 219.

## Implementation notes

- Conventions: follow [`docs/guides/conventions/frontend.md`](../../guides/conventions/frontend.md) and the design spec at [`apps/frontend/src/features/quiz/docs/design.md`](../../../apps/frontend/src/features/quiz/docs/design.md), which is the authoritative surface contract (§26.0–§26.7). This epic's docs reference it and do not restate it.
- Storybook is the component truth (`npm run check:registry-stories`); the page gate collects only `pages/**/*Full.stories.tsx`, so format stories live beside their views and the wired path is covered by the page stories.
- Related documentation: [epic implementation](../../issue-implementation/epic-26-practice-calibration/README.md) (as-built record, gate table, decisions) · [Epic 25 BR](../epic-25-secure-guest-identity-and-route-gating/README.md) (fixed the shell chrome A26 assumed was still broken) · [business model](../../business/business-model.md) §3 + L1/L5 · [epic plan](../../planning/epics-25-40.md) §Epic 26 + A26 · the local artifact `verification-artifacts/epic-26-practice-calibration.md` (gitignored — the committed record is the [26-8 implementation](../../issue-implementation/epic-26-practice-calibration/story-26-8-docs-verification-artifact.md)).
- Close criteria, as met: all eight story docs and implementations exist with status filled; every AC box is
  ticked with a verifier; the five measurements are recorded in the artifact and condensed into the 26-8
  implementation; the Tier 1 / Tier 2 gates are green at or below the main baseline (see the implementation's
  gate table).
