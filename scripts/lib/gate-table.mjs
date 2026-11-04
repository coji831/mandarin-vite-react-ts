/**
 * gate-table.mjs - the one reader of the numbered gate tables.
 *
 * WHY THIS EXISTS
 *   `scripts/check-solar-parity.mjs` parsed the gate table inline to ask one question: can a
 *   governed run execute every gate this table declares? A second gate is about to read the same
 *   rows to ask a different question: does each gate measure anything? Two parses would mean two
 *   definitions of "a gate row" and of "a command in a row", and the copies would drift the first
 *   time this table changes shape - which it just did, when a fifth `Measures` cell was added and
 *   every consumer that binds cells by position had to learn about it. This repo's own
 *   pre-implementation rule says a second way to do a solved thing is the defect these steps exist
 *   to prevent, so the parse lives here once and each consumer reads the structure it needs.
 *
 *   The table now lives in two skills, one per tier, because that is how it is used: Tier 1 is read
 *   on every change and Tier 2 at a close. Two sources, one row sequence - `GATE_TABLES` names them
 *   in row order, and every consumer reads the concatenation, so a row means the same thing however
 *   many files it is spread across. A third source is an edit to this constant, never a second parse.
 *
 * CONTRACT
 *   - A gate row is any line matching /^\|\s*(\d+)\s*\|/. The repeated header rows do not match:
 *     their first cell is `#`, not a number. A labelled row with no `npm run` (a skill file, a
 *     manual gate) declares zero commands and is still a row.
 *   - Cells are read positionally: 2 = Gate, 3 = Command, 4 = Scope, 5 = Measures.
 *   - A command in a row is every `npm run <script>` occurrence, and every bare `npm <alias>`
 *     occurrence (`npm test` is the one alias the table uses and npm accepts it as `npm run test`).
 *     Without the alias clause a row can declare a gate the parse cannot see: gate 5 said `npm test`
 *     and contributed zero commands to the coverage denominator while the line still read `N/N`.
 *     Its `--workspace=` is the first one between that occurrence and the next command in the same
 *     row, so a workspace binds to the command it follows.
 */

import fs from "node:fs";
import path from "node:path";

export const GATE_TABLES = [
  ".github/skills/quality-gates-tier-1/SKILL.md",
  ".github/skills/quality-gates-tier-2/SKILL.md",
];

const ROW = /^\|\s*(\d+)\s*\|/;
const COMMAND = /npm (?:run )?([\w:.-]+)/g;
const WORKSPACE = /--workspace=([\w@/.-]+)/;

/**
 * Every numbered gate row in a gate-table source, in file order, with the cells and commands a
 * consumer may act on.
 */
export function parseGateTable(markdown) {
  const rows = [];
  for (const line of String(markdown).split(/\r?\n/)) {
    const match = line.match(ROW);
    if (!match) continue;
    const cells = line.split("|");
    const matches = [...line.matchAll(COMMAND)];
    rows.push({
      row: +match[1],
      label: cells[2]?.trim() ?? "",
      scope: cells[4]?.trim() ?? "",
      measures: cells[5]?.trim() ?? "",
      commands: matches.map((m, i) => {
        const tail = line.slice(m.index + m[0].length, matches[i + 1]?.index ?? line.length);
        return { script: m[1], workspace: tail.match(WORKSPACE)?.[1] ?? null };
      }),
    });
  }
  return rows;
}

/** The gate tables of a checkout, parsed and concatenated in `GATE_TABLES` order. */
export function readGateTable(root) {
  return GATE_TABLES.flatMap((rel) =>
    parseGateTable(fs.readFileSync(path.join(root, rel), "utf8")),
  );
}

/**
 * The same rows flattened to one entry per declared command, in table order. A consumer that
 * judges commands rather than rows (script resolution, argv parity) walks this, so row nesting
 * cannot change the order it sees.
 */
export function gateCommands(rows) {
  return rows.flatMap(({ row, label, commands }) =>
    commands.map(({ script, workspace }) => ({ row, label, script, workspace })),
  );
}
