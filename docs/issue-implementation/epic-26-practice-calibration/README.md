---
purpose: Epic 26 as-built — phase truth, the completion slot, the guest lane, the four formats, one backend registry, and the curated banks, with the gate results at close
status: completed
last-verified: 2026-10-31
type: epic
---

# Epic 26: Practice Calibration — Implementation

**BR Reference:** `docs/business-requirements/epic-26-practice-calibration/README.md`

**Branch:** `epic-26-practice-calibration` · **PR:** not yet opened

## Epic Summary

**Goal:** Make the Practices lane correct, guest-servable and ten formats deep — fixing the phase registry and its aggregation, giving the completion region a named contract and one position-locked primary, scoring a guest's session from local state, and adding Q6/Q7/Q9/Q10 on curated banks with no schema change.

**Key Points:**

- **A26's premise was two-thirds stale, and that is the epic's first finding.** The rail was already collapsing by archetype and `window.location.href` was already gone from the quiz feature before this epic opened — both landed with the guest-identity epic (PR #61, `6e84c12e`, 2026-10-30). The one genuinely unbuilt item was the **completion slot**, so 26-2 repaired one region and left the shell alone. Building four formats into the old action row would have multiplied a defect; the row is what changed, not the page frame.
- **The engine's phase data was wrong in three ways and untested in all three.** `PHASE_CONFIGS[3]` did not exist, Phase 4 duplicated Phase 2 verbatim, and `useQuizCard` read only the current phase so a passed phase's assessments vanished. The hook had zero tests. All three are fixed at the registry and the hook, and the hook now has 14.
- **"Exactly one primary" is structural.** `CompletionSlot` takes a single `primary` ReactNode; there is no second slot to fill. The results column reads value → slot → review, and the ghost is passed _into_ the slot instead of being a sibling.
- **A guest's completion is a stub, so the stub is never the score.** `usesLocalScore = isGuest || attemptMaxScore <= 0` means a guest who answered 9/10 reads 9/10, and the register CTA owns the slot's primary. The client still calls `createQuizAttempt` unconditionally — the zero-row guarantee is the server's, and branching in the client would hide it.
- **Nine registered strategies on two runtimes and no migration.** Four new `StrategyType`s per side (frontend
  registry 3 → 7, backend 5 → 9), one `QUESTION_VIEWS` map on the FE, one `STRATEGY_MAP` on the BE (it was
  the same five-key literal written twice), and persistence as a value convention on the answer columns that
  already exist (`0` is the sentinel, and also a legal neutral tone). Q8 comprehension is the taxonomy's tenth
  format and stays in epic 28.

**Status:** Completed — all eight stories landed on `epic-26-practice-calibration`; the branch is not merged.

**Last Update:** October 31, 2026

## Technical Overview

Epic 26 is a **repair-and-extend** epic, split cleanly between two runtimes and one content file. On the
frontend it fixes the phase registry, names the completion region as a shared component, corrects the
guest display rule, centralises dispatch, and adds four question surfaces. On the backend it adds four
strategies generated from the corpus, folds two copies of the registry literal into one, and widens
`QuizAttemptType` without touching the schema. On content it pins forty anchors and verifies them at seed
time.

Scope as built, by story:

| Story | Commit     | What landed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Production code changed   |
| ----- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 26-1  | `b61158ff` | `PHASE_CONFIGS[3]` (cloze + sentence-building); `tier: 2` on both Phase-4 entries; `getQuizzesUpToPhase()`; `useQuizCard` timeline text states + 7-entry `QUIZ_LABELS`; `QuizCard` rebuilt with one labelled CTA per assessment; `QuizCard.css` + `QuizCard.stories.tsx` (6 states); design spec §26.0–§26.7 authored in the same commit                                                                                                                                                                                                                               | Yes (frontend)            |
| 26-2  | `19f41699` | `shared/components/completion-slot/` (`CompletionSlot.tsx`, `.css`, `.stories.tsx`) + registry entry; `QuizResults` rebuilt on the slot and reordered value → slot → review; `quizSessionStore.announcement` + `session.ts` field; one `role="status"` region in `QuizSessionPage`; focus effects on `QuestionView`, `MultipleChoiceView`, `FeedbackView`; `Timer` state words; `Button` gains `aria-disabled`                                                                                                                                                         | Yes (frontend)            |
| 26-3  | `972b12ac` | `QuizResults.test.tsx` (**NEW**, 5 cases incl. the guest `0/0` regression); `PhaseGateBadge` guest copy ("This result is not saved yet."); store guest case (one call, no auth branch); four page stories for the guest identities. The local-score display rule itself shipped in 26-2's rebuild and is pinned here                                                                                                                                                                                                                                                   | Tests + copy (frontend)   |
| 26-4  | `5b27ff9a` | `components/questionViews.ts` (`QUESTION_VIEWS`); `engine/constants.ts` (`SELECT_ONE_STRATEGIES`, `AUTHORED_ANNOUNCEMENT_STRATEGIES`); `StrategyType` widened; four FE strategies registered; **all four** format view shells (`ClozeQuestionView`, `SentenceBuilderView`, `DictationQuestionView`, `ToneJudgmentView`) with their `.css` and 12–13 stories each, plus their four `*Question` store wrappers; `formats/keyGuard.ts`; `Quiz.css` single-select block; `SentenceBuilderQuestion.test.tsx`, `formatDispatch.test.tsx`, `practiceFormatStrategies.test.ts` | Yes (frontend)            |
| 26-5  | `82305f24` | `DictationQuestion.test.tsx`, `ToneJudgmentQuestion.test.tsx`; the store's authored-verdict announcement branch (`AUTHORED_ANNOUNCEMENT_STRATEGIES`) + 2 store tests; four page stories (`ClozeFormat`, `SentenceBuildingFormat`, `DictationFormat`, `ToneJudgmentFormat`); `QuizPage.test.tsx` route case. The four **views** landed in `5b27ff9a`; this commit is their wiring proof                                                                                                                                                                                 | Tests + wiring (frontend) |
| 26-6  | `a7fa1ae1` | `ClozeStrategy`, `SentenceBuildingStrategy`, `ListeningDictationStrategy`, `ToneJudgmentStrategy`; `formatUtils.ts`; `quizFormatBank.ts`; `STRATEGY_MAP`; `QuizAttemptType` widened to 9; `quiz-format-answer-encoding.test.ts` (6); strategy unit suites (4 files)                                                                                                                                                                                                                                                                                                    | Yes (backend)             |
| 26-7  | `a83dda28` | `content/seed/phase2/quiz-formats.json` (40 pins); `syncQuizFormats` in `prisma/sync-helpers.ts`; `prisma/seed.ts` Step 33; manifest entry (count + SHA-256 + `generatedAt`); `tests/integration/quiz-format-seed.test.ts` (9)                                                                                                                                                                                                                                                                                                                                         | Content + seed            |
| 26-8  | docs       | This record, the epic BR + eight story BRs, the eight story implementations, and `verification-artifacts/epic-26-practice-calibration.md` (gitignored)                                                                                                                                                                                                                                                                                                                                                                                                                 | **No**                    |

**Where the code actually changed.** Frontend production code changed under
`apps/frontend/src/features/quiz/**` (registry, hook, card, stores, constants, dispatch, four format views,
strategies), `apps/frontend/src/pages/practices/QuizSessionPage.tsx`, and
`apps/frontend/src/shared/components/` (`completion-slot/`, `index.tsx`, `Button/Button.tsx`). Backend
production code changed under `apps/backend/src/modules/quiz/**` (`strategies/`, `types/quiz.ts`,
`nest/quiz-nest.controller.ts`) and the seed pair (`prisma/seed.ts`, `prisma/sync-helpers.ts`). No file
outside those trees changed in production code: `apps/frontend/src/pages/practices/QuizPage.tsx` and
`shared/constants/pageChrome.ts` were **not** touched, which is why the entry surface and the session-query
chrome rule needed no revalidation beyond the design spec's Step 0.

**Gate results at epic close (2026-10-31, `epic-26-practice-calibration`).**

| Gate                      | Command                                                                                           | Result                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Frontend full suite       | `npm run test:full --workspace=@mandarin/frontend`                                                | **167 files / 1245 tests pass**                                                                                        |
| Frontend quiz + practices | `npx vitest run src/features/quiz src/pages/practices --project='!storybook'`                     | **26 files / 194 tests pass**                                                                                          |
| Storybook suite           | `npx vitest run --project storybook` (`npm run test-storybook`)                                   | **70 files / 421 tests pass**                                                                                          |
| Backend unit suite        | `npm run test:full --workspace=@mandarin/backend`                                                 | **60 files / 689 tests pass**                                                                                          |
| Backend type-check        | `npm run typecheck --workspace=@mandarin/backend` (`tsc --noEmit`)                                | **exit 0**                                                                                                             |
| Seed integration suite    | `npx vitest run tests/integration/quiz-format-seed.test.ts --config vitest.integration.config.ts` | **1 file / 9 tests pass** against the reachable seeded database (not skipped)                                          |
| Design audit (foundation) | `npm run design-audit:foundation`                                                                 | **PASS** — 0 page-anatomy findings of 639 total                                                                        |
| Design audit (full)       | `npm run design-audit`                                                                            | **219 errors / 420 warnings in 639 findings** — the main baseline count, no new finding in an epic-26 file             |
| Page inventory            | `npm run check:page-inventory`                                                                    | **PASS** — 20 entries (18 conforms, 2 diverges)                                                                        |
| Registry stories          | `npm run check:registry-stories`                                                                  | **PASS** — 39 shared components                                                                                        |
| Doc links                 | `npm run check:doc-links`                                                                         | **135 unresolved links across 52 files** — all pre-existing archive debt; none in an epic-26 file (baseline unchanged) |
| System map                | `npm run check:system-map`                                                                        | **PASS** — `docs/README.md` + `docs/coverage.md` regenerated in this epic, so the two stale blocks are gone            |

**Note on the doc gates.** `check:doc-links` was red **before** this epic's docs existed: 135 unresolved
links, all in `docs/**/archive/**` and older epic folders. That count does not move because of an epic-26
file, and it is recorded here rather than fixed, because it belongs to `docs/guides/testing/known-failures.md`'s
triage list and re-fixing it from scratch inside a feature epic would pull half the archive into this diff.
`check:system-map` was red for the same kind of reason (two stale generated blocks) and **is now green**,
because regenerating the map was part of this epic's documentation duty.

## Architecture Decisions

1. **Repair the completion region; do not rebuild the shell.**
   Rationale: A26's three named defects were measured, and two were already fixed. The design spec's Step 0 revalidation scored the session shell PASS on contract items 1–6 and scored only the completion region FAIL on 3 and 5, so the correct action was the narrow one.
   Alternatives considered: rebuild `QuizSessionPage` and `QuizResults` as one greenfield surface (would have discarded a conforming shell and re-opened settled token/anatomy work).
   Implications: `PageShell(detail)` / `PageStack` / `PageHeader` / `QuizRouter` / `QuizProgressBar` are untouched; the diff is one region, one store field and one page node.

2. **The completion slot is a shared component with an empty variant set.**
   Rationale: the `detail` archetype declares a `completion` region and no registry entry implemented it; four Focus families in the plan need the identical contract. A single `primary` ReactNode makes "exactly one primary" structural.
   Alternatives considered: a `PageShell` prop (would let any Browse page mount one, and would put behaviour in the anatomy ledger it does not gate); a `PageStack` child as the contract (rhythm, not position lock — today's defect).
   Implications: `variants: []` is a real declaration, not an omission — one shape, identity decides content. `GuestUpsell` is deliberately not mounted in that position because it ships its own CTA.

3. **One live region, owned by the session, mounted empty.**
   Rationale: a region that mounts with its text is not reliably announced, and a per-view region vanishes when the view swaps — the two failure modes are opposite and both silently drop the announcement. One node in `QuizSessionPage`, filled by the store, has neither.
   Alternatives considered: per-view `role="status"` nodes (double-announce on overlapping renders, silent gap on swap); announcing from the strategy (no knowledge of the DOM).
   Implications: the store's `announcement: string` is the only source, `announce(text)` exists for the practice surfaces that own steps the store cannot see ("Added 我, position 1 of 4."), and the timer's per-second value never enters it — only the 30s/10s thresholds and time-up.

4. **The guest lane stays auth-blind in the client.**
   Rationale: the zero-row guarantee belongs to `OptionalAuthGuard`; a client branch would stop exercising it. The client's rule is a display rule: if the completion is not a real denominator, read local state.
   Alternatives considered: `if (isGuest) return` before `createQuizAttempt` (removes the contract from every guest run); trusting the stub (the `0/0` defect).
   Implications: the proof is split deliberately — the client test asserts one call and no branch, the controller test asserts no service call and no write.

5. **Dispatch is a total map over a closed union; the union is the gate.**
   Rationale: the duplicated `MULTIPLE_CHOICE_STRATEGIES` set would have routed two single-select formats through the pinyin view. A `Record<StrategyType, ComponentType>` turns that mistake into a type error at the moment a format is added.
   Alternatives considered: extending the if-chain (the same trap one format later); a runtime fallback to `QuestionView` (still exists in `QuizRouter` as a defensive `?? QuestionView`, but it is unreachable for a typed id).

6. **Persistence as a value convention; no migration.**
   Rationale: the columns and the wire payload already exist. `quizType` is a `String`, the five answer columns are NOT NULL, and the FE already sends exactly those fields.
   Alternatives considered: `response Json?` (schema change plus a second payload shape); a Prisma enum (breaks the FE's legacy aliases, which the route must keep accepting as pass-throughs).
   Implications: `0` is overloaded ("not a tone answer" and "neutral tone"), so consumers key off `category`/`quizType`; the encoding table is pinned by six tests rather than described once in prose.

7. **Cut the curated banks as a selection layer, and resolve before write.**
   Rationale: the corpus already stores every field the four formats need; a question table duplicates it. Resolving all anchors before the first write means a dangling id cannot half-seed a bank.
   Alternatives considered: a `QuizQuestion` table; a per-item write loop (a partial seed on failure).
   Implications: the file holds no answers, so a second run is a canonical-JSON diff that writes 0 rows; dictation is character-level because `Word` has no `metadata` column, and that limitation is recorded rather than worked around.

8. **The focus ring is a token-coloured `box-shadow`, so the audit count does not move.**
   Rationale: focus lands on a `opacity: 0` radio inside an option row, so the `focus-ring-primary` utility (which targets the focused element) can never match; a hand-written `outline` with a raw colour would add `hardcoded-color` findings. `box-shadow: 0 0 0 2px var(--focus-ring)` reproduces the utility's own geometry with no new value.
   Alternatives considered: a new token (frozen); per-format outline rules (raw colour, and four copies).
   Implications: the full audit stays at 219 errors — the main baseline — and the ring is one block in `Quiz.css` shared by every single-select format.

## Technical Challenges & Solutions

### Challenge 1: A26's premise did not match the code, and the plan was already ratified

The amendment is `status`-bearing planning text, so "the rail is open and there is a `window.location.href`
escape hatch" reads like a current fact. Three checks settled it: `AppLayout` derives its mode from the
page archetype (`isFocusMode` collapses the rail and recesses the bar), a repo-wide search for
`window.location` returns nothing under `features/quiz/**` or `pages/practices/**`, and both landed in
PR #61. Writing this into the BR as a correction — rather than implementing a fix for an already-fixed
defect or quietly ignoring the amendment — is the only honest resolution: the amendment's _instruction_
(fix the shell before multiplying its surface) still holds, and the half that held was the completion slot.

### Challenge 2: `MULTIPLE_CHOICE_STRATEGIES` was declared twice, and both copies were about to be wrong

`QuizRouter` and `FeedbackView` each held `new Set(["radical-gate"])`. With one single-select format that
is invisible. With three, a cloze or tone-judgment question renders the pinyin `QuestionView` — audio plus
a typed-pinyin field — for formats that have no audio at all, and no test fails, because the surface
renders _something_. The fix was structural: `SELECT_ONE_STRATEGIES` in `engine/constants.ts` (read by
both), and `QUESTION_VIEWS: Record<StrategyType, ComponentType>` in `components/questionViews.ts`. The
dispatch test asserts the negative directly — `?type=cloze` mounts the cloze surface and **never** the
pinyin one.

### Challenge 3: The silent-fallback trap in the route itself

`QuizPage`'s `parse: (raw) => (raw && getStrategy(raw) ? raw : null)` means an unregistered `?type=` renders
the `EmptyState` entry with **no error**. A format shipped with a view but not in `QUIZ_STRATEGIES` would
look like "no quiz selected", and a reviewer would have no signal. So registration is asserted twice: a
table-driven `getStrategy` test over all four ids, and a `QuizPage` case that `?type=cloze` mounts a session
rather than the entry.

### Challenge 4: A stub that is honest on the wire and a lie on screen

The guest completion (`{totalScore: 0, maxScore: 0, passed: false}`) is the correct server answer: nothing
was persisted, so there is no real denominator. `QuizResults` then treated it as the result. The
distinction that resolved it is between **whose number is real**: if `maxScore <= 0` there is no
denominator, so the local session is the only source. `usesLocalScore` says exactly that, applies to a
guest and to any attempt whose completion never lands, and gates the category breakdown's stub as well —
otherwise a guest would get a correct score beside an empty or fabricated breakdown.

### Challenge 5: Two registries, one contract, and a union that was never equal

`QuizAttemptType` was not the FE union: it carried `comprehension` and `qualification` (BE-only) and lacked
`audio-to-pinyin` / `audio-to-tone` (FE-only legacy aliases with no BE strategy). Making them "match" would
have meant inventing BE strategies for aliases that must never create an attempt. Instead the backend is
the deliberate superset of nine, and one comment in `modules/quiz/types/quiz.ts` records both sides and
lists the differences. The same comment states why `quizType` stays a pass-through `String`: the route
cannot reject an unknown type without breaking an FE alias.

### Challenge 6: `0` means two things, and dictation had to be character-level

The answer columns are NOT NULL, so a non-tone answer needs a sentinel; `0` is the natural one, and it is
_also_ the legal neutral tone. The rule that prevents a future misread is written into the encoding table
and pinned by test: consumers key off `category`/`quizType`, never off "tone === 0". Dictation then
inherited a scope limit from the schema — `Word` has no `metadata` column, so the bank anchors `Character`
rows and dictation is character-level in this epic. Deferring words was cheaper and more honest than adding
a column for one format.

### Challenge 7: Three input hazards in one view

`DictationQuestionView` had to survive a real learner's input method. Enter commits an IME candidate, so an
unguarded `onKeyDown` submits half a word — `formats/keyGuard.ts` (`isComposingKey`) is shared by all three
typed surfaces. A `disabled` replay button while audio plays drops focus to `<body>` mid-interaction, so the
button carries `aria-disabled` and guards its own handler (which required adding `aria-disabled` to the
shared `Button`). And a failed playback must not replace the question, so it is an inline retry rather than
a page `ErrorScreen`.

### Challenge 8: Where a seed's "right counts" actually lives

`scripts/verify/verify-seed-counts.ts` is a hardcoded expected-count map that has never held a Grammar row,
so adding 40 quiz items there would have asserted a count in a file that does not know the corpus.
Verification was therefore placed where the facts are: the seed suite asserts that every anchor resolves,
that the second run writes 0 rows, that the manifest's `entries` and `sha256` match the file bytes (both
recomputed), and that each bank's item count equals the number of anchors actually carrying it. The
`generatedAt` stamp moved in the same change, because a manifest that says "40" with a stale timestamp is
still a lie about the file.

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied
      verbatim): `quizAttempts: "/v1/quiz/attempts"`, `quizAttemptAnswer(id)`,
      `quizAttemptComplete(id)`, `quizConfig`, `quizQuestions`, `quizFeedback`, `quizSandhiDrill`.
- [x] Feature/module/component names verified against `apps/frontend/src/features/` (`quiz`) and
      `apps/backend/src/modules/` (`quiz`); every component name in this doc exists on disk.
- [x] Data source matches the backing code: the four formats read Postgres through Prisma
      (`GrammarExample`, `Character`, `TonePair`, `PinyinSyllable`), and the bank is an authored JSON
      file consumed at **seed** time, never at request time.
- [x] All relative markdown links resolve (`npm run check:doc-links` — no epic-26 file in the failure list).
- [x] Last Updated / `last-verified` is current (2026-10-31) in every file this epic created.

> PR / Merge Date stay `pending` until the branch merges; the key commits are literal and already pushed
> to `epic-26-practice-calibration`.

## Technical Implementation

### Architecture

```
/practices (Browse)
  QuizCard ── useQuizCard ── PHASE_CONFIGS ── getQuizzesUpToPhase(currentPhase)
      │                                        └─ tier (1 | 2) discriminates phase 4
      └─ one labelled CTA per assessment ── ?type=<id>

/practices/quiz?type=<id> (Focus, SESSION_QUERY_ROUTES)
  QuizSessionPage
    ├─ <p role="status" aria-live="polite" aria-atomic="true" class="sr-only">   ← the ONE live region
    │      ▲ quizSessionStore.announcement (start · verdict · advance · 30s/10s · time-up · completion)
    ├─ PageHeader(+Timer)
    ├─ QuizRouter ── QUESTION_VIEWS[strategyType]
    │     ├─ QuestionView | IMEQuestionView | MultipleChoiceView      (existing)
    │     ├─ ClozeQuestion        → ClozeQuestionView       (12 states)
    │     ├─ SentenceBuilderQuestion → SentenceBuilderView  (12 states, no drag)
    │     ├─ DictationQuestion    → DictationQuestionView   (13 states, no glyph)
    │     └─ ToneJudgmentQuestion → ToneJudgmentView        (12 states, no audio)
    └─ QuizProgressBar
         … RESULTS:
             value (score card · badge · timer · bar · breakdown)
             CompletionSlot(primary, secondary?)   ← ONE position-locked primary
             collapsible review (content, not an action)

POST /v1/quiz/attempts            optionalAuth → guest stub (no write) | registered → persisted
POST /v1/quiz/attempts/:id/answers optionalAuth → mock verdict      | registered → QuizAttemptAnswer
PUT  /v1/quiz/attempts/:id/complete optionalAuth → stub completion   | registered → real completion
         ▲ STRATEGY_MAP (9 ids) ── cloze | sentence-building | listening-dictation | tone-judgment
                                  └─ prefer metadata.quizFormats[] anchors, else generated corpus
```

### API Endpoints (if applicable)

The four formats reuse the existing quiz routes; no route was added, renamed or re-guarded.

`POST /v1/quiz/attempts` (`OptionalAuthGuard`)

- Body: `{ quizType: string, phase?: number }`. `quizType` is a pass-through `String`, so the four new ids
  need no validation change.
- Guest (`req.userId` undefined): `201` with `{ id, quizType, phase, userId: null, passed: false, createdAt }`;
  the service is **not** called.
- Registered: `201` with the persisted attempt, delegated with `req.userId`.

`POST /v1/quiz/attempts/:id/answers` (`OptionalAuthGuard`)

- Body: `{ questionIndex, pinyinInput, selectedTone, correctPinyin, correctTone, category }` — unchanged,
  which is why the encoding is a value convention.
- Guest: `200` with the locally evaluated verdict, no write. Registered: `200`, one `QuizAttemptAnswer` row.

`PUT /v1/quiz/attempts/:id/complete` (`OptionalAuthGuard`)

- Guest: `200` with the stub completion (`totalScore: 0, maxScore: 0, passed: false`), no write.
- Registered: `200` with the real completion.

`GET /v1/quiz/config` and `GET /v1/quiz/questions` (`OptionalAuthGuard`) return the four formats' config and
generated questions; `getRegisteredTypes()` now lists nine, so a config fetch for a new type resolves.

### Component Relationships

```
CompletionSlot (shared, registry: variants [])  ← used by QuizResults (feature-local)
        ▲
        └── Button variant="primary" | "ghost"   (aria-disabled added for in-flight locks)

QUESTION_VIEWS (Record<StrategyType, ComponentType>)
        ▲                    ▲
        │                    └── formats/*Question.tsx → formats/*View.tsx (feature-local, 12–13 stories each)
        └── QuizRouter (renders the map; `?? QuestionView` is unreachable for a typed id)

engine/constants.ts
   SELECT_ONE_STRATEGIES            ← QuizRouter-style dispatch decisions + FeedbackView
   AUTHORED_ANNOUNCEMENT_STRATEGIES ← quizSessionStore.submittedAnnouncement

content/seed/phase2/quiz-formats.json ──syncQuizFormats──▶ metadata.quizFormats[]
        ▲                                                        ▲
        └── manifest.json (entries + sha256)                     └── quizFormatBank.quizFormatFilter()
                                                                         (preferred by the 4 BE strategies)
```

## Code Review Outcome

A cross-cutting review pass ran on the finished branch and returned **CHANGES-REQUESTED** with two majors
and four minors. All six were addressed before the epic closed; the fixes are the branch's last commit.

| #   | Severity | Finding                                                                                                                                                                                                                                     | Resolution                                                                                                                                                                                                                                                                                            |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Major    | `CategoryBreakdown` rendered for every non-IME strategy, but it and the backend aggregator model only `pinyin`/`tones`/`pairs`/`rules` — a perfect cloze/dictation/tone-judgment/sentence-building run printed "0/5 (0%)" under a 5/5 score | The breakdown is gated to the formats whose categories it models (`QuizResults.CATEGORY_BREAKDOWN_STRATEGIES`, currently `audio-to-pinyin-tone`), and the spec's claim that no breakdown work was needed is corrected in [design.md §26.4.2](../../../apps/frontend/src/features/quiz/docs/design.md) |
| 2   | Major    | The scoped `:has()` focus ring was a `box-shadow`, which forced-colors drops, and the only remaining focus affordance was a 0×0 `opacity:0` input — no visible focus in Windows High Contrast                                               | A `@media (forced-colors: active)` block puts a real `outline` on the focused row (the pattern Spinner/Skeleton/ProgressBar already use); the comment now states why the utility class cannot reach this selector instead of claiming parity                                                          |
| 3   | Minor    | Dictation's local normalisation accepts multi-syllable tone digits (`ni3 hao3`) while the server's whole-string form rejects them — and the instruction advertised that exact example                                                       | The learner-facing copy and placeholder promise only the single-syllable case; the divergence is documented at `ListeningDictationStrategy.canonicalTranscription`, and word-level dictation remains deferred                                                                                         |
| 4   | Minor    | `PhaseTimelineEntry.state` / `stateLabel` were computed, exported and tested but never rendered — `QuizCard` re-derived its own vocabulary, and the two maps already disagreed                                                              | `QuizCard` renders `entry.stateLabel` verbatim, `STATE_WORDS` and the duplicate label map are deleted, and the hook's words are the single source                                                                                                                                                     |
| 5   | Minor    | The completion announcement asserted "Passed."/"Not passed." from the local score before `completeAttempt()` resolved, while `tierRules` can raise the server threshold — a screen reader could be told the opposite of the badge           | The announcement now states facts only ("Quiz complete. 9 of 10, 90 percent."); the verdict is the badge's job                                                                                                                                                                                        |
| 6   | Minor    | Two doc claims described test assertions that did not exist                                                                                                                                                                                 | Both assertions were added rather than the claims deleted: dictation now proves no answer glyph is on screen (`promptGlyph: "hide"`), and tone judgment proves selecting an option does not grade                                                                                                     |

The reviewer independently confirmed AC1, AC2, AC4 and AC5 against code and a real database, recomputed the
manifest hash (`7244e453…`) against the file bytes, and judged the "all four format views shipped under 26-4"
boundary acceptable — `QUESTION_VIEWS` is `Record<StrategyType, ComponentType>`, so a new union member cannot
exist without its component.

### Carry-forward (recorded, deliberately not fixed here)

- **`QuizAttemptType` still has no runtime counterpart.** The union is a type only; `quizType` stays a
  pass-through `String` because the FE carries legacy aliases the BE has no strategy for. Closing that
  needs the aliases retired first.
- **Word-level dictation.** `Word` has no `metadata` column, so dictation is character-level. A word-level
  bank needs either a migration or a different anchor column — an epic of its own, not a patch here.
- **A per-category bar for the practice formats.** `CategoryBreakdown` was gated rather than extended. A
  genuine per-format breakdown (correct/total per `cloze` / `sentence-building` / `dictation` /
  `tone-judgment`) needs the aggregator to learn those keys on both sides.
- **`verification-artifacts/` is gitignored.** The epic's five measurements live in
  `verification-artifacts/epic-26-practice-calibration.md` locally and are condensed into the
  [26-8 implementation](story-26-8-docs-verification-artifact.md), which is the committed record.
