---
purpose: Design spec for strategy-pattern quiz sessions — phase-gated assessment across quiz modes
status: active
last-verified: 2026-10-30
type: design
---

# Feature: Quiz — Design Spec

**Last Updated:** 2026-10-30 (Epic 26 section added — see §26; body above is the reviewed 2026-07-01 baseline)
**Status:** Reviewed (baseline) · Specified (Epic 26, not implemented)

---

## Figma Reference

- **File:** (not yet linked — add Figma file URL here)
- **Frame:** Quiz Session (Wireframe Section 4.6)

---

## Layout

Quiz sessions use a single-page pattern with phase-based routing. All quiz types go through the same page and are distinguished by `?type=` query parameter.

| Route                             | Component         | Purpose                         |
| --------------------------------- | ----------------- | ------------------------------- |
| `/practices/quiz?type=<strategy>` | `QuizSessionPage` | Active quiz session             |
| `/practices/quiz`                 | `QuizPage`        | Fallback — no strategy selected |

---

## Architecture (Strategy Pattern)

The quiz system uses the **Strategy Pattern**:

- `QuizStrategy` interface in `types/engine.ts` defines the contract
- Strategies registered in `engine/strategies/quizStrategyRegistry.ts`:
  - `audio-to-pinyin-tone`, `ime-simulator`, `radical-gate`
- Each strategy implements `generateQuestions()` and `evaluateAnswer()`
- **Note:** `audio-to-type` and `pinyin-to-char` are **not** registered strategies — the registry contains only the three above. The tone-sandhi drill (`SandhiDrill`) is a **foundations widget** (`features/foundations/components/tones/SandhiDrill.tsx`) served by its own `GET /v1/quiz/sandhi-drill/questions` endpoint — an explicit non-registry exception, not a quiz strategy (Story 21.17)
- **Epic 26 delta:** the registry grows from 3 to 7 strategies — `cloze`, `sentence-building`, `listening-dictation`, `tone-judgment` join the three above. The delta, the archetype/anatomy for it, and the data contract are specified in §26; this list stays the as-built record until 26-4/26-5 land.

---

## Components

| Component            | Source                                            | Notes                                                             |
| -------------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| `QuizPage`           | `pages/practices/QuizPage.tsx`                    | Entry point — routes by `?type=` param                            |
| `QuizSessionPage`    | `pages/practices/QuizSessionPage.tsx`             | Session orchestrator with header + timer + progress               |
| `QuizRouter`         | Custom in `components/`                           | Phase-based view switch (LOADING→QUESTION→INPUT→FEEDBACK→RESULTS) |
| `QuestionView`       | Custom in `components/`                           | Standard question display                                         |
| `IMEQuestionView`    | Custom in `components/ime-input/`                 | IME simulator input view                                          |
| `MultipleChoiceView` | Custom in `components/`                           | Multiple choice for radical-gate strategy                         |
| `FeedbackView`       | Custom in `components/`                           | Answer feedback with explanation                                  |
| `QuizResults`        | Custom in `components/results/`                   | End-of-quiz score summary                                         |
| `CategoryBreakdown`  | Custom in `components/results/`                   | Per-category performance breakdown                                |
| `PhaseGateBadge`     | Custom in `components/results/`                   | Phase gate pass/fail badge                                        |
| `Timer`              | Custom in `components/`                           | Countdown timer per question                                      |
| `QuizProgressBar`    | Custom (composes `shared/components/ProgressBar`) | Score progress bar with pass/fail threshold                       |
| `QuizCard`           | Custom in `components/`                           | Question card wrapper                                             |
| `AudioPlayer`        | Custom in `components/`                           | Audio playback for aural questions                                |
| `AnswerInput`        | Custom in `components/`                           | Text input for pinyin/character answers                           |
| `PinyinToneInput`    | Custom in `components/inputs/`                    | Combined pinyin + tone input                                      |

### States (phase-based routing)

| Phase      | Component                                                 | Description                            |
| ---------- | --------------------------------------------------------- | -------------------------------------- |
| `LOADING`  | Spinner                                                   | Fetching questions from backend        |
| `QUESTION` | `QuestionView` / `IMEQuestionView` / `MultipleChoiceView` | Showing question + input               |
| `INPUT`    | Same as QUESTION                                          | (Second pass for multi-step questions) |
| `FEEDBACK` | `FeedbackView`                                            | Showing correct answer + explanation   |
| `RESULTS`  | `QuizResults`                                             | Score summary + pass/fail              |
| `ERROR`    | Error card                                                | Error message + retry button           |

---

## Shared Components Reused

| Component     | Source                          |
| ------------- | ------------------------------- |
| `Button`      | `shared/components/Button`      |
| `ProgressBar` | `shared/components/ProgressBar` |

---

## Design Tokens Used

### Colors

| Token   | CSS Variable      | Usage                             |
| ------- | ----------------- | --------------------------------- |
| Success | `--color-success` | Correct answer indicator          |
| Error   | `--color-error`   | Wrong answer indicator            |
| Primary | `--accent-fill`   | Interactive elements, phase badge |
| Warning | `--color-warn`    | Timer warning state               |
| —       | `--ink-1`         | Question text                     |
| —       | `--ink-2`         | Instructions, hints               |
| —       | `--card`          | Card backgrounds                  |

### Typography

| Element         | Class             | Size      |
| --------------- | ----------------- | --------- |
| Question        | `.font-lg`        | 16px      |
| Character glyph | `.font-4xl`+      | 36px+     |
| Timer           | `.font-xl fw-700` | 20px bold |
| Score           | `.font-xl`        | 20px      |

### Layout Classes

| Class                             | Usage                                             |
| --------------------------------- | ------------------------------------------------- |
| `.quiz-session-page`              | Page wrapper; `max-width: 700px` (defined in CSS) |
| `Box variant="dark"`              | Card surface for header, progress, quiz cards     |
| `.flex-col-center`                | Centered column                                   |
| `.gap-md` / `.gap-lg` / `.gap-xl` | Flex gaps                                         |
| `.p-xl`                           | Page padding                                      |

---

## Visual Acceptance Criteria

- [ ] Loading state shows spinner with "Loading quiz..." text
- [ ] Question view shows character/info + input area + timer + progress bar
- [ ] IME question shows IME input simulation
- [ ] Feedback view shows correct/incorrect + explanation
- [ ] Results view shows score, pass/fail badge, category breakdown
- [ ] Timer visually warns when time is low
- [ ] All colors reference CSS variables
- [ ] WCAG AA contrast ratios
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigable (Tab, Enter, number keys for options)
- [ ] Verified via Playwright browser screenshot

