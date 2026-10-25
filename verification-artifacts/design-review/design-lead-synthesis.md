> **Provenance.** S7 of the spine-hybrid migration, `design-lead` role, synthesis pass. Read: the R1
> report `design-review-learn-radicals.md`, ADR-011, `page-archetypes.md`, `design-quality-rubric.md`,
> `DESIGN.md`, `.github/page-inventory.json`. **No route source and no stylesheet was read in this pass**
> — the ban holds, and every measured number below is quoted from the R1 report with its instance named.

# Design lead — synthesis across the route reviews

Round: S7 R0→R3, one route (`/learn/radicals`). What was read: `design-review-learn-radicals.md` (F1–F6,
one withdrawal); the brief sources named above. Date 2026-10-25.

## 1 · Alignment

### A1 — the loading state abandons the geometry the loaded state establishes [against ADR-011] [high]

- **Routes** — `/learn/radicals`, both tabs. Browse's loading state is a small centred spinner in a
  1220 px field; Trees' loading state is one 60 px bar (`1088 × 60`) where the loaded state paints two
  panels totalling ≈205 px (R1 F1, 1440 capture).
- **Evidence** — R1 F1 against the rubric's own line: *"no layout shift (CLS): skeleton dims = final
  dims"*.
- **Which side the evidence favours** — the rubric. A skeleton is a promise about the shape that is
  arriving; this one promises a shape the route does not deliver.
- **Fix** — page change (F1), and it is the cheapest high-severity fix in the round: no token moves, no
  brief moves.

### A2 — one surface, two answers to "where does the filter start" [against peers] [low]

- **Routes** — the route's own two tabs. Browse: search spans its filter block (`1128 px` at 1440, `715`
  at 1024). Trees: a `220 px` control centred in a `1205 px` region with the row otherwise empty
  (R1 F3).
