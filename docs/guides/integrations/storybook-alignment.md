# Storybook–Production Alignment Guide

**Last Updated:** July 20, 2026
**Purpose:** Methodology for maintaining zero drift between Storybook stories and production pages — ensuring Storybook functions as the design-level source of truth.
**Audience:** Frontend developers writing React components, creating Storybook stories, or reviewing code for visual consistency.

---

## Overview

Storybook stories and production pages frequently diverge because:

- Stories render components in isolation — without the same layout wrappers, context providers, or global CSS as production.
- Pages compose components differently — a page might pass different props, use different wrapper markup, or inject additional state.
- Visual drift is silent — without automated visual diffing, design rot accumulates unnoticed.
- Design tokens aren't enforced — hardcoded values creep into production code, bypassing the token system tested in Storybook.

**The goal:** Every production page should be a thin orchestration layer over components individually verified in Storybook, wrapped in the same layout decorators used in stories.

---

## Step 1: Split Pages into Container + Presentational

Every page must be split into two layers:

```
PageContainer (production only)       ← Data fetching, routing, state
└── PageContent (Storybook-able)      ← Pure presentational, props-only
    └── Layout (AppLayout, LearnLayout)  ← Shared, decorator-wrapped
        └── FeatureComponent(s)        ← Individual stories exist
```

**Rules:**

- `PageContent` must be fully renderable in Storybook with only props — no hooks that fetch data, no router dependencies, no localStorage access.
- `PageContainer` is the production-only wrapper that calls hooks and passes data down as props.
- Every `PageContent` component gets its own `.stories.tsx` file.

---

## Step 2: Create Layout Decorators for Storybook

Create decorators in `.storybook/decorators/` that mirror the exact production wrapper chain:

```
Production:  <BrowserRouter> → <AuthProvider> → <AppLayout> → <LearnLayout> → <PageContent>
Storybook:   <MemoryRouter>  → <AuthProvider> → <AppLayout> → <LearnLayout> → <PageContent>
```

**Implementation:**

```tsx
// .storybook/decorators/withAppLayout.tsx
import { AppLayout } from "../../src/shared/layouts/AppLayout";
import { MemoryRouter } from "react-router-dom";

export function withAppLayout(Story: () => JSX.Element) {
  return (
    <MemoryRouter initialEntries={["/learn/radicals"]}>
      <AppLayout>
        <Story />
      </AppLayout>
    </MemoryRouter>
  );
}
```

**Convention:**

- Apply global decorators (auth, router) in `.storybook/preview.tsx`
- Apply page-level decorators (AppLayout, LearnLayout) at the meta level
- All decorators support parameter-driven opt-out via `parameters.layout = 'none'`

---

## Step 3: Enforce Explicit Layout Parameters

Every story must declare its `layout` parameter. Never rely on the default.

| Layout       | Use Case                                 | Production Equivalent                |
| ------------ | ---------------------------------------- | ------------------------------------ |
| `centered`   | Atomic components (Button, Input, Chip)  | Rendered inside a centered container |
| `padded`     | Mid-level composites (Card grids, forms) | Default content area padding         |
| `fullscreen` | Pages, layouts, full-screen modals       | The actual browser viewport          |

```tsx
// Atomic component — centered for isolated viewing
const meta = {
  component: Button,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Button>;

// Page-level story — fullscreen to match production
const meta = {
  component: RadicalsPageContent,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RadicalsPageContent>;
```

---

## Step 4: Use Args Composition for Page Stories

Build page stories from child component stories to keep data DRY and consistent:

```tsx
// RadicalsPageContent.stories.tsx
import * as ContentBrowserStories from "../ContentBrowser/ContentBrowser.stories";

export const Default: Story = {
  args: {
    radicals: ContentBrowserStories.WithItems.args?.items ?? [],
    filters: { level: 1 },
  },
};

export const Empty: Story = {
  args: { radicals: [], isLoading: false, error: null },
};

export const Loading: Story = {
  args: { radicals: [], isLoading: true, error: null },
};

export const Error: Story = {
  args: { radicals: [], isLoading: false, error: "Failed to load radicals." },
};
```

**Required states per page:** Default, Empty, Loading, Error.

---

## Step 5: Mock API Data with MSW

For components that fetch data directly (rather than receiving it as props), use MSW handlers that return realistic data matching the real API shape:

```tsx
// .storybook/msw-handlers.ts
import { http, HttpResponse } from "msw";

export const radicalsHandlers = [
  http.get("/api/radicals", () => {
    return HttpResponse.json({
      data: [
        { id: "1", character: "一", strokeCount: 1, level: 1 },
        // ... realistic sample data
      ],
    });
  }),
];
```

**Rule:** MSW handlers must return data consistent with the real API — same shape, same field names, realistic values. Never return `[]` for "default" stories.

---

## Step 6: Configure Viewport & Background Testing

### Required Breakpoints

Every page story must be verified at these breakpoints:

| Breakpoint   | Width  | Purpose                 |
| ------------ | ------ | ----------------------- |
| Mobile Small | 320px  | Minimum supported width |
| Mobile Large | 414px  | Typical phone           |
| Tablet       | 768px  | iPad portrait           |
| Desktop      | 1024px | Standard laptop         |

### Viewport Configuration

```tsx
// .storybook/preview.tsx
parameters: {
  viewport: {
    viewports: {
      mobileSmall: { name: 'Mobile S', styles: { width: '320px', height: '568px' }, type: 'mobile' },
      mobileLarge: { name: 'Mobile L', styles: { width: '414px', height: '896px' }, type: 'mobile' },
      tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
      desktop: { name: 'Desktop', styles: { width: '1024px', height: '768px' }, type: 'desktop' },
    },
  },
}
```

### Overflow Verification

Include a `play` function that verifies no horizontal overflow at the smallest viewport:

```tsx
export const MobileLayout: Story = {
  globals: { viewport: { value: "mobileSmall", isRotated: false } },
  play: async ({ canvasElement }) => {
    const root = canvasElement.firstElementChild;
    await expect(root?.scrollWidth).toBeLessThanOrEqual(320);
  },
};
```

### Background Configuration

```tsx
parameters: {
  backgrounds: {
    default: 'dark',
    values: [
      { name: 'dark', value: '#1C1917' },    // --surface-dark-alt
      { name: 'medium', value: '#262321' },  // --surface-dark
      { name: 'light', value: '#F5F5F4' },   // Future light theme
    ],
  },
}
```

---

## Step 7: Use Design Token Discipline

### CSS Token Decision Flowchart

```
Writing a CSS value?
  ├─ Is it a color?          → Must use var(--color-*) or var(--surface-*)
  ├─ Is it spacing?          → Use var(--space-*) token
  ├─ Is it a shadow?         → Use var(--shadow-*)
  ├─ Is it a border-radius?  → Use var(--radius-*)
  ├─ Is it a transition?     → Use var(--transition-*)
  └─ One-off unique value?   → Write literal + comment why no token fits.
```

### Extraction Rule

If the same literal value appears in 2+ CSS files, extract it to `globals.css` as a new CSS variable:

```css
/* Before: two files hardcode the same value */
.sidebar {
  width: 220px;
}
.drawer {
  width: 220px;
}

/* After: extract to token */
:root {
  --sidebar-width: 220px;
}
.sidebar {
  width: var(--sidebar-width);
}
.drawer {
  width: var(--sidebar-width);
}
```

### Global Utility Classes

Define multi-property patterns in `globals.css` to enable future Tailwind migration:

```css
.card-dark {
  background: var(--surface-dark);
  border-radius: var(--radius-md);
}
.card-raised {
  background: var(--surface-raised);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
```

**Enforcement:**

- No local `.css` file may declare `background`, `color`, `border-radius`, `box-shadow`, or `padding` — those must come from global utilities or tokens.
- Local CSS files contain only structural rules: `display`, `grid-template-*`, `flex-*`, `position`, `width`, `height`, `overflow`.
- Audit: `grep -r "background:" apps/frontend/src --include="*.css" | grep -v globals.css` should return zero results.

---

## Step 8: Use Shared Components — Never Recreate

Check `src/shared/components/` before using any native HTML element for a UI pattern:

| Instead of…                           | Use…                         |
| ------------------------------------- | ---------------------------- |
| `<div className="card">`              | `<Card>`                     |
| `<button className="btn-primary">`    | `<Button variant="primary">` |
| `<input type="text" className="...">` | `<Input>`                    |
| `<div className="chip">`              | `<FilterChip>`               |
| `<div className="spinner">`           | `<LoadingScreen>`            |
| `<div className="error-msg">`         | `<ErrorScreen>`              |
| `<div className="progress">`          | `<ProgressBar>`              |
| `<div className="toggle">`            | `<ToggleSwitch>`             |
| `<div className="grid">`              | `<Grid>`                     |
| `<div className="modal-overlay">`     | `<Modal>`                    |
| `<div className="tabs">`              | `<Tabs>`                     |
| `<div className="search">`            | `<SearchInput>`              |

**Style override exception:** Shared components accept `className` for contextual spacing adjustments, but never for redefining the component's core visual identity.

---

## Step 9: Add Verification Gates

### Visual Testing (Chromatic)

```bash
npx storybook@latest add @chromatic-com/storybook
```

**CI workflow:**

1. Developer makes code change
2. Run visual tests from the Storybook addon panel (or `npx chromatic`)
3. Review pixel diffs — accept intentional changes as new baselines
4. Push → CI runs Chromatic → PR gets a "UI Tests" check

### Interaction Testing

Use Storybook's `play` function to simulate user interactions:

```tsx
export const FilterByLevel: Story = {
  args: { radicals: mockRadicals },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("Level 1"));
    const items = canvas.getAllByRole("article");
    await expect(items).toHaveLength(3);
  },
};
```

### Accessibility Testing

Enable `@storybook/addon-a11y` to check every story for WCAG violations:

```tsx
parameters: {
  a11y: {
    config: {
      rules: [{ id: 'color-contrast', enabled: true }],
    },
  },
}
```

### Design Token Linting

```json
// .stylelintrc.json
{
  "rules": {
    "color-no-hex": true,
    "declaration-no-important": true
  }
}
```

---

## Step 10: Organize Stories to Mirror Production

```
📁 Layouts
  📄 AppLayout (LoggedInDashboard, LoggedInLearnActive, LoggedOut, Mobile)
  📄 LearnLayout (Phase1, Phase2, Phase3, Phase4, Mobile)
📁 Pages
  📁 Learn
    📄 RadicalsBrowser (Default, Filtered, Loading, Error, Empty)
    📄 RadicalsBrowser — Full Page (Default, Phase1, Phase2, Mobile)
  📁 Dashboard
    ...
  📁 Practices
    ...
📁 Components
  📄 Button, Input, Card, ContentBrowser, FilterChip, ...
```

**Naming convention:**

- `Layouts/` — Layout components only
- `Pages/<Area>/<PageName>` — Isolated page content
- `Pages/<Area>/<PageName> — Full Page` — Page with full layout chain
- `Components/<Name>` — Reusable atomic and composite components

---

## Key Principles Summary

| #   | Principle                                 | Why                                                                                                                |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | **Storybook is the design review tool**   | Stories should look exactly like production — same wrappers, same tokens, same data shapes                         |
| 2   | **Split presentational from connected**   | Pure components → Storybook. Connected wrappers → Production. Never mix.                                           |
| 3   | **Decorators = Production context**       | Every layout, provider, and router used in production must be a Storybook decorator                                |
| 4   | **Args composition = DRY data**           | Page stories reuse child component story args, not hand-written duplicates                                         |
| 5   | **Visual testing is the safety net**      | Pixel diffs catch what code review misses — every PR gets a visual check                                           |
| 6   | **Tokens are the single source of truth** | `DESIGN.md` → CSS variables → Components → Stories → Pages. No shortcuts.                                          |
| 7   | **Viewports are not optional**            | Every page story must pass at 320px, 768px, and 1024px                                                             |
| 8   | **Extract CSS, don't duplicate**          | Before writing any CSS value, check if a token exists. 2+ usages → extract to globals.css.                         |
| 9   | **Compose components, don't recreate**    | Never use `<div className="card">` when `<Card>` exists. Add variants there if needed.                             |
| 10  | **Global utilities > local repetition**   | Token combinations go in `globals.css` as utility classes. Local CSS = structure only. Enables Tailwind migration. |

---

## Related Docs

- [Frontend-Backend Integration](./frontend-backend.md) — Proxy, CORS, shared constants
- [Frontend Conventions](../conventions/frontend.md) — Component patterns, naming, exports
- [DESIGN.md](../../../DESIGN.md) — Design token reference
- [Component Registry](../../../.github/component-registry.json) — Shared component inventory
