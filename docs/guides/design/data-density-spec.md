---
purpose: "The dense-data spec (uiux fundamental #10) — the row/column density contract, tabular numerals, status-via-roles, and how the reports and timed-scan surfaces compose with the archetypes; written ahead of epics 36/37 so dense lists are never invented ad hoc"
status: active
last-verified: 2026-10-26
type: guide
audience: agents
relates-to: "uiux-fundamentals.md (#10) · page-archetypes.md (reports, detail) · design-reasoning.md §0 External Borrowing Protocol · DESIGN.md (spacing, type roles, status roles) · ADR-007/010 (saturation budget) · ADR-013 (composition/portals)"
provenance: "Carbon data-table row-height scale + header/toolbar alignment (pattern) · enterprise dense-scan conventions (pattern) · tabular numerals as a typographic fact (principle) — patterns only, no code or visual language copied; see §7"
---

# Dense-Data Spec — fundamental #10 (data-dense enterprise)

**Last Updated:** 2026-10-26
**Audience:** AI Coding Agents + Code Reviewer + Docs Writer
**Purpose:** the committed contract for **the densest surfaces PinyinPal will build** — the HSK exam
timed scan (epic 37), the speaking/ASR feedback surface (epic 36), and the `reports` archetype when a
page needs a real scan table. It exists so those epics **consume a contract** instead of each inventing
a dense-list pattern, and so the invented pattern is impossible to tell apart from the ruled one.

> **Consume-me rule.** Any epic whose slice contains a scan table, a numeric column, or a status column
> reads this guide at design-spec time and records `provenance:` in its per-epic spec
> ([`per-epic-design-spec.md`](per-epic-design-spec.md)) with the archetype it lands on. If a slice needs
> something this guide does not cover, the **guide is amended in that epic's PR** — the surface does not
> quietly invent it.

**Status of the surfaces:** none is built. Epics 36/37 are unstarted and `reports` has no page yet
(`page-archetypes.md` §10: "none yet — ProgressPage stays `settings` until it grows a real reporting
surface"). This guide is the **pre-written spec**, exactly as fundamental #10 requires.

---

## 1. The density contract (the numbers)

Density is **two tiers, named, and per-surface** — never per-developer taste, never "whatever fits".

| Tier           | Row height             | Type role                                            | Cell padding (x)      | Column gap   | Where it is legal                                     |
| -------------- | ---------------------- | ---------------------------------------------------- | --------------------- | ------------ | ----------------------------------------------------- |
| `dense`        | **32px** (`--space-xl`) | `meta` = `--font-sm` (14) + `--lh-tight` (1.15)      | `--space-xs` (8)      | `--space-sm` (12) | Browse scan tables (`reports`); the **body** of a timed scan; never the answer target |
| `comfortable`  | **40px** (`--space-2xl`) | `meta` = `--font-sm` (14) + `--lh-normal` (1.5)    | `--space-sm` (12)     | `--space-md` (16) | Focus answer rows (36/37), the one interactive row in a scan, any row carrying a control |
| two-line       | content height, floor `--space-2xl` | `body`/`meta` as above                  | as the chosen tier    | as the tier  | Rows with a second line (glyph + pinyin); 2 lines max |

Rules that are not negotiable:

1. **Two row heights, not five.** Carbon publishes a five-step row scale (24/32/40/48/64px); PinyinPal
   takes **32 and 40** because those are the two steps its own spacing scale already owns
   (`--space-xl`, `--space-2xl`). 24px is rejected: it is under `--size-touch` (28px), so a row's own
   control could not clear the WCAG 2.5.8 floor. 48/64 are rejected as tokens; a two-line row is
   content-height with a `--space-2xl` floor instead.
2. **The header row height equals the body row height** of its table (borrowed Carbon rule), and the
   pagination/toolbar strip matches the row tier it sits under. A 32px body under a 40px header is drift,
   not density.
3. **Touch floor survives density.** A control inside a `dense` row is **28px** (`--size-touch`) — i.e. a
   2px vertical inset inside the 32px row. If the control cannot be 28px, the row is `comfortable`.
4. **Type never drops below the ladder.** `--font-xs` (12px) is the floor and is for **column headers and
   metadata only**; dense body cells and every numeral use `--font-sm`. "Denser" never means "smaller
   than the type scale".
5. **Density is declared, not inferred.** A surface names its tier in its per-epic spec and in
   `.github/page-inventory.json`'s page entry (note field). Two tables on one page may differ (a dense
   scan + a comfortable action list) but a single table never mixes body tiers.
