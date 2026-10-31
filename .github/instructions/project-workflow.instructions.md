---
description: "The canonical quality-gate table, the pre-implementation checklist and the code-change checklist. Read when implementing a story, closing an epic, or preparing a commit."
---

# Project workflow

The **seven-phase lifecycle** (scope, BR, design, build, story close, epic close, ship) and its exit
gates live in `.github/copilot-instructions.md`, which is always loaded. The human-paced version is
`docs/guides/operations/workflow.md`. This file holds the one thing neither of them owns: **the gate
table**, and the two checklists that gate a change.

## Quality gates (the canonical table)

This is the **single source of truth** for gates. **A gate appears in exactly one place in this table.**
Any other doc either points here or shows the exact command with its `--workspace` flags. No doc defines
its own gate set.

### Tier 1, every code change

| # | Gate | Command | Scope |
| --- | --- | --- | --- |
| 1 | Format | `npm run format` / `npm run format:check` | both |
| 2 | Lint | `npm run lint` (0 errors) | both |
| 3 | CSS lint | `npm run lint:css --workspace=@mandarin/frontend` | frontend |
| 4 | Type-check + build | `npm run build` | both |
| 5 | Tests, changed scope | `npm test` | both |

### Tier 2, pre-merge, story close, epic close

| # | Gate | Command | Scope |
| --- | --- | --- | --- |
| 6 | Full tests | `npm run test:full` | both |
| 7 | Story tests + ledgers | `npm run test-storybook --workspace=@mandarin/frontend; npm run check:registry-stories; npm run check:module-boundaries; npm run check:page-inventory` | stories, always at merge |
| 8 | Design lint | `npm run design:lint` | `DESIGN.md` |
| 9 | Design audit | `npm run design-audit` | frontend |
| 10 | Backend type-check | `npm run typecheck --workspace=@mandarin/backend` | backend |
| 11 | Frontend audit skill | `.github/skills/frontend-audit/SKILL.md` | frontend |
| 12 | Backend audit skill | `.github/skills/backend-audit/SKILL.md` | backend |
| 13 | Docs + AC + truth-check | BR/impl/design updated; every AC complete; doc-code truth-check; `npm run check:system-map; npm run check:doc-links` | blocking |
| 14 | Design parity | `npm run check:design-parity` | `DESIGN.md` + `globals.css` |
| 15 | Name discipline | `npm run check:spine-parity` | `globals.css` + spine snapshot |
| 16 | Class catalog | `npm run check:class-catalog` | the three stylesheets |

Notes that cost a run when missed:

- **`npm run build` IS the frontend type-check.** The frontend has no separate `typecheck` script by
  design; `tsc -b` covers the whole `src` graph.
- **`npm test` is `vitest run --changed`** and can pass with zero tests. It is a changed-scope check
  only. `test:full` is the real suite.
- **`design-audit` is non-zero on this tree by design** (pinned baseline). Treat it as **no new
  findings**, never "exit 0".
- **`check:doc-links` and `check:system-map`** are red at times on pre-existing debt. Compare against
  the base commit, do not chase zero.

## Before implementing

1. **Find the pattern that already exists.** Search for a sibling implementation before writing one; a
   second way to do a solved thing is the defect this step exists to prevent.
2. **Verify the structure you are about to touch** — the route constant, the service, the store, the
   component's registry entry. Read, do not assume.
3. **Check the data source.** Which endpoint, which content file, which fallback for a guest.
4. **Read the epic's binding text** — `docs/planning/epics-25-40.md` and the per-epic file under
   `docs/planning/epics/`. An audit amendment **overrides** the epic body, so re-measure any premise it
   names before scoping.
5. **Name the edge cases** the story has to survive: guest, empty, error, loading, offline.

## The code-change checklist

- The change is the smallest one that satisfies the AC, and nothing unrelated moved.
- A new branch of logic has a test. A bug fix has a test that failed before it.
- Types are real, not `any`. A new public symbol has a named interface.
- A new component has a registry entry, a story and its state set.
- No hardcoded value, no page-scoped layout, no invented component.
- Docs that state a number, a name or a path still match the code.

## Closing

- **Story close** boxes the AC, sets `status` and the update date, and runs the truth-check on the
  story's BR and implementation pair.
- **Epic close** runs Tier 2, enumerates the high-level surfaces **by name** (`docs/architecture.md`,
  the READMEs, the KB and guides, `docs/coverage.md` and the map, the epic and story files), regenerates
  the system map, and writes a carry-forward **into the receiving epic's own file**, not only into your
  close-out table.

## Counts and logs

Every count asserted in a doc is measured, never estimated. Raw command output goes to the central
`logs/` directory via `npm run logs:capture`, never to the repo root; the curated summary in
`verification-artifacts/` is the record, and that directory is gitignored.
