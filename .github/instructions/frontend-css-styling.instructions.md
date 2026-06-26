---
description: "Use when writing CSS or styling components. Covers CSS scope, global reset avoidance, proper import patterns, and design token usage."
applyTo: "**/*.css,apps/frontend/src/**/*.tsx"
---

# CSS & Styling Conventions

## DESIGN.md Token Reference

This project has a machine-readable design token file at the project root: `DESIGN.md`

- ✅ ALWAYS read `DESIGN.md` before styling any component
- ✅ ALWAYS use CSS variables from `apps/frontend/src/styles/globals.css` — they map directly to DESIGN.md tokens
- ✅ Use `card-dark` and `card-dark-hover` CSS classes for card surfaces
- ✅ Use `hover-lift` for interactive element hover effects
- ❌ NEVER hardcode hex values, spacing, or font sizes — they all have CSS variables

## ✅ Utility Classes (Prefer Over Custom CSS)

`globals.css` provides utility classes that should be used instead of writing custom CSS for common layouts and styles:

**Layout:**

- `.flex-center` — `display: flex; align-items: center; justify-content: center; gap: var(--space-sm);`
- `.flex-col` — `display: flex; flex-direction: column;`
- `.flex-col-center` — `.flex-col` + centered alignment
- `.flex-between` — `display: flex; justify-content: space-between; align-items: center;`
- `.flex-wrap` — `display: flex; flex-wrap: wrap; gap: var(--space-sm);`
- `.grid-2-col` — 2-column responsive grid
- `.grid-3-col` — 3-column responsive grid
- `.w-full` — `width: 100%`
- `.mx-auto` — `margin: 0 auto`

**Spacing:**

- `.gap-{xs/sm/md/lg/xl/2xl}` — gap between flex/grid children
- `.p-{xs/sm/md/lg/xl/2xl}` — padding on all sides
- `.px-{sm/md/lg}` — horizontal padding
- `.py-{sm/md/lg}` — vertical padding

**Typography:**

- `.font-{xs/sm/md/lg/xl/2xl/3xl/4xl/5xl}` — font-size via `var(--font-*)`
- `.fw-{400/500/600/700/800}` — font-weight
- `.text-center` — text-align: center
- `.font-italic` — italic text

**Text color:**

- `.text-{primary/secondary/tertiary/muted/success/error/warning}` — text color

**Border/Radius:**

- `.radius-{sm/md/lg/pill/full}` — border-radius
- `.border-default` — 1px solid `var(--surface-border)`
- `.border-none` — no border

**Background:**

- `.bg-surface-{dark/dark-alt/dark-2}` — background color
- `.gradient-primary` — primary gradient

**Effects:**

- `.transition-all` — transition: all `var(--transition-fast)`
- `.skeleton-loading` — skeleton loading animation

**Inputs:**

- Use `.input-base` class on `<input>` elements instead of custom input styles

```tsx
// ✅ DO — Use utility classes
<div className="flex-center gap-sm p-md border-default">
  <span className="font-sm text-muted">Label</span>
</div>

// ❌ BAD — Custom CSS that duplicates utility classes
<div className="my-custom-bar">
  <span className="my-custom-label">Label</span>
</div>
```

## ✅ Shared Components Over Raw HTML

`src/shared/components/` has re-exported components that replace raw HTML:

- `Button` — variants `primary`/`secondary`, sizes `sm`/`md`/`lg`, loading state
- `Input` — styled text input
- `LoadingScreen`, `ErrorScreen` — full-page states
- `FilterChip` — toggleable filter chip
- `ToggleSwitch` — on/off toggle
- `ProgressBar` — progress indicator
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

- Keep component files under ~150 lines
- Extract render branches >30 lines into separate sub-components
- Each sub-component handles ONE concern

```tsx
// ✅ DO — Decomposed
function MyFeature() {
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;
  return <MyFeatureContent />;
}

// ❌ BAD — Monolithic component
function MyFeature() {
  // ... 200+ lines with everything inlined
}
```

## Global CSS Avoidance

- ❌ NEVER use `// eslint-disable-next-line no-restricted-imports` to bypass CSS import restrictions
- ❌ NEVER rely on global button/input resets — they affect ALL elements of that type
- ✅ Use `<div>` with `role="button"` and `tabIndex={0}` for custom button-like elements to avoid global button styles

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