6. **Density never reduces the a11y floor** — contrast pairs, the 2px focus ring, 3:1 boundaries, 320px
   reflow. A dense row that fails any of these is not dense, it is broken.

### 1.1 Column contract

| Rule                          | Value                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| Columns, dense                | **≤6** visible; ≤4 at 320px (priority order below)                                    |
| Column order                  | **identity → metric(s) → status → action** (left to right, always this order)         |
| Alignment                     | text left; **numerals right**; status column left; action column right                |
| Header                        | real `<th scope>` (or a labelled grid) + `meta` at `--font-xs`, `--fw-600`, `--text-muted` |
| Truncation                    | truncate the **label**, never the number, never the identity column                   |
| Nesting                       | **no nested tables.** A row's detail is an expandable region, not a table-in-a-table   |
| 320px reflow                  | columns drop by priority (action → status → secondary metrics); the identity + the primary metric never drop; **no horizontal scroll** |
| Rows per page                 | paginate (existing `Grid`); no infinite scroll as the primary model                    |

### 1.2 Numerals: `tabular-nums` wherever a digit can change

A scanning column of proportional digits jitters: `111` is narrower than `888`, so a score column's
decimal points and digit groups do not line up and the eye cannot compare rows in one pass. Tabular
figures fix the width; that is the whole reason, and it is a typographic fact rather than a house style.

| Rule                | Contract                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| Which cells         | every numeric cell, metric, score, percentage, timer readout, count, and delta — `font-variant-numeric: tabular-nums` |
| Which not           | prose, labels, glyphs, pinyin (never tabular: pinyin is text)                                              |
| Where it lives      | today, **component-local CSS** (`font-variant-numeric: tabular-nums`) in the shared component that renders the number. Precedent in-repo: `features/readers/components/AudioControlBar/AudioControlBar.css` |
| Global utility      | **not yet.** A `.tabular-nums` global utility lands with the **first dense consumer** through the ADR-005 route (DESIGN.md §Utility Classes + `globals.css` + `design-audit` parity) — not as a drive-by |
| Pairing             | right-aligned + `--text-primary` for the metric; a unit or suffix (`%`, `s`, `分`) in `--text-muted` at `--font-xs`, outside the tabular run |

### 1.3 Status via roles, never saturation

Status is a **role**, and the role has four members plus neutral. The token names below are the ones
`globals.css` actually declares — note that DESIGN.md's `--success/--warning/--info` shorthand is stale
short-hand; the live names are:

| Meaning          | Role token                                                              | Plane (composed)                                                                   |
| ---------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| pass / correct   | `--color-success`                                                       | `color-mix(in srgb, var(--color-success) calc(var(--status-tint) * 100%), transparent)` |
| fail / incorrect | `--color-error` (+ `--edge-danger` for a destructive edge)               | same formula with `--color-error`                                                  |
| warn / borderline| `--color-warn`                                                          | same formula with `--color-warn`                                                    |
| info / note      | `--status-info` (+ `--status-info-bg`, `--status-info-border`)           | `--status-info-bg`                                                                  |
| neutral / n/a    | `--text-muted` ink, `--surface-border` edge                             | none                                                                                |

The three rules that make this "roles, not saturation":

1. **A status plane is composed, never typed.** Use `--status-tint` (0.12) through `color-mix`; a
   hand-typed `rgba(..., 0.15)` is a new role wearing a costume. There are **four** status roles. A fifth
   colour is a design change, not a cell style.
