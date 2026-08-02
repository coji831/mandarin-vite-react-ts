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
   5. **Validation** — Input validation at controller layer. Error responses in `{ error, code }` format per `backend-error-messages.instructions.md`.
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
7. **Run Locally (If Needed)** — Start app: `npm run dev`. Start local backend (if API integration touched): `npm run dev:backend`. Manual sanity check: exercise UI path for story; capture any discrepancies against AC.

**5.5 Visual Verification** — After all UI changes are implemented, visually validate against Storybook:

1. Start Storybook: `npm run storybook --workspace=@mandarin/frontend` — open the affected page story(ies) in the browser
2. Start dev server: `npm run dev` — open the same page in production
3. **Wait for both pages to fully load** — ensure loading spinners/placeholders have resolved before taking screenshots. If one page shows a loading state and the other shows data, this is a state mismatch — log it as a discrepancy and re-check after data resolves.
4. Take screenshots of both side-by-side
5. Compare: does the Storybook story match production appearance in layout, spacing, colors, and component structure?
6. If discrepancies exist, fix the story to match production OR fix the component to match the story (whichever is the source of truth)
7. Log any discrepancies in `verification-artifacts/` with a `review-findings-*` artifact

⚠️ **When to skip visual verification**: Pure backend changes with no UI surface. Never skip for UI changes.
🔄 **When to run backend pipeline only**: Database-only, API-only, or external-service-only changes with no UI surface — skip steps 4-5.5 and jump to step 6 (Run Locally) to verify backend endpoints.

**Story test validation**: After visual verification, run story tests to catch rendering regressions:

```
npm run test-storybook --workspace=@mandarin/frontend
```

This runs Chromatic/vitest-integration tests on all stories. Fix any failures before committing.

7. **Update Documentation** — Developer records decisions, data shape changes, and performance notes in story implementation doc. Add "Technical Challenges & Solutions" section for non-trivial problems. Update Last Update date fields. Documentation changes must be reviewed before commit.

   **Per-story struggle extraction** — When a struggle resolves (>1h debug, schema/API misalignment, pattern clarified, perf issue), record it in the story impl "Technical Challenges & Solutions" **same-day** — do not defer to epic close. Reusable patterns (>3h) extract to `docs/knowledge-base/` or `docs/guides/` immediately and cross-link.

8. **Pre-Commit Gate** — Run `npm run format` → auto-formats code with Prettier. Run `npm run build` → must pass (runs `tsc -b` type-check across all workspaces + Vite bundle). Run `npm run test:full` → must pass (full suite; `npm test` runs changed-scope only). Run `npm run test-storybook --workspace=@mandarin/frontend` → must pass if stories were modified. Run `npm run lint` → must have **0 errors** (warnings are acceptable during incremental migration). Fix any NEW errors you introduced. Do not add new `any` annotations — use proper types. Verify Quality Gates & Cross-Doc Alignment checklists. Documentation changes must be validated by a reviewer for template compliance, cross-linking, AC clarity, technical accuracy, and status consistency.

   **Git State Pre-Flight (before `git add`)**
   - Verify branch/HEAD/divergence with REAL commands — never reconstruct state from `.git/` file inspection:
     - `git status --short`
     - `git log --oneline -5`
     - `git rev-list --count HEAD@{upstream}..HEAD` and `..origin/<branch>` to check ahead/behind
   - Treat `git status` as the only truth of "what is my delta". An uncommitted 267-file delta is NOT "33 commits" — never plan squash/reset work on a reconstructed model.
   - **Commit-scope check**: run `git diff --cached --stat` and confirm the staged set is story-scoped only (story code + tests + BR + impl). If unrelated files are staged (repo-wide reformat, stray data dumps), `git restore --staged <path>` them out. Never mix a repo-wide reformat or unrelated dump into a story commit.
   - Never run `git reset --soft` to "rebuild" state without first confirming `git log` + `git reflog`. Prefer `git checkout -- <path>` for surgical unstage.

   **Dependency single-version guard**
   - When `package.json`/`package-lock.json` changed, verify a single version with `npm ls <pkg>` (e.g. `npm ls @types/react` must show exactly one).
   - Prefer root `devDependencies` for @types/peer packages; treat `overrides` as a blunt last resort ONLY when peer requesters cannot agree.
   - **Never hand-edit `package-lock.json`.** If `npm install` reports "up to date" after a dependency change, delete the stale nested `node_modules/<pkg>` and re-install instead.

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

## Windows / PowerShell 5.1

- ❌ No `&&` chaining in PowerShell 5.1 — it is not supported. Use `;` (e.g. `npm run build; npm run test:full`).
- ⚠️ PowerShell console mangles UTF-8 Chinese glyphs in `git diff` output. This is display-only —
  NOT file corruption. Verify by opening the file in the editor or browser before assuming damage.
- ✅ Prefer the test runner tool over raw terminal for vitest commands (cleaner output, avoids PS quoting).

## Code Change Checklist

- Read [`AGENTS.md`](../AGENTS.md) for agent behavior rules, structure conventions, and prohibitions
- Refer to `docs/guides/conventions/frontend.md` (frontend) or `docs/guides/conventions/backend.md` (backend) + `docs/knowledge-base/practices/solid-principles.md`
- Update file-level header comments when public API surface changes (use File Summary Template)
- Update design docs if feature logic or architecture changes
- Update `docs/architecture.md` if cross-cutting changes
- Update API docs if endpoints/contracts change
- Update related BR + implementation docs for status, rationale, new decisions
- Verify docs match the implemented code (Doc Truth-Check per `documentation-standards.instructions.md`) before commit
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
8. Documentation final review — verify template compliance, cross-linking correctness, technical accuracy, status/date field synchronization, and doc↔code truth-check (no stale endpoints, renamed components, or removed sections surviving)
9. Commit BR + implementation changes together

