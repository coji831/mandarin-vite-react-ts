---
description: "CSS rules for PinyinPal: the token law, the three-file split, and the prohibitions. Read before writing any stylesheet or className."
applyTo: "**/*.css,apps/frontend/src/**/*.tsx"
---

# CSS and styling

Every value reads a token. The token layer is `styles/globals.css` (`:root`, plus single-property
utilities), with `styles/components.css` (multi-property patterns) and `styles/animations.css`
(`@keyframes`, transition classes) imported beside it. `DESIGN.md` records the intent.

**The gate is the authority, not this file.** `npm run design-audit` reports a literal as
`hardcoded-color`, `hardcoded-spacing` or `hardcoded-font-size`, and `npm run check:spine-parity`
checks the name vocabulary. If this file and the gate disagree, the gate wins.

## The prohibitions

- **No literal value.** No hex, no `rgb()`, no `px`, no `ms`, no raw `z-index` integer. A value with no
  token is a token-layer request: name the role the value plays and add the token.
- **No arbitrary opacity.** Use the `op-40` / `op-60` / `op-80` / `op-100` utilities.
- **No `transition` in feature CSS.** Transitions belong to `components.css` or `animations.css`; in JSX
  use `transition-all` / `transition-colors`.
- **No directional property.** No `padding-top`, `margin-left`, `border-right`. Use symmetrical
  `padding: var(--space-*)`, `gap-*` on the parent, and `<Box variant="divider" />` for separators.
- **No raw element selector.** `p`, `span`, `div`, `button`, `h1`-`h6`, `a` are banned in component CSS
  even when nested under a class. Use a BEM-classed element. Pseudo-elements are exempt.
- **No inline `style` prop** for anything a token or class can express. A dynamic value that must be
  inline reads a custom property set on the element, never a literal in the JSX.
- **No global resets** for a bare element type outside `components.css`, and never bypass an import
  restriction with an eslint-disable.

## Layout values are the documented exception

Colours, radii and the spacing scale always come from tokens. A one-off **structural** value may be a
literal when it is pure layout math, not a scale step: `min-height` on a fixed-state shell, a hairline
border, a fixed panel width. `RadicalTreesTab.css` and `PhoneticFamilyNode.css` are the sanctioned
example of that boundary. Do not invent a token per px; that bloats the token surface.

## Where styles live

| File | Holds |
| --- | --- |
| `styles/globals.css` | tokens + single-property utilities (`.gap-*`, `.p-*`, `.flex-center`) |
| `styles/components.css` | multi-property patterns (`.btn-base`, `.card-interactive`, `.hover-lift`) |
| `styles/animations.css` | `@keyframes` + animation and transition classes |

One CSS file per component, same base name, beside it. A subcomponent gets its own file, never a block
in its parent's. A component that uses only global utilities needs no CSS file at all.

## Compose, do not restyle

Import shared components from `src/shared/components` rather than rebuilding one, and read
`.github/component-registry.json` before creating any UI structure.

Use the **native element** where one exists: `<button>` for an action, `<a href>` for navigation. A
`<div role="button" tabIndex={0}>` is never the answer; it loses keyboard activation, focus behaviour
and the assistive-technology role that the native element already has.

## Every state is a class

Each interactive component styles `:hover`, `:focus-visible`, `:active` and `[disabled]` (or
`[aria-disabled="true"]`), plus an error treatment where the component can fail. A missing state is a
missing rule, not a later task. Focus must stay visible: 2px minimum, 3:1 against its adjacent colour.

## The flex scroll chain

Internal scroll (an area scrolls while the page does not) needs all three, or it silently does nothing:

```
.root { height: 100vh }                    /* bounded, NOT min-height */
  .child { flex: 1; min-height: 0 }
    .scroll { flex: 1; overflow-y: auto; min-height: 0 }
```

`min-height` is a floor, not a ceiling, and a flex item defaults to `min-height: auto` so it cannot
shrink below its content. Both are why `overflow-y: auto` fails without them.

## Where the detail lives

- Full utility-class and pattern-class list: `docs/guides/design/css-class-catalog.md` (generated from
  `globals.css`, so it cannot drift).
- Layout physics, worked examples, before/after: `docs/guides/design/layout-physics.md`.
- Every token and its role: `DESIGN.md`, or `spine://tokens` through the spine MCP.
