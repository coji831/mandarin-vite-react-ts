---
description: "The WCAG 2.2 floors every component and page must clear, and the one rule each floor implies. Applies to every file."
applyTo: "**"
---

# Accessibility floor

The floor is WCAG 2.2 AA. The axe sweep in `docs/guides/testing/visual-qa.md` enforces what a machine
can check; the rest is a contract a reviewer checks by hand. `docs/guides/design/uiux-fundamentals.md`
owns the full table and the component-by-component keyboard contracts; this file is the rule and its
reason.

- **Text at 4.5:1, large text at 3:1, UI boundaries and states at 3:1 (SC 1.4.3, 1.4.11).** Reason:
  the token ladder is solved for these ratios, so a component that reads the ink and edge tokens
  inherits the floor; one that invents a colour does not.
- **The focus ring is at least 2px and contrasts 3:1, on `:focus-visible`, for every variant (SC 2.4.7,
  2.4.13).** Reason: a variant that inherits the UA ring has a focus indicator nobody designed, and a
  new variant is the usual way the ring disappears.
- **A focused element is never hidden by author content (SC 2.4.11).** Reason: sticky chrome and
  overlays scroll over the focused row by default; the fix is a scroll margin or a focus move, not a
  smaller overlay.
- **Disabled text is not faded.** Step it down to the quiet ink tier and keep its ratio. Reason: any
  container opacity below 1 puts the quiet tier under 4.5:1, and the 1.4.3 exemption does not cover
  text a reader still has to read.
- **`prefers-reduced-motion: reduce` is a contract, not a suggestion.** Reason: the transition tokens
  are the only motion source, so honouring the query once at the token layer covers every component.
- **Every custom-drawn indicator carries a `@media (forced-colors: active)` block.** Reason: forced
  colours discards background images and custom borders, and an indicator drawn that way disappears.
- **Native element first; ARIA only where no native element exists.** Reason: a native control brings
  keyboard behaviour, focus management and a role for free, and a rebuilt one brings the bugs.
- **Status messages are announced without moving focus (`role="status"` or `role="alert"`, SC 4.1.3).**
  Reason: a toast a screen-reader user never hears is a message that did not arrive.
- **Targets clear 24 x 24 CSS px (SC 2.5.8); the primary action clears 44px.** Reason: the token
  ladder already carries `--size-touch` (28px, the WCAG 2.5.8 minimum), so a smaller target is a
  literal, and the 44px primary is a documented deliberate exception to that floor.
- **The gate is the check.** The axe sweep over every theme is the R0 reading; a review that restates
  a ratio the sweep printed is duplicating the instrument. The static half is `npm run design-audit`.
