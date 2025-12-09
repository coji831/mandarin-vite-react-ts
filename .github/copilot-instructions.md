# Copilot Instructions for AI Coding Agents

Operational playbook for AI agents contributing to `mandarin-vite-react-ts`. Follow these rules to stay aligned, produce high‑quality changes, and keep documentation in sync.

## ⚡ TL;DR Quick Start

Install: `npm install`
Run dev: `npm run dev` (port 5173)
Run local backend: `npm run start-backend` (port 3001)
Run tests: `npm test`
Epic BR: use `docs/templates/epic-business-requirements-template.md`
Story BR: use `docs/templates/story-business-requirements-template.md`
Epic Implementation: `docs/templates/epic-implementation-template.md`
Story Implementation: `docs/templates/story-implementation-template.md`
Code change: follow `docs/guides/code-conventions.md` + `docs/guides/solid-principles.md`
Close epic/story: verify all AC done → update Status & Last Update in BR + implementation → check all AC boxes → commit together.

## 📚 Table of Contents

1. Architecture Overview
2. Workflows
3. Templates Index
4. Naming & Structure
5. State Management Rules
6. Testing Rules
7. Documentation Standards
8. Code Change Checklist
9. Git & Branching
10. Closing Epics & Stories
11. Quality Gates
12. Cross‑Doc Alignment Checklist
13. Automation Protocol
14. Resources

## 🏗️ Architecture Overview

**Frontend**: React + TypeScript via Vite; feature folders in `src/features/`.
**State**: Context + reducers; slices: `lists`, `user`, `ui`; persisted via localStorage.
**Backend**: Serverless functions in `api/` (e.g., TTS) + optional Express in `local-backend/`.
**Data**: CSV/JSON in `public/data/`, loaded by `src/utils/csvLoader.ts`.
**Routing**: React Router; constants in `src/constants/paths.ts`.

## 🔄 Workflows

Development: install → run dev → run local backend (optional) → iterate.
Testing: `npm test` (Jest + RTL) for unit/component tests.
Deployment: use `vercel` with `vercel.json` config.
Data Update: modify CSV under `public/data/vocabulary/`; parse via `csvLoader.ts`.

### 🧪 Story-Level Development Workflow

Follow this sequence whenever implementing or updating a story (smallest deliverable linked to an epic):

1. Review Requirements

- Open the story BR file (`docs/business-requirements/epic-<num>-<slug>/story-<epic>.<story>-*.md`) and its epic BR `README.md`.
- Open corresponding implementation docs (`docs/issue-implementation/epic-<num>-<slug>/story-<epic>-<story>-*.md` + epic implementation `README.md`).
- Confirm Acceptance Criteria (AC) clarity; note any ambiguous items in a "Questions / Clarifications" subsection (add if missing).

2. Plan Changes

- Identify impacted feature folder(s) under `src/features/`.
- Check design doc (`src/features/<feature>/docs/design.md`) and `docs/architecture.md` for conflicts.
- If adding public APIs/components/hooks, prepare file header summaries (template: `docs/templates/file-summary-template.md`).

3. Implement Code

- Create/update components, hooks, reducers, types within the feature folder.
- Maintain state rules (domain-prefixed action types, immutable updates, normalized collections).
- Keep scope tightly bound to story AC; defer extras into a new follow-up story.

4. Tests (Create / Update)

- Add or adjust unit/component tests to cover happy path + at least one edge case from AC.
- Ensure new reducers/actions/selectors have isolated tests.
- Avoid brittle UI assertions (prefer role/text queries via RTL).

5. Run Locally (If Needed)

- Start app: `npm run dev`.
- Start local backend (if API integration touched): `npm run start-backend`.
- Manual sanity check: exercise UI path for story; capture any discrepancies against AC.

6. Update Documentation

- Story BR: mark progressed AC (leave unchecked until fully validated).
- Story implementation doc: record decisions, data shape changes, performance notes.
- Epic docs: only update if cross-cutting decisions or shared architecture changed.
- Update Last Update date fields accordingly.

7. Pre-Commit Gate

