---
purpose: The guest lane is pinned by tests — local score over the server stub, the register CTA as the only primary, no client auth branch, and four guest page stories
status: completed
last-verified: 2026-10-31
type: implementation
---

**Last Updated:** October 31, 2026

# Implementation 26-3: Guest Lane — Local Score and the Value Moment

> **BR Reference:** `docs/business-requirements/epic-26-practice-calibration/story-26-3-guest-lane-value-moment.md`
> **Epic Implementation:** [README.md](README.md)
> **Status:** Completed
> **Last Update:** October 31, 2026
> **Key Commit:** `972b12ac` (feat(epic-26): story-26-3 guest lane scores locally at the value moment)

## Implementation Summary

**Attribution, stated first because it is a real boundary and the commit split shows it.** The guest display
rule (`usesLocalScore`, the local `correct` / `passed`, the register-owned primary, `GUEST_NOTE`) shipped
inside the 26-2 results rebuild at `19f41699` — `QuizResults.tsx` does not appear in this commit's diff.
Splitting it out would have meant rebuilding the same region twice, so 26-2 carried the rule and this story
did the four things that turn a rule into a guarantee:

1. **`QuizResults.test.tsx` (new, 5 cases)** — the guest `0/0` regression driven through a _real_
   `completeAttempt`, plus the identity cases. Two describe blocks: "guest lane" and "registered identities".
2. **Guest copy in `PhaseGateBadge`** — "Great score. This result is not saved yet." / "Keep practicing.
   This result is not saved yet." The badge states the fact and does not repeat the pitch, because the slot
   already owns it.
3. **The store's guest case** — the deliberate non-branch, asserted: `createQuizAttempt` is called exactly
   once, the attempt id is the server's mock, every submit addresses that mock, and the session still
   reaches `RESULTS` with the correct local score.
4. **Four guest page stories** — `GuestResultsPassedCompleted` and `GuestResultsFailedCompleted` drive the
   real completion path (not a stubbed store), alongside the earlier `GuestResultsPassed` /
   `GuestResultsFailed` surface states.

Why the rule is correct rather than a workaround: a guest's completion is `{ totalScore: 0, maxScore: 0,
passed: false }`, which is the honest server answer — nothing was persisted, so there is no denominator.
The defect was reading a response with no denominator as if it were a result. `maxScore <= 0` is the
general test for "this response cannot be a score", and `isGuest` is the narrower one; the rule uses both so
a registered attempt whose completion never lands is also rescued.

## Technical Scope

Pin the guest lane's four promises and correct the guest copy; change no production logic beyond the badge.

**Files:**

- `apps/frontend/src/features/quiz/components/results/__tests__/QuizResults.test.tsx` — **NEW**: 5 tests
  (2 guest, 3 registered).
- `apps/frontend/src/features/quiz/components/results/PhaseGateBadge.tsx` — update: guest pass/fail copy
  states "not saved yet" instead of "Phase N unlocked".
- `apps/frontend/src/features/quiz/stores/__tests__/quizSessionStore.test.ts` — **NEW**: the guest
  completion case plus the three announcement cases from 26-2's contract.
- `apps/frontend/src/pages/practices/QuizPageFull.stories.tsx` — update: `GuestResultsPassed`,
  `GuestResultsFailed`, `ResultsWithSlot`, `ResultsZeroMisses`, `GuestResultsPassedCompleted`,
  `GuestResultsFailedCompleted`.

## Implementation Details

### The test that matters most

```typescript
it("renders a guest's local score after a real completeAttempt, never the stub's 0/0", async () => {
  // …answers 9 of 10 through the real store, then the real completeAttempt lands the stub…
  await vi.waitFor(() => expect(store().completionResult).toEqual(GUEST_STUB_RESULT));
  expect(screen.getByText("9/10 (90%)")).toBeInTheDocument();
});
```

The assertion holds _after_ the stub has landed — that ordering is the whole test. A faster version that
asserted before `completionResult` resolved would pass on the broken code too, because the stub is what
overwrote the score.

### The non-branch, asserted from the client side

```typescript
await useQuizSessionStore.getState().initialize("audio-to-pinyin-tone");
expect(quizService.createQuizAttempt).toHaveBeenCalledTimes(1);
expect(useQuizSessionStore.getState().attemptId).toBe("guest-mock-attempt");
await answerAll(true);
expect(useQuizSessionStore.getState().phase).toBe("RESULTS");
expect(useQuizSessionStore.getState().score).toBe(10);
```

The row-level half of the promise is deliberately not here: a store test mocks the service, so it could
not prove a row count. That lives at the controller boundary
(`quiz-nest.controller.test.ts` — the guest cases assert the service methods are never called). The two
halves are named in each file's header so neither is mistaken for the other.

### Identity → slot content

| Identity               | Primary                                                           | Ghost             | Note                                                               |
| ---------------------- | ----------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------ |
| Guest                  | Create an account to save your progress                           | Back to Practices | "This score is local to this tab and is not saved anywhere. …"     |
| Registered, missed > 0 | Review what you missed (`/practices/review?type=…&filter=recent`) | Back to Practices | "N of M answers were wrong. The review queue holds exactly those." |
| Registered, perfect    | Back to Practices                                                 | —                 | "Perfect score. Nothing to review."                                |

## Architecture Integration

```
useAuth().isAuthenticated ──▶ QuizResults.isGuest
                                 ├── usesLocalScore = isGuest || attemptMaxScore <= 0
                                 │      ├── score / totalQuestions / passed  (local)
                                 │      └── CategoryBreakdown (computed, not the stub)
                                 ├── CompletionSlot.primary   ← register route for a guest
                                 └── PhaseGateBadge(isGuest)  ← "not saved yet" copy