2. **A status is never carried by colour alone** (WCAG 2.2 SC 1.4.1). Every status cell carries **ink in
   the role colour plus a non-colour carrier**: an `Icon` glyph (pass ✓ / fail ✕ / warn ! / info i) or the
   status **word**. Colour is the second signal, never the only one. This is also the reason the ASR
   surface (36) must not encode pronunciation quality as a hue ramp.
3. **A status is not a filled saturated chip.** A saturated **fill** is spent from the ≤1-per-viewport
   budget (ADR-007/ADR-010/Q10); a 20-row table of filled status chips spends it twenty times. Status in
   a dense row is therefore **tinted plane + role ink + glyph**, and the row's single saturated fill
   budget belongs to the one primary action, if any.

---

## 2. The three consuming surfaces

Each entry is spec-level only — **no surface is built by this guide**.

### 2.1 `reports` — the dense scan archetype (Browse)

- **Archetype:** `reports` (`page-archetypes.md` §10) — Browse, rail expanded, standard top bar, measure
  **1200px**. This is the only archetype that is *supposed* to be the densest Browse surface.
- **Zones (top to bottom):** page header (h1 + the one entry CTA, e.g. export) → filter strip
  (`FilterControls` / `Dropdown`, sticky under the header) → headline figures (`ProgressBar` / `Badge`,
  ≤3) → **the scan table** → `Grid` pagination.
- **Density:** `dense` (32px) for the table body; the filter strip and pagination match it. Headline
  figures are not a table and do not shrink.
- **States:** loading (skeleton rows at the **final** row height — a 32px skeleton row, not a 48px one),
  empty (`EmptyState` with a next step, never an empty grid), error (`ErrorScreen` in the table region),
  filter-pending (`disabled` + `aria-busy`, focus does not move), edge (one row; 0-result filter).
- **Table component status:** **there is no `DataTable` in the registry today.** The first consumer lands
  it through the normal path (`component-registry.json` + story + states + tests + a11y) with a closed
  variant set: `rowHeight: "dense" | "comfortable"`, `align`, and a status slot. Until then the contract
  binds whatever renders the rows — a `Box variant="item"` row list inside `PageGrid` is the interim
  shape, and it must obey §1 exactly.

### 2.2 Epic 37 — HSK exam-prep timed scan (Focus)

- **Archetype:** `detail` (Focus), rail collapsed, recessed top bar; timer in the top bar; fixed
  data-resilient shell (ADR-002) with inner scroll. The former `focus-timed` name is retired.
- **Density split — this is the important one:**
  - the **scan body** (the question's option list / the reading passage's line list) is `dense` (32px);
  - the **answer row** — the row that carries the selection control — is `comfortable` (40px), because a
    row that carries a control must clear `--size-touch` with room to spare;
  - the **completion CTA** stays position-locked and full size. A timed exam is not an excuse to shrink
    the one action.
- **Timer:** tabular numerals, `--font-sm`, in the recessed top bar. Announced through a **live region at
  coarse milestones** (e.g. 5 min / 1 min remaining), never per second — a per-second `aria-live` region
  is an announcement flood (SC 4.1.3 is satisfied once, not sixty times a minute).
- **Scan behaviour:** the timed body may be scannable but never **dense-by-default for reading prose** —
  a passage is long-form (`--font-md`/`--lh-relaxed`, ADR-011's paper surface applies where the reader
  pattern is reused); only its *index* list is dense.

### 2.3 Epic 36 — speaking / ASR feedback (Focus)

- **Archetype:** `detail` (Focus), full-bleed media controls, non-color feedback mandatory.
- **Density:** **`comfortable` (40px)** is the default and dense is not used. A speaking drill is
  one-task-at-a-time; there is no scan table on the primary surface. What this guide binds here is the
  **feedback rows** (per-word/per-tone results) and the **score readout**:
  - score readout = tabular numerals + `--font-2xl`/`--font-3xl` display tier (a metric, not a table cell);
  - per-word feedback rows = `comfortable`, status via roles (§1.3) with a glyph + word, never a hue ramp.
