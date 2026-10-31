---
purpose: The completion region gets a name — CompletionSlot with one position-locked primary, the results reordered value then slot then review, and one session-level status region
status: completed
last-verified: 2026-10-31
type: story
---

# Story 26.2: Completion Slot — One Position-Locked Primary

**Last Updated:** October 31, 2026

## Description

**As a** learner finishing a session,
**I want** exactly one primary next step in a fixed place,
**So that** I never have to work out which of three buttons the app thinks is next.

## Business Value

This story is the built half of **A26**. The audit amendment named three defects under "quiz shell
chrome first": the rail standing open, the completion CTA living outside a completion slot, and a
`window.location.href` escape hatch. Measured at epic open, the first and third were already gone
(`AppLayout` collapses the rail by archetype; `window.location.href` occurs nowhere in the quiz feature).
The second was real.

`QuizResults` ended in a free-floating `<div className="flex-center gap-md flex-wrap">` row holding
"Review what you missed", "Back to Practices" and a guest persistence ask as visual peers, with the
primary chosen by an inline ternary. Under the one-task/one-CTA law that is a contract failure on two
counts: which action was primary moved with the score state (and with the viewport, since the row
wrapped), and the position of the primary was not fixed by anything.

The `detail` archetype already **declares** a `completion` region — "rating / next-action cluster at the
natural completion point" — and nothing in the 45-entry component registry implemented it. So the
region is now named once: `CompletionSlot`, a shared component with a closed (empty) variant set, whose
single `primary` ReactNode prop makes "exactly one primary" structural rather than policed. Four Focus
families in the plan (quiz, review, speaking, exam) need the same contract, so it is shared rather than
feature-local.

The story also fixes two silent accessibility failures in the same session:

- **No live region existed anywhere in the quiz feature.** An answer reveal was silent to a screen
  reader. The session now owns exactly one `role="status"` region, mounted empty and filled by the
  store.
- **Focus fell to `<body>`** on QUESTION → FEEDBACK → RESULTS, because the view that held focus was
  unmounted. Each surface now takes focus on its heading, and the first Tab from the results heading
  reaches the slot's primary.

## Acceptance Criteria

- [x] `CompletionSlot` exists as a shared component with a registry entry, a declared (empty) variant
      set, its tokens, and a story, and it is exported from `shared/components`. _Verified:
      `shared/components/completion-slot/CompletionSlot.tsx` + `.css` + `.stories.tsx`; registry entry
      `"CompletionSlot"` in `.github/component-registry.json` with `variants: []`, `tokens:
["--space-md", "--size-touch"]` and story states `default` / `with-action` / `edge`;
      `npm run check:registry-stories` PASS (39 shared components)._
- [x] The slot takes exactly one primary and at most two ghost/icon secondaries, named by a
      `role="group"` + `aria-label`, with static positioning only. _Verified: `CompletionSlotProps` has
      `primary: ReactNode` (required), optional `secondary`, `label` (default `"Next step"`), `note`;
      the component renders `role="group" aria-label={label}` and adds no positioning rule (the only CSS is
      the ≥768px row direction)._
- [x] `QuizResults` renders value → slot → review, and passes the ghost **into** the slot instead of
      making it a sibling. _Verified: `QuizResults.tsx` order is score card + badge + timer + bar, then
      `CategoryBreakdown` / score-by-type, then `<CompletionSlot primary=… secondary=…>`, then the
      collapsible review `<details>`; `QuizResults.test.tsx` "puts one primary inside the slot, with the
      ghost passed into it as a node"._
- [x] The registered identities decide the primary: missed answers → "Review what you missed"; a perfect
      score → "Back to Practices" with no ghost; a guest → the persistence ask (story 26.3). _Verified:
      the `primary` / `secondaryLabel` branches in `QuizResults.tsx`; `QuizResults.test.tsx` "offers only
      the way out on a perfect score"._
- [x] The session renders exactly one `role="status"` / `aria-live="polite"` / `aria-atomic="true"`
      node, mounted empty and fed by `quizSessionStore.announcement`; no per-view live region exists.
      _Verified: the single `<p role="status" …>` in `QuizSessionPage.tsx`; every other occurrence of
      `role="status"` under `features/quiz/**` and `pages/practices/**` is a comment. Measurement (e) in
      the verification artifact._
- [x] Focus is managed across QUESTION, FEEDBACK and RESULTS: the prompt heading takes focus on question
      change, the verdict heading on feedback, the results `<h2>` on entry, and the first Tab reaches the
      slot's primary. _Verified: `QuestionView`/`MultipleChoiceView` `promptRef` focus effects, the
      `FeedbackView` `verdictRef` effect, the `QuizResults` `headingRef` effect; `QuizResults.test.tsx`
      "moves focus to the results heading, and the first Tab reaches the slot's primary"._
- [x] Timer urgency carries a state word, not colour alone. _Verified: `Timer.tsx` renders `"0:25 left"`
      / `"0:08 left, almost out"` / `"Time's up!"` alongside the warning/danger classes._
- [x] The completion line is composed **once**, at the RESULTS transition, from local state. _Verified:
      `completionAnnouncement()` called at the two RESULTS transitions only; `quizSessionStore.test.ts`
      "composes the completion summary once, at the transition, from local state"._

## Business Rules

1. **One primary per viewport.** The slot holds one; a surface that mounts the slot may not also place a
   filled button beside it (`GuestUpsell` is deliberately not used in the completion position).
2. **Position is fixed by mount order, not by CSS.** The slot is the last action in the column, after
   the value and before the review content; it introduces no position, float, sticky or page CSS.
3. **Identity decides, the slot never chooses.** The slot renders what it is given; which identity owns
   the primary is a rule of the surface (story 26.3 for the guest leg).
4. **One live region per session.** The session owns it so a swapped view cannot double-announce or take
   the region away mid-session.
5. **An action is never autofocused.** Focus lands on the new surface's heading; the primary is one Tab
   away.

## Related Issues

- **Epic 26: Practice Calibration** _(link to [`../epic-26-practice-calibration/README.md`](../epic-26-practice-calibration/README.md))_ (Parent)
- **Story 26.1: Engine Truth** _(link to [`story-26-1-engine-phase-truth.md`](story-26-1-engine-phase-truth.md))_ (Predecessor — supplies the labels and the aggregated list)
- **Story 26.3: Guest Lane** _(link to [`story-26-3-guest-lane-value-moment.md`](story-26-3-guest-lane-value-moment.md))_ (Successor — fills this slot's primary for a guest)
- **Story 26.4/Q6-Q7 and 26.5/Q9-Q10** _(link to [`story-26-4-q6-cloze-q7-sentence-building.md`](story-26-4-q6-cloze-q7-sentence-building.md))_ (Successors — the formats built into the region this story repaired)
- **Epic 25: Secure Guest Identity & Route Gating** _(link to [`../epic-25-secure-guest-identity-and-route-gating/README.md`](../epic-25-secure-guest-identity-and-route-gating/README.md))_ (Predecessor — fixed the chrome half of A26)

## Implementation Status

- **Status**: Completed
- **PR**: not yet opened (epic branch `epic-26-practice-calibration` unmerged)
- **Merge Date**: pending
- **Key Commit**: `19f41699` (feat(epic-26): story-26-2 completion slot and one position-locked CTA)
