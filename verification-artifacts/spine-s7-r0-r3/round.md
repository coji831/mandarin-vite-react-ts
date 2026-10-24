# S7 — agentic wiring + one R0→R3 round: the round receipt

Step S7 of the spine-hybrid migration, per `design-lead-ruling.md` § IN/OUT item 5 and
`design-lead-sevenchecks-ruling.md` § "Effect on the remaining branch steps".

Route chosen: **`/learn/radicals`**. Criterion (the seven-checks ruling, "R0→R3 route constraint"):
the route must carry (a) a `.skeleton`/`.skeleton-loading` block, (b) a `Spinner`, (c) a Han body block.
This route satisfies all three by name in the tree:

| required | where it is | how it was exercised in this round |
| --- | --- | --- |
| skeleton block | `Phase3TreeView`, `RadicalTreesTab`, `RadicalDetailContent` (`skeleton` in 11 files of the feature) | rendered: `trees-loading` story → 1 skeleton, `1088 × 60`, `animation: skeleton-shimmer` |
| Spinner | `RadicalGrid` → `LoadingScreen` → `Spinner` | rendered: `loading` story → `role="status"` + centred spinner |
| Han body block | radical glyphs (一 丨 丶 氵 亻 / 白 又 口 力) | rendered: `browse` (10 cards, 13 Han glyphs) and `trees` (5 chips + tree row) |

## R0 — deterministic gates

Run in the dirty tree (the new instruction/skill/agent files are in place). Full transcripts:
`r0-gates.txt`.

| command | exit | the one number it printed |
| --- | --- | --- |
| `npm run build` | **0** | `✓ built in 5.46s` (all workspaces) |
| `npm run typecheck` | **0** | 0 errors across workspaces |
| `npm run lint` | **0** | `40 problems (0 errors, 40 warnings)` |
| `npm run design-audit` (full) | **1** | `250 error(s), 436 warning(s) in 686 finding(s)` — **equal to the pinned floor 250/436/686 (S3, 2026-10-24)** |
| `npm run design-audit:foundation` | **0** | `page-anatomy findings: 0 of 686 total` → `✅ Foundation gate PASS` |
| `npm run check:spine-parity` | **0** | `✅ spine parity PASS — 91 canonical, 2 override, 38 domain, 0 generic, 0 deprecated.` |
| `npm run check:closure` | **0** | `genuinely dangling: 0` (declared 143 / referenced 135 / cycles 0) |
| `npm run check:design-parity` | **0** | `48 token/var pairs` |

**Why `design-audit` exits 1 at the floor, and why that is not a regression.** The wrapper delegates the
full audit to spine's own gate and, in `--full` mode, returns *spine's* exit code (its own source comment:
"its exit code is spine's own"). The counts are byte-for-byte the pinned floor, so the reading is
**unchanged, not worse**. The foundation mode — the half that has a pass line of its own — exits 0.

## R1 — independent eye (I was the layout-critic for this round)

Report: `verification-artifacts/design-review/design-review-learn-radicals.md`.

A **browser pass was available**, so this is a rendered R1, not a static one. Two surfaces:

1. `http://localhost:5173/learn/radicals` — the real route. It renders the shell and then the error state
   (`Failed to load radicals`) because no API is running on `:3001`; that is how the error state got its
   capture.
2. Storybook `Pages/Learn/Radicals` — the same component tree with MSW fixtures, which is what made the
   Browse / Loading / Trees / Trees-loading states renderable. No backend and no database was started
   (there is no `prisma/dev.db` in this checkout), and nothing was seeded to make a screenshot prettier.

Widths: 1440 / 1024 / 320, viewport set explicitly, `document.fonts.ready` awaited, captures taken
twice and judged from the second. Findings F1–F6, one withdrawal:

| id | verdict | severity | one-line |
| --- | --- | --- | --- |
| F1 | VISUAL | high | Trees skeleton is one `1088 × 60` bar where the loaded content is ≈205 px → the rubric's "skeleton dims = final dims" fails |
| F2 | VISUAL | medium | cards fill 11 px short of their cell at 1440, **33 px (19 %)** at 1024 and **93 px (44 %)** at 320 |
| F3 | VISUAL | low | the filter is a full-width field on Browse (`715 px` at 1024) and a `220 px` centred pill on Trees |
| F4 | VISUAL | medium | two rules drawn as typography: a `─── … ───` box-drawing run, and a literal `|` as the tab separator |
| F5 | VISUAL | medium | the switch track's `2 px` border computes to `transparent`; its only boundary is a fill of `rgb(50,39,26)`. Shared component |
| F6 | **BRIEF** | medium | the mode switch lives in a `1152 × 100` footer card at y 804 of a 900 viewport, and **nothing** in ADR-011 / the archetype table / the rubric says where it belongs |
| — | withdrawn | — | "spinner contrast too low" — no reading captured; re-opened in S8 |

Reflow clause, measured as a side-effect (the formal sweep is S8): `scrollWidth === clientWidth` at all
three widths, `0` elements past the right edge at 320.

## R2 — synthesis

`verification-artifacts/design-review/design-lead-synthesis.md`.

- **Alignment** — A1 the loading state abandons the loaded geometry (against ADR-011's own performance
  line); A2 two answers to "where does the filter start" inside one route; A3 two tab levels, one
  treatment, no vocabulary difference.
