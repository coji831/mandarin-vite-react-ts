---
purpose: The guest practice lane scores from local state and hands its single primary to the register CTA, with no client auth branch and no server row
status: completed
last-verified: 2026-10-31
type: story
---

# Story 26.3: Guest Lane — Local Score and the Value Moment

**Last Updated:** October 31, 2026

## Description

**As a** guest,
**I want** the score I earned and one honest next step,
**So that** a good session shows me why an account is worth creating instead of showing me a fabricated zero.

## Business Value

A guest can sit any quiz. The backend is honest about what that means: `OptionalAuthGuard` returns a
session-local mock — `createQuizAttempt` answers `{ id, quizType, phase, userId: null, passed: false,
createdAt }` without calling the service, and `completeQuizAttempt` answers
`{ totalScore: 0, maxScore: 0, passed: false }`. No `QuizAttempt` row and no `QuizAttemptAnswer` row is
written.

The results surface then preferred that stub over its own state:

```
totalQuestions = completionResult?.maxScore ?? questions.length   // 0
correct        = completionResult?.totalScore ?? score            // 0
```

so a guest who answered 9 of 10 correctly read **"0/0 (0%) — Not passed"**. That is the worst possible
version of the funnel's value moment: the product tells a visitor they failed a quiz they passed, then
asks them to register. The stub was never wrong — reading it as if it were a real result was.

Two decisions follow. First, the **local** session wins whenever the completion cannot be trusted
(`isGuest || maxScore <= 0`), so the score shown is the score earned. Second, at the value moment the
slot's single primary becomes the persistence ask — "Create an account to save your progress" — because
a guest has no server-side review queue to offer and "Back to Practices" is the way out, not the next
step. The pitch is a `note` inside the same slot, never a second button, and the copy states the fact:
nothing was saved server-side.

## Acceptance Criteria

- [x] A guest's results show the score they actually earned, never the stub's `0/0`, and "passed" is
      computed from the local threshold. _Verified: `usesLocalScore`, `totalQuestions`, `correct`,
      `localPassed` and `passed` in `QuizResults.tsx`; `QuizResults.test.tsx` "renders a guest's local
      score after a real completeAttempt, never the stub's 0/0". **Attribution note:** the display rule
      itself shipped inside the 26-2 results rebuild (`19f41699`) — this story pinned it with tests, changed
      the guest copy and added the guest page stories, because the rule cannot be separated from the region
      that 26-2 rebuilt._
- [x] For a guest, the register CTA is the slot's single primary and "Back to Practices" is the ghost.
      _Verified: the `isGuest` branch of `primary`, `secondaryLabel = isGuest || missedCount > 0 ? "Back to
Practices" : null`; `QuizResults.test.tsx` "gives the guest exactly one primary and one ghost, and
      claims nothing was saved"._
- [x] The guest copy never claims the score was saved, and the guest badge states the fact without
      repeating the pitch. _Verified: `GUEST_NOTE` in `QuizResults.tsx`; `PhaseGateBadge` guest messages
      "Great score. This result is not saved yet." / "Keep practicing. This result is not saved yet."_
- [x] The client does **not** branch on authentication: `initialize` calls `createQuizAttempt` exactly
      once for a guest, uses the server's mock id, and the session completes from local state. _Verified:
      `quizSessionStore.test.ts` "asks for an attempt once — no client-side auth branch — and completes from
      local state" (asserts one call, `attemptId === "guest-mock-attempt"`, `phase === "RESULTS"`,
      `score === 10`, and that every submit used the mock id)._
- [x] A guest attempt writes **0** `QuizAttempt` and `QuizAttemptAnswer` rows. _Verified at the
      controller boundary: `quiz-nest.controller.test.ts` guest cases assert
      `mockQuizService.createQuizAttempt` / `submitAnswer` / `completeQuizAttempt` are **not called**, and
      the mock shapes carry `userId: null`. Measurement (a) in the verification artifact._
- [x] The local-score rule also rescues a registered attempt whose completion never lands
      (`maxScore <= 0`), and the category breakdown falls back to computing from local answers rather than
      rendering a stub breakdown. _Verified: `usesLocalScore` gates both the score and
      `CategoryBreakdown`'s `categoryBreakdown` prop._
- [x] Page stories cover the guest identities end to end through the real completion path. _Verified:
      `QuizPageFull.stories.tsx` `GuestResultsPassedCompleted`, `GuestResultsFailedCompleted` (plus
      `GuestResultsPassed` / `GuestResultsFailed` from the earlier surface pass)._

## Business Rules

1. **A stub is not a result.** Whenever the completion's denominator is not real, local state is the
   source of the score.
2. **Nothing is saved for a guest, and the copy says so.** No sentence on a guest surface may imply the
   attempt was persisted.
3. **The register CTA owns the value moment for a guest.** It is the slot's primary; the pitch is a note
   in the same slot, never a second button.
4. **The client never branches on auth.** The server's guard decides; the client only decides how to
   display what came back.
5. **Server-side demo counters are not here.** The guest quota is epic 29's; this story is client UX only.

## Related Issues

- **Epic 26: Practice Calibration** _(link to [`../epic-26-practice-calibration/README.md`](../epic-26-practice-calibration/README.md))_ (Parent)
- **Story 26.2: Completion Slot** _(link to [`story-26-2-completion-slot-position-locked-cta.md`](story-26-2-completion-slot-position-locked-cta.md))_ (Predecessor — the slot whose primary this story fills)
- **Epic 25: Secure Guest Identity & Route Gating** _(link to [`../epic-25-secure-guest-identity-and-route-gating/README.md`](../epic-25-secure-guest-identity-and-route-gating/README.md))_ (Predecessor — established the guest identity this lane consumes)
- **Epic 29** (Cost Gateway: demo quotas and the server-side guest counter) (Successor — owns server enforcement)

## Implementation Status

- **Status**: Completed
- **PR**: not yet opened (epic branch `epic-26-practice-calibration` unmerged)
- **Merge Date**: pending
- **Key Commit**: `972b12ac` (feat(epic-26): story-26-3 guest lane scores locally at the value moment) —
  tests, guest copy and page stories; the display rule itself is `19f41699` (26-2), recorded in the
  [implementation](../../issue-implementation/epic-26-practice-calibration/story-26-3-guest-lane-value-moment.md)
