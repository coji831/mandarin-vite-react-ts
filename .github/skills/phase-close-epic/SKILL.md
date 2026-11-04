---
name: phase-close-epic
description: "Phase 5 of the lifecycle: closing an epic — the Phase 5 surface table by name, close sections, KB extraction, the map, the review verdict and the carry-forward."
user-invocable: true
---

# Phase 5 — Close an epic

## The Phase 5 surface table

Re-open every surface **by name**: a self-audit cannot see a doc you never opened — that is how
`docs/architecture.md` went stale for weeks.

- `docs/architecture.md`
- `README.md` and `apps/*/README.md`
- `docs/knowledge-base/` — the extracted practice
- `docs/guides/`
- `docs/coverage.md` and the generated `docs/README.md`
- the epic and story files, close sections boxed
- any `.github/` rule the epic changed

Record each outcome — "verified current" is a result; silence is not.

## Steps

1. **Tier 2 gates** (`quality-gates-tier-2`), then the review verdict.
2. **Docs audit** — `.github/skills/docs-audit/SKILL.md`.
3. **Regenerate the map** (`npm run generate:system-map`) and let the check confirm it.
4. **Extract the practice** into `docs/knowledge-base/` while it is still true.
5. **Write the carry-forward into the receiving epic's own file**, not just your close-out.
6. **Counts and logs.** Every count a doc asserts is measured, never estimated. Raw output goes to `logs/`
   via `npm run logs:capture`; the curated summary in `verification-artifacts/` is the record.

## Exit gate

Tier 2 green, verdict recorded, docs audit clean, map regenerated.

Hand off to `phase-ship-pr`.