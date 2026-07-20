---
description: "Use when implementing any UI — pages, components, screens. Covers Storybook-first mandate, token integrity, component reuse, verification, responsive checks, and data-resilient shells. Read BEFORE writing UI code."
applyTo: "apps/frontend/src/**/*.tsx"
---

# Visual Design Protocol

## Design-First Mandate

- ✅ Before implementing any UI, check Storybook for existing components and patterns
- ✅ All design tokens live in `DESIGN.md` → verified via `npx @google/design.md lint DESIGN.md`
- ✅ Storybook (`npm run storybook`, port 6006) is the visual source of truth for all components

## Component Reuse Rule

- ✅ Before creating a new component, search existing shared components in `src/shared/components/`
- ✅ If a matching component exists (same visual pattern), reuse it with style overrides — never duplicate

## Token Integrity

- ✅ Never hardcode colors, spacing, font sizes, or shadows — always reference CSS variables from `apps/frontend/src/styles/globals.css` or `DESIGN.md` tokens

## Storybook Mandate

- ✅ Every shared component MUST have a `.stories.tsx` file covering all visual states (default, loading, error, empty, edge cases)
- ✅ Feature components should have Storybook stories for key states
- ✅ Run story tests: `npm run test-storybook`

## Verification Requirement

- ✅ After every UI implementation, use Playwright or Chrome DevTools MCP to:
  1. Open the page in the integrated browser
  2. Take a screenshot
  3. Compare visually against the Storybook story reference
- ✅ Log any visual discrepancies in a `review-findings-*` artifact under `verification-artifacts/`

## Responsive & Accessibility Checks

- ✅ Test at breakpoints: 320px, 768px, 1024px using browser tools
- ✅ Verify WCAG contrast ratios when colors are selected
- ✅ Ensure proper ARIA labels on all interactive elements

## Feature Design Specs

- ✅ Every feature with a UI surface should have a `docs/design.md` file containing: Storybook story references, list of design tokens used, and visual acceptance criteria

## Data-Resilient UI Principle

Components must have a **data-resilient visual shell** — the outer container dimensions, padding, overlays, and scroll behavior must be invariant regardless of data volume.

- ✅ **DO**: Use fixed `height`/`width` on containers that wrap dynamic content. Let the inner scroll area handle overflow.
- ✅ **DO**: Verify in Storybook with mock data, then verify in production with real data — the visual footprint should be identical.
- ❌ **DON'T**: Use `max-height`/`max-width` on containers where the visual footprint must stay consistent.

**Rationale**: Storybook uses curated mock data (often larger datasets) while production serves real data (which may be smaller or incomplete). If the component shell changes size based on data, you get visual drift between environments — making Storybook verification unreliable.

## UI Composition Guide

- ✅ Before writing any UI code, read `.github/instructions/ui-composition.instructions.md` — it covers visual hierarchy, spacing rhythm, CTA clarity, and container discipline
- ✅ Always check `.github/component-registry.json` before creating UI structures — only use components listed there with their defined props
- ✅ Never invent new component variants or props not in the registry
