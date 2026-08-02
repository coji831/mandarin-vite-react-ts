# Copilot Instructions for AI Coding Agents

**Last Updated:** August 2, 2026

Operational playbook for AI agents contributing to `mandarin-vite-react-ts`.

## ⚡ TL;DR Quick Start

Install: `npm install`
Run dev: `npm run dev` (port 5173)
Run local backend: `npm run dev:backend` (port 3001)
Run tests (changed scope only): `npm test`
Run full test suite: `npm run test:full`
Run storybook: `npm run storybook --workspace=@mandarin/frontend` (port 6006)
Run story tests: `npm run test-storybook --workspace=@mandarin/frontend` (runs `vitest run --project storybook` via `@storybook/addon-vitest`, no coverage)
Build storybook: `npm run build-storybook --workspace=@mandarin/frontend`
Run build (type-check + bundle): `npm run build`
Run format: `npm run format`
Run lint: `npm run lint` (0 errors required)
Run design lint: `npx @google/design.md lint DESIGN.md`
Run design audit (code compliance): `npm run design-audit`
Run registry-stories check: `npm run check:registry-stories`
Run backend type-check (full): `npm run typecheck --workspace=@mandarin/backend`
Quality gates (canonical two-tier): see `project-workflow.instructions.md` — the single source of truth for all gates
Read design reasoning: `docs/guides/design/design-reasoning.md`
Run pre-delivery checklist: `.github/instructions/frontend-pre-delivery-checklist.instructions.md`
See visual design protocol: `.github/instructions/frontend-visual-design-protocol.instructions.md`
See AGENTS.md for agent roles, behavior rules, and prohibited patterns.
Epic BR: use `docs/templates/epic-business-requirements-template.md`
Story BR: use `docs/templates/story-business-requirements-template.md`
Epic Implementation: `docs/templates/epic-implementation-template.md`
Story Implementation: `docs/templates/story-implementation-template.md`
Code change: follow `docs/guides/conventions/frontend.md` (frontend) or `docs/guides/conventions/backend.md` (backend) + `docs/knowledge-base/practices/solid-principles.md`
Close epic/story: verify all AC done → update Status & Last Update in BR + implementation → check all AC boxes → commit together.
Doc Truth-Check: before closing, verify docs match the shipped code (endpoints/names/data source/links/dates) — see `documentation-standards.instructions.md`.

## 🎨 Visual Design Protocol

See `.github/instructions/frontend-visual-design-protocol.instructions.md` for the full protocol covering: Storybook-first mandate, component reuse, token integrity, Storybook mandate, verification requirements, responsive/accessibility checks, data-resilient UI principle, and UI composition guide.

**Key references:** `ui-composition.instructions.md` (layout rules), `component-registry.json` (allowed components), `design-reasoning.md` (design philosophy), `DESIGN.md` (design tokens).

---

## 🏗️ Architecture Overview

**Frontend**: React + TypeScript via Vite; feature folders in `apps/frontend/src/features/`.
**State**: Context + reducers + shared Zustand stores: `userStore` (userId/preferences), `uiStore` (loading/error/selectedList), `hubStore` (LexicalHub overlay); plus feature-scoped stores (mnemonicStore, quizSessionStore, readingStore, audioStore). Device identity read from localStorage (deviceUserId); stores are not persisted.
**Backend**: Express + Prisma in `apps/backend/`; deployed to Railway in production, runs locally on port 3001 for development.
**Routing**: React Router; constants in `apps/frontend/src/shared/constants/paths.ts`.
**Authentication**: JWT with httpOnly cookies, bcrypt password hashing, refresh token rotation.

## 🧩 Component Reuse

- ✅ ALWAYS check `src/shared/components/` before creating a new component
- ✅ Import from `shared/components` — they're already re-exported via barrel
- ✅ Use CSS variables from `apps/frontend/src/styles/globals.css` — never hardcode colors, spacing, or typography
- ✅ See [DESIGN.md](../DESIGN.md) for the complete design token reference
- ✅ See [component-decomposition skill](./skills/component-decomposition/SKILL.md) for component breakdown rules
- ✅ See [frontend-audit skill](./skills/frontend-audit/SKILL.md) for frontend code audit checklist
- ✅ See [backend-audit skill](./skills/backend-audit/SKILL.md) for backend code audit checklist
- ❌ NEVER reimplement Button, Input, LoadingScreen, ErrorScreen, ProgressBar, FilterChip, ToggleSwitch, or ContentBrowser

## 🔄 Development Workflow

Concise checklist: `Context → Review → Plan → Implement → Verify → Test → Run → Docs → Gates → Commit`

Where **Context** means: before writing code, read the relevant shared components, DESIGN.md tokens, and existing feature structure to understand what's available for reuse. If a Figma design URL is available, query the Framelink MCP to fetch structured design data.

Where **Verify** means: after implementation, use Playwright/Chrome DevTools MCP to open the page, take screenshots, and visually validate against the design spec. Document any discrepancies in `verification-artifacts/`.

See [project-workflow.instructions.md](./instructions/project-workflow.instructions.md) for the detailed story-level development workflow, epic/story closing procedures, quality gates, and code change checklist.

## ✅ Pre-Delivery UI Checklist

Run through `.github/instructions/frontend-pre-delivery-checklist.instructions.md` before reporting any UI code as complete. Covers: token compliance, states coverage, interaction, layout, and quality gates.

---

## 📋 Instruction Reference — What to Read When

