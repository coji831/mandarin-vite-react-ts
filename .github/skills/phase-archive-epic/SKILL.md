---
name: phase-archive-epic
description: "Phase 7 of the lifecycle: archiving closed epics in one deferred batch — which folders move and the exemptions."
user-invocable: true
---

# Phase 7 — Archive

1. **Move the pair together** — the `docs/business-requirements/` folder and its `docs/issue-implementation/`
   mirror both go to `archive/` in their own tree.
2. **Archived docs are records** — `**/archive/**` is prettier-ignored and exempt from the front-matter
   contract and the freshness scan.
3. **Never delete an epic's record** to tidy a listing; the archive is the only proof of what was decided.
4. **Regenerate the map** (`npm run generate:system-map`) after the move.

## Exit gate

No epic folder is half-moved, and `npm run check:system-map` passes.