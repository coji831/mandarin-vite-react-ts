---
purpose: The epic's as-built record and its five measurements are written against shipped code, with relative links that resolve and no invented changelog entry
status: completed
last-verified: 2026-10-31
type: story
---

# Story 26.8: Docs and Verification Artifact

**Last Updated:** October 31, 2026

## Description

**As the** next workstream,
**I want** the epic's claims measured and recorded against shipped code,
**So that** the evidence is auditable without re-running the pipeline.

## Business Value

Seven stories of behaviour produced a set of claims that are easy to state and easy to get wrong: that a
guest writes no rows, that twelve states exist per format, that the banks resolve, that phases aggregate,
and that the announcement region is singular. Each of those is a promise the roadmap will build on — epic
28 assumes the guest lane and the completion slot; epic 29 assumes the guest attempt is unpersisted. A
promise recorded as prose and never measured is a promise the next epic will silently break.

This story therefore does three things and nothing else:

- **Records the as-built state** for every story — what changed, which file, what was decided, and what
  the commit's own message claimed, checked against the code rather than copied.
- **Measures the five claims** with the command or test that proves each one, in
  `verification-artifacts/epic-26-practice-calibration.md` (that directory is gitignored by design) and
  condensed into committed docs so the record survives on `main`.
- **Leaves the design spec where it is.** `apps/frontend/src/features/quiz/docs/design.md` is the
  authoritative surface contract and was written before the code; this story does not rewrite it, it
  records where the build agrees and where it diverges.

It also refuses a false obligation: the repo has **no** `CHANGELOG.md`, so no changelog entry was invented.
The rule the plan cites ("CHANGELOG entry only if a path/rule/output moved") has nothing to attach to here.

## Acceptance Criteria

- [x] An epic BR and one story BR per story exist, linked bidirectionally with the epic implementation and
      each story implementation. _Verified: this directory's eight story files plus [`README.md`](README.md),
      and the eight files under
      [`docs/issue-implementation/epic-26-practice-calibration/`](../../issue-implementation/epic-26-practice-calibration/README.md).
- [x] The as-built record names the real files and the real decisions, including the A26 premise correction
      (the rail collapse and the `window.location.href` hatch were already fixed by PR #61; the unbuilt half
      was the completion slot). _Verified against `AppLayout.tsx` (`isFocusMode`), a repo-wide search for
      `window.location` (no hit under `features/quiz/**` or `pages/practices/**`), and `QuizResults`'s
      pre-story action row as described in the design spec's Step 0 table.
- [x] Five measurements are recorded, each with the command or test that proves it: guest writes 0 rows;
      12 states × 4 formats exist and the storybook suite passes; the seed's 40 pins and manifest agreement;
      phase aggregation; the single announcement region. _Verified: `verification-artifacts/epic-26-practice-calibration.md`
      and the condensed tables in the [26-8 implementation](../../issue-implementation/epic-26-practice-calibration/story-26-8-docs-verification-artifact.md)._
- [x] Every relative link in the new docs resolves, and the system-map gate is run. _Verified:
      `npm run check:doc-links` — no unresolved link in a file this story created; `npm run check:system-map`
      — no drift introduced by these files (the two pre-existing drift failures and the archive link debt are
      recorded as pre-existing, with their counts)._
- [x] No `CHANGELOG.md` entry is invented. _Verified: `Test-Path CHANGELOG.md` at the repo root is false; the
      rule is therefore not applicable, and that is stated rather than silently skipped._
- [x] No production code is changed by this story. _Verified: this story's diff is docs-only._

## Business Rules

1. **A claim needs a command.** Every measurement names the test or command that produces it.
2. **No invented endpoints, names, counts or dates.** Every identifier is copied from the code.
3. **Relative links only, and they must resolve.**
4. **The design spec is referenced, never duplicated.** It is the surface contract; these docs record the
   build against it.
5. **A gitignored artifact is not the committed record.** The essential evidence is condensed into tracked
   docs.

## Related Issues

- **Epic 26: Practice Calibration** _(link to [`../epic-26-practice-calibration/README.md`](../epic-26-practice-calibration/README.md))_ (Parent)
- **Stories 26.1–26.7** (Predecessors — every claim this story measures)
- **Epic 25: Secure Guest Identity & Route Gating** _(link to [`../epic-25-secure-guest-identity-and-route-gating/README.md`](../epic-25-secure-guest-identity-and-route-gating/README.md))_ (Precedent — the docs + artifact pattern this story follows)
- **Story 26.6: Backend Format Contract** _(link to [`story-26-6-backend-format-contract.md`](story-26-6-backend-format-contract.md))_ (Sibling — the measured contract)

## Implementation Status

- **Status**: Completed
- **PR**: not yet opened (epic branch `epic-26-practice-calibration` unmerged)
- **Merge Date**: pending
- **Key Commit**: docs commit for story 26.8 on `epic-26-practice-calibration` (docs only, no production code)
