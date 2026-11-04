---
name: quality-gates-tier-1
description: "Tier 1 quality gates: the five commands every code change runs before a commit, each gate's scope and what it counts. Read before committing, or when a change needs its gates named."
user-invocable: true
---

# Tier 1 — every code change

The canonical gate table is these two skills together — Tier 1 here, Tier 2 in `quality-gates-tier-2`. **A
gate appears in exactly one place**, and nowhere else: any other doc points here or shows the command
verbatim. No doc defines its own gate set. Row numbers are permanent; a new gate takes the next free one.

## The table

| # | Gate | Command | Scope | Measures |
| --- | --- | --- | --- | --- |
| 1 | Format | `npm run format` / `npm run format:check` | both | matched files from the format globs; none printed |
| 2 | Lint | `npm run lint` (0 errors) | both | linted files across both workspaces; none printed |
| 3 | CSS lint | `npm run lint:css --workspace=@mandarin/frontend` | frontend | linted stylesheets from the `src/**/*.css` glob; none printed |
| 4 | Type-check + build | `npm run build` | both | workspace builds from the package.json workspaces list; none printed |
| 5 | Tests, changed scope | `npm test` | both | changed-scope tests from the non-storybook frontend and backend vitest projects |

Notes that cost a run when missed:

- **`npm run build` IS the frontend type-check.** The frontend has no separate `typecheck` script by
  design; `tsc -b` covers the whole `src` graph.
- **`npm test` is `vitest run --changed`** and can pass with zero tests. It is a changed-scope check
  only. `test:full` is the real suite.
- **Gate 1 has a Tier-1 fast path: `npm run format:check:changed`.** It runs prettier over the files
  changed against `--base <rev>` (default `HEAD`) plus the untracked ones, and measured ~1 s against the
  full sweep's 22 s on this tree (2026-11-01). It is an optimization and **never a substitute**:
  `format:check` keeps its exact globs, and `ci.yml` runs that full sweep on every PR.

Rows 6-18, and the notes they earn, are in `quality-gates-tier-2`.
