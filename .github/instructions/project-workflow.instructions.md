---
description: "Use when implementing a story, closing an epic, preparing a commit, or running quality gates. Covers the full story-level development workflow, pre-implementation investigation, closing procedures, and checklists."
---

# Project Workflow

## Story-Level Development Workflow

Follow this sequence when implementing or updating a story:

1. **Review Requirements** — Open the story BR file and its epic BR README. Open corresponding implementation docs. Confirm Acceptance Criteria clarity; note ambiguous items in a "Questions / Clarifications" subsection.

1.5 **Design Thinking & User Flow** — Before planning any code, establish the user's mental model:

- **Read the research** — Open design docs, proposals, competitor analysis, domain research under `docs/` and `verification-artifacts/`. If the feature has a `docs/design.md`, read it. Don't design UI without understanding the domain context.
- **Map the user's flow step by step** — For each action the user takes, ask:
  - What do they see? (visual state)
  - What do they think? (interpretation)
  - What do they want to do next? (intent)
  - What does the interface tell them they CAN do? (WAGC — What Am I Gonna Click)
- **Establish the preview/reward boundary** — Identify which elements are preview/teaser surfaces (cards, list items) and which are detail/reward surfaces (modals, panels, expandable sections). Detail content must NOT appear on the preview surface — that breaks the reward loop. See `preview-detail-separation.instructions.md`.
- **Check source for every design decision** — If you propose adding an element to the UI, you must be able to answer "where did my data come from to design this layout?" If the answer is a future-state proposal, verify the change works with the CURRENT architecture, not just the proposed one. Incremental changes to an existing system must not pre-implement future-state designs.
- **Apply principles before polish** — Evaluate each UI addition against: WAGC (does this look clickable when it shouldn't?), content density (can the user parse this in 2 seconds?), clarity (is the meaning obvious without a tooltip?), cognitive load (does this add mental work or reduce it?).

2. **Plan Changes** — Read [`AGENTS.md`](../AGENTS.md) for agent behavior rules, structure conventions, and prohibitions. Identify impacted feature folder(s) under `apps/frontend/src/features/`. Check design doc (`apps/frontend/src/features/<feature>/docs/design.md`) and `docs/architecture.md` for conflicts. If adding public APIs/components/hooks, prepare file header summaries.
3. **Implement Code** — Create/update components, hooks, reducers, types within the feature folder. Maintain state rules (domain-prefixed action types, immutable updates, normalized collections). Keep scope tightly bound to story AC; defer extras into a new follow-up story.
4. **Tests (Create / Update)** — Add or adjust unit/component tests to cover happy path + at least one edge case from AC. Ensure new reducers/actions/selectors have isolated tests. Avoid brittle UI assertions (prefer role/text queries via RTL).
5. **Run Locally (If Needed)** — Start app: `npm run dev`. Start local backend (if API integration touched): `npm run start-backend`. Manual sanity check: exercise UI path for story; capture any discrepancies against AC.

**5.5 Visual Verification** — After all UI changes are implemented, visually validate against Storybook:

1. Start Storybook: `npm run storybook` — open the affected page story(ies) in the browser
2. Start dev server: `npm run dev` — open the same page in production
3. **Wait for both pages to fully load** — ensure loading spinners/placeholders have resolved before taking screenshots. If one page shows a loading state and the other shows data, this is a state mismatch — log it as a discrepancy and re-check after data resolves.
4. Take screenshots of both side-by-side
5. Compare: does the Storybook story match production appearance in layout, spacing, colors, and component structure?
6. If discrepancies exist, fix the story to match production OR fix the component to match the story (whichever is the source of truth)
7. Log any discrepancies in `verification-artifacts/` with a `review-findings-*` artifact

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
