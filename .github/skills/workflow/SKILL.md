---
name: workflow
description: "The eight-phase epic and story lifecycle: what each phase produces, its exit gate, and the skill that owns the step. Read when scoping an epic, writing requirements, opening or closing a story, closing an epic, shipping or archiving, or when unsure what comes next."
user-invocable: true
---

# Workflow

Eight phases, each with an exit gate. Phases 0-2 precede code, 3-4 repeat per story, 5-6 happen once per
epic, 7 is a deferred batch. `.github/skills-registry.json` indexes every phase skill with its trigger.

- **0 Scope** (`phase-scope-epic`) — the epic's binding text plus any audit amendment. Gate: every premise
  an amendment names is re-measured.
- **1 BR** (`phase-business-requirements`) — a `README` plus one story file per story. Gate: every story
  carries an AC and a status.
- **2 Design** (`phase-design-gate`) — the component set and each component's state list. Gate: the human
  preview.
- **3 Build** (`phase-build-story`) — story commits, the implementation doc, tests. Gate: Tier 1 plus
  "commit allowed".
- **4 Story close** (`phase-close-story`) — the BR and IMP pair. Gate: the doc-code truth-check on it.
- **5 Epic close** (`phase-close-epic`) — close sections, high-level docs, KB, the map. Gate: Tier 2, the
  review verdict, the docs audit.
- **6 Ship** (`phase-ship-pr`) — one PR per epic. Gate: CI green.
- **7 Archive** (`phase-archive-epic`) — folders under `docs/**/archive/`. Gate: a batch pass, not per epic.

## Two rules that cost epics before they were written down

**A brief quotes the Phase-5 surface table, it never summarises it** — a self-audit cannot see a file you
never opened. **A carry-forward goes into the receiving epic's own file**, not only into your close-out
table.

## Gates

`quality-gates-tier-1` holds the gates every change runs, `quality-gates-tier-2` the ones a close runs,
`add-a-gate` adds a row. The human-paced checklist is `docs/guides/operations/workflow.md`.