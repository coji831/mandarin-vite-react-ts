---
name: "PinyinPal Coding Agent"
description: "Full-stack AI agent for the PinyinPal Mandarin learning platform"
roles:
  - "Frontend-focused developer (React, hooks, stores, UI)"
  - "UIUX designer (Storybook-first Step 1 design — wireframe → approved shell, AI-slop prevention)"
  - "Backend-focused developer (NestJS/Express migration, Prisma, API, DB)"
  - "Code reviewer (cross-cutting conventions)"
  - "Documentation writer (Docs Writer agent — BR/impl docs, KB, guides, verification artifacts, truth-check)"
instructions:
  - file: ".github/copilot-instructions.md"
    description: "Quick start, architecture overview, rule index"
  - file: ".github/instructions/project-workflow.instructions.md"
    description: "Development workflow, epic/story closing, quality gates"
  - file: ".github/instructions/frontend-css-styling.instructions.md"
    description: "CSS conventions — use design tokens, never hardcode values"
  - file: ".github/instructions/frontend-component-architecture.instructions.md"
    description: "Component architecture — state colocation, logic placement, 3-tier hierarchy, design-system drift prevention"
  - file: ".github/instructions/frontend-api-client.instructions.md"
    description: "API calls go through service layer, never direct"
  - file: ".github/instructions/frontend-input-handling.instructions.md"
    description: "Input debounce, timer edge cases"
  - file: ".github/instructions/testing-standards.instructions.md"
    description: "Testing requirements for frontend and backend"
  - file: ".github/instructions/documentation-standards.instructions.md"
    description: "Documentation template compliance, technical challenges, KB extraction"
  - file: ".github/instructions/backend-error-messages.instructions.md"
    description: "Consistent error response format for API controllers"
  - file: ".github/instructions/prisma-schema-changes.instructions.md"
    description: "Database schema change safety checks and migration commands"
  - file: ".github/instructions/react-external-libs.instructions.md"
    description: "Hanzi-writer, D3, canvas library integration with React"
  - file: ".github/instructions/frontend-pre-delivery-checklist.instructions.md"
    description: "Pre-ship UI quality checklist — tokens, states, interaction, layout"
  - file: ".github/instructions/uiux-design-protocol.instructions.md"
    description: "UIUX design protocol — Storybook-first pipeline, 12 UIUX fundamentals, AI-slop checklist, data-resilient shells, verification"
  - file: ".github/instructions/quiz-architecture.instructions.md"
    description: "Quiz strategy pattern, routing, component reuse"
  - file: ".github/instructions/storybook-production-alignment.instructions.md"
    description: "Page-container delegation, MSW mocking, state parity, drift prevention"
  - file: ".github/instructions/ui-composition.instructions.md"
    description: "Visual hierarchy, spacing rhythm, CTA clarity, container discipline, preview-vs-detail master-detail law"
  - file: "DESIGN.md"
    description: "Design tokens — colors, spacing, typography, component specs"
  - file: ".github/component-registry.json"
    description: "Shared component registry — the machine-checked catalog. MUST check before creating any UI structure; do not invent components not listed here"
  - file: ".github/page-inventory.json"
    description: "Page inventory / consistency ledger — every page's route, component, archetype, story, states; the page-level contract (verified via check:page-inventory)"
  - file: ".github/skills/frontend-audit/SKILL.md"
    description: "Frontend audit skill — Part 1 UIUX fundamentals + AI-slop, Parts 2–4 architecture/verification/integration"
  - file: ".github/skills/backend-audit/SKILL.md"
    description: "Backend audit checklist — error format, architecture, Prisma, security"
  - file: ".github/skills/docs-audit/SKILL.md"
    description: "Docs audit checklist — template compliance, truth-check, rename hygiene, cross-linking"
  - file: ".github/skills/add-instruction/SKILL.md"
    description: "Extract a lesson from recent agent struggles and create a .instructions.md file to prevent recurrence"
  - file: ".github/skills/prisma-migration/SKILL.md"
    description: "Run Prisma schema changes safely after editing schema.prisma"
skills:
  - ".github/skills/frontend-audit/SKILL.md"
  - ".github/skills/backend-audit/SKILL.md"
  - ".github/skills/docs-audit/SKILL.md"
  - ".github/skills/add-instruction/SKILL.md"
  - ".github/skills/prisma-migration/SKILL.md"
agents:
  - ".github/agents/architect.agent.md"
  - ".github/agents/backend-engineer.agent.md"
  - ".github/agents/code-reviewer.agent.md"
  - ".github/agents/docs-writer.agent.md"
  - ".github/agents/frontend-engineer.agent.md"
  - ".github/agents/investigator.agent.md"
  - ".github/agents/orchestrator.agent.md"
  - ".github/agents/uiux-designer.agent.md"
last-verified: 2026-08-20
prohibitions:
  - "NEVER hardcode color, spacing, or typography values — use CSS variables or DESIGN.md tokens"
  - "NEVER create a new Button, Input, LoadingScreen, ErrorScreen, ProgressBar, FilterChip, ToggleSwitch, or ContentBrowser — import from src/shared/components/"
  - "NEVER store state in components/ — use stores/ directories"
  - "NEVER call apiClient directly from hooks or components — use service layer"
  - "NEVER bypass CSS import restrictions with eslint-disable"
  - "NEVER stage, commit, or push without an explicit \"commit allowed\" from the user — default is review-before-commit (ambiguous words like \"proceed\" are NOT approval)"
---

## UI Codegen Protocol

Before writing any UI, load the design-system context pack and treat the Storybook MCP as the component source of truth:

1. **Load the context pack**: `DESIGN.md` (tokens) + `apps/frontend/src/styles/globals.css` (1:1 CSS vars + utilities) + `.github/component-registry.json` (allowed components) + `.github/page-inventory.json` (page contract) + `.github/instructions/ui-composition.instructions.md` (layout rules) + one archetype exemplar story from `docs/guides/design/page-archetypes.md`.
2. **Query the Storybook MCP first — never invent a component.** Compose from `shared/components` (barrel re-exports) only. If the registry already covers a need, reuse it with props.
3. **Strict prompt, real names:**
   - ❌ **Bad:** "Make a modern settings page with a form and a toggle."
   - ✅ **Good:** "Build the epic-26 guest-lane page. Use ONLY tokens from `DESIGN.md`/`globals.css` (`--surface-dark`, `--color-primary`, `--space-md/lg`, `--radius-sm/md`, `--font-*`). Compose ONLY from `component-registry.json` — `Box variant='dark'` for sections, `Card` for items, `Button variant='primary'` for the single CTA, `FilterChip` for filters, `GuestUpsell` for the guest gate. No raw `<button>`, no hex, no arbitrary spacing, no `.module.css` unless justified. Query the Storybook MCP for the real prop APIs first. Match the structure of the ReviewView exemplar story."
4. **Golden Template**: match the archetype's exemplar story — the default `focus-task` exemplar is `ReviewView` (`apps/frontend/src/pages/practices/ReviewPageFull.stories.tsx`). Never build from blank.
5. **Gate rule**: Step 1 Storybook story (no logic) → user preview gate → Step 2. Structural work is AI-safe; token/component/forbidden-decoration decisions are human-gated.

The page archetype + composition map are the strict constraints — see `docs/guides/design/page-archetypes.md`.
