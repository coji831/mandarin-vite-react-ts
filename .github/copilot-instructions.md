# Copilot Instructions for AI Coding Agents

**Last Updated:** October 31, 2026

Operational playbook for AI agents contributing to `mandarin-vite-react-ts`.

## 🚦 COMMIT GATE (binding — read first)

**Never `git commit` or `git push` unless the user explicitly says the phrase
"commit allowed"** (or an unambiguous equivalent like "yes, commit"). The
default state of this repo is **review-before-commit**: after making changes,
present the diff/plan and wait for explicit approval. Ambiguous words
("proceed", "go ahead", "fix it", "ok") do NOT grant commit permission. When
in doubt, do not commit — ask. The only exception is a change the user has
already explicitly approved for commit earlier in the same session.

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
Run foundation audit (spine's page-anatomy rules only): `npm run design-audit:foundation`
Run registry-stories check: `npm run check:registry-stories`
Run backend type-check (full): `npm run typecheck --workspace=@mandarin/backend`
Quality gates (canonical two-tier): see `project-workflow.instructions.md` — the single source of truth for all gates
Read design reasoning: `docs/guides/design/design-reasoning.md`
Run pre-delivery checklist: `.github/instructions/frontend-pre-delivery-checklist.instructions.md`
See visual design protocol: `.github/instructions/uiux-design-protocol.instructions.md`
Read page archetypes (Focus-First page library): `docs/guides/design/page-archetypes.md`
Score designs against the quality rubric: `docs/guides/design/design-quality-rubric.md`
Write per-epic design specs from the template: `docs/guides/design/per-epic-design-spec.md`
See AGENTS.md for agent roles, behavior rules, and prohibited patterns.
Epic BR: use `docs/templates/epic-business-requirements-template.md`
Story BR: use `docs/templates/story-business-requirements-template.md`
Epic Implementation: `docs/templates/epic-implementation-template.md`
Story Implementation: `docs/templates/story-implementation-template.md`
Code change: follow `docs/guides/conventions/frontend.md` (frontend) or `docs/guides/conventions/backend.md` (backend) + `docs/knowledge-base/practices/solid-principles.md`
Close epic/story: follow the seven-phase lifecycle above (§Epic & Story Lifecycle) — Phase 4 closes a story, Phase 5 closes an epic, and Phase 5's surface table is mandatory.
Doc Truth-Check: before closing, verify docs match the shipped code (endpoints/names/data source/links/dates) — see `documentation-standards.instructions.md`.

## 🎨 Visual Design Protocol

See `.github/instructions/uiux-design-protocol.instructions.md` for the full protocol covering: Storybook-first mandate, component reuse, token integrity, Storybook mandate, verification requirements, responsive/accessibility checks, data-resilient UI principle, UI composition guide, and the UIUX fundamentals + AI-slop checklist.

**Key references:** `ui-composition.instructions.md` (layout rules), `component-registry.json` (allowed components), `page-archetypes.md` (page library), `design-reasoning.md` (design philosophy), `DESIGN.md` (design tokens).

**Design-system source of truth = spine** (served by the `spine` MCP in `.mcp.json`). The generic layer — generic tokens, generic components, page-anatomy measures, the archetype vocabulary — lives there. This repo owns only the theme overlay (`DESIGN.md` + `globals.css` `:root`) and the `domain.pinyinpal` support tokens; never add a generic token or a new measure locally. See `AGENTS.md` § "Design-system source of truth (spine)".

---

## 🏗️ Architecture Overview

**Frontend**: React + TypeScript via Vite; feature folders in `apps/frontend/src/features/`.
**State**: Context + reducers + shared Zustand stores: `userStore` (userId/preferences), `uiStore` (loading/error/selectedList), `hubStore` (LexicalHub overlay); plus feature-scoped stores (mnemonicStore, quizSessionStore, readingStore, audioStore). Device identity read from localStorage (deviceUserId); stores are not persisted.

- **Backend**: NestJS 11 (Express platform adapter) + Prisma in `apps/backend/` (production backend); deployed to Railway in production, runs locally on port 3001 for development.
  **Routing**: React Router; constants in `apps/frontend/src/shared/constants/paths.ts`.
  **Business & planning**: Epic work follows the RATIFIED business model (`docs/business/business-model.md`, BM-1) and the approved epic plan (`docs/planning/epics-25-40.md`).
  **Authentication**: JWT with httpOnly cookies, bcrypt password hashing, refresh token rotation.

## 🧩 Component Reuse

- ✅ ALWAYS check `src/shared/components/` before creating a new component
- ✅ Import from `shared/components` — they're already re-exported via barrel
- ✅ Use CSS variables from `apps/frontend/src/styles/globals.css` — never hardcode colors, spacing, or typography
- ✅ See [DESIGN.md](../DESIGN.md) for the complete design token reference
- ✅ See [frontend-audit skill](./skills/frontend-audit/SKILL.md) for the frontend audit checklist (Part 1 = 12 UIUX fundamentals + AI-slop; Parts 2–4 = architecture, verification, integration)
- ✅ See [uiux-fundamentals guide](../docs/guides/design/uiux-fundamentals.md) for the 12 UIUX fundamentals + QA pyramid + AI-slop list
- ✅ See [backend-audit skill](./skills/backend-audit/SKILL.md) for backend code audit checklist
- ❌ NEVER reimplement Button, Input, LoadingScreen, ErrorScreen, ProgressBar, FilterChip, ToggleSwitch, or ContentBrowser

## 🔄 Epic & Story Lifecycle (the full cycle)

Seven phases from plan entry to archive. **Every phase has an exit gate; a phase is not done because its artefacts exist.** Phases 0–2 happen before code, 3–4 per story, 5–6 once per epic, 7 is deferred. Gate _commands_ are not repeated here — `project-workflow.instructions.md` is the single source for the two-tier gate table.

| #   | Phase                       | Produces                                                                                                                                                                   | Exit gate                                                                                                                                                                                                                                             | Lead                        |
| --- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 0   | **Scope**                   | the epic's binding text: `docs/planning/epics-25-40.md` §Epic N plus any `§2026 Audit Amendments` (A0, A25, A26 …)                                                         | An amendment **overrides** the epic body where they disagree — so **re-measure every premise it names against the code before scoping**. A26 named three defects and two were already fixed when its epic opened; record what you measured and where. | architect                   |
| 1   | **BR**                      | `<epic>/README.md` (BR) + one `story-N-M-*.md` per story from `docs/templates/`; UI epics also get the per-epic design spec (`docs/guides/design/per-epic-design-spec.md`) | Every story carries AC + status. The design spec runs **Step 0 revalidation first** (`design-revalidation-guide.md`) and names its archetype, provenance and anatomy.                                                                                 | architect                   |
| 2   | **Design** (UI epics)       | Step-1 Storybook shells covering every state, no logic                                                                                                                     | **Human User Preview Gate** — approval before any code conversion. The accessibility lead runs _before_ the first TSX/CSS edit.                                                                                                                       | uiux-designer               |
| 3   | **Build** (per story)       | story commits (`story-N-M`), the story implementation doc, tests                                                                                                           | Tier 1 gates per story + the **commit gate** ("commit allowed", no exceptions)                                                                                                                                                                        | frontend / backend engineer |
| 4   | **Story close** (per story) | the story BR + IMP pair: `status`, `Last Update`, AC boxed, Technical Challenges where required                                                                            | doc↔code truth-check on that pair                                                                                                                                                                                                                     | docs-writer                 |
| 5   | **Epic close**              | epic IMP README close sections, **high-level docs**, **KB extraction**, verification artifact, regenerated system map                                                      | Tier 2 gates + code-review verdict + `docs-audit`                                                                                                                                                                                                     | docs-writer + code-reviewer |
| 6   | **Ship**                    | one PR `epic-<n>-<slug>` → `main` via `.github/PULL_REQUEST_TEMPLATE.md`, merged with a merge commit                                                                       | CI green; both epic records name the PR number                                                                                                                                                                                                        | coordinator                 |
| 7   | **Archive** (deferred)      | epic folders moved under `docs/**/archive/` + an outcome row in the archive README                                                                                         | A **batch** pass, not a per-epic step — closed epics stay live until then (epics 24–26 are live today)                                                                                                                                                | owner                       |

### Phase 5 is where epics silently fail

Prose duties are not gates, and this repo has the scar. `docs-audit` check #7 ("high-level claims re-derived from code") named the exact failure and still did not fire — because **a self-audit of touched files cannot see an untouched file**. The docs writer never opened `docs/architecture.md`, so the check never ran on it, and it described the quiz engine as a single strategy long after seven shipped.

So Phase 5 enumerates its surfaces **by name**. Each is opened, re-derived from code and bumped — never inferred from "did I happen to touch it":

| Surface                                | Carries                                                                 | Invalidated by                                             |
| -------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| `docs/architecture.md`                 | feature inventory lines, module/registry/format counts, system sections | any new feature, module, registry entry or format          |
| `README.md`, `apps/*/README.md`        | product and feature blurbs                                              | any change to a feature's scope                            |
| `docs/knowledge-base/`, `docs/guides/` | how-to patterns, the id/count vocabulary they teach                     | a pattern that changed, or an id renamed, added or removed |
| `docs/coverage.md`, `docs/README.md`   | the generated map                                                       | always — `npm run generate:system-map`, then gate it       |
| `<epic>/README.md` + every story file  | the plan versus the as-built record                                     | every story                                                |

Two hard rules for this phase:

- **A brief quotes this table; it never summarises it.** A brief saying "write the story docs" is incomplete — that exact phrasing is what let Phase 5's doc duties drop on Epic 26.
- **`verification-artifacts/` is gitignored.** Evidence lives there locally; the _committed_ record is its condensation in the story or epic IMP doc.

And one rule that governs every handoff between epics:

- **A carry-forward is written into the receiving epic's record, not only your own.** A row in your close-out table naming a future epic is a hope until that epic's own file lists it. Epic 25 delegated two items to Epic 26 by table row alone; neither was picked up, both survived that epic's close, and they were only found by re-reading Epic 25's table on 2026-10-31 (F12, F15 — now re-homed to epics 28 and 27).

**Template compliance versus close-out sections.** `docs-audit` #1 permits no section the template lacks, so the epic IMP template carries `## Code Review Outcome` and `## Epic Close — Documentation Duty`. Write those sections instead of inventing new ones, and promote any genuinely recurring new section into `docs/templates/` in the same change that first uses it.

### Inside Phase 3 — the story-level pipeline

Unchanged: `Context → Review → Plan → Implement → Verify → Test → Run → Docs → Gates → Commit`.

- **Context** — before writing code, read the shared components, DESIGN.md tokens and existing feature structure to see what is reusable. A Figma URL means querying the Framelink MCP for structured design data.
- **Verify** — after implementation, open the page (Playwright / Chrome DevTools MCP), screenshot it and validate against the spec; record discrepancies in `verification-artifacts/`.

The per-step sequence for each role — UIUX Step 1/Step 2, the backend modulith pipeline, story closing — is in [project-workflow.instructions.md](./instructions/project-workflow.instructions.md), visualised in `docs/guides/dev-flow-visualization.html`.

## 🧭 Frontend Development Landscape (4 pillars)

The frontend agentic layer is organized into **4 pillars** — UIUX + AI-slop is first-class (Pillar 1), and every other frontend concern has a home. Run the `frontend-audit` skill (Parts 1–4) before closing any frontend change.

| Pillar                           | Covers                                                                                                      | File / spec                                                                                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. UIUX Design** (first-class) | design process (Storybook-first), 12 fundamentals, **AI-slop**, composition, styling                        | `uiux-design-protocol.instructions.md` · `ui-composition.instructions.md` · `frontend-css-styling.instructions.md` · `docs/guides/design/uiux-fundamentals.md` (+ `uiux-resources.md`) |
| **2. Frontend Architecture**     | 3-tier structure, state colocation, logic placement, barrels, stores, service layer, input/timer edge cases | `frontend-component-architecture.instructions.md` · `frontend-api-client.instructions.md` · `frontend-input-handling.instructions.md`                                                  |
| **3. Verification & Quality**    | unit/component tests, stories + MSW + state parity, pre-ship gate                                           | `testing-standards.instructions.md` · `storybook-production-alignment.instructions.md` · `frontend-pre-delivery-checklist.instructions.md`                                             |
| **4. Feature & Integration**     | quiz strategy pattern, external DOM libs                                                                    | `quiz-architecture.instructions.md` · `react-external-libs.instructions.md`                                                                                                            |

**Audit:** `frontend-audit` skill — Part 1 = UIUX fundamentals + AI-slop, Part 2 = Architecture & data, Part 3 = Verification, Part 4 = Integration.

**Role flow:** Product & Architecture (`architect` — design brief) → **UIUX Designer** (Step 1 design + human preview gate) → **Frontend/Backend Engineer** (Step 2 code) → Docs Writer + Code Reviewer (docs + audit). The User Preview Gate is human-owned and sits between Step 1 (design) and Step 2 (code).

## ✅ Pre-Delivery UI Checklist

Run through `.github/instructions/frontend-pre-delivery-checklist.instructions.md` before reporting any UI code as complete. Covers: token compliance, states coverage, interaction, layout, and quality gates.

---

## 📋 Instruction Reference — What to Read When

| When you need to...                          | Read this file (`.github/instructions/`)                                                                                         |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Follow the full dev pipeline                 | `project-workflow.instructions.md` + `docs/guides/dev-flow-visualization.html`                                                   |
| Run an epic end-to-end (scope → archive)     | §Epic & Story Lifecycle above — then `project-workflow.instructions.md` for role-level steps                                     |
| Implement UI from spec                       | `uiux-design-protocol.instructions.md` → `ui-composition.instructions.md` → `docs/guides/design/uiux-fundamentals.md`            |
| Write CSS / style a component                | `frontend-css-styling.instructions.md`                                                                                           |
| Decompose components (state/logic/hierarchy) | `frontend-component-architecture.instructions.md`                                                                                |
| Make API calls from frontend                 | `frontend-api-client.instructions.md`                                                                                            |
| Build a card + detail panel                  | `ui-composition.instructions.md` §7 (preview-vs-detail)                                                                          |
| Handle inputs, debounce, timers              | `frontend-input-handling.instructions.md`                                                                                        |
| Write tests                                  | `testing-standards.instructions.md`                                                                                              |
| Modify Prisma schema                         | `prisma-schema-changes.instructions.md`                                                                                          |
| Integrate external libs (canvas)             | `react-external-libs.instructions.md`                                                                                            |
| Write backend error handlers                 | `backend-error-messages.instructions.md`                                                                                         |
| Create/edit barrel files + stores            | `frontend-component-architecture.instructions.md` (Barrel File Rules + Store Placement Rules sections)                           |
| Create/move a state store                    | `frontend-component-architecture.instructions.md` (Store Placement Rules section)                                                |
| Update DESIGN.md / registry                  | `frontend-component-architecture.instructions.md` (Design-System Drift section)                                                  |
| Write story docs, KB articles                | `documentation-standards.instructions.md`                                                                                        |
| Add a new quiz mode                          | `quiz-architecture.instructions.md`                                                                                              |
| Create Storybook stories                     | `storybook-production-alignment.instructions.md`                                                                                 |
| Pre-ship UI quality check                    | `frontend-pre-delivery-checklist.instructions.md`                                                                                |
| Design a new page / pick archetype           | `docs/guides/design/page-archetypes.md` + `docs/guides/design/per-epic-design-spec.md`                                           |
| Score a design against the bar               | `docs/guides/design/design-quality-rubric.md`                                                                                    |
| Read the page contract / ledger              | `.github/page-inventory.json` — verified via `check:page-inventory` (canonical gate table in `project-workflow.instructions.md`) |
| Write/audit docs, truth-check                | Docs Writer agent + `docs-audit` skill (`.github/skills/docs-audit/SKILL.md`)                                                    |

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

| Category                       | File                                                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma & Database              | [prisma-schema-changes.instructions.md](./instructions/prisma-schema-changes.instructions.md)                                             |
| External libraries & React DOM | [react-external-libs.instructions.md](./instructions/react-external-libs.instructions.md)                                                 |
| CSS & styling                  | [frontend-css-styling.instructions.md](./instructions/frontend-css-styling.instructions.md)                                               |
| API client & service layer     | [frontend-api-client.instructions.md](./instructions/frontend-api-client.instructions.md)                                                 |
| Barrel files + store placement | [frontend-component-architecture.instructions.md](./instructions/frontend-component-architecture.instructions.md) (Barrel/Store sections) |
| Input/timer edge cases         | [frontend-input-handling.instructions.md](./instructions/frontend-input-handling.instructions.md)                                         |
| Testing requirements           | [testing-standards.instructions.md](./instructions/testing-standards.instructions.md)                                                     |
| Storybook-Production drift     | [storybook-production-alignment.instructions.md](./instructions/storybook-production-alignment.instructions.md)                           |
| Backend error messages         | [backend-error-messages.instructions.md](./instructions/backend-error-messages.instructions.md)                                           |
| Design system drift            | [frontend-component-architecture.instructions.md](./instructions/frontend-component-architecture.instructions.md)                         |
| Documentation drift            | §Epic & Story Lifecycle → Phase 5 surface table (then `documentation-standards.instructions.md`)                                          |

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
