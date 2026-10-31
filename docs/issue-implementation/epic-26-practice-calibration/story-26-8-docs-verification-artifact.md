---
purpose: The committed record of the epic's five measurements, the as-built deltas per story, and the doc gates run at close, with no invented changelog entry
status: completed
last-verified: 2026-10-31
type: implementation
---

**Last Updated:** October 31, 2026

# Implementation 26-8: Docs and Verification Artifact

> **BR Reference:** `docs/business-requirements/epic-26-practice-calibration/story-26-8-docs-verification-artifact.md`
> **Epic Implementation:** [README.md](README.md)
> **Status:** Completed
> **Last Update:** October 31, 2026
> **Key Commit:** docs-only commit for story 26.8 on `epic-26-practice-calibration` (no production code)

> **Full local artifact (gitignored):** `verification-artifacts/epic-26-practice-calibration.md` — measured
> 2026-10-31 at `82305f24` with the verbatim command output. `verification-artifacts/` is gitignored by
> design (`verification-artifacts/README.md`), so **this document is the record that survives on `main`**.

## Implementation Summary

This story produced the epic's documentation and its evidence, and nothing executable.

**Files created:**

- `docs/business-requirements/epic-26-practice-calibration/` — `README.md` + eight `story-26-N-*.md`.
- `docs/issue-implementation/epic-26-practice-calibration/` — `README.md` + eight `story-26-N-*.md`.
- `verification-artifacts/epic-26-practice-calibration.md` — the five measurements with their commands
  (gitignored; condensed below).
- Index updates: an Epic 26 row in [`docs/business-requirements/README.md`](../../business-requirements/README.md).

**No production code changed.** No test changed. No `CHANGELOG.md` entry was written, because there is no
`CHANGELOG.md` in this repo (`Test-Path CHANGELOG.md` → false); the plan's "entry only if a path/rule/output
moved" rule therefore has nothing to attach to, and inventing a file to then write an entry in it would be
worse than skipping it.

## Technical Scope

Record the epic as built and measure its five claims.

**Files:**

- `docs/business-requirements/epic-26-practice-calibration/README.md` — **NEW**: epic BR (scope, the A26
  premise correction, six ACs with evidence pointers, the eight stories, decisions, risks, close criteria).
- `docs/business-requirements/epic-26-practice-calibration/story-26-{1..8}-*.md` — **NEW**: eight story BRs in
  the epic-25 shape (status, description, business value, ACs, business rules, related issues, implementation
  status).
- `docs/issue-implementation/epic-26-practice-calibration/README.md` — **NEW**: as-built record, per-story
  table, gate table, eight architecture decisions, eight technical challenges, component relationships,
  carry-forward.
- `docs/issue-implementation/epic-26-practice-calibration/story-26-{1..8}-*.md` — **NEW**: eight story
  implementations.
- `verification-artifacts/epic-26-practice-calibration.md` — **NEW** (gitignored): the five measurements.
- `docs/business-requirements/README.md` — update: Epic 25 and Epic 26 rows in the active-epics table (both
  were missing; see the note below).

## Implementation Details

### The five measurements, condensed

| #   | Claim                                                                        | Proof command                                                                                                                                                                     | Result                                                                                                                                                              |
| --- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a   | A guest attempt writes 0 `QuizAttempt` / `QuizAttemptAnswer` rows            | `npx vitest run src/modules/quiz/nest/__tests__/quiz-nest.controller.test.ts` (backend) + `npx vitest run src/features/quiz/stores/__tests__/quizSessionStore.test.ts` (frontend) | **PASS** — all four guest controller cases assert the service is never called; the store test asserts one attempt call, no auth branch, completion from local state |
| b   | 12 states × 4 formats exist as stories; storybook passes                     | export count per `formats/*.stories.tsx` + `npx vitest run --project storybook`                                                                                                   | **PASS** — 12 + 12 + 12 + 13 = **49** format stories; **70 files / 421 tests pass**                                                                                 |
| c   | Seed: 40 pins = manifest, 10/10/10/10, dangling-id rejected, re-run writes 0 | `npx vitest run tests/integration/quiz-format-seed.test.ts --config vitest.integration.config.ts` + a SHA-256 recompute                                                           | **PASS** — 9/9 unskipped; 40 items, 10 per bank; SHA-256 `7244e453…` matches the manifest                                                                           |
| d   | Phase aggregation                                                            | `npx vitest run src/features/quiz/hooks/__tests__/useQuizCard.test.tsx src/features/quiz/components/__tests__/QuizCard.test.tsx`                                                  | **PASS** — 14 + 4 tests (`phase <= currentPhase`, phase 3 non-empty, phase 4 ≠ phase 2)                                                                             |
| e   | One announcement region, six message classes, no per-view region             | `Select-String 'role="status"\|aria-live'` over `features/quiz/**` + `pages/practices/**`, then the store suite                                                                   | **PASS** — one code occurrence (`QuizSessionPage.tsx:55`), the rest are comments; six classes pinned by the store suite                                             |

Full command output, file/line evidence and the gate table are in the local artifact.

### As-built deltas worth recording (where the build differs from the plan)

