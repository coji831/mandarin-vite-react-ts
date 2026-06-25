---
description: "Use when: designing a new page or feature UI, deciding where to place a component, or choosing between creating new vs reusing existing components."
name: "Component Decomposition"
---

# Component Decomposition Skill

## Purpose

Teach the agent how to decompose UI into the correct component hierarchy following the PinyinPal project's patterns and conventions. Prevents monolithic components, duplicated UI code, and misuse of the shared component library.

## Hierarchy Rule

Always decompose UI following this strict layering:

```
Page Route → Feature Orchestrator → Feature Components → Shared UI Components → Primitives
```

| Layer                    | Location                             | Responsibility                                                                |
| ------------------------ | ------------------------------------ | ----------------------------------------------------------------------------- |
| **Page Route**           | `src/pages/`                         | Route-level orchestrator. Minimal JSX. Delegates to features.                 |
| **Feature Orchestrator** | `src/features/<feature>/`            | Composes feature components and shared UI. Manages data flow for the feature. |
| **Feature Components**   | `src/features/<feature>/components/` | Domain-specific compositions of shared UI. Feature-aware logic.               |
| **Shared UI Components** | `src/shared/components/`             | Reusable primitives (Button, Input, Card patterns). Never feature-specific.   |
| **Primitives**           | Raw HTML + CSS variables             | Styled with CSS variables from `globals.css`. Never hardcoded values.         |

## Decomposition Checklist

When building any UI, follow these steps in order:

1. **☐ Can this be a shared component?**
   - Check `src/shared/components/index.tsx` first
   - If an existing shared component matches the need, use it — do NOT reimplement
   - Shared components list: Button, Input, LoadingScreen, ErrorScreen, ProgressBar, FilterChip, ToggleSwitch, ContentBrowser

2. **☐ Can this be extracted to a feature-level component?**
   - If the component is specific to a feature but used multiple times within it
   - Put in `src/features/<feature>/components/`
   - Give it a descriptive, feature-scoped name

3. **☐ Is it a one-off?**
   - If used in only one place and not reusable
   - Put in the feature folder, co-located with usage
   - Consider inlining if the JSX is small (<20 lines)

4. **☐ Does it need its own CSS file?**
   - Co-locate a `.css` file with the component
   - Use BEM-style naming: `.component__element--modifier`
   - Use CSS variables from `globals.css` — never hardcode values

## Shared Component Reference

See [DESIGN.md](../../../DESIGN.md) for the complete shared component catalog with descriptions, file paths, and import paths.

## DO / DON'T Examples

### ✅ DO — Check shared components first

```tsx
// ✅ DO — Import Button from shared components
import { Button } from "@/shared/components";

function SaveProfile() {
  return (
    <Button variant="primary" size="md">
      Save
    </Button>
  );
}
```

### ❌ DON'T — Reimplement shared components

```tsx
// ❌ BAD — Custom button with hardcoded styles
<button
  style={{
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
  }}
>
  Save
</button>
```

### ✅ DO — Use CSS variables for styling

```tsx
// ✅ DO — Co-located CSS using design tokens
<div className="feature-card">
  <p className="feature-card__title">{title}</p>
</div>
```

```css
/* feature-card.css */
.feature-card {
  background: var(--surface-dark);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}
.feature-card__title {
  color: var(--text-primary);
  font-size: var(--font-lg);
}
```

### ❌ DON'T — Hardcode values

```css
/* ❌ BAD — Hardcoded colors, spacing, radius */
.feature-card {
  background: #232a3a;
  border: 1px solid #38405a;
  border-radius: 8px;
  padding: 16px;
}
```

### ✅ DO — Split large components

```tsx
// ✅ DO — QuizPage delegates to feature components
function QuizPage() {
  return (
    <QuizProvider>
      <QuizHeader />
      <QuestionCard />
      <ProgressBar value={progress} />
      <AnswerOptions />
    </QuizProvider>
  );
}
```

### ❌ DON'T — Monolithic page components

```tsx
// ❌ BAD — Everything in one component, >200 lines
function QuizPage() {
  // state for header
  // state for question
  // state for progress
  // state for answers
  // event handlers galore
  // ALL the JSX inline...
  return <div>{/* 200+ lines of JSX */}</div>;
}
```

### ✅ DO — Import shared utility classes from globals.css

```tsx
// ✅ DO — Use card-dark for card surfaces
<div className="card-dark">
  <h2 className="text-secondary">{title}</h2>
</div>

// ✅ DO — Use hover-lift for interactive cards
<button className="hover-lift card-dark-hover" onClick={handleClick}>
  Click me
</button>
```

### ❌ DON'T — Reimplement utility patterns

```tsx
// ❌ BAD — Redundant card styling
<div
  style={{
    background: "#232a3a",
    border: "1px solid #38405a",
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  }}
>
  Content
</div>
```

## Output Format

When decomposing a UI, output your plan as:

```
I will create:
1. `src/features/<feature>/components/<ComponentName>.tsx` — Feature-level component for [purpose]
2. `src/features/<feature>/components/<ComponentName>.css` — Co-located styles using CSS variables
3. Uses shared `<Button>` from `@/shared/components`
4. Uses shared `<ProgressBar>` from `@/shared/components`
```

If no new components are needed (all can be composed from shared primitives), say:

```
This UI can be composed entirely from existing shared components:
- `<Button>` for action triggers
- `<Input>` for text entry
- `card-dark` CSS class for card surfaces
```
