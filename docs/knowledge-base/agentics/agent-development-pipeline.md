---
purpose: "Conceptual deep-dive into the full development lifecycle — requirements to commit, and the why behind each phase"
status: active
last-verified: 2026-07-20
type: guide
---

# Agent Development Pipeline

**Last Updated:** 2026-07-20
**Audience:** AI Coding Agents
**Purpose:** Conceptual deep-dive into the full development lifecycle — from requirements to commit — explaining not just the steps but the _why_ behind each phase.

---

## Overview

The agent development pipeline follows a nine-step sequence: **Context → Review → Plan → Implement → Verify → Test → Run → Docs → Gates → Commit**. Each step is a quality gate that prevents downstream waste.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Context → Review → Plan → Implement → Verify → Test → Run → Gates → Commit │
└─────────────────────────────────────────────────────────────────────────┘
```

The pipeline is designed for two scenarios:

| Scenario       | Pipeline                  | Key Difference                 |
| -------------- | ------------------------- | ------------------------------ |
| **Full story** | All 9 steps               | Context includes BR + design   |
| **Quick fix**  | Implement → Test → Commit | Skip docs, gates, verification |

---

## Step 1: Context

**Goal:** Understand what exists before creating anything new.

Before writing code, the agent must gather context across four dimensions:

### 1.1 Business Context

- Read the story Business Requirements (BR) in `docs/business-requirements/`
- Understand acceptance criteria, user stories, and scope

### 1.2 Technical Context

- Read the story Implementation doc in `docs/issue-implementation/`
- Understand architecture decisions, known constraints, and technical approach

### 1.3 Existing Codebase Context

- Check `apps/frontend/src/shared/components/` for reusable components (never re-implement)
- Check `component-registry.json` for component API documentation
- Read `DESIGN.md` for design tokens
- Use codegraph MCP for code intelligence (faster than grep+read loops)

### 1.4 Design Context

- Read `docs/guides/design/design-reasoning.md` for design philosophy (incl. token-change procedure)
- Follow `.github/instructions/storybook-production-alignment.instructions.md` for Storybook-first patterns
- If a Figma URL is available, fetch structured design data

**Anti-pattern:** Jumping straight to implementation without reading shared components or design tokens → results in reimplementation and style drift.

---

## Step 2: Review

**Goal:** Identify violations before they compound.

After gathering context but before writing code, review the existing area for:

- **CSS leeching** — feature CSS referencing global element selectors (`p`, `button`, `ul`)
- **Hardcoded values** — colors, spacing, font sizes not using CSS variables
- **Dead code** — unused components, exports, or styles
- **Barrel compliance** — feature exports go through `index.ts` barrels
- **Store placement** — Zustand/Context stores in `stores/` not `components/`
- **API client rules** — frontend API calls go through service layer, not direct `apiClient`

Use the frontend-audit and backend-audit skills for systematic review.

---

## Step 3: Plan

**Goal:** Produce a clear implementation plan before coding.

For complex features, the agent should:

1. Break the feature into discrete tasks
2. Identify which files need creation vs modification
3. Note dependencies between tasks
4. Register the plan in session memory for tracking

**Output:** A structured todo list with file-level scope for each item.

---

## Step 4: Implement

**Goal:** Write code that is correct, testable, and convention-compliant.

### Code Rules

| Rule                        | Enforcement                           |
| --------------------------- | ------------------------------------- |
| Use CSS variables only      | `var(--space-*)` `var(--surface-*)`   |
| Use shared components       | Check barrel before creating new ones |
| Feature barrels for exports | `features/<name>/index.ts`            |
| Stores in `stores/`         | Never in `components/`                |
| Services for API calls      | Never call `apiClient` from hooks     |
| No raw element selectors    | Use BEM-classed elements              |
| No directional properties   | No `border-top`, `padding-left`, etc  |

### Implementation Order

1. Data layer (types, Prisma schema, services)
2. State layer (stores, contexts, reducers)
3. UI layer (components, pages)
4. Tests

---

## Step 5: Verify

**Goal:** Visually confirm the implementation matches the design intent.

For UI changes:

1. Open the page in browser (via `npm run dev`)
2. Use Playwright/Chrome DevTools MCP to take screenshots
3. Compare against Storybook stories or wireframes
4. Document discrepancies in `verification-artifacts/` (gitignored — evidence is not a committed source)

For backend changes:

1. Run integration tests
2. Verify API responses match expected format
3. Check error handling covers all failure modes

---

## Step 6: Test

**Goal:** All existing and new tests pass.

| Test Suite             | Command                   | Scope                 |
| ---------------------- | ------------------------- | --------------------- |
| Unit + component tests | `npm test`                | Changed scope only    |
| Full test suite        | `npm run test:full`       | All tests             |
| Storybook tests        | `npm run test-storybook`  | Visual regression     |
| Storybook build        | `npm run build-storybook` | Storybook compilation |

**Minimum requirement:** New logic must have unit/component tests per `testing-standards.instructions.md`.

---

## Step 7: Run

**Goal:** Verify the application builds and runs without runtime errors.

| Gate        | Command                                | Expected Result |
| ----------- | -------------------------------------- | --------------- |
| Type-check  | `npm run build`                        | Compiles clean  |
| Lint        | `npm run lint`                         | 0 errors        |
| Design lint | `npx @google/design.md lint DESIGN.md` | 0 errors        |

The build step also catches TypeScript errors the test runner might miss.

---

## Step 8: Docs

**Goal:** Keep documentation synchronized with code changes.

### What to Update

| Changed                        | Update                                                   |
| ------------------------------ | -------------------------------------------------------- |
| New/edited component           | `DESIGN.md` + `component-registry.json`                  |
| New/edited feature             | Feature `docs/design.md`                                 |
| Architecture change            | `docs/architecture.md`                                   |
| New pattern/concept for agents | `docs/knowledge-base/agentics/`                          |
| New story/epic                 | BR + implementation docs + cross-links                   |
| Implementation details         | Story implementation doc, "Technical Challenges" section |

### Documentation Principles

- **Template compliance** — match template structure exactly
- **Cross-linking** — BR ↔ implementation ↔ stories bidirectionally
- **No epic/story numbers in high-level docs** — use descriptive names
- **Actionable patterns → `docs/guides/`** — concise, directive
- **Conceptual deep-dives → `docs/knowledge-base/`** — educational with tradeoffs

---

## Step 9: Gates → Commit

**Goal:** Final quality check before committing.

### Pre-Commit Checklist

1. **Build passes** — `npm run build`
2. **All tests pass** — `npm run test:full`
3. **Lint passes** — `npm run lint` (0 errors)
4. **Design lint passes** — `npx @google/design.md lint DESIGN.md`