| When you need to...              | Read this file (`.github/instructions/`)                                             |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| Follow the full dev pipeline     | `project-workflow.instructions.md` + `docs/guides/dev-flow-visualization.html`       |
| Implement UI from spec           | `frontend-visual-design-protocol.instructions.md` → `ui-composition.instructions.md` |
| Write CSS / style a component    | `frontend-css-styling.instructions.md`                                               |
| Make API calls from frontend     | `frontend-api-client.instructions.md`                                                |
| Build a card + detail panel      | `preview-detail-separation.instructions.md`                                          |
| Handle inputs, debounce, timers  | `frontend-input-handling.instructions.md`                                            |
| Write tests                      | `testing-standards.instructions.md`                                                  |
| Modify Prisma schema             | `prisma-schema-changes.instructions.md`                                              |
| Integrate external libs (canvas) | `react-external-libs.instructions.md`                                                |
| Write backend error handlers     | `backend-error-messages.instructions.md`                                             |
| Create/edit barrel files         | `barrel-files.instructions.md`                                                       |
| Create/move a state store        | `store-placement.instructions.md`                                                    |
| Update DESIGN.md / registry      | `design-system-drift.instructions.md`                                                |
| Write story docs, KB articles    | `documentation-standards.instructions.md`                                            |
| Add a new quiz mode              | `quiz-architecture.instructions.md`                                                  |
| Create Storybook stories         | `storybook-production-alignment.instructions.md`                                     |
| Pre-ship UI quality check        | `frontend-pre-delivery-checklist.instructions.md`                                    |

All `.instructions.md` files auto-attach when editing matching file types. Each has **numbered how-to steps** and cross-references to related files. See also the agent files in `.github/agents/` and audit skills in `.github/skills/`.

## 📦 Templates & Naming

| Item                  | Path                                                                           |
| --------------------- | ------------------------------------------------------------------------------ |
| Epic BR               | `docs/business-requirements/epic-<num>-<slug>/README.md`                       |
| Story BR              | `docs/business-requirements/epic-<num>-<slug>/story-<epic>-<story>-<short>.md` |
| Epic Implementation   | `docs/issue-implementation/epic-<num>-<slug>/README.md`                        |
| Story Implementation  | `docs/issue-implementation/epic-<num>-<slug>/story-<epic>-<story>-<short>.md`  |
| Feature code          | `apps/frontend/src/features/<feature>/`                                        |
| Architecture          | `docs/architecture.md`                                                         |
| Pull Request template | `.github/PULL_REQUEST_TEMPLATE.md`                                             |

## 🌿 Git & Branching

Branch naming: `epic-<num>-<slug>` primary; optional `feature/<short>` or `fix/<short>`.
Conventional Commits: `<type>(<scope>): <description>`; scopes: e.g., `epic-N`, `component`, `hook`, `api`, `docs`.
See `docs/guides/conventions/git.md` + `docs/templates/commit-message-template.md`.

## 🛑 Known Pitfalls

Each pitfall category has a dedicated `.instructions.md` file with DO/DON'T examples:

| Category                       | File                                                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Prisma & Database              | [prisma-schema-changes.instructions.md](./instructions/prisma-schema-changes.instructions.md)                   |
| External libraries & React DOM | [react-external-libs.instructions.md](./instructions/react-external-libs.instructions.md)                       |
| CSS & styling                  | [frontend-css-styling.instructions.md](./instructions/frontend-css-styling.instructions.md)                     |
| API client & service layer     | [frontend-api-client.instructions.md](./instructions/frontend-api-client.instructions.md)                       |
| Barrel files                   | [barrel-files.instructions.md](./instructions/barrel-files.instructions.md)                                     |
| Store placement                | [store-placement.instructions.md](./instructions/store-placement.instructions.md)                               |
| Input/timer edge cases         | [frontend-input-handling.instructions.md](./instructions/frontend-input-handling.instructions.md)               |
| Testing requirements           | [testing-standards.instructions.md](./instructions/testing-standards.instructions.md)                           |
| Storybook-Production drift     | [storybook-production-alignment.instructions.md](./instructions/storybook-production-alignment.instructions.md) |
| Backend error messages         | [backend-error-messages.instructions.md](./instructions/backend-error-messages.instructions.md)                 |
| Design system drift            | [design-system-drift.instructions.md](./instructions/design-system-drift.instructions.md)                       |
| Documentation drift            | [documentation-standards.instructions.md](./instructions/documentation-standards.instructions.md)               |

## 📁 Key Files & Directories

### Frontend

`apps/frontend/src/features/<feature>/` – feature code (components, hooks, services, stores, types)

### Backend Modules

`apps/backend/src/modules/<module>/` – self-contained modulith module
`apps/backend/prisma/schema.prisma` – database schema

### Shared & Data

`content/` – pinyin, tones, strokes, and reference data files
`packages/shared-constants/` – route paths, data file paths, foundation sections
`packages/shared-types/` – TypeScript types shared across packages

### Docs

`docs/architecture.md` – system design and architecture overview
`<feature>/docs/design.md` – feature-level design decisions

## 📁 Customization Files (Auto-Attached)

This project uses file-scoped `.instructions.md` files that auto-attach when
you edit matching files, and custom `.agent.md` agents for specialized reviews.
See `.github/instructions/` and `.github/agents/` for the full list.

## 🛠️ Resources

- Frontend Conventions: `docs/guides/conventions/frontend.md`
- Backend Conventions: `docs/guides/conventions/backend.md`
- SOLID Principles: `docs/knowledge-base/practices/solid-principles.md`
- Git Workflow: `docs/guides/conventions/git.md`
- Documentation Patterns: `docs/knowledge-base/practices/documentation-patterns.md`
- Architecture: `docs/architecture.md`

---

If any section is unclear or missing — ask for clarification before proceeding.
