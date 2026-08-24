---
description: "Use when writing CSS or styling components. Covers CSS scope, global reset avoidance, proper import patterns, and design token usage."
applyTo: "**/*.css,apps/frontend/src/**/*.tsx"
---

# CSS & Styling Conventions

## Before You Write Any UI

- ✅ Read `.github/instructions/ui-composition.instructions.md` for layout hierarchy, spacing rhythm, and container discipline
- ✅ Read `.github/component-registry.json` for allowed shared components and their props

## Layout Gotchas — Flex Overflow & Scrolling

When building page layouts with flexbox where only a specific area should scroll (not the whole page), the flex chain must be properly bounded at every level.

### The Scroll Chain Rule

For `overflow-y: auto` to create an internal scroll area in a flex layout:

```
root-container { height: 100vh }           ← MUST be bounded (not min-height)
  flex-child { flex: 1; min-height: 0 }    ← MUST have min-height: 0
    scroll-area { flex: 1; overflow-y: auto; min-height: 0 }  ← scrolls
```

**Three conditions, all required:**

1. **The root flex container must have a bounded height** — `height: 100vh` (not `min-height: 100vh`). `min-height` is a floor, not a ceiling — the layout can still grow past it, making overflow impossible.

2. **Every flex ancestor in the chain needs `min-height: 0`** — Flex items default to `min-height: auto`, which means they CANNOT shrink below their content size. Without `min-height: 0`, `overflow-y: auto` never activates because there's never space for overflow.

3. **The scroll area must be a `flex: 1` child between fixed-height siblings** — The scroll area fills remaining space. Its siblings (header, footer, toolbar) take their natural height via `flex: 0 0 auto` or just no flex-grow.

### Anti-pattern

❌ `min-height: 100vh` on the root container — lets the entire layout grow past the viewport, forcing document-level scroll instead of internal scroll.

❌ `overflow-y: auto` on a flex child without `min-height: 0` on every flex ancestor — the child can't shrink below content size, so it never overflows.

❌ Fixing the scroll at `.learn-content` level when only `.radicals-page__content` needs to scroll — creates nested scroll containers and unexpected scrollbar behavior.

### ✅ Fix pattern (from radicals page)

```css
.app-layout {
  height: 100vh;
} /* bounded root */
.app-content {
  min-height: 0;
  overflow-y: auto;
} /* ancestor chain */
.learn-content {
  min-height: 0;
} /* ancestor chain */
.radicals-page__content {
  overflow-y: auto;
  min-height: 0;
} /* scrolls */
```

### Flex shrink/clip gotcha (from commit f365dc54)

A flex item with `overflow: hidden` sets `min-height: auto → 0`, so flex **shrinks** expanded
content — content stays in the DOM but is invisible. Real case: `.phonetic-family-node` was
rendered at 49px (header height) instead of 357px; the expanded member list was clipped.

Two rules:

1. **`flex-shrink: 0` on the growing child** — never let a dynamic-content item be shrunk
   below its content height:
   ```css
   .phonetic-family-node {
     flex-shrink: 0;
   }
   ```
2. **ONE unified scroll container, not nested per-item scrollers** — the tab wrapper is the
   single scroll zone; items inside must NOT each carry `overflow-y: auto` / `max-height`:
   ```css
   .radical-trees-tab {
     flex: 1;
     min-height: 0;
     overflow-y: auto;
   }
   ```
   Nested per-item `overflow-y: auto`/`max-height` re-introduces the shrink/clip bug and
   creates nested scrollbars.

### Layout-Breakage Playbook (min-w-0, flex-basis, overflow knobs, stacking contexts)

Quick recipes for the most common layout breakages — reach for these before re-architecting a layout.
Reference sources: Tailwind docs (layout / flexbox / overflow / grid sections) + Josh Comeau's CSS
layout articles. These are reference sources only — this repo is **no-Tailwind**; apply the _recipes_,
never Tailwind classes or arbitrary values.

1. **Content won't shrink / flex item overflows** → add `min-width: 0` to the flex child. Flex items
   default to `min-width: auto`, which refuses to shrink below content — the horizontal sibling of the
   scroll-chain `min-height: 0` rule above.
2. **Wrapping vs truncation** → set an explicit `flex-basis` (or `width`) on the child, then apply the
   overflow knobs on the text node (`overflow: hidden`, `text-overflow: ellipsis`, `whitespace-nowrap`).
   Without a basis, an item sizes to its content and the overflow knobs have nothing to clip.