## Quality Gates (Canonical Source of Truth)

This section is the **single source of truth** for all quality gates in the monorepo. Gates follow a **two-tier model**: Tier 1 runs on every code change; Tier 2 adds heavier gates at merge / story-complete / epic-close.

### Anti-Drift Rule

A gate may appear in **exactly one place** in the canonical table below. Any other doc that lists gates must either **(a)** point to this table, or **(b)** show the exact command with `--workspace` flags. **No doc may define its own gate set.**

### Tier 1 — Per-Change / Pre-Commit (fast, run on every code commit)

| #   | Gate                        | Exact command                                     | Scope            |
| --- | --------------------------- | ------------------------------------------------- | ---------------- |
| 1   | Format (soft, non-blocking) | `npm run format`                                  | both             |
| 2   | Lint                        | `npm run lint` (0 errors)                         | both             |
| 3   | CSS lint                    | `npm run lint:css --workspace=@mandarin/frontend` | frontend changes |
| 4   | Type-check + build          | `npm run build`                                   | both             |
| 5   | Tests (changed scope)       | `npm test`                                        | both             |

### Tier 2 — Pre-Merge / Story-Complete / Epic-Close (Tier 1 plus)

| #   | Gate                               | Exact command                                                                                                                                                                                                                                                                                                    | Scope                             |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 6   | Full tests (NEVER `npm test`)      | `npm run test:full`                                                                                                                                                                                                                                                                                              | both                              |
| 7   | Story tests                        | `npm run test-storybook --workspace=@mandarin/frontend; npm run check:registry-stories`                                                                                                                                                                                                                          | stories changed / always at merge |
| 8   | Design lint (spec validity)        | `npx @google/design.md lint DESIGN.md`                                                                                                                                                                                                                                                                           | DESIGN.md                         |
| 9   | Design audit (code compliance)     | `npm run design-audit`                                                                                                                                                                                                                                                                                           | frontend changes                  |
| 10  | Backend type-check (full)          | `npm run typecheck --workspace=@mandarin/backend`                                                                                                                                                                                                                                                                | backend changes                   |
| 11  | Frontend-audit skill               | per `.github/skills/frontend-audit/SKILL.md`                                                                                                                                                                                                                                                                     | frontend changes                  |
| 12  | Backend-audit skill                | per `.github/skills/backend-audit/SKILL.md`                                                                                                                                                                                                                                                                      | backend changes                   |
| 13  | Docs + pre-delivery checklist + AC | BR/impl/design updated + `.github/instructions/frontend-pre-delivery-checklist.instructions.md` + all AC complete + doc↔code truth-check (endpoints via ROUTE_PATTERNS, names via src/, data source, links, dates) + Technical Challenges present where required + per-story struggle extraction done — blocking | —                                 |

> **Known-failures triage (gate 6)** — At every `test:full`/type-check failure, match against `docs/guides/testing/known-failures.md` FIRST; re-triaging a known failure from scratch is prohibited — update its last-verified date + one-line confirm instead. A new failure opens a new entry; do not auto-fix unrelated failures inside a story. The gate command stays `npm run test:full` — this adds triage discipline only, no new gate.

### Key Decisions

- **`npm run build` IS the type-check gate**: frontend `tsc -b` covers the whole `src` graph incl. `src/test-utils.tsx` (the graph that catches `@types/react`-class breakage); backend build runs `tsc -p tsconfig.build.json`. Frontend has no separate `typecheck` script by design.
- **`npm test` = `vitest run --changed`** (can pass with 0 tests) — it is a Tier-1 changed-scope check only; `test:full` is the real full-suite gate.
- **Design gates are TWO complementary tools**: `@google/design.md lint` validates the DESIGN.md token **SPEC**; `npm run design-audit` (`tools/design-audit.mjs`) scans SOURCE CODE for token compliance. Both are gates; neither replaces the other.
- **`format` is soft** (no `format:check` script exists; prettier drift breaks nothing). Coverage is NOT a gate (Testing-Trophy minimums in `testing-standards.instructions.md` are the enforcement).
- **Storybook tests** run via the `@storybook/addon-vitest` project; frontend `test:full` is scoped `--project='!storybook'` so the browser storybook project only runs via `test-storybook`.
- **Known-failures triage** — At every `test:full`/type-check failure, match against `docs/guides/testing/known-failures.md` FIRST; re-triaging a known failure from scratch is prohibited — update its last-verified date + one-line confirm instead. New failures open a new entry; do not auto-fix unrelated failures inside a story.

## Cross-Doc Alignment Checklist

- BR ↔ implementation ↔ stories all cross-link
- Status & Last Update synchronized
- Templates followed (all required sections intact)
- AC list maps to stories or tests
- Architecture/design/API decisions recorded if changed

---

**See also:** `docs/guides/dev-flow-visualization.html` (pipeline diagram) • `frontend-pre-delivery-checklist.instructions.md` (UI gate) • `documentation-standards.instructions.md` (doc updates) • `testing-standards.instructions.md` (test requirements)