---

# Epic 26 — Practice Calibration: engine truth, guest lane, four formats

**Source:** `docs/planning/epics-25-40.md` §"Epic 26 — Practice Calibration" + §"2026 Audit Amendments" A26
**Design process:** `docs/guides/design/design-revalidation-guide.md` (Step 0 first) → `docs/guides/design/per-epic-design-spec.md`
**Status:** specified, not implemented (2026-10-30). Implementation order = §26.5 story table.
**Scope guards:** no new page, no new route, no page-scoped layout CSS, no new token, no Prisma migration, no restyle of a surface outside the quiz lane.

---

## 26.0 Step 0 — Revalidation verdict (mandatory; run 2026-10-30)

Surfaces in scope:

| ID  | Surface                                                                    | What it is today                                                                                                                                                                                                                                           |
| --- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | `/practices/quiz` with **no** `?type=` — the entry                         | `QuizPage` → `PageShell archetype="empty"` → `PageStack` → `EmptyState` with one CTA (`QuizPage.tsx:44-60`). Declared `empty`/Browse in `pageChrome.ts:85` and in `.github/page-inventory.json` (`measure: empty`, `header: null`).                        |
| S2  | `/practices/quiz?type=<strategy>` — the session                            | `SESSION_QUERY_ROUTES` promotes the route to `detail`/Focus once `type` is present (`pageChrome.ts:124-131,149-157`). `QuizSessionPage` composes `PageShell archetype="detail"` → `PageStack` → `PageHeader`(+`Timer`) → `QuizRouter` → `QuizProgressBar`. |
| S3  | the results / completion region inside S2                                  | `QuizResults` — score card, breakdown, then a **free-floating** `<div className="flex-center gap-md flex-wrap">` action row (`QuizResults.tsx:171-187`).                                                                                                   |
| C1  | `QuizCard` — an in-scope **component**, host surface `/practices` (Browse) | CTA label/type derive from `quizzes[0]` and the phase number; the timeline shows no current marker once the current phase is passed (`QuizCard.tsx:61-62,77`).                                                                                             |

Per-item verdict (the 7 contract items of the revalidation guide):

