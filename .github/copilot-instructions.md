# Copilot Instructions for AI Coding Agents

**Last Updated:** June 25, 2026

Operational playbook for AI agents contributing to `mandarin-vite-react-ts`.

## ⚡ TL;DR Quick Start

Install: `npm install`
Run dev: `npm run dev` (port 5173)
Run local backend: `npm run start-backend` (port 3001)
Run tests: `npm test`
Run design lint: `npx @google/design.md lint DESIGN.md`
See AGENTS.md for agent roles, behavior rules, and prohibited patterns.
Epic BR: use `docs/templates/epic-business-requirements-template.md`
Story BR: use `docs/templates/story-business-requirements-template.md`
Epic Implementation: `docs/templates/epic-implementation-template.md`
Story Implementation: `docs/templates/story-implementation-template.md`
Code change: follow `docs/guides/conventions/frontend.md` (frontend) or `docs/guides/conventions/backend.md` (backend) + `docs/knowledge-base/practices/solid-principles.md`
Close epic/story: verify all AC done → update Status & Last Update in BR + implementation → check all AC boxes → commit together.

## 🏗️ Architecture Overview

**Frontend**: React + TypeScript via Vite; feature folders in `apps/frontend/src/features/`.
**State**: Context + reducers + Zustand; slices: `lists`, `user`, `ui`; persisted via localStorage.
**Backend**: Express + Prisma in `apps/backend/`; deployed to Railway in production, runs locally on port 3001 for development.
**Routing**: React Router; constants in `apps/frontend/src/shared/constants/paths.ts`.
**Authentication**: JWT with httpOnly cookies, bcrypt password hashing, refresh token rotation.

## 🧩 Component Reuse

- ✅ ALWAYS check `src/shared/components/` before creating a new component
- ✅ Import from `@/shared/components` — they're already re-exported via barrel
- ✅ Use CSS variables from `apps/frontend/src/styles/globals.css` — never hardcode colors, spacing, or typography
- ✅ See [DESIGN.md](./DESIGN.md) for the complete design token reference
- ✅ See [component-decomposition skill](./.github/skills/component-decomposition/SKILL.md) for component breakdown rules
- ✅ See [frontend-audit skill](./.github/skills/frontend-audit/SKILL.md) for frontend code audit checklist
- ✅ See [backend-audit skill](./.github/skills/backend-audit/SKILL.md) for backend code audit checklist
- ❌ NEVER reimplement Button, Input, LoadingScreen, ErrorScreen, ProgressBar, FilterChip, ToggleSwitch, or ContentBrowser

## 🔄 Development Workflow

Concise checklist: `Context → Review → Plan → Implement → Test → Run → Docs → Gates → Commit`

Where **Context** means: before writing code, read the relevant shared components, DESIGN.md tokens, and existing feature structure to understand what's available for reuse.

See [project-workflow.instructions.md](./instructions/project-workflow.instructions.md) for the detailed story-level development workflow, epic/story closing procedures, quality gates, and code change checklist.

## 📋 Where to Find Rules

| Topic                        | File                                                                                              | Auto-attaches when...                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Workflow, epics, closing     | [project-workflow.instructions.md](./instructions/project-workflow.instructions.md)               | Description matches task                     |
| Documentation standards      | [documentation-standards.instructions.md](./instructions/documentation-standards.instructions.md) | Editing `docs/**/*.md`                       |
| API client rules             | [frontend-api-client.instructions.md](./instructions/frontend-api-client.instructions.md)         | Editing frontend `.ts/.tsx`                  |
| CSS & styling                | [frontend-css-styling.instructions.md](./instructions/frontend-css-styling.instructions.md)       | Editing `.css` or frontend `.tsx`            |
| Barrel files                 | [barrel-files.instructions.md](./instructions/barrel-files.instructions.md)                       | Editing `index.ts`                           |
| Store placement              | [store-placement.instructions.md](./instructions/store-placement.instructions.md)                 | Editing store files                          |
| Testing requirements         | [testing-standards.instructions.md](./instructions/testing-standards.instructions.md)             | Editing frontend `.ts/.tsx` or backend `.js` |
| Prisma schema changes        | [prisma-schema-changes.instructions.md](./instructions/prisma-schema-changes.instructions.md)     | Editing `schema.prisma`                      |
| External libs (hanzi-writer) | [react-external-libs.instructions.md](./instructions/react-external-libs.instructions.md)         | Editing canvas/animation files               |
| Input/timer edge cases       | [frontend-input-handling.instructions.md](./instructions/frontend-input-handling.instructions.md) | Editing input/timer/quiz files               |
| Backend error messages       | [backend-error-messages.instructions.md](./instructions/backend-error-messages.instructions.md)   | Editing backend controllers/services         |

