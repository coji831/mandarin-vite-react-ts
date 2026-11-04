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

| # | Gate | Command | Scope | Measures |
| --- | --- | --- | --- | --- |
| 1 | Format | `npm run format` / `npm run format:check` | both | matched files from the format globs; none printed |
| 2 | Lint | `npm run lint` (0 errors) | both | linted files across both workspaces; none printed |
| 3 | CSS lint | `npm run lint:css --workspace=@mandarin/frontend` | frontend | linted stylesheets from the `src/**/*.css` glob; none printed |
| 4 | Type-check + build | `npm run build` | both | workspace builds from the package.json workspaces list; none printed |
| 5 | Tests, changed scope | `npm test` | both | changed-scope tests from the non-storybook frontend and backend vitest projects |

### Tier 2, pre-merge, story close, epic close

| # | Gate | Command | Scope | Measures |
| --- | --- | --- | --- | --- |
| 6 | Full tests | `npm run test:full` | both | tests from the non-storybook frontend, backend and shared-utils vitest suites |
| 7 | Story tests + ledgers | `npm run test-storybook --workspace=@mandarin/frontend; npm run check:registry-stories; npm run check:module-boundaries; npm run check:page-inventory` | stories, always at merge | stories from the frontend storybook project; imports from shared dirs; pages from page-inventory.json |
| 8 | Design lint | `npm run design:lint` | `DESIGN.md` | linted DESIGN.md sections; none printed |
| 9 | Design audit | `npm run design-audit:foundation` | frontend | page-anatomy, mode/chrome and session/route findings from spine's audit of `apps/frontend/src`; prints `page-anatomy findings: N of M total`, and N must be 0 |
| 10 | Backend type-check | `npm run typecheck --workspace=@mandarin/backend` | backend | program files from the backend tsconfig; none printed |
| 11 | Frontend audit skill | `.github/skills/frontend-audit/SKILL.md` | frontend | UI, components, pages and userflows against uiux-fundamentals.md |
| 12 | Backend audit skill | `.github/skills/backend-audit/SKILL.md` | backend | backend modules against the boundary, validation and DI rules |
| 13 | Docs + AC + truth-check | BR/impl/design updated; every AC complete; doc-code truth-check; `npm run check:system-map; npm run check:doc-links` | blocking | surfaces from the system-map scoreboard; unresolved-link identities from `docs/**`, `.github/**` and root `*.md`, matched against the pinned baseline |
| 14 | Design parity | `npm run check:design-parity` | `DESIGN.md` + `globals.css` | token/var pairs from DESIGN.md and globals.css |
| 15 | Name discipline | `npm run check:spine-parity` | `globals.css` + spine snapshot | var names from `:root` in globals.css and `tools/spine-token-names.json` |
| 16 | Class catalog | `npm run check:class-catalog` | the three stylesheets | classes from globals.css, components.css and animations.css |
| 17 | Rule surface budget | `npm run check:load` | `.github/instructions/**`, `copilot-instructions.md` | instruction files and representative paths from `.github/instructions` and `agent-surface.json` |
| 18 | Solar parity | `npm run check:solar-parity` | `.solar/commands.json`, `.solar/registry.json`, `.github/agents/` | gate commands parsed from the numbered rows of this table |

Notes that cost a run when missed:

- **`check:load` is the one gate that also runs when you change a rule file, not code.** It fails when the
  always-on layer or any representative path exceeds its ceiling in `.github/agent-surface.json`, and it
  prints the full table either way. A new instruction with a broad `applyTo` is a finding on the next run.
  The ceilings are a ratchet: lower one in the commit that earns it, never raise one to make room.
- **`npm run build` IS the frontend type-check.** The frontend has no separate `typecheck` script by
  design; `tsc -b` covers the whole `src` graph.
- **`npm test` is `vitest run --changed`** and can pass with zero tests. It is a changed-scope check
  only. `test:full` is the real suite.
- **Gate 9 is the foundation variant, and it passes**: `design-audit:foundation` filters spine's audit
  to the page-anatomy, mode/chrome and session/route laws and exits 0 (measured 2026-11-01:
  `page-anatomy findings: 0 of 639 total`). The unfiltered `--full` run (`npm run design-audit`) is a
  **pinned-baseline measurement, not a gate**: it exits 1 at `219 error(s), 420 warning(s) in 639
  finding(s)` against a floor of 249/436/685, and stays out of CI on purpose.
- **`check:system-map`** is red at times on pre-existing debt. Compare against the base commit, do not
  chase zero.
- **`check:doc-links` is a ratchet against a pinned baseline, not a chase to zero.** The unresolved
  relative links accepted as pre-existing debt are pinned by identity (`file` + `target`) in
  `.github/doc-links-baseline.json`, whose size and `pinned` date are the record. A break that is not
  in the baseline is red and named on its own; a baseline entry that is no longer broken is red and
  asks you to lower the baseline; an unchanged tree is green, with the current and baseline counts on
  one line. Re-pin deliberately with `npm run check:doc-links -- --print-baseline`, review the diff,
  and never re-pin just to get green.
- **`check:solar-parity` is driven by the table above, not by a list of its own.** It reads every
  `npm run` in a numbered row and fails when the script does not exist, when no command in
  `.solar/commands.json` runs it, or when a solar command names a script nobody has. Adding a gate here
  and forgetting the solar command is exactly the failure it catches, so it runs after every table edit.
- **`check:gate-liveness` is an on-demand audit, not a numbered gate.** It checks that each row
  declares a denominator and each check script is registered, which is not the class that recurs
  (rules loading on the wrong files is), and it took 3.7 s of the 7.2 s cheap Tier-2 sweep (median of
  three runs, 2026-11-02). The `Measures` column on rows 1-18 stays as documentation that nothing
  enforces, so a new `scripts/check-*.mjs` can be added without a table row and no governed run will
  notice: run `npm run check:gate-liveness` after adding one.
- **Gate 1 has a Tier-1 fast path: `npm run format:check:changed`.** It runs prettier over the files
  changed against `--base <rev>` (default `HEAD`) plus the untracked ones, and measured ~1 s against the
  full sweep's 22 s on this tree (2026-11-01). It is an optimization and **never a substitute**:
  `format:check` keeps its exact globs, and `ci.yml` runs that full sweep on every PR.
- **The Tier-2 gate commands have the same fast path: `npm run gates -- <gate> <gate> ...`.** It runs a
  `node <file>` script as that node process and every other script through `npm run`, all under one outer
  npm invocation, and prints each gate's name, exit code and duration, with a failing gate's output under
  it. Measured 2026-11-01: the npm wrapper is ~540 ms per invocation and 45% of a multi-gate run, so the
  13 cheap Tier-2 commands take **16.2 s run one by one against 9.3 s**, gates unchanged; a script that
  needs `npm run` still pays its own wrapper. It is an optimization and **never a substitute**: the rows
  above keep the individual commands, `ci.yml` runs those, and a red sweep still names the gate that is
  red.

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
