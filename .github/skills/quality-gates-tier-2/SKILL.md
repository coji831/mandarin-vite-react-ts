---
name: quality-gates-tier-2
description: "Tier 2 quality gates: the thirteen pre-merge, story-close and epic-close gates with their commands, scope and what each counts, plus the notes that decide when a red result is pre-existing debt. Read when closing a story or epic, or preparing to merge."
user-invocable: true
---

# Tier 2 — pre-merge, story close, epic close

Tier 1 (`quality-gates-tier-1`) runs on every change; these run at a close and at merge. **A gate appears
in exactly one place**, and nowhere else: any other doc points here or shows the command verbatim. No doc
defines its own gate set. Row numbers are permanent; a new gate takes the next free one.

## The table

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
| 18 | Solar parity | `npm run check:solar-parity` | `.solar/commands.json`, `.solar/registry.json`, `.github/agents/` | gate commands parsed from the numbered rows of the gate tables |

Notes that cost a run when missed:

- **`check:load` is the one gate that also runs when you change a rule file, not code.** It fails when the
  always-on layer or any representative path exceeds its ceiling in `.github/agent-surface.json`, and it
  prints the full table either way. A new instruction with a broad `applyTo` is a finding on the next run.
  The ceilings are a ratchet: lower one in the commit that earns it, never raise one to make room.
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
- **`check:solar-parity` is driven by the gate tables above, not by a list of its own.** It reads every
  `npm run` in a numbered row and fails when the script does not exist, when no command in
  `.solar/commands.json` runs it, or when a solar command names a script nobody has. Adding a gate here
  and forgetting the solar command is exactly the failure it catches, so it runs after every table edit.
- **`check:gate-liveness` is an on-demand audit, not a numbered gate.** It checks that each row
  declares a denominator and each check script is registered, which is not the class that recurs
  (rules loading on the wrong files is), and it took 3.7 s of the 7.2 s cheap Tier-2 sweep (median of
  three runs, 2026-11-02). The `Measures` column on rows 1-18 stays as documentation that nothing
  enforces, so a new `scripts/check-*.mjs` can be added without a table row and no governed run will
  notice: run `npm run check:gate-liveness` after adding one.
- **The Tier-2 gate commands have the same fast path: `npm run gates -- <gate> <gate> ...`.** It runs a
  `node <file>` script as that node process and every other script through `npm run`, all under one outer
  npm invocation, and prints each gate's name, exit code and duration, with a failing gate's output under
  it. Measured 2026-11-01: the npm wrapper is ~540 ms per invocation and 45% of a multi-gate run, so the
  13 cheap Tier-2 commands take **16.2 s run one by one against 9.3 s**, gates unchanged; a script that
  needs `npm run` still pays its own wrapper. It is an optimization and **never a substitute**: the rows
  above keep the individual commands, `ci.yml` runs those, and a red sweep still names the gate that is
  red.

Rows 1-5, and their notes, are in `quality-gates-tier-1`.
