---
description: "A theme is a delta overlay over the same semantic token names: no new names, no component overrides, no fork. Applies to the live token layer and the design spec."
applyTo: "apps/frontend/src/styles/globals.css,DESIGN.md"
---

# Theme delta

A theme changes values, never vocabulary. The overlay re-declares a subset of the same semantic names
under `[data-theme="<name>"]`, which is what lets one page show two surfaces side by side without a
second component stylesheet. Here the live token layer is `apps/frontend/src/styles/globals.css` and
`DESIGN.md` is the recorded palette intent.

- **A theme re-declares semantic and component names only, and introduces none.** Reason: a new name
  in a theme is a base-token decision hiding in an overlay, and every consumer that does not use the
  theme now has an undefined variable.
- **A theme never carries a component override.** Reason: components read semantic variables, so an
  overlay is sufficient by construction; an override means a component read a value it should not.
- **The theme name is data, not a class.** `data-theme="<name>"` on a root element selects the pack.
  Reason: an attribute can be applied to any subtree, which is what makes per-region theming possible.
- **Every declared value enters through the token layer, never a hand edit in a component sheet.**
  `globals.css` is the single source; `DESIGN.md` records the intent beside it. Reason: two sources of
  a value means one of them is wrong and neither is authoritative.
- **The merged set clears the same contrast floors as the base.** Text at 4.5:1, UI and focus at 3:1,
  focus ring at least 2px. Reason: a theme that fails contrast is a theme that fails the accessibility
  floor the base paid for; verify it with the axe sweep per theme, not per token.
- **The overlay keeps the ramps monotonic.** Lightness moves in one direction across a ramp, with no
  inversion and no muddy cross-hue grey unless the theme says so. Reason: a non-monotonic ramp reads
  as an accident at the boundary between two steps.
- **`validate-theme` is the intended gate, and it is not implemented yet.** Until it exists, run the
  seven checks in `.github/skills/add-theme/SKILL.md` and record the results as the pack's receipts,
  with `npm run check:spine-parity`, `npm run check:token-values` and `npm run check:closure` as the
  machine-owned half. Reason: a pack without receipts is a palette someone liked.