| #   | Contract item                                                | S1   | S2          | S3                            | C1              | Evidence                                                                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------ | ---- | ----------- | ----------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Correct archetype                                            | PASS | PASS        | PASS (inherits S2's `detail`) | n/a (component) | `pageChrome.ts:85` (`empty`) + `SESSION_QUERY_ROUTES` (`detail`); ledger row conforms; `QuizSessionPage` passes `archetype="detail"` to `PageShell`.                                                                                                                                                                     |
| 2   | Correct mode (Browse vs Focus)                               | PASS | PASS        | PASS                          | n/a             | Entry = Browse (rail expanded, standard bar); session = Focus. One route, two surfaces, resolved by query — the ratified pattern.                                                                                                                                                                                        |
| 3   | Correct chrome + **exactly one position-locked primary CTA** | PASS | PASS        | **FAIL**                      | **FAIL**        | Chrome half now passes (rail collapse + recessed bar, `AppLayout.tsx:82-84,117-127`). S3 fails the _position_ half: the primary is one node in a wrap row that also carries ghost siblings and (for guests) the persistence pitch — nothing fixes its position. C1's CTA is a card-level label, not a completion action. |
| 4   | No third mode (session ≠ modal; modal ≠ session host)        | PASS | PASS        | PASS                          | n/a             | Session is a routed `detail`, bounded (10 questions), has progress (`QuizProgressBar`) and a completion action → the classifier says session. No `<Modal>` in `features/quiz/**`; **no `window.location.href` anywhere in the feature** (A26's "escape hatch" premise is stale — all exits use `useNavigate`).           |
| 5   | One task, one CTA (no sibling spread, no stacked primaries)  | PASS | PASS        | **FAIL**                      | **FAIL**        | S3: `Review what you missed` / `Back to Practices` / `Create an account…` sit as peers in one row, and which is primary is decided inline in the component (`QuizResults.tsx:81-97`). C1: the card offers one CTA for a phase that has **two** assessments, always the first.                                            |
| 6   | Anatomy law (PageShell → PageStack → PageGrid; no page CSS)  | PASS | PASS        | PASS                          | n/a             | S1/S2 already compose the primitives; `Quiz.css` holds component classes only (`.quiz-question`, `.quiz-results__card`, …) — no `max-width`, no `margin: auto`, no grid template.                                                                                                                                        |
| 7   | Fundamentals & a11y                                          | PASS | **PARTIAL** | **PARTIAL**                   | **PARTIAL**     | Contrast/tokens/focus are green; **no live region anywhere in the quiz feature** (`role="status"` / `aria-live` absent) so an answer reveal is silent to a screen reader; `useQuizCard` has **zero tests**; the timeline's current marker is icon-only with no text alternative for "passed".                            |

**Verdict.**

- **S1 — PASSES all 7 → evolves in place.** No rebuild. It gains nothing structural in this epic (the format list lives on Practices' `QuizCard`, not here); the only change is that its `EmptyState` copy stays true once phases ≤ current are aggregated.
- **S2 — PASSES the structural items (1–6) → evolves in place.** One a11y delta (item 7): the session gains the persistent answer announcement region (§26.2.4). The four new formats are **new surfaces built to spec** inside this passing shell — nothing greenfield about the shell itself.
- **S3 — FAILS items 3 and 5 → the completion region is rebuilt**, but rebuilt **inside the existing Focus shell**: `PageShell(detail)` / `PageStack` / `PageHeader` / `QuizRouter` / `QuizProgressBar` all stay; the shell now passes, so this is not a greenfield page.
- **C1 — FAILS items 3, 5, 7 → the card body is rebuilt as a component** (data correctness + one labelled CTA per assessment), on the same Browse surface.

Rework boundary applied (`design-revalidation-guide.md` §"Rework-from-scratch boundary"): **kept** = tokens, `--page-measure-*`, `PageShell`/`PageStack`/`PageGrid`, the `session-query` chrome rule, `QuizSessionPage` orchestration, `QuestionView`/`IMEQuestionView`/`MultipleChoiceView`, the `QuizStrategy` interface and `AnswerResult`. **Rebuilt** = the completion region (§26.2), the `QuizCard` body, the guest branch of results. **Never touched** = `content/` corpus, ADRs, gated-green anatomy/a11y/tests.

---

## 26.1 Per-epic design spec — Epic 26

```
Source: BM-1 (§P1–P5 lane rows) + epic-26 ACs 1–6 + A26
archetype: detail
provenance: none
anatomy: shell: PageShell | measure: detail | gutter: default | header: PageHeader
```

`provenance: none` — no external borrow. The only exemplar this spec reads is **in-repo**: the North Star `ReviewView` completion cluster (`page-archetypes.md` §3 `golden-template`). Nothing is copied from outside the repo, so the External Borrowing Protocol has nothing to record.

### 1. User flow

**Registered learner:** Practices (`/practices`, Browse) → the phase card lists **every** assessment for phases ≤ current → pick one → `?type=<id>` (Focus; rail collapsed, one task) → 10 questions (per-format surface) → per-question reveal (announced) → RESULTS: score card + breakdown → **completion slot**: primary = _Review what you missed_ (or _Back to Practices_ on a perfect score), secondary ghost = _Back to Practices_ → next session.

**Guest learner:** same entry, same session, same question surfaces, same score card — **the score is real** (session-local, no server row). At the completion slot the single primary is the **persistence ask** (_Create an account to save your progress_), secondary ghost = _Back to Practices_. What they think: "I scored 7/10 and it will vanish when I close the tab." → the slot is the moment to convert. Nothing is gated to produce that moment.

**Entry with no `?type=`** (deep link, bad param): unchanged — `EmptyState`, one CTA back to Practices. A deep link to an **unregistered** id also lands here (see §26.4.4), so the fallback must stay honest.

### 2. Preview / reward split

The Practices card is a **preview** and must stay one: phase label, the assessment names, one CTA per assessment, and the timeline. It carries **no** question, no answer affordance, no score. The session is the only place a question exists. Delta for C1: the preview gets _more_ honest (aggregated phases, correctly labelled CTA per assessment), not denser.

### 3. States — the 12-state set

The component model requires 12 states per surface (`epics-25-40.md:43,61`); **the canonical enumeration is not written anywhere in the repo**, so this epic declares the set it will use. Every new surface renders all 12, and each maps to a Storybook story + MSW mock (§26.3 table):

| #   | State           | Meaning for a quiz surface                                                  |
| --- | --------------- | --------------------------------------------------------------------------- |
| 1   | `default`       | Question displayed, nothing chosen yet                                      |
| 2   | `hover`         | Pointer over an option/token (colour only; no motion, no lift)              |
| 3   | `focus-visible` | Keyboard focus ring (`--focus-ring`), focus order = visual order            |
| 4   | `active`        | Option pressed (pointer/keyboard)                                           |
| 5   | `selected`      | Chosen but not submitted                                                    |
| 6   | `disabled`      | Input locked while an answer is in flight; commit disabled when incomplete  |
| 7   | `submitting`    | Optimistic answer in flight; double-submit guarded                          |
| 8   | `pass`          | Reveal: correct (`Box variant="pass"`, text + icon, never colour alone)     |
| 9   | `fail`          | Reveal: incorrect, plus the correct answer and the strategy's explanation   |
| 10  | `empty`         | Bank exhausted / zero questions → `EmptyState` with one way out             |
| 11  | `error`         | Generation or submit failure → `ErrorScreen` with retry                     |
| 12  | `edge`          | 320px reflow, over-long sentence wrap, autoplay blocked, rapid repeat input |

### 4. Component reuse map

Reference archetype **`detail`** (`page-archetypes.md` §3). Deltas only:

| Need                      | Registry component                                                                                      | New?                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Page column + measure     | `PageShell archetype="detail"` (620px)                                                                  | reuse (already mounted)                                 |
| Section rhythm            | `PageStack size="default"`                                                                              | reuse                                                   |
| Header + timer            | `PageHeader` + feature-local `Timer`                                                                    | reuse                                                   |
| Progress + threshold      | `ProgressBar` (via `QuizProgressBar`)                                                                   | reuse                                                   |
| Task card (flat)          | `Box variant="dark"`                                                                                    | reuse                                                   |
| Reveal surface            | `Box variant="pass" \| "fail"`                                                                          | reuse                                                   |
| Single-select options     | `RadioGroup` (already the MC primitive — `MultipleChoiceView.tsx:10,44-50`)                             | reuse                                                   |
| Fill blank                | `Box variant="dashed"` (dashed slot, already in the Box variant set)                                    | reuse                                                   |
| Sentence tokens           | `Chip interactive` + `active` (`aria-pressed`)                                                          | reuse                                                   |
| Tone picker               | `RadioGroup` (5 options: neutral + 1–4)                                                                 | reuse                                                   |
| Metadata pills            | `Badge`, `Chip`                                                                                         | reuse                                                   |
| Empty / error             | `EmptyState`, `ErrorScreen`, `LoadingScreen`, `Spinner`, `Skeleton`                                     | reuse                                                   |
| Icons                     | `Icon` (`aria-hidden` when decorative, `label` when meaningful)                                         | reuse                                                   |
| **Completion region**     | **none exists** — declared spec-first as `CompletionSlot` (§26.2)                                       | **new shared component**                                |
| Per-format question views | `ClozeQuestionView`, `SentenceBuilderView`, `DictationQuestionView`, `ToneJudgmentView` (feature-local) | new, feature-local (no duplication of a registry entry) |

Checked for duplication before declaring anything new: `Box`, `Card`, `Chip`, `RadioGroup`, `EmptyState`, `GuestUpsell`, `ProgressBar`, `Badge`, `Button`, `Icon`, `PageShell`/`PageStack`/`PageGrid`, `Grid`, `FilterChip`, `Tabs`, `ToggleSwitch`, `Input`, `Textarea`. **`GuestUpsell` is deliberately not used in the completion position** — it ships its own CTA, and mounting it next to the slot would put two primary actions in one viewport; it stays the dashboard/entry upsell it was built for.

### 5. Token map

**Zero new tokens.** Every element resolves to an existing token or an existing registry variant — full accounting in §26.6.

### 6. A11y checklist (WCAG 2.2 AA)

- **Answer reveal is announced.** One persistent, visually hidden `role="status"` / `aria-live="polite"` / `aria-atomic="true"` node lives in the session (`Class sr-only`, precedent: `HubSheet.tsx:231`). It is **mounted at `QUESTION` and filled at `FEEDBACK`** — a region that mounts _with_ its text is not reliably announced.
- **Colour is never the only signal.** Reveal uses `Box variant="pass"/"fail"` + `Icon` with `label` + text ("Correct" / "Incorrect — the answer is …").
- **Keyboard, no pointer-only path.** Every interaction reachable by Tab; `RadioGroup` keeps arrow-key selection; the sentence builder is operable with Tab + Enter alone (see §26.3 Q7 — no drag anywhere).
- **Focus order = visual order**; focus returns to the task card on question advance, and to the slot's primary when the results surface mounts.
- **Touch ≥ `--size-touch` (28px)** on every option, token, and control; tokens grow, never shrink.
- **320px reflow** with no horizontal scroll (`revalidate` in story `edge`); long sentences wrap, the token bank wraps to multiple rows.
- **Contrast on token pairs only** — `text-*` on `--surface-*`; no raw hex (`design-audit`: `hardcoded-color`).
- **One saturated fill per viewport.** The per-question commit or the completion primary is the only `primary` fill on screen; everything else is `ghost`/`icon`.

### 7. Data-resilient shell (ADR-002)

Fixed frame, inner scroll, chrome never scrolls: `PageShell`/`PageStack` keep the frame; the results column is the scrolling content. **Skeletons use final dimensions** (`Skeleton` with the score-card dimensions, not a spinner swap). The completion slot is the **last child of the page column** — it does not float, does not stick, introduces no positioning CSS; it simply cannot move relative to the summary because nothing is inserted above it after mount.

### 8. AI-codegen inputs

`DESIGN.md` + `apps/frontend/src/styles/globals.css` + `.github/component-registry.json` + `.github/page-inventory.json` + `docs/guides/ui-composition.instructions.md` + **Golden Template** = `features/review/components/ReviewView` (North Star, `detail`). Component truth = Storybook MCP; **never invent a component** — the only new shared name in this epic is `CompletionSlot`, and it lands in the registry before use (§26.2.5).

### 9. Acceptance

Story tests pass (one per state per format) · `npm run design-audit:foundation` green · `npm run check:page-inventory` green · `npm run check:registry-stories` green (covers `CompletionSlot`) · `npm run check:design-parity` green (no token drift) · axe clean on each format's `default` + `fail` story · 22-criteria rubric pass at epic close · verification artifact written (§26.5, `26-8`).

---

## 26.2 The completion-slot contract

### 26.2.1 The decision

**`CompletionSlot` — a new shared component** (`shared/components/completion-slot/CompletionSlot.tsx`, registry entry `CompletionSlot`). It is mounted as a child of `PageStack` in the results view.

Rejected alternatives, and why:

| Option                                | Verdict | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A `PageShell` prop (`completion={}`)  | **No**  | `PageShell` is the generic measure+pad primitive — the one surface whose contract is "the archetype's measure and the page pad, nothing else" (`component-registry.json` → `PageShell`). A completion slot is _session_ semantics; putting it there would let any Browse page mount one, and would make the anatomy ledger describe behaviour it does not gate.                                                                                                                        |
| A `PageStack` child _as the contract_ | **No**  | This is literally today's shape: a `div` that happens to be a child of `PageStack`. Being a child buys rhythm, not **position lock** — the exact thing item 3 of the contract fails. Rhythm stays with `PageStack`; it is not the contract.                                                                                                                                                                                                                                            |
| A new shared component                | **Yes** | The `detail` archetype **already declares** a `completion` region ("rating / next-action cluster at the natural completion point", `page-archetypes.md` §3) and **no registry entry implements it**. Four Focus families in the plan need the identical contract (quiz 26, review 28, speaking 36, exam 37) — the batch rule in `per-epic-design-spec.md` names this family explicitly. Not inventing a duplicate: nothing in the 45-entry registry encodes "one primary at task end". |

### 26.2.2 Contract (closed set — no variants)

```
CompletionSlot
  props:
    primary:   ReactNode   REQUIRED — exactly one Button variant="primary"
    secondary?: ReactNode  one Button variant="ghost" | "icon" (at most two)
    label?:    string      default "Next step" — the group's accessible name
  anatomy: role="group" aria-label={label}; children stacked with gap-md
  responsive: one row at ≥768px; stacked, full-width primary at <768px
  positioning: static. No position, no float, no sticky, no page-scoped CSS.
  order: always the LAST child of the page column, after the value (score/breakdown)
         and before optional secondary content (the collapsible answer review).
```

"Exactly one primary" is **structural, not policed**: the primary is a single `ReactNode` prop, so there is no second primary slot to fill. That is the whole point of naming the region — the old failure was three peers in a flex-wrap row.

### 26.2.3 Who owns the primary (identity rule)

| Learner                    | Primary (position-locked)                                         | Secondary (ghost) | Why                                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ----------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registered, missed > 0     | Review what you missed → `/practices/review?type=…&filter=recent` | Back to Practices | The next _session_ is the reward loop; it is the learner's real next step.                                                                                                                                                                                                                                           |
| Registered, perfect        | Back to Practices                                                 | —                 | Nothing to review; inventing a second action is forbidden by the one-CTA law.                                                                                                                                                                                                                                        |
| **Guest**                  | **Create an account to save your progress**                       | Back to Practices | This is the value moment (L1): the score is on screen and provably local. A guest has **no** server-side review queue until epic 28, so the learner's only honest next step is persistence. This reverses today's decision to demote the pitch to a ghost — reversed _because_ the ghost row is what fails item 3/5. |
| Guest, `type` unregistered | (cannot occur)                                                    | —                 | An unregistered `?type=` renders the S1 entry, never a results surface.                                                                                                                                                                                                                                              |

Everything else on the results surface — the collapsible **Review Answers** `<details>`, the category breakdown, the score-by-type list — is **content, not an action**, and sits after the slot.

### 26.2.4 Session-level announcement region (a11y delta, item 7)

`QuizSessionPage` renders, once, as a child of `PageStack`:

```jsx
<p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {announcement}
</p>
```

`announcement` comes from `quizSessionStore` (a `string` set on submit/advance: `"Correct. Tone 2."` / `"Incorrect. The answer is ní hǎo, third tone then third tone."` / `"Question 4 of 10."`). Mounted empty at `QUESTION`, filled at `FEEDBACK`. No new CSS (`.sr-only` exists, `globals.css:1043`), no new component, no new token.

### 26.2.5 Registry entry (lands in 26-2, before the component is used)

`CompletionSlot` in `.github/component-registry.json`: `description` (one line: the `detail` archetype's position-locked next-action region), `props` exactly as §26.2.2, **`variants: none`** (closed set is empty — one shape, identity decides the content), `tokens: [--space-md, --size-touch]`, and a story so `check:registry-stories` passes. Feature-local views never take a `primary` prop of their own; they render the slot.

---

## 26.3 Per-format surfaces (Q6, Q7, Q9, Q10)

Shared rules for all four: one submit per question via the existing store signature `submitAnswer(primary: string, tone: number)`; optimistic local evaluation then the `FEEDBACK` phase; **the `QuizStrategy` interface and `AnswerResult` are unchanged** (the answer channel is the two-argument call — see §26.4.2); every view renders the 12 states of §26.1 item 3; the per-question commit sits at the **bottom of the task `Box`**, which is the `detail` archetype's CTA position.

### 26.3.1 Dispatch must be fixed first

`MULTIPLE_CHOICE_STRATEGIES` is declared **twice** (`QuizRouter.tsx:18`, `FeedbackView.tsx:34`) as `new Set(["radical-gate"])`. With four new formats, two of which are single-select, this duplication silently routes a cloze question through `QuestionView` (audio + pinyin input) — the format would render as the wrong exercise. Delta for 26-4: replace both sets with one exported `SELECT_ONE_STRATEGIES` (`radical-gate`, `cloze`, `tone-judgment`) in `engine/constants.ts`, and replace `QuizRouter`'s if-chain with a `QUESTION_VIEWS: Record<StrategyType, ComponentType>` map so a new format cannot be added without naming its view.

### 26.3.2 Q6 — Cloze (`cloze`)

- **Interaction model:** sentence with one blanked segment; **choose one of four** tokens. Keyboard: `RadioGroup` arrow keys + Tab + Enter/Space to commit; number keys `1–4` select. Touch: options are full-width rows ≥ `--size-touch` (28px), stacked below 768px.
- **Question surface shows:** the pattern's `name`/`structure` as a one-line context `Badge`; the sentence with the blank rendered as `Box variant="dashed"` (fixed inline width, wraps at 320px); an English gloss line; the option list. No audio.
- **Feedback / announcement:** on commit the blank fills with the chosen token inside `Box variant="pass"|"fail"`, the correct token appears inline on fail, and the announcement region says `"Correct. 我打人。"` / `"Incorrect. The answer is 把."` The explanation is the pattern's `explanation` (already authored).
- **Reuse vs new:** new feature-local `ClozeQuestionView`; primitives = `Box(dashed)`, `RadioGroup`, `Badge`, `Icon`. Nothing shared is invented.
- **12 states:** `default` blank dashed, options enabled · `hover` option tint · `focus-visible` ring on the focused option · `active` pressed option · `selected` option shows `aria-pressed`/checked + blank echoes the token · `disabled` options locked while submitting · `submitting` optimistic lock, commit spinner · `pass` blank filled, success edge · `fail` blank filled with the choice, correct token shown · `empty` bank has no items for this phase → `EmptyState` + one CTA · `error` generation failed → `ErrorScreen` + retry · `edge` over-long sentence wraps, 320px, rapid re-tap while locked.

### 26.3.3 Q7 — Sentence building (`sentence-building`)

- **Interaction model:** **tap-to-place, keyboard-first. Drag is not implemented and is not a fallback path** — the registry has no DragDrop/Sortable entry, and a pointer-only assembly step would fail 2.1.1/2.5.7. Tab through the word bank, Enter appends the token to the answer row; Tab into the answer row, Enter (or the token's ✕ `icon` button) removes it. Explicit `Move left` / `Move right` `icon` buttons on the focused answer token give ordering without drag. Commit = `primary` "Check" at the bottom of the card; `ghost` "Reset" clears the row.
- **Question surface shows:** the target meaning/gloss (never the answer sentence), the word bank as `Chip interactive` tokens (shuffled, stable order per question id), and the answer row as an `<ol>` whose items are chips with a remove control.
- **Feedback / announcement:** the answer row becomes `Box variant="pass"|"fail"`; on fail the canonical order renders underneath as a token row. Announcement: `"Added 我, position 1 of 4."` on each add, then `"Correct."` / `"Incorrect. The correct order is 我 打 人."`
- **Reuse vs new:** new feature-local `SentenceBuilderView`; primitives = `Chip(interactive, active)`, `Box(pass|fail|dashed)`, `Button(primary|ghost|icon)`, `Icon`. No new shared component (a sortable list is a _format_, not a system primitive — if epic 36 needs one, it lands there with an ADR, not here).
- **12 states:** `default` empty answer row + full bank · `hover` chip tint · `focus-visible` ring on the focused chip/answer item · `active` chip press · `selected` chip leaves the bank, appears in the row (`aria-pressed` true, bank copy disabled) · `disabled` commit disabled until ≥1 token, locked while submitting · `submitting` lock + spinner · `pass` row framed pass · `fail` row framed fail + canonical order · `empty` no bank items → `EmptyState` · `error` → `ErrorScreen` · `edge` 8-token sentence at 320px (bank wraps, row scrolls, no horizontal page scroll), rapid add/remove.

### 26.3.4 Q9 — Listening dictation (`listening-dictation`)

- **Interaction model:** audio plays on demand (never autoplays), learner **types** the transcription in the existing `AnswerInput`, Enter submits, `icon` "Replay" (with an accessible label including the replay count). Keyboard-only path: Tab to Replay → Tab to field → type → Enter. Touch ≥28px on Replay and the field.
- **Question surface shows:** `AudioPlayer` (existing, TTS from the row's glyph — the glyph is **never printed**; `promptGlyph: "hide"`), the instruction line, the replay affordance, the field. Tone digits are accepted (`ni3 hao3`), matching the existing audio strategy's normalisation.
- **Feedback / announcement:** pass/fail `Box` with typed answer vs expected (tone marks rendered from the corpus), the `displayPinyin` line, and announcement `"Correct. nǐ hǎo."` / `"Incorrect. It was nǐ hǎo, third tone then third tone."`
- **Reuse vs new:** new feature-local `DictationQuestionView`; **every** part is existing — `AudioPlayer`, `AnswerInput`, `Box`, `Button(icon)`. Deliberately thin: dictation is `QuestionView` minus the glyph plus a replay count, so if `QuestionView` can host a `replayCount` slot the view can be folded into it at implementation (engineer's call, recorded in the impl doc).
- **12 states:** `default` idle, replay available · `hover` replay tint · `focus-visible` ring on replay/field · `active` replay pressed (playing indicator) · `selected` typed text present, submit enabled · `disabled` field locked while submitting; submit disabled when empty · `submitting` lock + spinner · `pass` typed text framed pass · `fail` typed text framed fail + expected shown · `empty` bank empty → `EmptyState` · `error` TTS/network failure → inline error + Replay retry (not a page-level `ErrorScreen`; the question survives) · `edge` autoplay blocked (no autoplay attempted), 0.5× device, rapid Enter, 320px.

### 26.3.5 Q10 — Tone judgment (`tone-judgment`) — a distinct format, not an `audio-to-tone` sub-mode

- **What makes it distinct (the AC's requirement):** `audio-to-tone` is **perception from audio** — hear a syllable, name its tone. `tone-judgment` has **no audio at all**: the learner reads a **written** phrase in tone-marked pinyin, sees the sandhi rule it triggers, and must state the **surface** tone of one marked syllable — i.e. it exercises the _rule_, not the ear. Different stimulus (written, no TTS), different corpus anchor (`ToneRule` + grammar example), different phase (`1`), different failure mode (a learner who hears perfectly can still fail it). It is a Phase-1 _format_.
- **Interaction model:** `RadioGroup` with five options — neutral `0`, `1`, `2`, `3`, `4` — selected by arrow keys or number keys `0–4`, committed with Enter. Touch ≥28px per option. (Single-select primitive is shared with Q6/`radical-gate`; the format is not.)
- **Question surface shows:** the rule `Badge` (`rule-3rd-sandhi`); the phrase with the target syllable bracketed and visually weighted; the base (dictionary) tones of every syllable; the question "what tone does 你 surface as here?". The answer is never pre-revealed by the bracketed rendering.
- **Feedback / announcement:** `Box variant="pass"|"fail"`, the surface-tone sequence for the whole phrase revealed on both outcomes (it _is_ the teaching moment), plus the rule's `title`. Announcement: `"Correct. 你 becomes second tone before 好."` / `"Incorrect. It is second tone: ní hǎo."`
- **Reuse vs new:** new feature-local `ToneJudgmentView`; primitives = `RadioGroup`, `Badge`, `Box(pass|fail)`, `Chip` (non-interactive, per-syllable tone display). No audio components.
- **12 states:** `default` question + 5 options · `hover` option tint · `focus-visible` ring · `active` pressed · `selected` chosen tone shown in the bracketed slot · `disabled` locked while submitting · `submitting` spinner · `pass` whole-phrase surface tones revealed · `fail` same reveal + chosen vs correct · `empty` bank empty (no rule-anchored items) → `EmptyState` · `error` → `ErrorScreen` · `edge` 320px (five options stack), a phrase where base tone already equals surface tone (no change), rapid re-select.

### 26.3.6 Q8 — comprehension authoring rule (P2; applied when Q8 ships in epic 28)

Every comprehension (Q8) question set MUST carry **at least one typed answer** — a question the learner produces rather than selects — so the set tests production, not only recognition (P2). The rule constrains the authored set, not the format: the typed item reuses `AnswerInput` and the existing `submitAnswer(primary, tone)` channel. Epic 28 enforces it per set; Epic 26 only records it in the bank's `_comment` (`content/seed/phase2/quiz-formats.json`).

---

## 26.4 Data & contract notes (architect → engineer)

### 26.4.1 The four strategy ids

| Format                 | id                    | Phase | Corpus anchor                       | FE `StrategyType` | BE registry | `promptGlyph` |
| ---------------------- | --------------------- | ----- | ----------------------------------- | ----------------- | ----------- | ------------- |
| Q6 cloze               | `cloze`               | 3     | `GrammarExample` (+ its pattern)    | add               | add         | `show`        |
| Q7 sentence-building   | `sentence-building`   | 3     | `GrammarExample` (segments)         | add               | add         | `show`        |
| Q9 listening-dictation | `listening-dictation` | 2     | `Character` / `Word` (audio target) | add               | add         | `hide`        |
| Q10 tone-judgment      | `tone-judgment`       | 1     | `GrammarExample` + `ToneRule`       | add               | add         | `show`        |

Registration is three literals that must stay in step: FE `QUIZ_STRATEGIES` (`quizStrategyRegistry.ts:15-19`), FE `StrategyType` (`types/engine.ts:10`), BE `getStrategy`/`getRegisteredTypes` (`strategies/registry.ts:18-27,33-42`) — the BE file rebuilds the **same 5-key literal twice**; collapse it to one `const STRATEGY_MAP` and derive `getRegisteredTypes()` from it. Also widen BE `QuizAttemptType` (`types/quiz.ts:21`) — it is currently **not** the FE union (`comprehension`/`qualification` are BE-only); make BE the superset and note the mapping in the impl doc rather than pretending they match.

### 26.4.2 Answer payload — encoded onto the existing columns (no migration)

`QuizAttemptAnswer`'s five answer columns are already NOT NULL and the FE wire payload (`quizService.submitAnswer`) already sends **exactly** `{questionIndex, pinyinInput, selectedTone, correctPinyin, correctTone, category}`. So the encoding is a **value convention on existing columns**, not a schema change:

| Format                   | `pinyinInput`                                     | `selectedTone`                             | `correctPinyin`               | `correctTone`         | `category`          |
| ------------------------ | ------------------------------------------------- | ------------------------------------------ | ----------------------------- | --------------------- | ------------------- |
| Q6 `cloze`               | the filled token                                  | `0` (unused sentinel — column is NOT NULL) | expected token                | `0`                   | `cloze`             |
| Q7 `sentence-building`   | ordered tokens joined by a **single ASCII space** | `0`                                        | canonical order, same join    | `0`                   | `sentence-building` |
| Q9 `listening-dictation` | the transcription as typed (trimmed)              | `0`                                        | expected pinyin (tone-marked) | `0`                   | `dictation`         |
| Q10 `tone-judgment`      | the syllable judged                               | chosen tone `0–4`                          | correct syllable              | expected surface tone | `tone-judgment`     |

Consequences that must be written into the impl, not discovered later:

- `QuizAttempt.quizType` is an unconstrained `String` (`schema.prisma:276`) → the new ids persist with no migration and no enum.
- `selectedTone`/`correctTone` are NOT NULL → the `0` sentinel is the encoding for "not a tone answer"; `0` is already a legal value (neutral tone), so a reader must key off `category`/`quizType`, never off "tone = 0".
- `category` is NOT NULL and is set to the format id (`cloze`, `sentence-building`, `dictation`, `tone-judgment`). **Correction (code review, 2026-10-30):** `CategoryBreakdown` and the backend `computeCategoryBreakdown` model only `pinyin` / `tones` / `pairs` / `rules`, and the aggregator silently drops every other key — so the results screen must NOT render the breakdown for the four new formats. It is gated to `audio-to-pinyin-tone` (`QuizResults.CATEGORY_BREAKDOWN_STRATEGIES`); a per-category bar for the practice formats, if wanted, is its own change.
- `correct: Boolean` stays server-derived.
- `QuizAttempt.metadata Json?` is the free slot for format provenance (`{ format, bankVersion }`); widening the FE `metadata` type is FE-only (`Json?` already accepts it).
- **No `response Json?` column, no `StrategyType` Prisma enum, no `QuizAttemptAnswer` reshape.** If a future format needs a structured payload, that is its own epic with an ADR.

### 26.4.3 Curated banks — authored JSON, no new table

**No new table, no migration.** The bank is an authored JSON **selection layer** over the corpus that already exists, consumed at seed time; the corpus stays the single source of truth and the answers are _derived from the anchored row_, never duplicated into the bank. Justification in one sentence: `GrammarExample` already stores per-segment `{text, pinyin, gloss}` and `Character`/`Word` already store `pinyin` + glyph, which is every field Q6/Q7/Q9/Q10 needs, so a question table would duplicate the corpus and create a second place for pinyin to drift.

Persistence path is the **existing `metadata Json` column of the anchor row** — `GrammarExample.metadata` (cloze, sentence-building, tone-judgment) and `Character.metadata` (dictation, since `Word` has no metadata column and adding one is out of scope). Shape, following the grammar precedent (`content/seed/phase2/grammar-patterns.json` → `prisma/seed.ts:505-518` → manifest → `tests/integration/grammar-seed.test.ts`):

```jsonc
// content/seed/phase2/quiz-formats.json
{
  "_comment": "Epic 26 curated quiz banks — a SELECTION layer over the corpus. Each item names an anchor row that already exists; the answer is DERIVED from the anchor at read time (never duplicated here). Seeded into the anchor row's metadata.quizFormats[] by apps/backend/prisma/seed.ts. Authoring rule for Q8 comprehension (epic 28): >=1 typed answer per set (P2).",
  "banks": {
    "cloze": [
      {
        "id": "clz_0001",
        "exampleContentId": "gr_0001_ex1",
        "blankSegmentIndex": 1,
        "category": "cloze",
      },
    ],
    "sentence-building": [
      { "id": "sbo_0001", "exampleContentId": "gr_0001_ex2", "category": "sentence-building" },
    ],
    "listening-dictation": [
      { "id": "dct_0001", "characterId": "ch_25105", "phase": 2, "category": "dictation" },
    ],
    "tone-judgment": [
      {
        "id": "tsj_0001",
        "exampleContentId": "gr_0002_ex1",
        "targetSegmentIndex": 0,
        "ruleId": "rule-3rd-sandhi",
        "category": "tone-judgment",
      },
    ],
  },
}
```

Seed + verification duties (26-7):

1. `prisma/seed.ts` reads the file, **resolves every anchor** (`exampleContentId` → `GrammarExample`, `characterId` → `Character`) and fails loudly on a dangling id — the bank can never point at a row the corpus dropped.
2. Writes `metadata.quizFormats[]` on the anchor row; **idempotent** (second run writes 0 rows, same contract as `syncGrammar`).
3. `content/seed/manifest.json` gains one `phase2` entry (`entries` + SHA-256 of the file bytes, and a bumped `generatedAt`). **There is no manifest generator script in the repo** — this entry is part of the seed change, computed, not hand-waved. `scripts/verify/verify-seed-counts.ts:12-38` is a hardcoded expected-count map with no Grammar rows today, so verification is **not** a new count there: assert instead that (a) every anchor resolves, (b) the second seed is a no-op, (c) each bank's item count matches the manifest entry — as `tests/integration/quiz-format-seed.test.ts`, mirroring `grammar-seed.test.ts`.
4. Strategy read path: `generateQuestions()` selects anchors whose `metadata.quizFormats` contains the strategy id for the phase, deterministically ordered (the anchor's `sortOrder` then id) — same no-runtime-JSON-read rule the grammar seed states.

### 26.4.4 Route contract (and the silent-fallback trap)

`?type=` is validated through the strategy registry (`QuizPage.tsx:37-40`, `parse: (raw) => raw && getStrategy(raw) ? raw : null`). An **unregistered** id therefore renders the S1 `empty` entry with no error — a typo or a not-yet-registered format looks like "no quiz selected". Registering the FE strategy is the switch that makes the route a session; a story/e2e must assert `?type=cloze` mounts a session (not the entry), so this cannot regress silently in either direction.

### 26.4.5 Guest lane

- Identity is `useAuth()`; **no new gate**. `quizSessionStore.initialize` keeps calling `createQuizAttempt` unconditionally — the server's `OptionalAuthGuard` returns a mock and **writes no row** (`quiz-nest.controller.ts:104-117,203-205`). Keeping the call (rather than branching on auth in the client) is deliberate: it exercises the server contract that L1 relies on; the verification artifact records "0 `QuizAttempt`/`QuizAttemptAnswer` rows for a guest attempt".
- **Real defect to fix (26-3):** `QuizResults.tsx:67-72` reads `completionResult?.maxScore ?? questions.length` / `completionResult?.totalScore ?? score`. A guest's mock completion is `{totalScore: 0, maxScore: 0, passed: false}`, so a guest who scored 9/10 renders **`0/0 (0%)` — not passed**. Rule: for a guest (or whenever `maxScore <= 0`) the _local_ store values win —
  `totalQuestions = isGuest || !completionResult?.maxScore ? questions.length : completionResult.maxScore`,
  `correct = isGuest ? score : (completionResult?.totalScore ?? score)`,
  `passed = isGuest ? (passThreshold != null && pct >= passThreshold * 100) : (completionResult?.passed ?? …)`.
  A guest must never see a failure badge that a server stub invented.
- The value moment is the score card + the slot's single primary (§26.2.3). Server-side demo counters are epic 29 — **not** here.

---

## 26.5 Story slicing

Order justified by dependency, not by size: truth first (26-1) so nothing downstream renders a mislabelled phase; the A26 residual next (26-2) so the four formats are never built into the failing completion region; the guest lane third (26-3) because it is a defect fix in the region 26-2 just rebuilt; formats in two pairs (26-4, 26-5) to reuse the cloze/option primitives before the second pair; the BE contract (26-6) can run parallel from the start but lands before seeded banks are consumed; banks (26-7) last-but-one because they need the registered ids; docs/verification closes (26-8).

| Story  | Scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Rough AC      | Depends on                                        |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------- |
| `26-1` | **Engine truth.** `PHASE_CONFIGS[3]` added (with its format mapping); key-4 dedupe (Phase-4 entries gain the `tier: 2` discriminator + a test asserting phase 4's `quizzes` ≠ phase 2's); `useQuizCard` aggregates `p <= currentPhase`; `QuizCard` rebuilt: one labelled CTA **per** assessment, current/passed/later markers that keep a current marker after a pass, text alternative for the state; `useQuizCard` unit tests (zero exist today).                                     | AC1           | —                                                 |
| `26-2` | **Completion slot + one position-locked CTA (A26 residual).** `CompletionSlot` registry entry + component + story; `QuizResults` rebuilt onto it; session-wide `role="status"` announcement region (§26.2.4); results order = value → slot → review.                                                                                                                                                                                                                                    | AC1, AC6, A26 | `26-1` (labels/aggregation)                       |
| `26-3` | **Guest lane + value moment.** Guest branch of the slot (register owns the primary); the `0/0` results defect fixed by the guest rule (§26.4.5); no-row-for-guest evidence; copy review (no "sign up" wall, no false "saved").                                                                                                                                                                                                                                                          | AC2           | `26-2` (slot owns the primary)                    |
| `26-4` | **Q6 cloze + Q7 sentence-building.** `SELECT_ONE_STRATEGIES` centralised + `QUESTION_VIEWS` dispatch map; `ClozeQuestionView`; `SentenceBuilderView` (tap-to-place, no drag); feedback branches; 24 stories (12 states × 2).                                                                                                                                                                                                                                                            | AC3 (a)       | `26-1`; `26-7` for seeded data (fixtures unblock) |
| `26-5` | **Q9 listening-dictation + Q10 tone-judgment.** `DictationQuestionView`; `ToneJudgmentView` (written sandhi, no audio — distinct from `audio-to-tone`); 24 stories.                                                                                                                                                                                                                                                                                                                     | AC3 (b)       | `26-4` (shared dispatch + primitives); `26-7`     |
| `26-6` | **BE contract + persistence.** 4 strategies registered BE; `STRATEGY_MAP` de-duplicated; `QuizAttemptType` widened + FE/BE union documented; submit/complete accept the four ids and persist the §26.4.2 encoding; registered-user persistence test; `quizType String` unchanged.                                                                                                                                                                                                       | AC4           | `26-1` (ids)                                      |
| `26-7` | **Curated banks + seed verification.** `content/seed/phase2/quiz-formats.json`; seed writes `metadata.quizFormats[]` idempotently with anchor resolution; manifest entry (count + SHA-256 + `generatedAt`); `tests/integration/quiz-format-seed.test.ts`; Q8 ≥1-typed-answer authoring rule recorded for epic 28 (P2).                                                                                                                                                                  | AC5           | `26-4`, `26-5`, `26-6`                            |
| `26-8` | **Docs + verification artifact.** This spec's status flipped to implemented with the as-built deltas; `QuizPageFull.stories.tsx` inventory note (only `pages/**/*Full.stories.tsx` is collected — the 17 existing stories stay the page gate, format stories live beside their views); verification artifact with the 5 measurements (guest 0 rows, 12 states × 4 formats, seed counts, phase aggregation, announce-region evidence); CHANGELOG entry only if a path/rule/output moved. | AC6 + close   | all                                               |

---

## 26.6 Token budget

**Token freeze applies (`design-reasoning.md` §0 / ADR-005) and NO new token is needed.** Nothing in this epic requires a value that does not exist:

| Need                        | Resolves to                                                                  |
| --------------------------- | ---------------------------------------------------------------------------- |
| Page measure 620            | `--page-measure-detail` via `PageShell archetype="detail"`                   |
| Section rhythm / item gaps  | `PageStack` rhythm + `--space-md`/`--space-lg` (registry `gap-*` classes)    |
| Touch targets               | `--size-touch` (28px) — every option, chip, replay and remove control        |
| Blank/answer slot treatment | `Box variant="dashed"` — existing variant, no border token invented          |
| Reveal colours              | `--color-success` / `--color-error` through `Box variant="pass" \| "fail"`   |
| Tone/category pills         | `Badge`, `Chip` variant sets                                                 |
| Focus ring                  | `--focus-ring` (global `:focus-visible`)                                     |
| Visually hidden region      | `.sr-only` (`globals.css:1043`)                                              |
| Corner radii                | `--radius-sm/md/lg/pill` (currently 0 — the Night Bench register, unchanged) |

If implementation discovers a genuine gap, the path is the ADR route (`DESIGN.md` + `globals.css` + `design-audit` + gate #14/#15), and it is **not** part of this epic. New CSS is limited to component classes in `Quiz.css` (`.quiz-cloze__*`, `.quiz-sentence__*`, …): no `max-width`, no `margin: auto`, no `grid-template-columns` at page scope (`design-audit`: `page-scoped-layout-css` / `page-scoped-grid` / `missing-layout-token`).

---

## 26.7 Open decisions (human sign-off before 26-1 lands)

**Signed off 2026-10-30 — all three proposals accepted as written, recorded here so 26-1 can land:**
(1) the phase → format mapping below is the product-wide meaning of "a Phase N quiz"; (2) the guest's
completion slot is owned by the register CTA, and the pitch is never a second button; (3) dictation is
character-level in this epic, words deferred.

1. **Phase → format mapping.** Proposed: Phase 1 = `tone-judgment` (+ `audio-to-pinyin-tone`); Phase 2 = `listening-dictation` (+ `ime-simulator`, `radical-gate`); Phase 3 = `cloze` + `sentence-building`; Phase 4 = the Phase-2 formats at `tier: 2`. This is what makes `PHASE_CONFIGS[3]` non-empty and key-4 non-duplicate, and it decides what "a Phase 3 quiz" means product-wide. Alternative: keep Phase 4 on the reading/grammar formats and give Phase 3 the dictation.
2. **Guest primary ownership.** Making the register CTA the single primary on results reverses the current deliberate choice to demote it to a ghost. Accept = the value moment outranks "Back to Practices" for a guest with no review queue; reject = the guest's slot primary stays _Back to Practices_ and the pitch moves to the score card as content (never a second button).
3. **Dictation scope.** Characters (`Character.metadata`, no migration) vs words (`Word` has no metadata column, so words need a new table or a deferred migration). Proposed: characters now, words deferred — the smaller option, at the cost of dictation being character-level in this epic.
