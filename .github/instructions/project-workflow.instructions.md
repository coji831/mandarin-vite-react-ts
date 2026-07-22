---
description: "Use when implementing a story, closing an epic, preparing a commit, or running quality gates. Covers the full story-level development workflow, pre-implementation investigation, closing procedures, and checklists."
---

# Project Workflow

## Story-Level Development Workflow

Follow this sequence when implementing or updating a story:

1. **Review Requirements** — Open the story BR file and its epic BR README. Open corresponding implementation docs. Confirm Acceptance Criteria clarity; note ambiguous items in a "Questions / Clarifications" subsection.

1.5 **Design Thinking & User Flow** — Before planning any code, establish the user's mental model. See `docs/guides/dev-flow-visualization.html` for the full flow diagram and `frontend-visual-design-protocol.instructions.md` for the detailed frontend pipeline:

- **Read the research** — Open design docs, proposals, competitor analysis, domain research under `docs/` and `verification-artifacts/`. If the feature has a `docs/design.md`, read it. Don't design UI without understanding the domain context.
- **Map the user's flow step by step** — For each action the user takes, ask:
  - What do they see? (visual state)
  - What do they think? (interpretation)
  - What do they want to do next? (intent)
  - What does the interface tell them they CAN do? (WAGC — What Am I Gonna Click)
