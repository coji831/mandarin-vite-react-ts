---
description: "Use when implementing any UI — pages, components, screens. Covers Storybook-first mandate, token integrity, component reuse, verification, responsive checks, data-resilient shells, and the UIUX fundamentals + AI-slop checklist. Read BEFORE writing UI code."
applyTo: "apps/frontend/src/**/*.tsx"
---

# UIUX Design Protocol

The always-on umbrella for **how UI is designed and built** in this repo. Read this (with `docs/guides/design/uiux-fundamentals.md`) BEFORE writing any UI code. See `docs/guides/dev-flow-visualization.html#frontend` for the full flow diagram.

## Storybook MCP + Context Pack (UI Codegen Protocol)

Before writing any UI, load the design-system context pack and treat the Storybook MCP as the component source of truth:

1. **Load the context pack**: `DESIGN.md` (tokens) + `apps/frontend/src/styles/globals.css` (1:1 CSS vars + utilities) + `.github/component-registry.json` (allowed components) + `.github/page-inventory.json` (page contract) + `.github/instructions/ui-composition.instructions.md` (layout rules) + one archetype exemplar story from `docs/guides/design/page-archetypes.md`.
2. **Query the Storybook MCP first — never invent a component.** Compose from `shared/components` (barrel re-exports) only. If the registry already covers a need, reuse it with props.
3. **Strict prompt, real names:**
   - ❌ **Bad:** "Make a modern settings page with a form and a toggle."
   - ✅ **Good:** "Build the guest-shell page. Use ONLY tokens from `DESIGN.md`/`globals.css` (`--surface-dark`, `--color-primary`, `--space-md/lg`, `--radius-sm/md`, `--font-*`). Compose ONLY from `component-registry.json` — `Box variant='dark'` for sections, `Card` for items, `Button variant='primary'` for the single CTA, `FilterChip` for filters, `GuestUpsell` for the guest gate. No raw `<button>`, no hex, no arbitrary spacing, no `.module.css` unless justified. Query the Storybook MCP for the real prop APIs first. Match the structure of the ReviewView exemplar story."
4. **Golden Template**: match the archetype's exemplar story — the default `focus-task` exemplar is `ReviewView` (`apps/frontend/src/pages/practices/ReviewPageFull.stories.tsx`). Never build from blank.
5. **Gate rule**: Step 1 Storybook story (no logic) → user preview gate → Step 2. Structural work is AI-safe; token/component/forbidden-decoration decisions are human-gated.

The page archetype + composition map are the strict constraints — see `docs/guides/design/page-archetypes.md`.

## UIUX Fundamentals & AI-Slop (read first)

- **`docs/guides/design/uiux-fundamentals.md`** — the 12 UIUX fundamentals applied to PinyinPal (WCAG contrast role tiers, typography discipline, semantic color roles, spacing/grids, elevation/layering, cognitive load, layout physics, quality bar, deep hierarchy, data density, composition/portals, Tailwind-ref) + the **7-layer QA pyramid** (Vitest → design-audit → axe → Chromatic → a11y regression → visual QA → owner sign-off).
- **AI-Slop checklist** — the consolidated 12-item forbiddance list (gradient whitelist, no glass/blur, tokenized shadows, emoji rule, resting-amber, no decorative motion, ≤1 saturated fill, tracking-tight, no confetti/orbs, microcopy, no magic values) lives in `uiux-fundamentals.md` §3 and is machine-enforced by `design-audit` + the `frontend-audit` skill (Part 1).
- **`docs/guides/design/uiux-resources.md`** — the 29-resource study-card index (provenance for every design decision).
- **`ui-composition.instructions.md`** — layout hierarchy, spacing rhythm, container discipline, CTA clarity, preview-vs-detail.
- **`frontend-css-styling.instructions.md`** — the full styling workflow (scroll chain, layout physics, utility classes, token usage, inline-style rules).

## 📋 Implementation Pipeline

**Two-step model (2026 flow):** when UI is involved, the work is **two steps, each owned by a distinct role, joined by a handoff artifact** — **Step 1 — UIUX Design** (UIUX Designer: wireframe → Storybook shell → User Preview Gate → handoff of approved stories + design spec + screenshots) then **Step 2 — Code Conversion** (Frontend Engineer: convert the approved design to code — logic, services, tests, gates). Backend-only work skips Step 1. The **User Preview Gate is human-owned** and sits between Step 1 and Step 2.

### Step 1 — UIUX Design (UIUX Designer): Storybook shell (no logic) → User Preview Gate

Build the complete visual UI in Storybook BEFORE writing any logic, hooks, or API calls. The host component must be the **page-level** or **most complex parent** component — never an isolated atom.

