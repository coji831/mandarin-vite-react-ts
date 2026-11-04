---
name: phase-scope-epic
description: "Phase 0 of the lifecycle: cutting an epic's scope before code — the binding text, re-measuring every premise an audit amendment names, and the deferral record."
user-invocable: true
---

# Phase 0 — Scope

Output is the epic's binding text plus any audit amendment, and a record the next phase inherits.

1. **Read the binding text in both places** — the roadmap row in `docs/planning/epics-25-40.md` and the
   per-epic file under `docs/planning/epics/`. Where they disagree the per-epic file wins; say so.
2. **Re-measure every premise an amendment names.** An audit amendment **overrides** the epic body, so a
   premise it names is read again from the tree before it is scoped. A stale number in the epic is the
   normal case, not the exception.
3. **Name the edge cases the stories must survive**: guest, empty, error, loading, offline.
4. **Give every deferral a receiving epic.** One that names no receiver is a gap the close phase finds.

## Exit gate

Every premise an amendment names is re-measured against the tree, and nothing deferred is homeless.

Hand off to `phase-business-requirements`.