- Run tests: `npm test` (or targeted pattern) → must pass.
- Type check & lint if configured (`tsc --noEmit`, ESLint task) – ensure clean.
- Verify Quality Gates & Cross‑Doc Alignment checklists.
- If instructed to "wait before commit": stage changes but defer commit; add a note in the story implementation doc explaining the hold reason.

8. Commit (When Allowed)

- Use Conventional Commit format: `<type>(story-<epic>-<story>): <summary>`.
- Include scope referencing story (e.g., `feat(story-11-2): add progress sync reducer`).
- Ensure BR + implementation doc updates are in the same commit for traceability.

Concise Checklist:
`Review → Plan → Implement → Test → Run → Docs → Gates → Commit`

Edge Cases to Watch:

- Partial AC completion: split remaining work into new story file.
- Data model shifts: update unified model docs & API specs.
- Performance regressions: add note + follow-up optimization story.
- Feature flag introduction: document in epic BR + implementation README.

If any step is blocked (missing requirements, unclear AC, external dependency): pause implementation and record the blocker under a "Pending / Blockers" subsection in both BR and implementation story docs.

## 📦 Templates Index

Business Requirements Format Guide: `docs/guides/business-requirements-format-guide.md`
Epic BR Template: `docs/templates/epic-business-requirements-template.md`
Story BR Template: `docs/templates/story-business-requirements-template.md`
Epic Implementation Template: `docs/templates/epic-implementation-template.md`
Story Implementation Template: `docs/templates/story-implementation-template.md`
Commit Message Template: `docs/templates/commit-message-template.md`
File Header / Summary Template: `docs/templates/file-summary-template.md`

## 🏷️ Naming & Structure

Epic BR: `docs/business-requirements/epic-<num>-<slug>/README.md`
Story BR: `docs/business-requirements/epic-<num>-<slug>/story-<epic>-<story>-<short>.md`
Epic Implementation: `docs/issue-implementation/epic-<num>-<slug>/README.md`
Story Implementation: `docs/issue-implementation/epic-<num>-<slug>/story-<epic>-<story>-<short>.md`
Feature code: `src/features/<feature>/`
Reducer files: `src/features/<feature>/reducers/<domain>Reducer.ts`
Design docs: `src/features/<feature>/docs/design.md`
Architecture overview: `docs/architecture.md`

## 🧠 State Management Rules

Reducers: `{domain}Reducer.ts`; action types SCREAMING_SNAKE_CASE with domain prefix.
Actions: exposed via `use<name>Actions()` hook; verb-based camelCase.
Selectors: always `use<name>State(s => s.slice?.value ?? fallback)`; never select entire root state.
Immutability: use spreads; no direct mutation.
Normalized data: maintain `itemsById` + `itemIds` pairs.
Types: explicit definitions in `src/feature/<feature>/types/`.

## 🧪 Testing Rules

Reducers: isolated action tests.
Hooks: verify memoization & stable references.
Components: context mocking for state/actions.
Stories/Epics: AC reflected in tests where feasible.
Add tests for new logic before declaring story complete.

## 📝 Documentation Standards

**Strict Template Compliance:**

- All documentation (BR, implementation, etc.) must strictly match the structure and sections of the corresponding template in `docs/templates/`.
- Do NOT add extra, duplicate, or non-template sections (such as "Status") unless they are explicitly present in the template file.
- When updating or creating docs, always cross-check with the latest template to ensure full compliance.

Epic creation checklist:

- Create BR README and implementation README using only the sections defined in their templates.
- Scaffold initial story files (BR + implementation) if known, matching template structure exactly.
- Link epic ↔ implementation ↔ stories bidirectionally.

Story creation checklist:

- Create BR story file and implementation story file using only the sections defined in their templates.
- Link back to epic BR + implementation README.

Header comments: add/update when new exported component/hook/service or public API surface changes (use File Summary Template).
Performance or architectural shifts: update `docs/architecture.md` + feature `design.md`.

## 🛠️ Code Change Checklist

- Refer: `code-conventions.md` + `solid-principles.md`.
- Update design docs if feature logic or architecture changes.
- Update architecture (`docs/architecture.md`) if cross‑cutting changes.
- Update API specs (`api/api-spec.md`, `local-backend/docs/api-spec.md`) if endpoints/contracts change.
- Add/update file header summary if exported surface changed.
- Update related epic/story BR + implementation docs for status, rationale, new decisions.
- Add/update tests (unit/integration) to cover new paths.
- Consider performance impact; document if complexity changes.

