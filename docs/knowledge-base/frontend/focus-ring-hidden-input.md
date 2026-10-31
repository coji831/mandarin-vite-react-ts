---
purpose: Focus rings on controls whose input is visually hidden — :has(), the design-audit duplicate-utility rule, and forced-colors survival
status: active
last-verified: 2026-10-31
type: guide
---

# Focus Rings on Controls With a Hidden Input

**Last Updated:** October 31, 2026

**Summary:** When a custom control hides its native input (0×0, `opacity: 0`) and paints its own visuals, the focus ring has to land on the **row**, not the input. Three separate constraints decide how you draw it: the audit's duplicate-utility rule, forced-colors mode, and whether the ring is reachable by a descendant selector at all. Getting one wrong produces a control that looks fine and has no focus indicator for keyboard or High Contrast users.

## The situation

`RadioGroup` renders each option as a label wrapping a real `<input type="radio">` that is `position: absolute; width: 0; height: 0` plus `opacity: 0`, with a painted ring and a styled label. Semantics are correct (single tab stop, arrow-key movement, native checked state), but there is **no visible focus indicator** unless something styles the row: the input is invisible, and its own `:focus-visible` outline is invisible with it.

## The three constraints

### 1. The selector must be a descendant match

A utility class on the row cannot express "the input inside me is focused". Only `:has()` reaches it:

```css
.quiz-select__options .radio-group__option:has(.radio-group__input:focus-visible) {
  /* the ring for the whole row, driven by the hidden input */
}
```

That rules out the usual `<div class="focus-ring-primary">` remedy.

### 2. The audit flags a duplicated `outline:`

`design-audit` errors on a CSS property that re-declares a global utility, and its message names the utility to use instead:

```
error: CSS property duplicates a global utility class — use className instead, or add a comment
explaining why local override is needed (custom cases); shared-component CSS is exempt:
"outline: 2px solid var(--focus-ring)" → use className="focus-ring-primary"
```

The suggested remedy is unusable here (see constraint 1), and a prose comment above the rule does **not** silence it — only a `comment` inside the declaration block does, and even then only when the checker accepts the phrasing. What actually passes is to stop re-declaring the utility's properties at all:

```css
box-shadow: 0 0 0 2px var(--focus-ring);
```

The ring is visually identical and the duplicate-utility rule no longer fires. This is the cheaper of the two legitimate outcomes; the other is the commented exemption, which survives in a "custom case" you can defend.

### 3. `box-shadow` does not survive forced-colors mode

Windows High Contrast (and any `forced-colors: active` context) forces `box-shadow: none`. A `box-shadow` ring is therefore **no focus indicator at all** for exactly the users who rely on system colours — WCAG 2.2 **2.4.7 Focus Visible** fails.

The fix is a real `outline` reintroduced only inside the media query, using the system colour reserved for it:

```css
@media (forced-colors: active) {
  .quiz-select__options .radio-group__option:has(.radio-group__input:focus-visible) {
    outline-color: Highlight;
    outline-style: solid;
  }
}
```

`Highlight` is the system colour for a selected/focused item, and `outline-style: solid` is required because `outline-color` alone paints nothing. Spinner, Skeleton, ProgressBar and StrokeAnimationTab already use `@media (forced-colors: active)` blocks — follow that shape rather than inventing one.

## Why not just draw the input visibly?

That is the better fix when you own the component: a visible native input keeps its own `:focus-visible`, survives forced colors for free, and needs no `:has()`. It is not available when the control is a shared component with many consumers and the visual is fixed — which is exactly when this page applies. Prefer "make the input visible" first; reach for the three constraints above only when the design forbids it.

## Checklist

- [ ] The control has a focus indicator at all — test with Tab, not with a click.
- [ ] `node tools/design-audit-foundation.mjs --full` reports no new finding for the file.
- [ ] `@media (forced-colors: active)` block present if the ring is a `box-shadow`.
- [ ] Ring contrast ≥ 3:1 against the adjacent surface (1.4.11) and visible against the selected plane too.
- [ ] The element that receives focus is not `disabled` (use `aria-disabled` + early return) — a disabled control is removed from the tab order and can drop focus to `<body>`.

## Related

- [Strategy Pattern on the Frontend](./strategy-pattern-frontend.md) — the quiz formats whose option groups use this ring
- [Quiz & Review System](../../architecture.md#quiz--review-system) — where the surfaces live
- `docs/guides/design/design-reasoning.md` — token freeze and the focus-ring token
