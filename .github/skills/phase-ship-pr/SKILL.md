---
name: phase-ship-pr
description: "Phase 6 of the lifecycle: shipping an epic as one pull request — the PR template, the gate evidence it asks for, and the CI-green exit gate."
user-invocable: true
---

# Phase 6 — Ship the PR

One PR per epic, not one per story.

1. **Use `.github/pull_request_template.md` verbatim** — its headings, checklist items and ordering — then
   replace the placeholders with the epic's real detail.
2. **Paste evidence, not claims.** The template asks for validation: give each command it names and the
   result it returned. A command listed without its result is not evidence.
3. **Say what was not run**, and why.

## Exit gate

CI green on every wired gate.

Hand off to `phase-archive-epic` in a later batch pass.