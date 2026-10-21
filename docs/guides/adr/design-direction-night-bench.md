---
purpose: "ADR-011 — the ratified North Star visual direction for PinyinPal: 'Night Bench' (dark instrument register + a light paper surface for long-form reading only), and the status of the light 'Reading Room' alternative."
status: ratified
date: 2026-09-12
relates-to: "ADR-001 (Dark Mode Only) · ADR-005 (Token Freeze) · ADR-007 (North-Star Visual Identity) · ADR-009 (Fluid Display Type Scale) · ADR-010 (Vibrancy Amplification)"
evidence: "archived hub evidence: design-style-catalogue Parts 7-9 · demo dashboard-options.html"
---

# ADR-011 — North Star Visual Direction: "Night Bench"

**Status:** ratified (owner, 2026-09-12)
**Decided by:** owner
**Evidence:** archived hub evidence: design-style-catalogue Parts 7-9 (the 21-platform
measurement, findings T1-T7, and both option specs) · demo dashboard-options.html

## Context

PinyinPal had a ratified visual identity (ADR-007) and a ratified dark-only constraint (ADR-001), but no
recorded decision about **which family of registers the North Star set is built from**. Two candidates
were specified and rendered side by side as the same Dashboard, differing only in decoration:

- **A, "Reading Room"** — a light warm-paper canvas on every surface.
- **B, "Night Bench"** — the dark canvas kept as the data/instrument register, plus a light warm-paper
  surface used **only** for long-form reading.

The evidence came from measuring 21 real learning platforms live in a browser (same probe on each):

| #   | Finding                                                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------- |
| T1  | **21 of 21 measured surfaces are light.** Not one dark canvas.                                                             |
| T2  | The only platforms with no typeface of their own are the institutional ones (edX, Open edX, Moodle).                       |
| T3  | **`0px` dominates the radius histogram on all 21.** Rounded cards + soft shadow is the AI tell, not the norm.              |
| T4  | Consumer products run h1 40-60px against body 14-20px.                                                                     |
| T5  | Category body is 16-18px.                                                                                                  |
| T6  | **Amber appears once in 21** (Memrise). Green is the language-app default; the two Chinese-content products use vermilion. |
| T7  | edX ships a measured dark-teal + cream pair — the precedent for a dark data layer with a light content layer.              |

## Decision

**Adopt Option B, "Night Bench".**

1. The **dark canvas stays** as the data, wayfinding and task register (T1: dark is the rarest position
   available in this category, and it is already built).
2. A **light warm-paper surface is added for long-form reading only** (the reader / `focus-media`
   archetype). This is T7, and it is measured rather than cultural: every read-first Mandarin product
   surveyed is light, and edX ships the same pairing.
3. **Amber stays as the single accent** (T6: 1 of 21, and it measures best on dark).
4. The register is therefore **per-archetype, not global**: dark for data/task, paper for reading. It is
   deliberately _not_ one style applied everywhere.
5. **Option A is not adopted.** It is retained as the candidate for a future light mode.

## Consequences

1. **ADR-001 (Dark Mode Only) is NOT superseded.** A light _surface_ for one archetype is not a light
   _mode_: there is no theme switch, no user preference, and no second token set for the same surface.
   This ADR is the explicit boundary, and the paper surface must not be extended into one.
2. **Adopting Option A later WOULD supersede ADR-001.** Retaining A is therefore not a free option kept
   in a drawer - any future light-mode work must supersede ADR-001 explicitly and visibly, rather than
   arriving through the back door as "applying A".
3. **New tokens are required**, via ADR-005's route (DESIGN.md + globals.css + design-audit, with an ADR):
   `--surface-paper`, `--surface-paper-alt`, `--surface-paper-border`, `--surface-paper-track`,
   `--text-paper-primary`, `--text-paper-secondary`, `--text-paper-tertiary`, `--size-well`,
   `--size-focal-glyph`.
4. **No new tokens are needed for type or accent** — verified against `globals.css`, which corrects an
   earlier assumption: the display tiers already exist (ADR-009, `--font-3xl`..`--font-6xl`, fluid
   28-60px), the font pair already exists (`--font-latin: Manrope`, `--font-hanzi: Noto Sans SC`), and the
   accent split already exists (`--color-primary-light` as fill, `--color-primary-dark` = `#92400E` as
   text on paper at 6.8:1). `flat-type-hierarchy` is a page-level _usage_ defect, not a missing token.
5. **Open reconciliation with ADR-007 and ADR-010.** Both cap saturated fills at <=1 per viewport. The
   approved Dashboard spends two (the primary action and the current phase node) plus the brand mark in
   the chrome. Either the wording becomes "<=1 per content region", or the phase node goes neutral.
   Outstanding owner decision.
6. **The paper surface is the light-surface token set**, so a future light mode reuses it rather than
   starting over. That is precisely why retaining A stays cheap.

## Verification of the demo this decision was made from

`dashboard-options.html` (archived hub demo) — same DOM in both panes, so only the register differs.

- detector: **0 findings** (the first build had 7)
- contrast: **0 failures** across 60 text nodes per option, at 1280 / 768 / 390 (worst pair 4.83:1)
- reflow: grid **4 -> 2 -> 1**, with 0px main and document overflow at all three widths
- tap targets: minimum 28px at 390 (the one sub-28 control is an inline link in a sentence - the
  WCAG 2.5.8 inline exemption)
- ramp: 6 sizes (12/14/16/20/40-32/48); body-to-display spread 14 -> 40 = 2.86x

Four defects in that demo were found **by measuring rather than reading** and are recorded in its header:
a flat ramp caused by an 18px tile well (the same defect `design-audit` reports in the app); a
fixed-width frame that could not test breakpoints (the grid stayed 4 columns at a 390px frame with 264px
of overflow, because `@media` reads the viewport - fixed with a real-viewport embed mode); cramped
padding; and 13 em dashes in body copy.

## Open items

1. Reconcile the saturated-fill cap with ADR-007/010 (consequence 5).
2. Land the paper token family through ADR-005.
3. Record A's status as retained, and re-open ADR-001 explicitly if light mode is ever attempted.