3. **Overflow knobs** — `overflow: hidden` / `clip` / `auto` must sit on the element that owns the
   scroll/clip, with `min-height: 0` / `min-width: 0` on every flex ancestor (see Scroll Chain Rule).
   `overflow-x: clip` kills an accidental horizontal scroller without creating a scroll container
   (the `DashboardPage.css` pattern) — don't reach for `overflow-x: hidden` (it creates a scroll
   container and can trap focus).
4. **Stacking contexts** — never use a raw `z-index` value; use the documented `--z-*` ladder
   (`--z-content` < `--z-chrome` < `--z-popover` < `--z-modal` < `--z-toast`, in `globals.css`).
   A `position` / `transform` / `opacity` / `will-change` on an ancestor creates a stacking context —
   if an element won't layer above a sibling, find the nearest context owner instead of cranking
   `z-index` (use `isolate`/`isolation: isolate` to start a fresh context).

## CSS Architecture (3-File Split)

| File                    | Purpose                                         | Example content                                                            |
| ----------------------- | ----------------------------------------------- | -------------------------------------------------------------------------- |
| `styles/globals.css`    | **Tokens** + **single-property utilities**      | `:root` vars, `.gap-*`, `.p-*`, `.flex-center`, `.text-*`                  |
| `styles/components.css` | **Multi-property component patterns**           | `.btn-base`, `.input-base`, `.card-interactive`, `.hover-lift`, `.overlay` |
| `styles/animations.css` | **`@keyframes` + animation/transition classes** | `.animate-fade-in`, `.transition-all`, `.skeleton-loading`                 |

All three are imported via `globals.css`. Every component/tokens file references CSS variables defined in `:root`.

## DESIGN.md Token Reference

This project has a machine-readable design token file at the project root: `DESIGN.md`

- ✅ ALWAYS read `DESIGN.md` before styling any component
- ✅ ALWAYS use CSS variables from `apps/frontend/src/styles/globals.css` — they map directly to DESIGN.md tokens
- ❌ NEVER hardcode hex values, spacing, or font sizes — they all have CSS variables

## Token vs Structural Values (Architect decision D4)

- ✅ Colors, radii, and the spacing scale MUST come from tokens (`var(--*)` / utility classes). No exceptions.
- ✅ One-off **structural layout values** are acceptable as documented exceptions — do NOT tokenize every px:
  - min-heights for fixed-state shells (e.g. `.radical-trees-tab__loading { min-height: 200px; }`)
  - hairline borders / small deltas (e.g. `2px` border-left on `.phonetic-family-node__members`)
  - fixed widths/paddings that are pure layout math, not a spacing-scale value (e.g. `40px`, `200px`)
- The existing tree components (`RadicalTreesTab.css`, `PhoneticFamilyNode.css`) are the sanctioned example of the boundary.
- ❌ Do not invent new tokens for every px — that bloats the token surface and creates token drift.

## ✅ Utility Classes (in `globals.css` — Single-Property)

These classes live in `globals.css` and map **one CSS property to one class**. Prefer these over writing custom CSS.

**Layout:**

| Class                | Effect                                                                               |
| -------------------- | ------------------------------------------------------------------------------------ |
| `.flex-center`       | `display: flex; align-items: center; justify-content: center; gap: var(--space-sm);` |
| `.flex-col`          | `display: flex; flex-direction: column;`                                             |
| `.flex-col-center`   | `.flex-col` + centered alignment                                                     |
| `.flex-between`      | `display: flex; justify-content: space-between; align-items: center;`                |
| `.flex-wrap`         | `flex-wrap: wrap`                                                                    |
| `.flex-align-center` | `display: flex; align-items: center`                                                 |
| `.shrink-0`          | `flex-shrink: 0`                                                                     |
| `.grid-2-col`        | 2-column responsive grid                                                             |
| `.grid-3-col`        | 3-column responsive grid                                                             |
| `.w-full`            | `width: 100%`                                                                        |
| `.mx-auto`           | `margin: 0 auto`                                                                     |

**Spacing:**

| Class                       | Effect                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `.gap-{xs/sm/md/lg/xl/2xl}` | `gap: var(--space-*)`                                                                   |
| `.p-{0/xs/sm/md/lg/xl/2xl}` | `padding: var(--space-*)` (all sides; use `gap` on parent for spacing between children) |

**Typography:**