- **Establish the preview/reward boundary** — Identify which elements are preview/teaser surfaces (cards, list items) and which are detail/reward surfaces (modals, panels, expandable sections). Detail content must NOT appear on the preview surface — that breaks the reward loop. See `preview-detail-separation.instructions.md`.
- **Check source for every design decision** — If you propose adding an element to the UI, you must be able to answer "where did my data come from to design this layout?" If the answer is a future-state proposal, verify the change works with the CURRENT architecture, not just the proposed one. Incremental changes to an existing system must not pre-implement future-state designs.
- **Apply principles before polish** — Evaluate each UI addition against: WAGC (does this look clickable when it shouldn't?), content density (can the user parse this in 2 seconds?), clarity (is the meaning obvious without a tooltip?), cognitive load (does this add mental work or reduce it?).

2. **Plan Changes** — Read [`AGENTS.md`](../AGENTS.md) for agent behavior rules, structure conventions, and prohibitions. Identify impacted feature folder(s) under `apps/frontend/src/features/` or `apps/backend/src/modules/`. Check design doc (`apps/frontend/src/features/<feature>/docs/design.md`) and `docs/architecture.md` for conflicts. If adding public APIs/components/hooks, prepare file header summaries.

3. **Backend Implementation (if applicable)** — For backend changes (API, database, external services), follow the modulith creation pipeline from `docs/guides/dev-flow-visualization.html`:

   1. **Module scaffold** — Create `modules/<name>/` with `api/`, `services/`, `repositories/`, `types/`, `container.ts`. Choose CRUD, Feature Slices, or Clean Architecture template based on complexity. See `docs/guides/conventions/backend.md`.
   2. **Database** — Edit `prisma/schema.prisma` → `npx prisma migrate dev` → `npx prisma generate`. Never `push` to production. See `prisma-schema-changes.instructions.md`.
   3. **Container DI** — Create `createXModule(deps)` factory. Register in root `src/app/container.ts`. Constructor injection at composition root.
   4. **Routes** — Define endpoints with rate limiting. Register in `src/app/routes.ts`. Use route constants from `packages/shared-constants`.
   5. **Validation** — Input validation at controller layer. Error responses in `{ error, code, message }` format per `backend-error-messages.instructions.md`.
   6. **External services** — Class pattern with constructor injection (GeminiService, CacheService, GCSClient). Fail-open: degraded service, never crash.
   7. **Tests** — Unit: service + repository. Integration: full request→response cycle. Mock external deps. `vitest run src/modules/<module>/`.

4. **Storybook-First UI Design (Phase A — No Logic)** — BEFORE implementing any logic, build the complete visual UI in Storybook. Follow the full Phase A pipeline from `frontend-visual-design-protocol.instructions.md`:

   1. **Gather context** — Research business need, user need, read design docs.
   2. **High-level design** — Wireframe/sketch the UI. Identify host component.
   3. **Component breakdown** — Decompose into hierarchy, check reuse, impact radius.
   4. **Build Storybook UI** — JSX skeleton on host `.stories.tsx`. Cover ALL visual states. MSW mocks. No hooks, no API calls.
   5. **Polish styling** — CSS variables, utility classes, data-resilient shell, responsive at 320px. See `frontend-css-styling.instructions.md`.
   6. **User preview & approval** — Present in browser. User approves layout/spacing/colors/states. **Gate: do NOT proceed until approved.**
   7. **Mock all data** — Use MSW handlers to simulate every state. No real API calls. No hook logic. Pure visual shell.
   8. **Polish styling** — Apply CSS variables, global utility classes, BEM component CSS. Data-resilient shell (fixed container, inner scroll). Verify at 320px. See `frontend-css-styling.instructions.md`.
   9. **Preview & iterate** — Open Storybook in the browser. Present to the user for feedback. Iterate on layout, spacing, colors, states until approved.

   ⚠️ **Gate rule**: Do NOT proceed to logic implementation until the user has previewed and approved the fully-styled UI design in Storybook. This prevents wasted work on logic behind unapproved layouts.

5. **Implement Logic** — After UI design is approved, add hooks, state management (reducers/context/Zustand), and API service layer. Connect the visual shell to real data. Wire up loading/error/empty state transitions.
6. **Tests (Create / Update)** — Add or adjust unit/component tests to cover happy path + at least one edge case from AC. Ensure new reducers/actions/selectors have isolated tests. Avoid brittle UI assertions (prefer role/text queries via RTL).
7. **Run Locally (If Needed)** — Start app: `npm run dev`. Start local backend (if API integration touched): `npm run start-backend`. Manual sanity check: exercise UI path for story; capture any discrepancies against AC.

**5.5 Visual Verification** — After all UI changes are implemented, visually validate against Storybook:

1. Start Storybook: `npm run storybook` — open the affected page story(ies) in the browser
2. Start dev server: `npm run dev` — open the same page in production
3. **Wait for both pages to fully load** — ensure loading spinners/placeholders have resolved before taking screenshots. If one page shows a loading state and the other shows data, this is a state mismatch — log it as a discrepancy and re-check after data resolves.
4. Take screenshots of both side-by-side
5. Compare: does the Storybook story match production appearance in layout, spacing, colors, and component structure?
6. If discrepancies exist, fix the story to match production OR fix the component to match the story (whichever is the source of truth)
7. Log any discrepancies in `verification-artifacts/` with a `review-findings-*` artifact

⚠️ **When to skip visual verification**: Pure backend changes with no UI surface. Never skip for UI changes.
🔄 **When to run backend pipeline only**: Database-only, API-only, or external-service-only changes with no UI surface — skip steps 4-5.5 and jump to step 6 (Run Locally) to verify backend endpoints. 7. Log any discrepancies in `verification-artifacts/` with a `review-findings-*` artifact

⚠️ **When to skip**: Pure backend changes, logic-only changes with no UI surface, or documentation-only changes. Never skip for UI changes.

**Story test validation**: After visual verification, run story tests to catch rendering regressions:

```
npm run test-storybook
```

This runs Chromatic/vitest-integration tests on all stories. Fix any failures before committing.

7. **Update Documentation** — Developer records decisions, data shape changes, and performance notes in story implementation doc. Add "Technical Challenges & Solutions" section for non-trivial problems. Update Last Update date fields. Documentation changes must be reviewed before commit.
8. **Pre-Commit Gate** — Run `npm run format` → auto-formats code with Prettier. Run `npm run build` → must pass (runs `tsc -b` type-check across all workspaces + Vite bundle). Run `npm run test:full` → must pass (full suite; `npm test` runs changed-scope only). Run `npm run test-storybook` → must pass if stories were modified. Run `npm run lint` → must have **0 errors** (warnings are acceptable during incremental migration). Fix any NEW errors you introduced. Do not add new `any` annotations — use proper types. Verify Quality Gates & Cross-Doc Alignment checklists. Documentation changes must be validated by a reviewer for template compliance, cross-linking, AC clarity, technical accuracy, and status consistency.
9. **Commit** — Use Conventional Commit format: `<type>(story-<epic>-<story>): <summary>`. Include scope referencing story. Ensure BR + implementation doc updates are in the same commit for traceability.

## Pre-Implementation Investigation Checklist

Before writing any code, the implementing agent MUST investigate these 4 areas to avoid systemic architecture mistakes:

### 1. Pattern Investigation

- Read the target feature directory to find existing architecture patterns (strategy pattern, component hierarchy, store patterns, service layers)
- Check if a reusable pattern already exists for the type of work being done
- ❌ Never build standalone implementations when a reusable pattern exists

### 2. Project Structure Verification

- Verify file placement against existing project conventions:
  - Feature components → `features/<name>/components/`
  - Quiz/assessment pages → `pages/practices/`
  - Stores → `features/<name>/stores/` or `shared/store/`
  - Services → `features/<name>/services/`
- ❌ Never place feature files in unrelated feature directories

### 3. Routing Convention Check

- Examine existing route files (`router/`) and path constants (`shared/constants/paths.ts`)
- Check for existing routing patterns (query params vs path segments)
- ❌ Never create new route patterns when an established convention exists

### 4. Data Source Audit

- Determine if data should come from: backend API, content files, or be generated
- Check if backend endpoints already exist for the data needed
- ❌ Never hardcode data in frontend services when a backend API exists

### Edge Cases

- Partial AC completion: split remaining work into new story file
- Data model shifts: update unified model docs & API specs
- Performance regressions: add note + follow-up optimization story
- Feature flag introduction: document in epic BR + implementation README
- Blocked step: record blocker under "Pending / Blockers" in both BR and implementation docs

## Code Change Checklist

- Read [`AGENTS.md`](../AGENTS.md) for agent behavior rules, structure conventions, and prohibitions
- Refer to `docs/guides/conventions/frontend.md` (frontend) or `docs/guides/conventions/backend.md` (backend) + `docs/knowledge-base/practices/solid-principles.md`
- Update file-level header comments when public API surface changes (use File Summary Template)
- Update design docs if feature logic or architecture changes
- Update `docs/architecture.md` if cross-cutting changes
- Update API docs if endpoints/contracts change
- Update related BR + implementation docs for status, rationale, new decisions
- Add/update tests to cover new paths
- Consider performance impact; document if complexity changes

## Closing Epics & Stories

1. Confirm all AC items checked in BR — split remaining into new story OR defer with explicit "Deferred" subsection if not
2. Verify and update high-level docs (`docs/architecture.md`, `README.md`, `docs/README.md`, `apps/*/README.md`) using descriptive feature names (NOT story/epic numbers)
3. Check for knowledge base and guideline updates — review "Technical Challenges & Solutions" section for reusable patterns; extract to `docs/knowledge-base/` or `docs/guides/` as appropriate
4. Run full test suite before closing — `npm run test:full`; for a specific feature: `vitest run src/features/<feature>/` or `vitest run src/modules/<module>/` — 100% pass rate
5. Update `Status: Completed` in BR + implementation docs
6. Update `Last Update` date in both
7. Ensure PR number is referenced in both docs
8. Documentation final review — verify template compliance, cross-linking correctness, technical accuracy, status/date field synchronization
9. Commit BR + implementation changes together

## Quality Gates (Before Merge/Close)

- Full tests passing (`npm run test:full`)
- Type check clean (`tsc --noEmit`)
- Lint clean (ESLint if configured)
- DESIGN.md tokens valid (`npx @google/design.md lint DESIGN.md`)
- Frontend-audit skill run (for frontend changes) — see `.github/skills/frontend-audit/SKILL.md`
- Backend-audit skill run (for backend changes) — see `.github/skills/backend-audit/SKILL.md`
- Docs updated (BR, implementation, design, architecture, API specs as needed)
- File headers updated for public surfaces
- All AC either complete or documented exception

## Cross-Doc Alignment Checklist

- BR ↔ implementation ↔ stories all cross-link
- Status & Last Update synchronized
- Templates followed (all required sections intact)
- AC list maps to stories or tests
- Architecture/design/API decisions recorded if changed

---

**See also:** `docs/guides/dev-flow-visualization.html` (pipeline diagram) • `frontend-pre-delivery-checklist.instructions.md` (UI gate) • `documentation-standards.instructions.md` (doc updates) • `testing-standards.instructions.md` (test requirements)
