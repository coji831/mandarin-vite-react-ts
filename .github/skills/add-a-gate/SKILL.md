---
name: add-a-gate
description: "The procedure for adding a quality gate without breaking parity: which skill the row goes in, the npm script, the solar command, and the checks that prove it is runnable."
user-invocable: true
---

# Add a gate

Four files move together, or the gate is unrunnable.

1. **The row** goes in the tier skill that owns it — `quality-gates-tier-1` for a per-change gate,
   `quality-gates-tier-2` for a pre-merge or close one. **Take the next free number; never renumber.** The
   number is what `check:solar-parity` reads and three workflows cite.
2. **Fill the `Measures` cell.** A row that says what it checks but not what it counts cannot be audited or
   probed, and `check:gate-liveness` fails an empty cell.
3. **The npm script**, at the root or in the workspace its `--workspace=` names. A row naming a script that
   does not exist is a finding.
4. **The solar command** in `.solar/commands.json`, its argv carrying the same `run <script>` pair, and the
   same `--workspace=` when the script is workspace-only. `check:solar-parity` fails a gate no governed run
   can execute.
5. **Run in this order**: `npm run check:solar-parity`, `npm run check:gate-liveness`, then the gate
   itself.
6. **Show it red once**, on the defect it exists to catch. A gate that has never failed is not a gate.

`scripts/lib/gate-table.mjs` is the one reader: `GATE_TABLES` names both skill files in row order. A
third source is an edit to that constant, not a second parse.