| Class                                    | Effect                     |
| ---------------------------------------- | -------------------------- |
| `.font-{xs/sm/md/lg/xl/2xl/3xl/4xl/5xl}` | `font-size: var(--font-*)` |
| `.fw-{400/500/600/700/800}`              | `font-weight: *`           |
| `.text-center`                           | `text-align: center`       |
| `.text-left`                             | `text-align: left`         |
| `.text-white`                            | `color: white`             |
| `.inline-block`                          | `display: inline-block`    |
| `.whitespace-nowrap`                     | `white-space: nowrap`      |

**Text color:**

| Class                                             | Effect                  |
| ------------------------------------------------- | ----------------------- |
| `.text-{primary/secondary/tertiary/muted/subtle}` | `color: var(--text-*)`  |
| `.text-{success/error/warning}`                   | `color: var(--color-*)` |

**Border/Radius:**

| Class                          | Effect                                          |
| ------------------------------ | ----------------------------------------------- |
| `.radius-{sm/md/lg/pill/full}` | `border-radius`                                 |
| `.border-{1/2}`                | `border-width: 1px/2px` + `border-style: solid` |
| `.border-none`                 | `border: none`                                  |
| `.border-surface`              | `border-color: var(--surface-border)`           |
| `.border-primary`              | `border-color: var(--color-primary)`            |
| `.border-primary-border`       | `border-color: var(--color-primary-border)`     |
| `.border-transparent`          | `border-color: transparent`                     |

**Background:**

| Class                  | Effect                                |
| ---------------------- | ------------------------------------- |
| `.bg-surface-light-5`  | `background: var(--surface-light-5)`  |
| `.bg-surface-light-10` | `background: var(--surface-light-10)` |

**Full reference:** see `apps/frontend/src/styles/globals.css` for the complete list.

## ✅ Component Pattern Classes (in `components.css` — Multi-Property)

These classes live in `components.css` and bundle **multiple properties** into reusable patterns. Use them for common UI structures.

| Class                               | Purpose                                                     |
| ----------------------------------- | ----------------------------------------------------------- |
| `.btn-base`                         | Base button reset (border-radius, font, background, cursor) |
| `.btn-close`                        | Close button for modals/popups (absolute, transparent)      |
| `.btn-icon-circle`                  | Small circular icon button (22×22, play buttons)            |
| `.input-base`                       | Generic text input styling (use on `<input>`)               |
| `.overlay`                          | Fullscreen backdrop for modals                              |
| `.card-interactive`                 | Clickable card surface with hover lift                      |
| `.hover-lift` / `.-sm` / `.-md`     | Interactive hover lift effects (translateY + shadow)        |
| `.hover-scale`                      | Hover scale effect                                          |
| `.alert-success/error/warning/info` | State feedback containers                                   |
| `.progress-container/text/bar/fill` | Progress bar structure                                      |

## ✅ Animation Classes (in `animations.css`)

| Class                | Effect                                        |
| -------------------- | --------------------------------------------- |
| `.animate-fade-in`   | Fade-in animation                             |
| `.skeleton-loading`  | Skeleton shimmer animation                    |
| `.transition-all`    | `transition: all var(--transition-fast)`      |
| `.transition-colors` | `transition: background, border-color, color` |

## ✅ Example

```tsx
// ✅ DO — Use utility classes from globals.css + component patterns from components.css
<div className="flex-center gap-sm p-md radius-md border-bottom-default">
  <span className="font-sm text-muted">Label</span>
</div>

// ❌ BAD — Custom CSS that duplicates utility/pattern classes
<div className="my-custom-bar">
  <span className="my-custom-label">Label</span>
</div>
```

## ✅ CSS Color Function Rule — `rgba()`/`rgb()` Only in `:root`

- `rgba()`, `rgb()`, `hsl()`, `hsla()` are **ONLY** allowed in `apps/frontend/src/styles/globals.css` (where `:root` token declarations live)
- ALL other `.css` files must reference colors via `var(--token)` — never raw color functions
- This is enforced by Stylelint's `function-disallowed-list` rule with an override exempting `globals.css`
- If you need a new color that doesn't have a token yet, add it to `:root` in `globals.css` first, then reference via `var(--token)` in your CSS
- NEVER hardcode `rgba()`/`rgb()` in feature CSS, component CSS, or `components.css`/`animations.css`

## ✅ Run Design Audit

After writing or modifying CSS/TSX, run the automated scanner to catch violations:

```bash
npm run design-audit              # Scan entire frontend
npm run design-audit:feature apps/frontend/src/features/<name>/  # Scan a specific feature
```

This checks:

- **Class hygiene** — `used-but-undefined-class`: an **error** for any NEW undefined `className` (in any file); pre-existing undefined classes are frozen in the class baseline (`tools/design-audit.class-baseline.json`) and reported as **warnings** until the cleanup track empties the baseline (then the rule is fully `error`)
- **Inline-style gate** — `inline-style-magic-value` (error) + `inline-style-static` (warning): static magic values / static-only `style={{}}` blocks are flagged (see §Inline Style Prohibition)
- hardcoded colors/spacing/font-sizes, console.log, TODO comments, missing aria-labels, and CSS that duplicates global utility classes without a clarifying comment
- **Typography tokens (P0)** — `hardcoded-line-height` (error) + `hardcoded-font-weight` (error): raw `line-height` / `font-weight` literals must come from the `--lh-*` / `--fw-*` ladders in `globals.css` (never `font-weight: 500/600` literals or ad-hoc line-heights)
- **Semantic color roles** — `tone-outside-sanctioned-surface` (error): pinyin `--tone-*` colors only inside sanctioned `box-tone-*` / `btn-tone-*` surfaces; `resting-amber-shadow` (error): the amber `--shadow-md/lg` family only in `:hover` / `.hover-lift` / XP rules — makes the DESIGN.md Amber Restriction (A.3) a machine rule
- **Elevation & layering** — `z-index-raw` (error): raw `z-index` outside the `--z-*` ladder (content < chrome < popover < modal < toast); `elevation-no-hairline` (error): an elevation token with no `--surface-border-subtle` hairline in the same rule
- **Motion & vibrancy** — `transition-token-only` (advisory): raw `transition:` duration literals instead of `--transition-*`; `display-tracking` (advisory): a display-size heading class without `tracking-tight`; `saturated-fill-overflow` (advisory): >1 filled saturated element per viewport (amber budget extended to all saturated fills — see rubric one-CLA)
- **Spacing rhythm** — `nesting-inversion` (advisory): a child gap ≥ its parent gap (violates the nesting-tightens table in DESIGN.md §Spacing)

**Shared component CSS (`shared/components/`) is exempt** from the utility-duplicate check — those files define intentionally multi-property variant classes (e.g., `box-dark`, `btn-primary`) that bundle background, border, radius, shadow, and padding together by design. Feature CSS files should still prefer utility classes or add clarifying comments for intentional overrides.

## ✅ Shared Components Over Raw HTML

`src/shared/components/` has re-exported components that replace raw HTML:

- `Box` — generic container; 20 variants (`dark`, `dark-alt`, `dark-accent`, `dark-accent-primary`, `surface`, `elevated`, `error`, `card`, `divider`, `header`, `dashed`, `chip`, `item`, `pass`, `fail`, `tone-1` through `tone-5`), padding sizes `none`/`xs`/`sm`/`md`/`lg`/`xl`/`2xl`
- `Button` — 21 variants (`primary`, `secondary`, `icon`, `ghost`, `control`, `control-active`, `circle`, `tag`, `tag-active`, `primary-active`, `tab`, `tab-active`, `tone-1` through `tone-5`, `ghost-primary`, `rating-again`, `rating-good`, `rating-easy`), sizes `sm`/`md`/`lg`, loading/disabled states
- `Input` — styled text input
- `LoadingScreen`, `ErrorScreen` — full-page states
- `ProgressBar` — progress indicator with threshold marker
- `FilterChip` — toggleable filter chip
- `ToggleSwitch` — on/off toggle
- `Dropdown` — select dropdown
- `ContentBrowser` — content browsing

```tsx
import { Button, Input, FilterChip } from "shared/components";

// ✅ DO — Use shared Button component
<Button variant="secondary" size="sm" onClick={handleClick}>
  Back
</Button>

// ❌ BAD — Raw button with hand-styled CSS
<button className="my-custom-btn" onClick={handleClick}>Back</button>
```

## ✅ Component Decomposition

Follow the **frontend-audit skill** (`.github/skills/frontend-audit/SKILL.md`) — §Part 2 Architecture & Data
for the hierarchy rule and decomposition checklist. Summary: keep component files under ~150 lines;
extract render branches >30 lines into single-concern sub-components.

## Global CSS Avoidance

- ❌ NEVER use `// eslint-disable-next-line no-restricted-imports` to bypass CSS import restrictions
- ❌ NEVER rely on global button/input resets (outside `components.css`) — they affect ALL elements of that type
- ✅ Use `<div>` with `role="button"` and `tabIndex={0}` for custom button-like elements to avoid global button styles

