---
description: "Use when implementing any UI — pages, components, screens. Covers Storybook-first mandate, token integrity, component reuse, verification, responsive checks, and data-resilient shells. Read BEFORE writing UI code."
applyTo: "apps/frontend/src/**/*.tsx"
---

# Visual Design Protocol

Follow this numbered pipeline when implementing any UI. See `docs/guides/dev-flow-visualization.html#frontend` for the full flow diagram.

## 📋 Implementation Pipeline

### Phase A: Storybook UI Design (No Logic) — User Preview Gate

Build the complete visual UI in Storybook BEFORE writing any logic, hooks, or API calls. The host component must be the **page-level** or **most complex parent** component — never an isolated atom.

#### Step 1: Research & Host Selection

1. Read `DESIGN.md` for design tokens and `ui-composition.instructions.md` for layout rules
2. Identify the **host component**: the page or most-complex parent that will contain the new UI. Create or update the `.stories.tsx` on this host.
3. Search `src/shared/components/` and check `component-registry.json` for existing components to reuse
4. Run `codegraph_explore` to check impact radius of changes
5. If a matching component exists, reuse with props — never duplicate

#### Step 2: Build Storybook UI (JSX + Mock Data)

1. Build the UI structure (JSX skeleton) directly on the host component's `.stories.tsx`
2. **Cover ALL visual states**: default, loading, empty, error, edge cases — use MSW mocks
3. **No API calls, no hook logic, no state management** — pure visual shell with mock data only

#### Step 3: Polish Styling

1. Apply CSS variables from `globals.css` only — never hardcode colors/spacing/fonts
2. Use global utility classes first (`.flex-center`, `.gap-sm`, `.w-full`) before custom CSS (BEM)
3. Follow data-resilient shell principle: fixed container dimensions, inner scroll for dynamic content
4. Test at 320px for responsive correctness — no horizontal scroll
5. See `frontend-css-styling.instructions.md` for the full styling workflow
6. Run `npm run test-storybook` to verify stories render correctly

#### Step 4: User Preview & Approval (Gate)

1. Open Storybook in the browser and present to the user
2. Walk through each visual state (loading, empty, error, display, edge cases)
3. User approves layout, spacing, colors, and state coverage

> ⚠️ **Gate rule**: Do NOT proceed to Phase B until the user has previewed and approved the UI design in Storybook. Logic implementation on unapproved layouts wastes effort.

### Phase B: Logic Implementation (After Approval)

#### Step 4: Connect Logic

1. Add hooks, state management (reducers/context/Zustand), and API service layer
2. Wire real data to the approved visual shell — replace mock data with real API calls
3. Ensure loading/error/empty state transitions match the approved Storybook states

#### Step 5: Verify & Design Spec

1. Open the page in browser and take screenshots — compare against approved Storybook
2. Test at 320px, 768px, 1024px for responsive correctness
3. Verify ARIA labels on all interactive elements
4. Update feature `docs/design.md` with Storybook story references, design tokens used, and visual acceptance criteria
5. Log any visual discrepancies in `verification-artifacts/` with `review-findings-*` artifact

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
