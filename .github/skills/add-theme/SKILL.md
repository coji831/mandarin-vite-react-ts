---
name: add-theme
description: >
  Adds a theme pack as a delta overlay over the same semantic token names, builds it, and
  validates it against the seven theme checks (closure, name discipline, contrast, ramp
  monotonicity, reflow, motion and forced-colors, receipts). USE WHEN a new surface, a
  consumer-branded palette, or a light/dark variant is being added without forking the
  component layer.
user-invocable: true
---

# Add a theme

**Trigger.** A new theme pack is requested: a second surface, a consumer-branded palette, or a
light/dark counterpart.

**Finish.** The pack is an overlay over the existing token layer, every declared name already exists in
the base set, the seven checks below have recorded results, and the theme is documented beside the
token layer.

A theme is a **delta overlay**. It re-declares a subset of the same semantic names under
`[data-theme="<name>"]` and changes nothing else. `apps/frontend/src/styles/globals.css` owns the shape
and the values; `.github/instructions/theme-delta.instructions.md` is the always-on contract.

## 0 · Decide whether it is a theme at all

- **A new token name is a base change, not a theme.** If the design needs a value the base set does not
  have, stop: add the semantic name to `globals.css` first, in every theme, then theme it.
- **A component override is not a theme.** Components read semantic variables; needing an override
  means a component read a value it should not, which is a component fix.
- **A theme is not a mode toggle.** The name is data (`data-theme`), and any subtree can carry it.

## 1 · Author the delta

1. List the semantic and component names the theme changes. Nothing else goes in the file.
2. Give each name a value in the base set's unit and format.
3. Keep the ramps monotonic: lightness moves in one direction across a ramp, with no inversions.
4. Author the pack in the token layer (`apps/frontend/src/styles/globals.css` or a sibling file it
   imports); never hand-edit a built or generated artefact.

## 2 · Build and prove the vocabulary

```powershell
npm run build:frontend
npm run check:spine-parity
npm run check:token-values
npm run check:closure
```

`check:spine-parity` proves the names are the canonical vocabulary (no new generic names);
`check:closure` proves every name the tree references is declared. A name the overlay invented shows up
in both. Reason: the overlay is only a delta if the vocabulary did not move.

## 3 · The seven checks

Run each and record the result as the pack's receipt. These are the checks `validate-theme` will
enforce; until that gate exists, the receipt is the evidence.

| # | Check | Pass looks like |
| --- | --- | --- |
| 1 | Schema and closure | the token layer parses, and after merging base + overlay every base token resolves to a concrete value (`npm run check:closure` → `genuinely dangling: 0`) |
| 2 | Name discipline | the overlay introduces no new semantic or component names and removes none (`npm run check:spine-parity` → `0 generic, 0 deprecated`) |
| 3 | Contrast | over the merged set: text 4.5:1, large text 3:1, UI and focus 3:1, focus ring at least 2px; APCA reported as advisory, not binding |
| 4 | Ramp monotonicity | lightness is monotonic across each ramp; hue and chroma deltas are bounded, with no muddy cross-hue grey unless the theme declares it |
| 5 | Reflow | no horizontal scroll at 200% zoom and at 320px; CJK line-height at or above 1.7 with no hyphenation |
| 6 | Motion and forced colors | `prefers-reduced-motion` collapses animation; `forced-colors: active` loses no information |
| 7 | Receipts | renders produced by the same instruments as the base, so theme-vs-base diffs visually and numerically |

Check 3 and check 5 are run per theme, not extrapolated from the base: a theme that fails contrast
fails the accessibility floor the base paid for.

## 4 · Apply and prove

- Apply the pack with `data-theme="<name>"` on a root element; it may be a subtree.
- Run the axe sweep in `docs/guides/testing/visual-qa.md` with the theme selected and record 0
  violations.
- Run `npm run design-audit` on the changed set and record the summary line.
- Add a story or a gallery pane that shows the theme beside the base, so a reviewer sees the delta
  rather than reading about it.

## 5 · Document

Add the pack to the table beside the token layer (`DESIGN.md`): the name, what it changes, how it is
applied, and where its receipt lives. A pack nobody can find is a pack nobody uses.

## When to stop

- The design needs a semantic name that does not exist: that is a base-token change, with its own ADR.
- A component needs an override to work under the theme: the component is reading the wrong tier.
- A check cannot be run because an instrument is missing: record the gap as the receipt rather than
  asserting the check passed.