## Hardcoded Styles Prohibition

- ❌ NEVER hardcode color values (`rgba()`, `#hex`, named colors) in component CSS — use CSS variables from `globals.css`
- ❌ NEVER use arbitrary opacity values like `opacity: 0.35` — use the `op-40`, `op-60`, `op-80`, `op-100` utility classes from `globals.css`
- ❌ NEVER write `transition` in feature component CSS — transitions belong on shared components (`components.css` or `animations.css`)
- ✅ Use `className="transition-all"`, `className="transition-colors"`, etc. from `animations.css` when needed in JSX

## Directional Properties Prohibition

- ❌ NEVER use `border-top`, `border-bottom`, `border-left`, `border-right` — use `<Box variant="divider" />` for separators
- ❌ NEVER use `padding-top`, `padding-bottom`, `padding-left`, `padding-right` — use `Box` with `padding` prop or full `p-*` utility classes
- ❌ NEVER use `margin-top`, `margin-bottom`, `margin-left`, `margin-right` — prefer `gap` on parent containers; use `m-0` for resets
- ✅ Use `padding: var(--space-*)` symmetrical shorthand only when both axes need the same tokens
- ✅ Use `gap-*` on parent containers for spacing between children

## Custom Scrollbar Rule

- ✅ Use `className="custom-scrollbar"` from `components.css` for any overflow container that needs custom scrollbar styling
- ❌ NEVER define `::-webkit-scrollbar` styles in component CSS — they belong in the global `components.css` `.custom-scrollbar` class

## Shared Components Over Custom Styles

- ❌ NEVER add custom `transition`, `opacity`, `background`, `font-size`, or `outline` overrides for shared components (Button, Input, etc.) in feature CSS — accept the shared component's default interaction design
- ✅ If a shared component's styling doesn't fit the exact use case, extend it with new props rather than overriding via CSS cascade
  - Example: Added `width`/`height` props to `<Button variant="icon">` instead of overriding 22×22 with parent-prefixed CSS selectors
- ✅ Propose new variants when a pattern is widely needed across features

## CSS Scope & File Placement

### Naming Convention: BEM (Block-Element-Modifier)

This project follows the standard BEM naming convention:

- **Block**: `.component-name` — the root element of a component
- **Element**: `.component-name__element` — a child part (separated by **double underscore `__`**)
- **Modifier**: `.component-name__element--modifier` or `.component-name--modifier` — a variant state (separated by **double hyphen `--`**)

```css
/* ✅ Correct BEM naming */
.radical-card {
} /* Block */
.radical-card__glyph {
} /* Element (double underscore) */
.radical-card__glyph--large {
} /* Modifier (double hyphen) */

/* ❌ Wrong — single underscore is not BEM */
.radical-card_glyph {
}
```

- Use short, semantic element names. Prefer `__search` over `__search-bar`.
- Use CSS modules as an alternative if preferred.

## No Raw Element Selectors

- ❌ NEVER use raw HTML element selectors (`p`, `span`, `div`, `button`, `h1`–`h6`, `a`, etc.) in component CSS — even when nested under a class
- ✅ Always use a BEM-classed element instead

```css
/* ❌ BAD — Raw element selector, even when context-scoped */
.rdc__etymology p {
  margin: var(--space-xs) 0 0;
}

/* ✅ GOOD — BEM-classed element */
.rdc__etymology-text {
  margin: var(--space-xs) 0 0;
}
```

**Exception:** Pseudo-elements (`::-webkit-scrollbar`, `::before`, `::after`) are exempt from this rule — they cannot use class names.

### File Placement: One CSS File Per Component

- Every component file gets its own `.css` file with the **same base name**, placed **next to it** in the same directory.
- A subcomponent's styles must NOT be placed in its parent's CSS file.

```
components/
├── MyComponent.tsx
├── MyComponent.css          ← ✅ Own CSS file
├── MySubComponent.tsx
├── MySubComponent.css       ← ✅ Own CSS file, NOT in MyComponent.css
└── index.ts
```

- If a component uses ONLY global utility classes (`.flex-center`, `.font-sm`, `.text-muted`, etc.) and has no unique CSS, then no CSS file is needed.
- Import the CSS file at the top of the component: `import "./MyComponent.css";`

## Dark Theme Variables (this project)

- Background: `#1e1e2e`
- Cards: `#252540`
- Borders: `#3a3a5e`
- Accent: `#818cf8`

## DO Example

