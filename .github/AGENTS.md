---
name: "PinyinPal Coding Agent"
description: "Full-stack AI agent for the PinyinPal Mandarin learning platform"
roles:
  - "Frontend-focused developer (React, hooks, stores, UI)"
  - "UIUX designer (Storybook-first Step 1 design — wireframe → approved shell, AI-slop prevention)"
  - "Backend-focused developer (NestJS migration, Prisma, API, DB)"
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
  - file: ".github/instructions/solar-agent-chain.instructions.md"
    description: "SOLAR v5 driver-orchestrated chain contract — the coordinator (Governor v5 / --auto) runs each link in order; you are ONE link. Never spawn or compose downstream links yourself (nested agents lack the spawn tool)."
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
  - ".github/agents/governor-v5.agent.md"
  - ".github/agents/hermes.agent.md"
  - ".github/agents/investigator.agent.md"
  - ".github/agents/uiux-designer.agent.md"
last-verified: 2026-09-06
prohibitions:
  - "NEVER hardcode color, spacing, or typography values — use CSS variables or DESIGN.md tokens"
  - "NEVER write page-scoped layout CSS - a page content region composes PageShell (per-archetype --page-measure-*) -> PageStack (section rhythm) -> PageGrid (card home); no page max-width, margin:...auto wrapper, or grid-template-columns in *Page.css (page-anatomy law; design-audit errors: missing-layout-token / page-scoped-layout-css / page-scoped-grid)"
  - "NEVER create a new Button, Input, LoadingScreen, ErrorScreen, ProgressBar, FilterChip, ToggleSwitch, or ContentBrowser — import from src/shared/components/"
  - "NEVER store state in components/ — use stores/ directories"
  - "NEVER call apiClient directly from hooks or components — use service layer"
  - "NEVER bypass CSS import restrictions with eslint-disable"
  - 'NEVER stage, commit, or push without an explicit "commit allowed" from the user — default is review-before-commit (ambiguous words like "proceed" are NOT approval)'
  - "NEVER invent a generic design token, generic component, or page-archetype measure - spine (`C:\\CodeProjects\\Personal\\spine`, reachable through the spine MCP) is the source of truth for the generic layer; PinyinPal owns only its theme overlay + `domain.pinyinpal` support tokens"
---

## UI Codegen Protocol

## Page-Anatomy Law (read before building ANY page)

Every routed page composes as: **AppLayout/LearnLayout chrome -> PageShell (per-archetype
measure) -> PageHeader -> PageStack (section rhythm) -> PageGrid (cards)** - see
`docs/guides/design/page-archetypes.md` + `.github/page-inventory.json` (the anatomy ledger:
shell/measure/gutter/header, verified by `check:page-inventory`).

- **No page-scoped layout CSS, ever.** Never set a page max-width, a `margin: ... auto` centering
  wrapper, or `grid-template-columns` in `*Page.css` - PageShell/PageStack/PageGrid own measure,
  rhythm, and the card grid. `design-audit` errors: `missing-layout-token`,
  `page-scoped-layout-css`, `page-scoped-grid` (S0a-3). Retrofit drift leaders in the S2 wave
  order - never add new UI on an un-converged shell (D5).
- **Foundation gate:** `npm run design-audit:foundation` runs *spine's* design-audit and fails on
  those three rules only (`.github/workflows/spine-foundation.yml`; `SPINE_ROOT`, default
  `C:\CodeProjects\Personal\spine`).

## Design-system source of truth (spine)

The generic design system is the **spine** repo (`C:\CodeProjects\Personal\spine`), not this one,
and the spine MCP (`.vscode/mcp.json` -> `spine`, stdio) serves it: `spine://tokens`,
`spine://components/{name}`, `spine://rules`, plus `search_kb` / `suggest_token` /
`suggest_component` / `audit_design` / `lint_spec`.

- **Generic layer = spine.** Generic tokens, generic components, page-anatomy measures and the
  page archetype vocabulary are spine's. Read `spine://components/{name}` for a component's
  contract instead of trusting a local copy.
- **This repo owns two layers only.** (1) the **theme overlay** PinyinPal applies over spine's
  semantic names (its locked palette, radii, elevation policy - DESIGN.md + `globals.css` `:root`);
  (2) the **`domain.pinyinpal`** support tokens (tone hues, stroke-demo, tone-contour, hanzi font).
  A theme is a delta over the same semantic names: renaming a spine token locally is a fork.
- **Never add a generic token or a new page-archetype measure locally** - if spine lacks it, that is
  a spine change (or an escalation), not a PinyinPal `:root` addition.
- `PageShell.css` is the one place PinyinPal's page archetypes map onto spine's generic measures
  (`hub-launcher -> overview`, `browse-index -> list`, `focus-task -> detail`, `utility -> settings`,
  `auth -> auth`). Pages never re-map it.
- Consume layout tokens (`--page-measure-<archetype>`, `--page-pad`, `--section-rhythm-*`,
  `--chrome-h`, `--card-gutter-*`) - never hardcoded px for page structure. DESIGN.md <->
  globals.css parity is enforced (`check:design-parity`, gate #14).

**UI Codegen Protocol:** see `.github/instructions/uiux-design-protocol.instructions.md` §Storybook MCP + Context Pack — Storybook MCP is the component source of truth; never invent a component.