quizSessionStore.initialize ──▶ quizService.createQuizAttempt  (unconditional)
                                       │
                                       └── server: OptionalAuthGuard → stub, 0 rows (controller-tested)
```

## Technical Challenges & Solutions

```
Problem:  The obvious client fix — skip the attempt call for guests — would have removed the only
          client-side exercise of the server's zero-row guarantee, and would have put `useAuth` inside a
          store that has no other identity dependency.
Solution: keep the call unconditional and fix the DISPLAY. `usesLocalScore` decides whose number is real;
          the store stays identity-blind, and the server contract keeps being exercised on every guest run.
```

```
Problem:  `totalScore ?? score` and `maxScore ?? questions.length` looked defensive but were the bug: a
          zero is not an absence, and `??` cannot tell them apart.
Solution: test the denominator, not the field's presence — `attemptMaxScore <= 0` means "this response has
          no denominator, so it is not a score". The same predicate gates the stub `categoryBreakdown`,
          which otherwise rendered an empty breakdown beside a correct score.
```

```
Problem:  The guest page stories initially stubbed the store, so they rendered the slot without exercising
          the path that produced the score — a story that could stay green while the real path broke.
Solution: `GuestResultsPassedCompleted` / `GuestResultsFailedCompleted` drive the real completion path;
          the stub-style stories remain as surface states, and the naming separates the two.
```

## Testing Implementation

| Suite                            | Result                                                                                                                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `QuizResults.test.tsx`           | 5 tests: guest score after a real `completeAttempt`; one primary + one ghost and "nothing was saved"; one primary inside the slot with the ghost as a node; perfect-score exit only; heading focus + first Tab |
| `quizSessionStore.test.ts`       | 4 tests at this commit: three announcement classes + the guest completion path                                                                                                                                 |
| `QuizPageFull.stories.tsx`       | 6 states added/updated for the results region (incl. the two completed-path guest stories)                                                                                                                     |
| Frontend full suite (epic close) | 167 files / 1245 tests pass                                                                                                                                                                                    |

### Doc Truth-Check

- [x] No endpoint documented; the guest attempt route is named only as a contract reference
      (`POST /v1/quiz/attempts`, `ROUTE_PATTERNS.quizAttempts`).
- [x] Names verified on disk: `QuizResults`, `PhaseGateBadge`, `CompletionSlot`, `quizSessionStore`.
- [x] Data source: the guest attempt is a server-side mock with zero writes; the score is in-memory store
      state. Nothing is persisted for a guest.
- [x] Relative links resolve.
- [x] `last-verified` / Last Update = 2026-10-31.