- **Why 36 still reads this guide:** it is the epic most likely to invent a "dense score table" from
  scratch. It must not; if a results table is needed it is `reports`-shaped (§2.1) and lands `DataTable`.

---

## 3. How density composes with the archetypes and mode/chrome

| Surface                    | Archetype | Mode   | Chrome                                   | Density tier          |
| -------------------------- | --------- | ------ | ---------------------------------------- | --------------------- |
| Reports / scan table       | `reports` | Browse | rail expanded, standard top bar, 1200px  | `dense` body          |
| HSK exam body              | `detail`  | Focus  | rail collapsed, recessed bar, timer, 620px | `dense` scan, `comfortable` answer |
| HSK results                | `reports` | Browse | rail expanded                            | `dense`               |
| ASR feedback               | `detail`  | Focus  | rail collapsed, recessed bar, full-bleed  | `comfortable`         |
| Any list page (lib/browse) | `list`    | Browse | rail expanded, 1200px                    | unchanged — consumer max, **not** this spec |

Two laws hold unchanged and are not negotiable by density:

1. **Preview-detail separation** (`ui-composition.instructions.md` §7): a dense row is a preview. It
   never inline-expands into the full detail; the detail is the Focus surface.
2. **No page-scoped layout CSS** (`page-archetypes.md` §0, page-anatomy law): a dense table lives inside
   `PageShell → PageStack → PageGrid`; its own width comes from the shell measure, and column widths are
   grid fractions (`minmax()`), not page-level rules. `page-scoped-grid` / `page-scoped-layout-css` stay
   at zero findings.

---

## 4. A11y for dense data

| Requirement                | Contract                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| Semantics                  | a real `<table>` with `<th scope="col">` / `<th scope="row">`, or a `role="grid"` with labelled cells. A `<div>` soup with `aria-label`s is a revalidation failure |
| Row identity               | the identity cell is a `<th scope="row">` so screen readers announce "row 4 of 20" with a name     |
| Focus                      | one tab stop per interactive row element; the focus ring (2px, 3:1) must be **visible inside** a 32px row — a ring clipped by `overflow: hidden` is a fail (SC 2.4.11) |
| Targets                    | ≥28px (`--size-touch`) for any control in a row; the primary CTA clears 44px                      |
| Status                     | never colour-only (§1.3); a status change announced via `role="status"` without moving focus        |
| Sort / filter              | `aria-sort` on the sorted header; filter changes do not move focus                                 |
| 320px                      | reflow by column priority, **no horizontal scroll**, no clipped numerals (tabular width + right align makes this measurable) |
| Zoom                       | 200% text zoom keeps the row's control ≥28px (the row may grow; the type does not shrink below `--font-xs`) |
| Reduced motion / contrast  | inherits the token layer; density adds no new colour                                               |

---

## 5. What is gated today, and what lands with the first consumer

Be honest about the split — this spec is ahead of its surface, so most of it is a reviewer contract
until a dense surface exists.

| Rule                                                              | Enforced today by                                        |
| ----------------------------------------------------------------- | -------------------------------------------------------- |
| No hardcoded colour / spacing / font-size / line-height / weight  | `design-audit` (`hardcoded-*`) — already errors          |
| No raw `z-index`; elevated surfaces carry the hairline            | `design-audit` (`z-index-raw`, `elevation-no-hairline`)   |
| ≤1 saturated fill per viewport                                    | `design-audit` (`saturated-fill-overflow`, advisory) + rubric |
| Contrast / ARIA / labels / target size                            | axe gate (`test-storybook`, WCAG 2.2 `runOnly`)           |
| No page-scoped layout CSS                                         | `design-audit` (`page-scoped-*`) + `check:page-inventory` |
| Density tiers, column budget, tabular numerals, status carriers    | **reviewer contract** (this guide) + the human rubric; a machine rule (`dense-row-height`, `status-color-only`) lands **with** the first dense consumer, so the gate and the surface arrive together |
| Rubric                                                            | `design-quality-rubric.md` — hierarchy/scan criteria apply to a dense surface too: a dense table still has exactly one focal column |

