---
purpose: CompletionSlot lands as the detail archetype's position-locked next-action region, the results column is reordered value then slot then review, and the session gains its single status region with focus management
status: completed
last-verified: 2026-10-31
type: implementation
---

**Last Updated:** October 31, 2026

# Implementation 26-2: Completion Slot — One Position-Locked Primary

> **BR Reference:** `docs/business-requirements/epic-26-practice-calibration/story-26-2-completion-slot-position-locked-cta.md`
> **Epic Implementation:** [README.md](README.md)
> **Status:** Completed
> **Last Update:** October 31, 2026
> **Key Commit:** `19f41699` (feat(epic-26): story-26-2 completion slot and one position-locked CTA)

## Implementation Summary

This is the built half of A26 — and only that half. The rail collapse and the `window.location.href` escape
hatch the amendment names were already gone (PR #61), so this commit changes one region of one page plus the
store field that feeds its live region. It does **not** touch `PageShell`, `PageStack`, `PageHeader`,
`QuizRouter` or `QuizProgressBar`.

What landed:

- **`CompletionSlot`** — a new shared component with a registry entry: `role="group"` + `aria-label`
  region name, one required `primary` ReactNode, at most two ghost/icon `secondary` nodes, an optional
  `note`, and `variants: []` (a closed set that is deliberately empty — one shape, identity decides the
  content). Its only CSS is the ≥768px row direction; positioning is static by construction.
- **`QuizResults` rebuilt onto it**, in the order value → slot → review. The ghost is passed _into_ the
  slot, so the old three-peer `flex-wrap` row cannot be reconstructed without editing the component.
- **One live region for the whole session** in `QuizSessionPage`, mounted empty and fed by
  `quizSessionStore.announcement`. Every other surface was audited for a second region and has none.
- **Focus management** across QUESTION → FEEDBACK → RESULTS: each surface focuses its own heading
  (`tabIndex={-1}`), never an action, so focus stops falling to `<body>` when a view is unmounted.
- **Timer urgency as words** ("0:25 left", "0:08 left, almost out", "Time's up!"), so the state does not
  depend on distinguishing two hues.

## Technical Scope

Name the completion region, rebuild the results column onto it, and give the session one announcement
source.

**Files:**

- `apps/frontend/src/shared/components/completion-slot/CompletionSlot.tsx` — **NEW**: the component.
- `apps/frontend/src/shared/components/completion-slot/CompletionSlot.css` — **NEW**: one breakpoint rule.
- `apps/frontend/src/shared/components/completion-slot/CompletionSlot.stories.tsx` — **NEW**: 5 states
  (`RegisteredWithMisses`, `RegisteredPerfect`, `Guest`, `CustomLabel`, `Edge`).
- `apps/frontend/src/shared/components/index.tsx` — update: export `CompletionSlot`.
- `.github/component-registry.json` — update: `CompletionSlot` entry (description, `importPath`,
  `variants: []`, `tokens: ["--space-md", "--size-touch"]`, storybook file + `states`, props).
- `apps/frontend/src/features/quiz/components/results/QuizResults.tsx` — update: value → slot → review,
  heading focus, `usesLocalScore` groundwork, note copy.
- `apps/frontend/src/features/quiz/stores/quizSessionStore.ts` — update: `announcement` written on start,
  submit, advance, timer threshold, time-up and completion; `announce(text)` for view-owned steps.
- `apps/frontend/src/features/quiz/types/session.ts` — update: `announcement: string` field, `""` at init.
- `apps/frontend/src/pages/practices/QuizSessionPage.tsx` — update: the single `role="status"` node.
- `apps/frontend/src/features/quiz/components/QuestionView.tsx`,
  `…/MultipleChoiceView.tsx`, `…/FeedbackView.tsx` — update: heading focus effects (prompt `<p>` → `<h2
tabIndex={-1}>`).
- `apps/frontend/src/features/quiz/components/Timer.tsx` — update: state words at both thresholds.
- `apps/frontend/src/shared/components/Button/Button.tsx` — update: `aria-disabled` prop (documented as
  "unavailable but operable — the consumer guards its own handler").

## Implementation Details

### The slot's contract, as the component enforces it

```tsx
<div role="group" aria-label={label} className="completion-slot flex-col gap-md">
  {note && <p className="font-sm text-secondary m-0 lh-normal">{note}</p>}
  <div className="completion-slot__primary flex flex-col gap-sm">{primary}</div>
  {secondary && <div className="flex flex-wrap items-center gap-md">{secondary}</div>}
</div>
```

"Exactly one primary" is not validated — it is unreachable. There is one `primary` prop, so a second
primary has nowhere to be rendered; the only CSS is `@media (min-width: 768px) {
.completion-slot__primary { flex-direction: row; } }`, which means the primary is a full-width stack on a
phone and a row above 768px without any width override touching the shared `Button`.

### Results order, and why the ghost moved

```
<div className="flex-col-center gap-lg">
  <h2 ref={headingRef} tabIndex={-1}>Quiz Complete</h2>        ← focus lands here on mount
  <Box variant={passed ? "pass" : "fail"}>…score · badge · timer · bar…</Box>
  <CategoryBreakdown … />            (value, not action)
  <CompletionSlot primary={…} secondary={…} note={note} />
  <Box as="details">…Review Answers…</Box>                      ← content, not action
</div>
```

`const secondaryLabel = isGuest || missedCount > 0 ? "Back to Practices" : null;` — a registered perfect
score gets **no** secondary, because "Back to Practices" would be the only action and inventing a second one
breaks the one-CTA law. The slot also renders no live region: the session owns the single one.

### The live region and its six sources

```tsx
<p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {announcement}
</p>
```

| Source          | Message (as composed in `quizSessionStore`)                                                      |
| --------------- | ------------------------------------------------------------------------------------------------ |
| session start   | `Session started. Question 1 of N.` (or `No questions available.`)                               |
| verdict         | `Correct. Tone 2.` / `Incorrect. The answer is …, tone ….` — or the strategy's authored sentence |
| advance         | `Question N of M.`                                                                               |
| timer threshold | `30 seconds left` / `10 seconds left`                                                            |
| time up         | `Time is up. Showing your results.`                                                              |
| completion      | `Quiz complete. X of Y, Z percent. Passed.` (or `Not passed.`) — composed **once**               |

The per-second value never enters the region; the visible `Timer` states it.

### Focus without autofocusing an action

`QuestionView` / `MultipleChoiceView` focus the prompt heading on `currentIndex` change;
`FeedbackView` focuses the verdict heading on mount; `QuizResults` focuses its `<h2>` on mount. The first
Tab from that heading reaches the slot's primary. `Button` gained `aria-disabled` in the same commit
because an in-flight lock expressed as `disabled` removes the focused control from the tab order and drops
focus — the exact failure the focus work was fixing.

## Architecture Integration

```
QuizSessionPage (owns the ONE role="status")
   ├── announcement ◀── quizSessionStore (single writer: start|verdict|advance|threshold|time-up|completion)
   ├── QuestionView / IMEQuestionView / MultipleChoiceView / formats/*   (heading focus, no live region)
   ├── FeedbackView                                                      (verdict heading focus)
   └── QuizResults                                                       (heading focus)
         └── CompletionSlot (shared, registry `variants: []`)
               ├── primary   ← identity rule (story 26-3 fills the guest leg)
               └── secondary ← at most one ghost
```

## Technical Challenges & Solutions

```
Problem:  A `role="status"` node that mounts WITH its text is not reliably announced, while a per-view node
          disappears when the view swaps — so the two obvious placements fail in opposite directions, and
          both fail silently.
Solution: one node in the session page, mounted empty for the whole session, with the store as its only
          writer. The store composes the completion line once at the RESULTS transition (the value from
          `completionResult` arrives later and would otherwise announce the same fact twice), and the timer
          contributes thresholds only.
```

```
Problem:  The component registry declares `variants: []` for an entry, and an empty variant list is easy to
          read as an omission — someone will "fix" it by adding variants.
Solution: the entry, the component header and the design spec all state that the closed set is empty BY
          DESIGN (one shape; identity decides the content), and the props are documented as
          `reactNode` so the entry reads as a slot contract rather than a button with missing variants.
```

```
Problem:  This commit shipped no test of its own.
Solution: recorded rather than glossed. The slot's guarantees were pinned in the following commit —
          `QuizResults.test.tsx` (5 cases: guest score, guest primary/ghost, one-primary-in-slot,
          perfect-score exit, heading focus + first Tab) and `quizSessionStore.test.ts` (announcement
          classes, completion composed once) — and the practice-format announcements in `26-5`. The
          consequence is stated in the epic record: the 26-2 diff is verified by the 26-3 and 26-5
          suites, not by a suite that landed with it.
```

## Testing Implementation

No test file is added by this commit; its behaviour is covered by the suites that follow it, and by the
design gates it was committed with.

| Suite / gate                      | Result at epic close                                                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `QuizResults.test.tsx`            | 5 tests, including "puts one primary inside the slot, with the ghost passed into it as a node" and "moves focus to the results heading, and the first Tab reaches the slot's primary" |
| `quizSessionStore.test.ts`        | announcement classes (start/verdict/advance, thresholds-not-ticks, completion once)                                                                                                   |
| `QuizPageFull.stories.tsx`        | `ResultsWithSlot`, `ResultsZeroMisses` (added in 26-3) + the four format stories (26-5)                                                                                               |
| `npm run check:registry-stories`  | PASS — 39 shared components                                                                                                                                                           |
| `npm run design-audit:foundation` | PASS — 0 page-anatomy findings                                                                                                                                                        |

### Doc Truth-Check

- [x] No endpoint documented — this story is frontend + registry.
- [x] Component names verified on disk: `CompletionSlot`, `Button`, `Timer`, `QuestionView`,
      `MultipleChoiceView`, `FeedbackView`, `QuizResults`, `QuizSessionPage`.
- [x] Data source: the announcement is in-memory store state; nothing is persisted.
- [x] Relative links resolve.
- [x] `last-verified` / Last Update = 2026-10-31.
