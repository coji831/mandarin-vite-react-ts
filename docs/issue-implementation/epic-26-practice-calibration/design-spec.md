---
purpose: "Epic 26 design spec: revalidation, per-epic spec, completion slot"
status: completed
last-verified: 2026-10-31
type: implementation
audience: agents
---

# Epic 26 design spec: revalidation, per-epic spec, completion slot

> Extracted from `apps/frontend/src/features/quiz/docs/design.md` on 2026-10-31
> (was 64,262 B against a 32,505 B leaf cap). Epic 26 is closed.mats

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