- **Fix** — *brief's share first*: F6 (one archetype line) and F5's missing a11y bullet; then the page's
  share in the order F1 → F2 → F4 → F5 → F3. **Rejected:** stretching the card (F2 is a grid job until
  proved otherwise), the clipped 320 placeholder, the withdrawn spinner claim, and every elevation
  question (`--shadow-*` is `none` by token, so `.box-card-elevated` is flat by construction — a near-miss
  the no-source rule prevented).
- **One systemic finding, four instances** — *the route decorates where the system would have composed*:
  typed rules (F4-a, F4-b), a transparent state boundary (F5), a fixed width inside an elastic column
  (F2).
- **Condensation** — PROMOTE: "skeleton dims = final dims" (advisory prose → a measured row),
  tab-strip placement (new archetype line), state-indicator boundary (one a11y bullet). DEMOTE:
  `--radius-*: 0px` vs `0` (notation, to a receipt). KEEP live: the 3 held `--surface-light-*` washes.
- **Gate-exemption check** (the role asks on every synthesis): `design-audit`, `check:closure` and
  `check:spine-parity` all scope by folder — correct. `tools/design-audit.class-baseline.json` is
  **name-keyed, 307 keys** — the rot the rule names; collapsing it to a folder would exempt classes nobody
  accepted, so the honest fix is date-and-attribute plus a "key must still match a live class" failure.
  Owner: the gates workstream, not this round.

## R3 — re-verify

Full transcripts: `r3-gates.txt`.

| command | R0 exit | R3 exit | R0 reading | R3 reading | unchanged? |
| --- | --- | --- | --- | --- | --- |
| `npm run build` | 0 | 0 | built | `✓ built in 5.63s` | yes |
| `npm run typecheck` | 0 | 0 | 0 errors | 0 errors | yes |
| `npm run lint` | 0 | 0 | 0 errors / 40 warnings | 0 errors / 40 warnings | yes |
| `npm run design-audit` (full) | 1 | 1 | 250/436/686 | 250/436/686 | **yes** |
| `npm run design-audit:foundation` | 0 | 0 | 0 page-anatomy | 0 page-anatomy | yes |
| `npm run check:spine-parity` | 0 | 0 | 91 / 2 / 38 / 0 / 0 | 91 / 2 / 38 / 0 / 0 | yes |
| `npm run check:closure` | 0 | 0 | dangling 0 | dangling 0 | yes |
| `npm run check:design-parity` | 0 | 0 | 48 | 48 | yes |

`tsc -b` in `apps/frontend` → exit 0 (also run as the first half of `build:frontend`, exit 0).

**R3's other two duties.** *Apply the falsifier* — F1's falsifier (skeleton height vs final height) and
F2's (cell − card at three widths) were both applied during R1, which is why they survived. F3's
falsifier would be "the two tabs' filter widths agree", which they do not. F5's would be "track fill vs
surface ≥ 3:1", which was **not** measured, so F5's severity stands on the computed `transparent` border
rather than on a ratio — stated as such in the report. *Withdraw what does not fail* — one claim was
withdrawn (spinner contrast), and the withdrawal is in the report's own section, because a withdrawn
finding is a measurement.

**Instrument identity.** R0 and R3 ran the same commands, in the same tree, with the same spine checkout
(`fd1bd9e6`) — so the two readings are comparable. The only change between them is this receipt and the
two report files, neither of which any gate reads.

## The a11y-floor instruction is exercised here, not merely installed

`.github/instructions/a11y-floor.instructions.md` is not dead letter: **S4 landed the two blocks that
this instruction's own bullets name**, and they survive in the tree today —

- `prefers-reduced-motion: reduce` / `forced-colors: active` in `shared/components/Spinner/Spinner.css`
  (forced-colors 64, reduced-motion 74) and `shared/components/Skeleton/Skeleton.css` (reduced-motion
  30, forced-colors 38) — i.e. on two of the exact components this round rendered;
- the same pair in `shared/components/ProgressBar/ProgressBar.css` (forced-colors 36, reduced-motion 56),
  `apps/frontend/src/styles/animations.css` (reduced-motion 74, forced-colors 87) and
  `pages/learn/foundations/StrokeAnimationTab.css` (21).

And this round **used** the instruction as a review instrument: F5 is raised against its "UI boundaries
and states at 3:1 (SC 1.4.11)" bullet, and the report's reflow reading is that instruction's 320 px
clause. So the instruction has both a code receipt behind it (S4) and a review finding in front of it
(S7).

## Files installed by this step

See `C:\CodeProjects\Personal\Resume\context\topics\spine-mandarin\s7-agentic-receipt.md` for the
parameterization table (what came from spine, what was rewritten for this tree) and the two role
definitions wired into `.solar/registry.json`.

## What is tracked, and what is only on disk

`verification-artifacts/` is **gitignored** in this repository (`.gitignore:46`) and holds force-added
receipts from earlier epics. This round follows that shape:

- **Force-added (staged, not committed)**: this file,
  `design-review/design-review-learn-radicals.md`, `design-review/design-lead-synthesis.md` — the three
  documents a later step must read.
- **On disk only (raw instrument output, deliberately not staged)**: `r0-gates.txt` (181 KB, spine's full
  686-finding block verbatim) and `r3-gates.txt` (14 KB). Every number either file proves is transcribed
  in the tables above, so the raw logs are evidence, not the receipt.

