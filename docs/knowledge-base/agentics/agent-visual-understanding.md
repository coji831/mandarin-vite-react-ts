# Agent Visual Understanding

**Last Updated:** 2026-07-20
**Audience:** AI Coding Agents
**Purpose:** Deep-dive into how agents handle visual design — the Storybook-first mandate, token integrity, MCP toolchain, and the verification loop.

---

## Why This Matters

Without visual understanding, agents generate blind code: correct syntax, wrong design. The visual understanding system bridges the gap between design intent and implementation by providing:

1. **Component documentation** — what exists, what props it takes, what it looks like
2. **Design tokens** — the vocabulary of colors, spacing, typography
3. **Verification tools** — ability to see the rendered result and compare it to expectations

---

## The Storybook-First Mandate

Storybook is the **visual source of truth** for all components. Every component must have a `.stories.tsx` file covering all visual states.

### Source of Truth Hierarchy

```
DESIGN.md  ←  Human-authoritative token reference
    ↓
globals.css  ←  CSS variable definitions + utility classes
    ↓
Shared Component CSS + Storybook stories  ←  Visual source of truth
    ↓
Feature Component CSS  ←  Uses CSS variables, never hardcoded values
```

### Storybook Role in the Workflow

| Phase        | Storybook Role                                              |
| ------------ | ----------------------------------------------------------- |
| Discovery    | Agent queries Storybook MCP to check if a component exists  |
| Development  | Agent builds/updates component alongside its `.stories.tsx` |
| Verification | Agent previews stories to visually confirm correctness      |
| Regression   | Story tests (`npm run test-storybook`) catch visual drift   |

### Component Coverage Requirements

Every component needs stories for:

- **Default state** — the primary use case
- **Loading state** — if the component loads async data
- **Error state** — if the component handles errors
- **Empty state** — if the component renders optional content
- **Edge cases** — long content, many items, missing data
- **All variants** — visual overview of available variants

---

## Token Integrity

Design tokens are the shared vocabulary between design and code. The token system enforces consistency across the entire application.

### Token Categories

| Category      | Pattern                                | Example                   |
| ------------- | -------------------------------------- | ------------------------- |
| Colors        | `--color-*`, `--surface-*`, `--text-*` | `var(--color-primary)`    |
| Spacing       | `--space-*`                            | `var(--space-md)`         |
| Border radius | `--radius-*`                           | `var(--radius-sm)`        |
| Shadows       | `--shadow-*`                           | `var(--shadow-md)`        |
| Font sizes    | `--font-*`                             | `var(--font-lg)`          |
| Transitions   | `--transition-*`                       | `var(--transition-fast)`  |
| Gradients     | `--gradient-*`                         | `var(--gradient-primary)` |

### Rules

- **Never hardcode** colors (`#`, `rgb`, `rgba`), spacing (`px`), or font sizes in feature CSS
- **Never hardcode** inline styles in TSX — use utility classes or CSS variables
- **Never use** raw element selectors in feature CSS (`p`, `button`, `ul`) — use BEM classes
- **Never add** transitions or animations to feature CSS — shared components own interaction styles

---

## MCP Toolchain

The agent uses three MCP tools for visual work:

### Storybook MCP

**Purpose:** Component discovery and documentation lookup.

- `list-all-documentation` — discover all available component IDs
- `get-documentation` — get component props, types, and story examples
- `get-documentation-for-story` — get detailed variant documentation
- `preview-stories` — render a story and get a URL to visually verify

**When to use:** Before creating any UI — check if the component already exists. Before using any component — verify props and variants.

### Playwright MCP

**Purpose:** Browser automation and screenshot verification.

- Navigate to pages and Storybook stories
- Take screenshots for visual comparison
- Click/interact with elements to verify behavior
- Get console messages for debugging

**When to use:** After implementing UI — capture screenshots to verify against design intent.

### Chrome DevTools MCP

**Purpose:** Page inspection and performance auditing.

- Inspect CSS computed values
- Run Lighthouse audits (accessibility, SEO, best practices)
- Capture performance traces
- Evaluate JavaScript in page context

**When to use:** For accessibility checks, performance audits, and deep CSS debugging.

---

## Verification Loop

The visual verification loop ensures design fidelity:

```
1. Define tokens → DESIGN.md + globals.css
2. Build/update component + Storybook story
3. Preview story via Storybook MCP → visually verify
4. Optionally screenshot via Playwright MCP → compare
5. Audit: grep for hardcoded values, dead CSS, console.log
6. Run design lint: npx @google/design.md lint DESIGN.md
7. Run story tests: npm run test-storybook
```

### What to Verify

| Check              | How                                                   |
| ------------------ | ----------------------------------------------------- |
| Token compliance   | No hardcoded colors, spacing, or font sizes           |
| State coverage     | Loading, empty, error, edge cases handled             |
| Layout stability   | Fixed container dimensions, inner scroll for overflow |
| Responsiveness     | Works at 320px, 768px, 1024px (via Playwright resize) |
| Accessibility      | aria-labels on interactive elements, contrast ratios  |
| No debug artifacts | No `console.log`, commented code, or TODO comments    |

---

## Design Philosophy: Warm Minimalism

The app follows a "Warm Minimalism" design philosophy:

- **Flat surfaces** — no glassmorphism, neumorphism, or heavy gradients
- **Content-first** — the character/word/quiz is the focus, not the chrome
- **Amber accents** — used sparingly for CTAs and active states
- **Dark mode only** — warm slate backgrounds, no light mode
- **Subtle feedback** — hover lifts, color transitions, no bouncy animations

See `docs/guides/design/design-reasoning.md` for the full design philosophy document.

---

## Pre-Delivery Checklist

Before reporting any UI as complete, run through the [Pre-Delivery Checklist](../../../.github/instructions/frontend-pre-delivery-checklist.instructions.md). It covers:

- Token compliance
- States coverage (loading, empty, error)
- Interaction patterns
- Layout stability
- Quality gates (build, test, lint, design lint)