## 📦 Templates Index

Epic BR: `docs/templates/epic-business-requirements-template.md`
Story BR: `docs/templates/story-business-requirements-template.md`
Epic Implementation: `docs/templates/epic-implementation-template.md`
Story Implementation: `docs/templates/story-implementation-template.md`
Commit Message: `docs/templates/commit-message-template.md`
File Header Summary: `docs/templates/file-summary-template.md`

## 🏷️ Naming & Structure

Epic BR: `docs/business-requirements/epic-<num>-<slug>/README.md`
Story BR: `docs/business-requirements/epic-<num>-<slug>/story-<epic>-<story>-<short>.md`
Epic Implementation: `docs/issue-implementation/epic-<num>-<slug>/README.md`
Story Implementation: `docs/issue-implementation/epic-<num>-<slug>/story-<epic>-<story>-<short>.md`
Feature code: `apps/frontend/src/features/<feature>/`
Reducer files: `apps/frontend/src/features/<feature>/reducers/<domain>Reducer.ts`
Design docs: `apps/frontend/src/features/<feature>/docs/design.md`
Architecture overview: `docs/architecture.md`

## 🌿 Git & Branching

Branch naming: `epic-<num>-<slug>` primary; optional `feature/<short>` or `fix/<short>`.
Conventional Commits: `<type>(<scope>): <description>`; scopes: e.g., `epic-N`, `component`, `hook`, `api`, `docs`.
Always consult: `docs/guides/conventions/git.md` + `docs/templates/commit-message-template.md`.
Feature flags: document flag names & purpose in epic BR + implementation README when used.

## 🛑 Known Pitfalls

Each pitfall category has a dedicated `.instructions.md` file with DO/DON'T examples:

| Category                       | File                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| Prisma & Database              | [prisma-schema-changes.instructions.md](./instructions/prisma-schema-changes.instructions.md)     |
| External libraries & React DOM | [react-external-libs.instructions.md](./instructions/react-external-libs.instructions.md)         |
| CSS & styling                  | [frontend-css-styling.instructions.md](./instructions/frontend-css-styling.instructions.md)       |
| API client & service layer     | [frontend-api-client.instructions.md](./instructions/frontend-api-client.instructions.md)         |
| Barrel files                   | [barrel-files.instructions.md](./instructions/barrel-files.instructions.md)                       |
| Store placement                | [store-placement.instructions.md](./instructions/store-placement.instructions.md)                 |
| Input/timer edge cases         | [frontend-input-handling.instructions.md](./instructions/frontend-input-handling.instructions.md) |
| Testing requirements           | [testing-standards.instructions.md](./instructions/testing-standards.instructions.md)             |
| Backend error messages         | [backend-error-messages.instructions.md](./instructions/backend-error-messages.instructions.md)   |

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

Frontend Conventions: `docs/guides/conventions/frontend.md`
Backend Conventions: `docs/guides/conventions/backend.md`
SOLID Principles: `docs/knowledge-base/practices/solid-principles.md`
Git Workflow: `docs/guides/conventions/git.md`
Documentation Patterns: `docs/knowledge-base/practices/documentation-patterns.md`
Architecture: `docs/architecture.md`

---

If any section is unclear or missing — ask for clarification before proceeding.
