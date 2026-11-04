---
name: phase-business-requirements
description: "Phase 1 of the lifecycle: an epic's business requirements — the README, one story file per story with an AC and a status, and the BR/implementation name pairing."
user-invocable: true
---

# Phase 1 — Business requirements

Output is `docs/business-requirements/epic-<num>-<slug>/README.md` plus one
`story-<epic>-<story>-<short>.md` beside it, mirrored under `docs/issue-implementation/`.

1. **Start from the template** in `docs/templates/`. No section it lacks, none it requires missing; a
   structural change changes the template first.
2. **One story file per story.** A story with no file has no AC to close against and no status to query.
3. **Every story carries its AC and a status** from the epic vocabulary — `planned`, `in-progress`,
   `completed`, `parked`, `retired`, `deferred` — spelled verbatim.
4. **Pair the names.** A BR doc and its implementation doc share a file name in the two mirrored folders —
   that pairing is how the close phase finds the pair to truth-check.

## Exit gate

Every story in the README has a file, an AC and a status, and every name it uses resolves.

Hand off to `phase-design-gate`.