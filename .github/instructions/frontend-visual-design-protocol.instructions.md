---
description: "Use when implementing any UI — pages, components, screens. Covers Storybook-first mandate, token integrity, component reuse, verification, responsive checks, and data-resilient shells. Read BEFORE writing UI code."
applyTo: "apps/frontend/src/**/*.tsx"
---

# Visual Design Protocol

Follow this numbered pipeline when implementing any UI. See `docs/guides/dev-flow-visualization.html#frontend` for the full flow diagram.

## 📋 Implementation Pipeline

### Step 1: Research & Reuse Check

1. Read `DESIGN.md` for design tokens and `ui-composition.instructions.md` for layout rules
2. Search `src/shared/components/` and check `component-registry.json` for existing components
3. Run `codegraph_explore` to check impact radius of changes
4. If a matching component exists, reuse with props — never duplicate

### Step 2: Build with Tokens

1. Use CSS variables from `globals.css` only — never hardcode colors/spacing/fonts
2. Apply global utility classes first (`.flex-center`, `.gap-sm`, `.w-full`) before custom CSS
3. Follow data-resilient shell principle: fixed container dimensions, inner scroll for dynamic content
4. See `frontend-css-styling.instructions.md` for the full styling workflow

### Step 3: Create Storybook Stories

1. Create `.stories.tsx` for **page-level or complex components** (not every atom)
2. Cover all visual states: default, loading, empty, error, edge cases
3. Use MSW mocks for API-dependent states
4. Run `npm run test-storybook` to verify

### Step 4: Verify

1. Open the page in browser and take screenshots
2. Compare against Storybook story — layout, spacing, colors must match
3. Test at 320px, 768px, 1024px for responsive correctness
4. Verify ARIA labels on all interactive elements
5. Log discrepancies in `verification-artifacts/` with `review-findings-*` artifact

### Step 5: Feature Design Spec

Every feature with a UI surface should have a `docs/design.md` file containing:

- Storybook story references
- List of design tokens used
- Visual acceptance criteria

## 📐 Core Principles

### Data-Resilient UI Principle

Components must have a **data-resilient visual shell** — outer container dimensions, padding, and scroll behavior invariant regardless of data volume.

- ✅ **DO**: Fixed `height`/`width` on containers wrapping dynamic content. Inner scroll handles overflow.
- ✅ **DO**: Verify in Storybook with mock data, then production with real data — identical visual footprint.
- ❌ **DON'T**: `max-height`/`max-width` on containers where the footprint must stay consistent.

### UI Composition Guide

- Read `ui-composition.instructions.md` before writing any UI code
- Always check `component-registry.json` before creating UI structures
- Never invent new component variants or props not in the registry

---

**See also:** `ui-composition.instructions.md` • `frontend-css-styling.instructions.md` • `storybook-production-alignment.instructions.md` • `frontend-pre-delivery-checklist.instructions.md` • `component-registry.json`