- **Evidence** — R1 F3, same route, two shapes, both captured at the same widths.
- **Which side the evidence favours** — Browse, because it is the shape the rest of the page already
  uses (heading, subtitle and legend all hang from the content's left edge).
- **Fix** — page change in Trees; a shared rule would be better, but one instance does not justify
  promoting a rule yet (see § 3).

### A3 — two tab levels, one treatment, no vocabulary difference [against peers] [medium]

- **Routes** — Browse/Trees (mode) and Radical/Phonetic (sub-mode) render inside the *same* footer card,
  separated by a literal `|` (R1 F4 instance 2, F6).
- **Evidence** — R1 F6's measured strip (`1152 × 100`, top y 804 in a 900 viewport) and R1 F4's
  accessibility-tree reading of the separator as text.
- **Which side the evidence favours** — neither; both tab levels are under-specified. This is an
  alignment defect with no correct side on screen, which makes it a **brief** job, not a page job.
- **Fix** — shared change: one line in the archetype table (F6's proposed insertion), after which the
  separator question answers itself.

## 2 · Fix

### The brief's share (the first deliverable)

1. **Where a route's mode switch lives** (F6/A3). One line in `docs/guides/design/page-archetypes.md`.
   This is first because it is the only finding whose absence *causes* a second finding (the footer card
   exists because nothing said otherwise, and the `|` separator exists because the card had no rule for
   grouping).
2. **The painted state indicator's boundary** (F5). `.github/instructions/a11y-floor.instructions.md`
   covers the focus ring, the targets and forced colours; it does **not** say that a painted two-state
   indicator needs a visible boundary. One bullet, and the `Switch` audit becomes checkable by rule
   instead of by capture.

Cost of the pair: two sentences and a bullet. Owner: whoever owns the design docs, not the route.

### The route's share

In the order that unblocks the most:

1. **F1 — skeleton dims = final dims.** Highest severity, smallest change, no dependency. It is also the
   finding most likely to be re-found by the next reviewer, because it is visible in the first
   half-second of every load.
2. **F2 — grid fill.** Touches one grid rule and the card width; it is the finding a 320-px user sees
   without scrolling.
3. **F4 — two typed rules.** Two small edits, one of which (the caption's box-drawing run) is also a
   screen-reader defect rather than only a visual one.
4. **F5 — the switch track.** *Not* a route edit: shared `Switch`, and it needs the a11y bullet above to
   be judgeable.
5. **F3 — Trees' filter width.** Last because it is low severity and because the right answer may follow
   from F6's line rather than from a Trees-local edit.

### One systemic finding with 4 instances

**A value that already exists in the system was re-drawn locally.** Its four instances in one route:

| instance | the local re-drawing | what already existed |
| --- | --- | --- |
| F4-a | box-drawing characters as a rule | the hairline |
| F4-b | a `|` text node as a group separator | the hairline, or spacing |
| F5 | a switch track whose 2 px border computes to `transparent` | the state-boundary contract |
| F2 | a fixed card width inside an elastic column, at three widths | the grid's own fill rule |

Stated once, this is one observation about the route: **it decorates where the system would have
composed.** That is worth more to the next reviewer than four separate rows, and it is the observation
that a token-discipline instruction (installed in this same step) is written to prevent.

### Do not fix — and why

- **The fixed 140 px card width's optical role** (R1 "noted"). The card may be correctly fixed and the
  *grid* wrong; F2 must not be implemented as "stretch the card" when the cheaper correction is "stop
  claiming the leftover width as a column". Rejected as stated, retained as a question for the page owner.
- **The clipped 320 placeholder.** No overflow was measured (`scrollWidth === clientWidth === 320`); a
  clipped placeholder is a microcopy question, and the rubric's reflow row is about overflow.
- **The withdrawn spinner-contrast claim.** It had no reading. S8 owns contrast and axe; a finding
  re-raised there with a measured ratio is a finding, and this one was not.
- **All `--shadow-*`/elevation questions.** The token layer sets `--shadow-sm|md|lg|elevated-1..3` to
  `none`, so `.box-card-elevated` is flat by construction. A reviewer reporting "elevation on the tab
  card" would have been reading the class name, not the render. Recorded as a near-miss because it is
  the exact failure the critic's no-source rule exists to prevent.

## 3 · Condensation

| Artefact | Move | Evidence | Depends on it | Cost of being wrong |
| --- | --- | --- | --- | --- |
| "skeleton dims = final dims" | **PROMOTE** from rubric prose to a gate reading (the browser pass's CLS row is where it is already owed) | R1 F1; the rubric names it but nothing measures it | every route with a skeleton (radicals, chengyu, grammar, phonetic-clusters, readers, character-hub all carry skeleton blocks) | the rule stays advisory and one route at a time re-breaks it — measured once here, six routes carry the surface |
| tab-strip placement | **PROMOTE** to `page-archetypes.md` (new, one line) | R1 F6; nothing states it today | Browse/Trees, and every future learn route | every route re-decides it, which is how a system grows two answers (A2 already shows it happening inside one route) |
| state-indicator boundary | **PROMOTE** to `a11y-floor.instructions.md` (one bullet) | R1 F5 | the shared `Switch`, and every composed control with a painted state | the floor stays uncheckable for painted controls |
| `--radius-*: 0px` vs spine's `0` | **DEMOTE** to a receipt, not a live exception | `npm run check:spine-parity` prints them as "paint pending" and then explains they are dimension-equal notation | the parity banner's reader | a reader treats 4 notation rows as debt; the banner already says the opposite |
| the 3 held `--surface-light-3/5/8` washes | **KEEP live, keep in the banner** | `check:spine-parity` output; F5 of the seven-checks ruling | the paper surface work (out of this branch's scope) | deleting the banner hides three deliberate deviations |

### The gate-exemption growth, and whether the folder should become the scope

The rule: *a gate that exempts artefacts by name rots, because the list only grows.* Checked in this
tree:

- `npm run design-audit` scopes by **folder** (`apps/frontend/src`) — correct shape, no fix needed.
- `npm run check:closure` and `check:spine-parity` scope by **folder** — correct shape.
- **`tools/design-audit.class-baseline.json` is a name-keyed exemption list** (307 CSS-class keys at the
  time of this pass, e.g. `hub-cardinal__center`, `hub-identity__glyph`). This is the rot the rule names:
  each key names a class, the list only grows, and a renamed class silently un-exempts a finding while
  its stale twin stays.

**Cost of collapsing it to a folder:** none that preserves its purpose — the file records *which
exemptions were accepted*, not *which folders are exempt*, so a folder scope would exempt classes nobody
accepted. The honest move is not to collapse it but to **date and attribute each key**, and to fail the
gate when a key no longer matches a live class. Owner: the gates workstream, not this round. Recorded
here because the role asks for the check on every synthesis, and this is the answer for this tree.

## Where the critics contradict each other

One route, one critic — so no cross-critic contradiction exists to adjudicate. The contradiction that
*does* exist is inside the round: R1's F2 asks the card to fill its column, and R1's own "noted"
suggests the fixed width may be deliberate. **I take the grid side**: the observation that matters at
320 is 93 px of unused column (44 %), and moving the obligation onto the grid leaves the card's optical
centring intact. The card owner can overrule me with one measurement of glyph centring across widths.

## What I could not decide from the material, and what would decide it

- **Whether the 7-column grid at 1440 is right.** ADR-011's own demo evidence records a dashboard grid
  at 4 → 2 → 1 (1280/768/390); this route runs 7 → 4 → 1. Different page, so not a contradiction — but
  nothing in the archetype table states a column ceiling, so I cannot call 7 wrong. **What would decide
  it:** an exemplar story for the learn-hub archetype, measured at 1440.
- **Whether the Trees tab should exist as a tab at all.** Its filter, its sub-tabs and its panels differ
  from Browse in every dimension but the heading. That may be a genuine mode difference or a second page
  wearing the first one's chrome. **What would decide it:** the page-inventory's declared archetype for
  `/learn/radicals` plus one more reviewed route in the same archetype — i.e. the next round, not this
  one.