---

## 6. Anti-patterns (the list a reviewer rejects on sight)

1. **Density by shrinking type.** `--font-xs` body cells, `--lh-1`, or a 11–12px numeral column. The
   scale's floor is the floor.
2. **Zebra + border + shadow + elevation on the same table.** One separator mechanism per table:
   hairline rows `--surface-border-subtle`, or a `--surface-light-5` band. Not both, not stacked.
3. **Filled saturated status chips in a column** — blows the ≤1 budget (ADR-007/010) and carries meaning
   by colour (SC 1.4.1).
4. **A hand-typed status plane** (`rgba(...)` instead of the `--status-tint` composition).
5. **Horizontal scroll at 320px**, or a clipped numeral because the column had a fixed width.
6. **A dense row that contains the page's primary action.** The one CTA is position-locked and full size.
7. **Nested tables / a table inside a card inside a table.** A row's detail is a detail surface.
8. **Proportional digits in a numeric column** — the scan fails silently and nobody can say why.
9. **An ad-hoc dense table invented in a feature** that is not this contract and not registered. That is
   the exact failure this guide exists to prevent.

---

## 7. Provenance (External Borrowing Protocol — patterns only, never code)

Per `design-reasoning.md` §0 (`extract → translate → register → gate`). Every borrow below supplied a
**principle**, translated into PinyinPal tokens; no code, markup, class name, or visual language was
copied.

```
provenance:
  - source: IBM Carbon data table (row-size scale + header/toolbar/pagination alignment)
    borrowed: that row height is a NAMED TIER matched across header, body, toolbar and pagination,
              and that taller rows exist for two-line content
    why: it converts "make it dense" into a ruled choice; the scale's five steps were then reduced to
         the two the PinyinPal spacing scale already owns (32/40), with 24 rejected for the touch floor
    rejected: 24px rows, zebra striping, the toolbar/batch-action bar, Carbon's own tokens and type ramp

  - source: enterprise dense-scan conventions (Linear/Stripe-class quality bar; Stripe/Carbon tables)
    borrowed: right-aligned tabular numerals; identity → metric → status column order; truncate the
              label, never the number
    why: a scan column is read in one pass and compared vertically; digit alignment is what makes that
         pass work
    rejected: the enterprise layout, command-bar chrome and density level itself — design-reasoning.md
              §0's Linear/Stripe row explicitly keeps those OUT and borrows the quality bar only. The
              density numbers here come from PinyinPal's own spacing scale, not from those products.

  - source: WCAG 2.2 SC 1.4.1 (use of colour) + SC 1.4.3/1.4.11 (contrast)
    borrowed: status must carry a second, non-colour signal; ink pairs with its surface
    why: it is a floor, not a style; it is also why the ASR surface may not encode quality as a hue ramp
    rejected: nothing — the standard is the requirement, not a design choice

  - source: WAI-ARIA APG (table/grid semantics, live-region guidance)
    borrowed: real table semantics + `aria-sort`, and that a live region announces a coarse change once
    why: a dense table is exactly where a screen reader loses row identity, and the timed surface is
         exactly where an over-eager live region becomes noise
    rejected: its example markup
```

---

## 8. Open items

1. **`DataTable` shared component** — lands with the first consumer (`reports` page or epic 37), with the
   closed variant set in §2.1. Not built here, deliberately: the registry rule is "never invent a
   component", and the pattern must be ruled before the component exists.
2. **`.tabular-nums` global utility** — lands through ADR-005 with that same first consumer; until then
   component-local usage is the sanctioned shape (§1.2).
3. **Machine rules** — `dense-row-height` and `status-color-only` are named here so the first dense PR
   has a rule to add to `tools/design-audit-foundation.mjs` rather than a debate to repeat.
4. **Virtualisation** — not needed at HSK scale (a part is tens of rows, paginated). Revisit only if a
   measured surface exceeds ~200 rows; do not pre-build it.