1. **A26's premise was two-thirds stale.** The rail collapse and the `window.location.href` escape hatch were
   already gone (PR #61, `6e84c12e`). Only the completion slot was unbuilt. Recorded in the epic BR rather
   than quietly implementing a fix for a fixed defect.
2. **Story boundaries do not match commit boundaries, in two places.** The guest display rule
   (`usesLocalScore`, the register-owned primary) shipped inside 26-2's results rebuild and was **pinned** by
   26-3's tests. All four format view shells shipped in 26-4's commit; 26-5 supplied the dictation and
   tone-judgment tests, the authored-verdict announcement and the four page stories. Both are stated in the
   affected story docs, because a reader tracing a line to a commit must not be surprised.
3. **26-2 shipped no test of its own.** Its guarantees are verified by the 26-3 and 26-5 suites. Recorded as a
   gap rather than described as tested-on-arrival.
4. **Dictation is character-level.** `Word` has no `metadata` column, so the bank anchors `Character` rows.
   The signed-off decision (§26.7 item 3) is honoured; word-level dictation is deferred.
5. **The banks were seeded by the test, not by `prisma/seed.ts`.** The dev database was not re-seeded in this
   story; the loader was exercised by the integration suite, which restores the authored file afterwards.

### The indexes

- `docs/README.md` and `docs/coverage.md` are **generated** from leaf frontmatter (`scripts/generate-system-map.mjs`).
  The epic folders appear in the map only through a hardcoded include list in that generator
  (`include: /^(README\.md|epic-(24|41)[^/]*\/README\.md)$/`), so **epic 25 and epic 26 are not leaves of the
  map** and regenerating would not add them. That is recorded here as a doc-tooling mismatch rather than
  "fixed" by editing the generator inside a feature epic.
- `docs/business-requirements/README.md` is hand-authored and lists active epics; epic 25 was missing from it.
  Both finished epics are now listed, since listing only the new one would leave the table reading as if
  epic 25 never existed.

## Architecture Integration

```
docs/business-requirements/epic-26-practice-calibration/README.md
        ▲                                    │
        │ (BR ↔ impl, both directions)       ▼
docs/issue-implementation/epic-26-practice-calibration/README.md ── per-story implementations
        ▲                                                 │
        │                                                 ▼
apps/frontend/src/features/quiz/docs/design.md    verification-artifacts/epic-26-practice-calibration.md
   (the surface contract — referenced, never duplicated)      (local, gitignored)
```

## Technical Challenges & Solutions

```
Problem:  The plan asks for a "CHANGELOG entry only if a path/rule/output moved". This repo has no
          CHANGELOG.md at all.
Solution: verify the absence (Test-Path → false) and state that the rule is not applicable. Creating a
          changelog to satisfy a sentence in a plan would add a file nothing reads and start a second
          history that will drift from the docs.
```

```
Problem:  `docs/README.md` is a hard gate (`check:system-map`) and was already stale, and its epic include
          list is hardcoded to epics 24 and 41 — so the "list this epic the way epic-25 is listed" instruction
          had no target: epic 25 is not listed there either.
Solution: put the epic where a human-written index actually lives (`docs/business-requirements/README.md`,
          adding both 25 and 26), leave the generator alone, and report the hardcoded-include finding. Editing
          the generator inside a feature epic would change the map's shape for every epic folder, which is a
          decisions-level change and not this story's business.
```

```
Problem:  Two of seven commits' messages carried test counts the recorded selectors do not reproduce (e.g.
          "quiz + practices 162/162"), which makes a copied number in a doc unverifiable.
Solution: every count in these docs was re-measured at close with the exact command printed next to it. No
          intermediate count from a commit message is repeated.
```

## Testing Implementation

This story adds no tests; it re-runs the suites its claims depend on.

| Gate                     | Result                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Frontend full suite      | 167 files / 1245 tests pass                                                                 |
| Storybook                | 70 files / 421 tests pass                                                                   |
| Backend unit suite       | 60 files / 689 tests pass                                                                   |
| Backend type-check       | exit 0                                                                                      |
| Seed integration         | 9 tests pass (unskipped, real DB)                                                           |
| Quiz/progression parity  | 41 tests pass                                                                               |
| Design audit foundation  | PASS — 0 page-anatomy findings                                                              |
| Design audit full        | 219 errors / 420 warnings / 639 findings — main baseline; zero findings in any epic-26 file |
| `check:page-inventory`   | PASS — 20 entries (18 conforms, 2 diverges)                                                 |
| `check:registry-stories` | PASS — 39 components                                                                        |
| `check:doc-links`        | 135 unresolved, all pre-existing archive debt; none in an epic-26 file                      |
| `check:system-map`       | 2 pre-existing stale generated blocks; no drift added by these files                        |

### Doc Truth-Check

- [x] No endpoint is asserted anywhere in these docs that is not in `ROUTE_PATTERNS`
      (`quizAttempts`, `quizAttemptAnswer`, `quizAttemptComplete`, `quizConfig`, `quizQuestions`,
      `quizFeedback`, `quizSandhiDrill`).
- [x] Names and counts re-derived by listing the directories and counting exports.
- [x] Data source claims match the code (Prisma at request time; authored JSON at seed time only).
- [x] Every relative link resolves (`check:doc-links`).
- [x] `last-verified` / Last Update = 2026-10-31 in every file this story created.
