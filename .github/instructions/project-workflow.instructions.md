---
description: "Use when implementing a story, closing an epic, preparing a commit, or running quality gates. Covers the full story-level development workflow, pre-implementation investigation, closing procedures, and checklists."
---

# Project Workflow

## Story-Level Development Workflow

Follow this sequence when implementing or updating a story:

1. **Review Requirements** — Open the story BR file and its epic BR README. Open corresponding implementation docs. Confirm Acceptance Criteria clarity; note ambiguous items in a "Questions / Clarifications" subsection.
2. **Plan Changes** — Read [`AGENTS.md`](../AGENTS.md) for agent behavior rules, structure conventions, and prohibitions. Identify impacted feature folder(s) under `apps/frontend/src/features/`. Check design doc (`apps/frontend/src/features/<feature>/docs/design.md`) and `docs/architecture.md` for conflicts. If adding public APIs/components/hooks, prepare file header summaries.
3. **Implement Code** — Create/update components, hooks, reducers, types within the feature folder. Maintain state rules (domain-prefixed action types, immutable updates, normalized collections). Keep scope tightly bound to story AC; defer extras into a new follow-up story.
4. **Tests (Create / Update)** — Add or adjust unit/component tests to cover happy path + at least one edge case from AC. Ensure new reducers/actions/selectors have isolated tests. Avoid brittle UI assertions (prefer role/text queries via RTL).
5. **Run Locally (If Needed)** — Start app: `npm run dev`. Start local backend (if API integration touched): `npm run start-backend`. Manual sanity check: exercise UI path for story; capture any discrepancies against AC.
6. **Update Documentation** — Developer records decisions, data shape changes, and performance notes in story implementation doc. Add "Technical Challenges & Solutions" section for non-trivial problems. Update Last Update date fields. Documentation changes must be reviewed before commit.
7. **Pre-Commit Gate** — Run tests: `npm test` (or targeted pattern) → must pass. Type check & lint if configured. Verify Quality Gates & Cross-Doc Alignment checklists. Documentation changes must be validated by a reviewer for template compliance, cross-linking, AC clarity, technical accuracy, and status consistency.
8. **Commit** — Use Conventional Commit format: `<type>(story-<epic>-<story>): <summary>`. Include scope referencing story. Ensure BR + implementation doc updates are in the same commit for traceability.

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
4. Run all feature tests before closing — `npm test -- --run src/features/<feature>/` — 100% pass rate
5. Update `Status: Completed` in BR + implementation docs
6. Update `Last Update` date in both
7. Ensure PR number is referenced in both docs
8. Documentation final review — verify template compliance, cross-linking correctness, technical accuracy, status/date field synchronization
9. Commit BR + implementation changes together

## Quality Gates (Before Merge/Close)

- Tests passing (`npm test`)
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
