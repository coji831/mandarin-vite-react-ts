---
purpose: Narrative companion to the storybook-production-alignment instruction — why the rules keep stories and pages in sync
status: active
last-verified: 2026-08-01
type: guide
---

# Storybook–Production Alignment Guide

**Last Updated:** August 1, 2026
**Purpose:** Narrative companion to `.github/instructions/storybook-production-alignment.instructions.md` — explaining the _why_ behind the operative rules for keeping Storybook stories and production pages in sync (zero visual drift).
**Audience:** Frontend developers writing React components, creating Storybook stories, or reviewing code for visual consistency.

> **Operative source:** This guide is a companion, not a replacement. The binding rules live in
> [`.github/instructions/storybook-production-alignment.instructions.md`](../../../.github/instructions/storybook-production-alignment.instructions.md)
> (auto-attached when editing `*.stories.tsx` and `pages/**/*.tsx`). When the two disagree, the
> instruction file wins.

---

## Overview

Storybook stories and production pages frequently diverge because:

- Stories render components in isolation — without the same layout wrappers, context providers, or global CSS as production.
- Pages compose components differently — a page might pass different props, use different wrapper markup, or inject additional state.
- Visual drift is silent — without automated story tests, design rot accumulates unnoticed.
- Design tokens aren't enforced — hardcoded values creep into production code, bypassing the token system tested in Storybook.

**The goal:** Every production page is a **container** that owns its business logic and delegates
rendering to **feature components**. Storybook stories target the container itself, so what you
see in a story is exactly what ships.

## The Container IS the Story Target

There is **no `*PageContent.tsx` split**. The page container (`*Page.tsx`) is both the
production entry point and the Storybook story target:

```
*Page.tsx (container)                    ← production + story target (same component)
├── Hooks (usePhaseGate, useRadicals, …) ← logic lives here
└── Feature components (props-only)      ← features/<feature>/components/*
```

- `*Page.tsx` contains the business logic: hooks, state handling, derived data, routing.
- Feature components (`features/*/components/*.tsx`) receive data via props — zero hooks, zero
  API calls.
- Storybook stories target the container, using MSW handlers to simulate the same API
  responses the hooks will return at runtime.

```tsx
// ✅ DO — story targets the container directly
import { DashboardPage } from "./DashboardPage";
const meta: Meta<typeof DashboardPage> = { component: DashboardPage /* ... */ };

// ❌ DON'T — introducing a separate presentational wrapper
import { DashboardPageContent } from "./DashboardPageContent";
```

## MSW for State Parity

Each story state (default, loading, error, empty) is expressed with a composed MSW handler
array — see the [Storybook MSW Handlers](../knowledge-base/frontend/storybook-msw-handlers.md)
KB article for the `mswHandlers` factory pattern:

```tsx
export const Default: Story = {
  parameters: { msw: { handlers: [mswHandlers.radicals.default()] } },
};
export const Loading: Story = {
  parameters: { msw: { handlers: [mswHandlers.radicals.loading()] } },
};
export const Error: Story = { parameters: { msw: { handlers: [mswHandlers.radicals.error()] } } };
export const Empty: Story = { parameters: { msw: { handlers: [mswHandlers.radicals.empty()] } } };
```

**State parity rule:** every MSW handler variant must map to a real code path in the container.
If a story shows a loading state, the container must actually render a loading path when its
hook is pending — never hardcode a value that makes a story state unreachable.

| Story State | MSW Handler Produces | Container Must Handle  |
| ----------- | -------------------- | ---------------------- |
| `Default`   | API returns data     | Hook returns data      |
| `Loading`   | API is pending       | Hook's initial loading |
| `Error`     | API returns 500      | Hook catches exception |
| `Empty`     | API returns `[]`     | Hook returns empty     |

## Layout Decorators Provide Production Context

Stories reuse the production wrapper chain via decorators from `.storybook/decorators/`
(`withAppLayout(path)`, `withLearnLayout`, `withGuestAuth`), and page stories declare
`parameters: { layout: "fullscreen" }` to match the real viewport. This is what makes a story
visually identical to the shipped page.

## Story Organization — Three Categories

All `.stories.tsx` files fall into exactly three categories:

| Category    | Contents                                                      | `title` prefix  | Location                                   |
| ----------- | ------------------------------------------------------------- | --------------- | ------------------------------------------ |
| **Pages**   | Page-level stories covering full flows (feature verification) | `"Pages/..."`   | `apps/frontend/src/pages/**/*.stories.tsx` |
| **Layouts** | App and feature layout components                             | `"Layouts/..."` | `apps/frontend/src/shared/layouts/*`       |
| **Shared**  | Reusable UI primitives (Button, Input, Card, …)               | `"Shared/..."`  | `apps/frontend/src/shared/components/**`   |

Feature-specific components are verified **through page stories**, not as standalone feature
stories. Add `beforeEach` hooks where a story depends on persisted state (e.g.,
`localStorage.treeMode`) so story tests are deterministic.

## Design Token Discipline

- Every color/spacing/radius/shadow value uses a CSS variable from `globals.css` / `DESIGN.md`.
- Reuse shared components (`Button`, `Input`, `Card`, `FilterChip`, `ToggleSwitch`, …) instead
  of re-implementing patterns — see `apps/frontend/src/shared/components/`.
- Shared components accept `className` for contextual spacing only, never to redefine core
  visual identity.

## Verification

1. Run `npm run storybook` and verify every state (default, loading, error, empty) in the browser.
2. Run `npm run test-storybook` (Storybook stories as Vitest tests via
   `@storybook/addon-vitest`) for headless regression coverage.
3. Run `npm run design-audit` after CSS/TSX changes to catch token violations early.
4. Confirm the container handles every state its stories cover (state parity).

## Key Principles Summary

| #   | Principle                                 | Why                                                                 |
| --- | ----------------------------------------- | ------------------------------------------------------------------- |
| 1   | **Container is the story target**         | No `*PageContent.tsx` split — the story shows exactly what ships    |
| 2   | **MSW = state parity**                    | Same API responses in stories and production → no story-only states |
| 3   | **Decorators = production context**       | Layout/providers are decorators, so stories match production        |
| 4   | **Tokens are the single source of truth** | `DESIGN.md` → CSS variables → components → stories → pages          |
| 5   | **Story tests are the safety net**        | `test-storybook` catches drift that visual review misses            |
