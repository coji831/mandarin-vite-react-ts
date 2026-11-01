---
description: "The token layer is the only source of a value: every colour, length, duration and z-index reads var(--token). Applies to stylesheets and TSX."
applyTo: "apps/frontend/src/**/*.tsx,apps/frontend/src/**/*.css"
---

# Token discipline

The token layer is the one place a value changes once and reaches every consumer. A literal moves
that decision into the component, and no gate fails on it: the law below is the only stop.

- **Every value in CSS is `var(--token)`.** No hex, no `rgb()`, no `px`, no `ms`, no raw integer for
  `z-index`. Reason: a literal cannot be themed or audited, and the full audit only reports it.
- **A value with no token is a token-layer request, not a local literal.** Stop, name the role the
  value plays, and add the token (or ask for one). Reason: a component that invents a value silently
  becomes a second palette.
- **Read only the token paths the registry entry declares.** `.github/component-registry.json` is the
  component contract; a value read outside it is an undeclared dependency. Reason: the entry is what a
  consumer reads, so an undeclared path is an API nobody documented.
- **A variant's look comes from its declared token value, not from a branch of literals.** Reason:
  the closed variant set and the token map are the same decision, and splitting them lets one move
  without the other.
- **Durations and easing come from `--duration-*` and `--transition-*`; stacking comes from `--z-*`.**
  Reason: motion and layering are global contracts (reduced-motion, overlays), and a local value
  escapes the contract.
- **Do not resolve an alias by hand.** The `spine` MCP server (`spine://tokens`,
  `spine://tokens/{theme}`) follows aliases to the value; a hand-resolved alias in a comment is a value
  that stops being true at the next token edit.
- **The check is by hand.** `npm run design-audit` reports `hardcoded-*` literals (it already exits 1,
  so a literal changes nothing) and `npm run check:spine-parity` checks the name vocabulary. Do not
  restate the rules in a review comment.