## 🌿 Git & Branching

Branch naming: `epic-<num>-<slug>` primary; optional `feature/<short>` or `fix/<short>`.
Conventional Commits: `<type>(<scope>): <description>`; scopes: `epic-11`, `story-11-2`, `component`, `hook`, `api`, `docs`.
Always consult: `docs/guides/git-convention.md` + `docs/templates/commit-message-template.md`.
Feature flags: document flag names & purpose in epic BR + implementation README when used.

## ✅ Closing Epics & Stories

1. Confirm all AC items checked in BR. If not:
   - Split remaining into new story OR
   - Defer with explicit "Deferred" subsection.
2. Update `Status: Completed` in BR + implementation docs.
3. Update `Last Update` date in both.
4. Ensure PR number is referenced in both docs.
5. Commit BR + implementation changes together.

## 🧷 Quality Gates (Before Merge / Close)

Tests passing (`npm test`).
Type check clean (`tsc --noEmit`).
Lint clean (ESLint if configured).
Docs updated (BR, implementation, design, architecture, API specs as needed).
File headers updated for public surfaces.
All AC either complete or documented exception.

## 🔗 Cross‑Doc Alignment Checklist

- BR ↔ implementation ↔ stories all cross-link.
- Status & Last Update synchronized.
- Templates followed (all required sections intact).
- AC list maps to stories or tests.
- Architecture/design/API decisions recorded if changed.

## 🤖 Automation Protocol

### Trigger Phrase

When you see "refer #file:automation" or "refer the automation folder" in a user request, activate strict automation protocol mode.

### Mandatory Behavior

1. Read story/epic BR and implementation docs first (in full).
2. Follow the Story-Level Development Workflow section above sequentially.
3. Use templates from `docs/templates/` exactly—preserve heading names and order verbatim.
4. When creating docs: populate placeholders with realistic content; do not remove or rearrange headings.
5. When producing code: enforce `docs/guides/code-conventions.md` + `docs/guides/solid-principles.md`; include inline comments referencing doc sections.
6. When producing git artifacts: follow `docs/guides/git-convention.md` for branch names, commit message format (Conventional Commits), and PR titles/descriptions.
7. For ambiguous requirements, missing templates, or critical missing files: STOP and return a short list of missing items plus 2 proposed options.
8. Do not run git commands, write files, or push to repository unless explicitly instructed after review.

### Output Contract (for "start implement workflow" requests)

Produce artifacts in this order:

1. Short action summary (bulleted).
2. Implementation plan (list of target files + responsibilities).
3. Files to create/update: unified git diff patch preferred; if not possible, provide per-file full contents with absolute path headers.
4. Tests (file paths + full test contents).
5. Branch name, Conventional Commit message, PR title, and PR description.
6. Exact Status strings to insert into both business and implementation README files (absolute paths).
7. Final checklist of ambiguous decisions or blockers (if any).

### Structured AI Prompt Format

Use this format for all AI interactions (detailed examples in `docs/automation/structured-ai-prompts.md`):

```
[TASK]: <task>
[CONTEXT]: <file or epic/story>
[PARAMETERS]: <inputs>
[OUTPUT]: <format>
[CONSTRAINTS]: <rules>
```

## 📁 Key Files & Directories (Quick Index)

`src/features/<feature>/` – core feature
`public/data/vocabulary/` – CSV vocabulary
`api/` – serverless functions
`local-backend/` – Express dev server
`src/utils/csvLoader.ts` – data loader
`docs/architecture.md` – system overview
`**/design.md` – feature design

## 🛠️ Resources

Code Conventions: `docs/guides/code-conventions.md`
SOLID Principles: `docs/guides/solid-principles.md`
Git Workflow: `docs/guides/git-convention.md`
Business Requirements Format: `docs/guides/business-requirements-format-guide.md`
Automation Protocols: `docs/automation/structured-ai-prompts.md`
Architecture: `docs/architecture.md`

---

If any section is unclear or missing—ask for clarification before proceeding.