```tsx
// ✅ DO — Use div for tab to avoid global button CSS
<div
  className="tab tab--active"
  onClick={() => setActive(id)}
  role="tab"
  aria-selected={isActive}
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") setActive(id);
  }}
>
  {label}
</div>
```

## DON'T Example

```tsx
// ❌ BAD — eslint-disable bypass
// eslint-disable-next-line no-restricted-imports
import './styles.css';

// ❌ BAD — button picks up global reset styles
<button className="tab" onClick={...}>{label}</button>
```

## ✅ Inline Style Prohibition (2026 rule)

**Utility-first by default.** Reach for a utility class first, a co-located `.css` class for component structure/state, and inline `style={{}}` **only** for values that are dynamic or var-driven. **Static magic values are forbidden** — the audit enforces this.

- ✅ Default — global utility classes in `className` (`.flex-center`, `.gap-sm`, `.text-primary`)
- ✅ Component structure/state — co-located local `.css` file (one per component)
- ✅ Inline `style={{}}` — ONLY for dynamic/var-driven values that a class can't express: computed percentages, runtime identifiers, theme-token keys
- ❌ **Static magic values** in `style={{}}` — literal lengths/numbers are a machine **error** (`inline-style-magic-value`); a block with zero dynamic content is a **warning** (`inline-style-static`)

### Decision table — what the audit enforces per property

| Case                                                                                                                                                                                                                                       | Verdict                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Key starts with `--` (`--accent-color`)                                                                                                                                                                                                    | ✅ pass                                                           |
| Value contains `var(--`                                                                                                                                                                                                                    | ✅ pass                                                           |
| Value is **dynamic** — contains `${`, is an identifier (`color`, `pct`), a member/call (`TONE_COLORS[i]`, `Math.max(value, 4)`), a ternary (`align === "center" ? a : b`), or a `%` string (`"100%"`, `${pct}%`)                           | ✅ pass                                                           |
| Value contains a **static** length/number literal — `\d+px`/`\d+rem`/`\d+em`, a bare `\d+` (`8`, `320`, `1000`), a quoted length (`"0.25rem"`, `"40px"`), or `clamp()/calc()/min()/max()/repeat()` with a px arg — **even alongside `${`** | ❌ **error** (`inline-style-magic-value`)                         |
| No magic literal but **zero** dynamic content (`display: "flex"`, `overflow: "hidden"`)                                                                                                                                                    | ⚠️ warning (`inline-style-static`) — prefer a utility/local class |

### ✅ DO — utilities + local CSS for structure/state

```tsx
<div className="flex-center gap-sm p-md text-primary">Content</div>
```

```css
/* MyComponent.css — co-located structure/state */
.my-component__bar {
  height: 8px;
  border-radius: var(--radius-pill);
}
```

### ✅ DO — inline `style` for dynamic / var-driven values only

```tsx
// ✅ PASS — dynamic: `${pct}%` string + `color` identifier (CategoryBreakdown fill)
<div
  className="quiz-breakdown__fill radius-pill h-full"
  style={{ width: `${pct}%`, background: color }}
/>
```

### ❌ DON'T — static magic values in `style={{}}`

```tsx
// ❌ ERROR (inline-style-magic-value) — static height + quoted length
<div style={{ height: 8, gap: "0.25rem" }}>Content</div>
```

If you find a fixed value that has no utility/class yet, add it to `globals.css` or the component's local `.css` — never leave it as a magic number in `style={{}}`.

## ✅ Dynamic States (Active, Disabled, Error)

Use **conditional className** with **global utility classes** for dynamic visual states. Never compute styles in JavaScript.

### ✅ DO

```tsx
<Link
  className={`base-class flex items-center gap-sm ... ${isActive ? "bg-primary-bg border-primary text-accent fw-600" : ""}`}
/>
```

### ❌ DON'T

```tsx
const getStyle = (isActive) => ({
  background: isActive ? "var(--color-primary-bg)" : "transparent",
  border: isActive ? "1px solid var(--color-primary-border)" : "1px solid transparent",
});
```

| State                | Approach                                                  |
| -------------------- | --------------------------------------------------------- |
| **Default**          | Base global utility classes                               |
| **Hover**            | CSS `:hover` pseudo-class in local `.css`                 |
| **Active/Selected**  | Toggle global utility classes via conditional `className` |
| **Missing utility?** | Add to `globals.css`                                      |

---

**See also:** `ui-composition.instructions.md` (layout rules) • `uiux-design-protocol.instructions.md` (design pipeline) • `frontend-pre-delivery-checklist.instructions.md` (token compliance check)
