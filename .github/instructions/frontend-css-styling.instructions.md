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

## Global CSS Avoidance

- ❌ NEVER use `// eslint-disable-next-line no-restricted-imports` to bypass CSS import restrictions
- ❌ NEVER rely on global button/input resets — they affect ALL elements of that type
- ✅ Use `<div>` with `role="button"` and `tabIndex={0}` for custom button-like elements to avoid global button styles

## CSS Scope

- Use BEM-style class names (`.component__element--modifier`)
- Or use CSS modules
- Keep component-specific styles in co-located CSS files

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