#### 1.1 — Gather Context (Research)

1. **Business need → User need → Research**: Start with business requirements and user needs, not code. Read design docs and `docs/design.md`.
2. **Map user flow**: For each action the user takes, determine: what do they see? (visual state), what do they think? (interpretation), what do they want to do next? (intent).
3. **Establish preview/reward boundary**: Identify preview surfaces (cards, list items) vs detail surfaces (modals, panels, expandable sections). Detail content must NOT appear on the preview surface. See `ui-composition.instructions.md` §Preview-vs-Detail.
4. **Check source for every design decision**: If you propose adding a UI element, verify it works with the CURRENT architecture, not just proposed future states.

#### 1.2 — High-Level Design (Wireframe)

1. **Wireframe/sketch** the UI before writing components. Visual understanding must precede implementation.
2. Read `DESIGN.md` for design tokens and `ui-composition.instructions.md` for layout rules. If the epic has a per-epic design spec (`docs/guides/design/per-epic-design-spec.md`), read it — it names the page `archetype:` (see `docs/guides/design/page-archetypes.md`); score the outcome against `docs/guides/design/design-quality-rubric.md`.
3. Identify the **host component**: the page or most-complex parent that will contain the new UI.
4. Search `src/shared/components/` and check `component-registry.json` for existing components to reuse.
5. Apply design principles: WAGC (does this look clickable?), content density (parsable in 2s?), clarity (obvious meaning?), cognitive load (reduces or adds?).

#### 1.3 — Component Breakdown

1. **Decompose** the wireframe into a component hierarchy (atoms → molecules → organisms).
2. Run `codegraph_explore` to check impact radius of changes.
3. Map hierarchy, define props interfaces for each component.
4. If a matching component exists, reuse with props — never duplicate.

#### 1.4 — Build Storybook UI (JSX + Mock Data)

1. Build the UI structure (JSX skeleton) directly on the host component's `.stories.tsx`
2. **Cover ALL visual states**: default, loading, empty, error, edge cases — use MSW mocks
3. **No API calls, no hook logic, no state management** — pure visual shell with mock data only

#### 1.5 — Polish Styling

1. Apply CSS variables from `globals.css` only — never hardcode colors/spacing/fonts
2. Use global utility classes first (`.flex-center`, `.gap-sm`, `.w-full`) before custom CSS (BEM)
3. Follow data-resilient shell principle: fixed container dimensions, inner scroll for dynamic content
4. Test at 320px for responsive correctness — no horizontal scroll
5. See `frontend-css-styling.instructions.md` for the full styling workflow
6. Run `npm run test-storybook --workspace=@mandarin/frontend` to verify stories render correctly

#### 1.6 — User Preview & Approval (Gate)

1. Open Storybook in the browser and present to the user
2. Walk through each visual state (loading, empty, error, display, edge cases)
3. User approves layout, spacing, colors, and state coverage

> ⚠️ **Gate rule**: Do NOT proceed to Step 2 (Code Conversion) until the user has previewed and approved the UI design in Storybook. Logic implementation on unapproved layouts wastes effort.

### Step 2 — Code Conversion (Frontend Engineer): convert the approved design to code

#### 2.1 — Connect Logic

1. Add hooks, state management (reducers/context/Zustand), and API service layer
2. Wire real data to the approved visual shell — replace mock data with real API calls
3. Ensure loading/error/empty state transitions match the approved Storybook states

#### 2.2 — Test

1. Unit tests: changed code only (`npm test`)
2. Integration tests: impacted service/API scope
3. See `testing-standards.instructions.md` for minimum coverage requirements

#### 2.3 — Verify & Audit

1. Open the page in browser and take screenshots — compare against approved Storybook
2. Test at 320px, 768px, 1024px for responsive correctness
3. Verify ARIA labels on all interactive elements
4. Run `frontend-pre-delivery-checklist.instructions.md` — token compliance, states, interaction, layout, quality gates
5. Run the **`frontend-audit` skill** — Part 1 (12 fundamentals + AI-slop) then Parts 2–4 (architecture, verification, integration) — replaces the old `uiux-audit`/`frontend-audit`/`component-decomposition` skills
6. Update feature `docs/design.md` with Storybook story references, design tokens used, and visual acceptance criteria
7. Log any visual discrepancies in `verification-artifacts/` with `review-findings-*` artifact

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

**See also:** `ui-composition.instructions.md` • `frontend-css-styling.instructions.md` • `storybook-production-alignment.instructions.md` • `frontend-pre-delivery-checklist.instructions.md` • `component-registry.json` • `docs/guides/design/uiux-fundamentals.md`
