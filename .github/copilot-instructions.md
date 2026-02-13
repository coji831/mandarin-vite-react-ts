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

**Frontend**: React + TypeScript via Vite; feature folders in `apps/frontend/src/features/`.
**State**: Context + reducers; slices: `lists`, `user`, `ui`; persisted via localStorage.
**Backend**: Express + Prisma in `apps/backend/`; deployed to Railway in production, runs locally on port 3001 for development.
**Data**: CSV/JSON in `public/data/`, loaded by `src/utils/csvLoader.ts`.
**Routing**: React Router; constants in `src/constants/paths.ts`.
**Authentication**: JWT with httpOnly cookies, bcrypt password hashing, refresh token rotation.

## 🔄 Workflows

Development: install → run dev (starts frontend + backend concurrently) → iterate.
Testing: `npm test` (Jest + RTL) for unit/component tests.
Deployment: Frontend deploys to Vercel; Backend deploys to Railway (via Procfile).
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
- **Add Technical Challenges & Solutions section**: Document any non-trivial problems encountered during implementation (debugging >1 hour, architectural decisions, test alignment issues, schema mismatches, error handling patterns). Include problem statement, root cause, solution with code examples, and lessons learned.
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

**High-Level Documentation Guidelines:**

- High-level docs (`docs/architecture.md`, `docs/README.md`, root `README.md`) should NOT reference specific story or epic numbers.
- Use descriptive feature names instead (e.g., "Gamification System" not "Story 15.3").
- Keep high-level docs focused on current system state, not implementation history.
- Story/epic references belong in BR and implementation docs only.

Epic creation checklist:

- Create BR README and implementation README using only the sections defined in their templates.
- Scaffold initial story files (BR + implementation) if known, matching template structure exactly.
- Link epic ↔ implementation ↔ stories bidirectionally.

Story creation checklist:

- Create BR story file and implementation story file using only the sections defined in their templates.
- Link back to epic BR + implementation README.

Header comments: add/update when new exported component/hook/service or public API surface changes (use File Summary Template).
Performance or architectural shifts: update `docs/architecture.md` + feature `design.md`.

**Technical Challenges Documentation:**

When completing story implementation, add a "Technical Challenges & Solutions" section to the implementation doc with:

- **Challenge title**: Descriptive name (e.g., "Race Condition in Streak Updates")
- **Problem**: What went wrong or what obstacle was encountered
- **Root Cause**: Why the problem occurred (schema mismatch, wrong assumptions, etc.)
- **Solution**: How it was resolved (include code examples if relevant)
- **Impact/Benefits**: What improved or what was learned
- **Alternatives Considered**: Other approaches evaluated (optional)

**When to document a challenge:**

- Debugging took >1 hour to resolve
- Test failures required significant refactoring
- Schema/API misalignment discovered
- Architectural pattern clarified through implementation
- Error handling strategy decided
- Performance issue identified and fixed

**Format example:**

```markdown
### Challenge 2: Test Schema Misalignment

**Problem:** Tests assumed QuizResult had correctCount/incorrectCount fields, but schema only has correct: Boolean.

**Root Cause:** Tests written before verifying Prisma schema.

**Solution:** Updated all test fixtures to use correct: Boolean field instead.

**Lesson:** Always verify database schema before writing service tests.
```

## 📚 Knowledge Base Update Protocol

**When to Extract Lessons to Knowledge Base:**

Update KB after resolving non-trivial technical struggles (3+ hours debugging, infrastructure integration complexity, architectural patterns discovered, or repeated questions across stories).

**Triggers for KB Updates:**

- Story took 2x+ longer than estimated due to infrastructure/integration complexity
- Discovered reusable architectural pattern not documented anywhere
- Solved cross-cutting technical issue (CORS, cookies, proxy, connection pooling, React lifecycle)
- Found non-obvious configuration requirement (environment setup, tooling quirks)
- Implemented security pattern (auth flows, input validation, rate limiting)
- Performance optimization with measurable impact (>20% improvement)

**Content Distribution: Guides vs Knowledge Base:**

- **Guides** (`docs/guides/`): Project-specific, action-focused, step-by-step setup/configuration
  - Example: "How to configure Vite proxy for cookie forwarding in THIS project"
  - Format: Numbered steps, code snippets, file paths, commands
  - Audience: Contributors setting up or maintaining THIS codebase

- **Knowledge Base** (`docs/knowledge-base/`): Transferable concepts, deep dives, architectural patterns
  - Example: "Why dev proxies don't forward cookies by default + HTTP header mechanics"
  - Format: Conceptual explanations, diagrams, tradeoff analysis, alternative approaches
  - Audience: Engineers learning concepts applicable to ANY similar project

**Extraction Workflow (After Completing Story):**

1. **Identify Reusable Content** — Review implementation doc "Technical Challenges & Solutions" section for patterns applicable beyond this story.

2. **Determine Target Location:**
   - Quick reference / project setup → Update relevant guide in `docs/guides/`
   - Deep technical concept / architectural pattern → Update/create KB article in `docs/knowledge-base/`
   - Both? Add quick reference to guide with "Learn more: [KB Article]" link

3. **Extract & Organize:**
   - Remove verbose postmortem/lesson sections from story implementation doc
   - Distribute actionable patterns to guides (concise, directive format)
   - Distribute conceptual explanations to KB (detailed, educational format)
   - Keep story implementation doc focused on WHAT was built, not WHY/HOW in detail

4. **Cross-Link:**
   - Story implementation doc: Add "Related Documentation" or "Technical Guidance" section with links to updated guides/KB
   - Guide: Add "Learn more" links to KB articles for deeper understanding
   - KB README: Update index with new/enhanced articles

5. **Maintain Template Compliance:**
   - After extraction, verify story/epic docs still match templates exactly
   - Remove all non-template sections (postmortems, root cause analysis, etc.)
   - Keep only template-defined sections

**KB Article Structure Guidelines:**

- Start with one-sentence summary (what concept, why it matters)
- Include "When to Use" and "When NOT to Use" sections
- Provide concrete code examples (before/after, good/bad)
- Explain tradeoffs and alternatives considered
- Link to related KB articles and external authoritative sources

**Example Extraction:**

- Story 13.3 encountered cookie forwarding issues (5+ hours debugging)
- **Guide Update**: [Vite Configuration Guide](docs/guides/vite-configuration-guide.md) — Added "Cookie-based auth through dev proxy" section with exact config
- **KB Update**: [Frontend Development Server](docs/knowledge-base/frontend-development-server.md) — Added deep dive on proxy mechanics, why headers aren't forwarded by default, security implications
- **Story Doc**: Removed postmortem, added links to both guide and KB in "Technical Challenges" section

## 🛠️ Code Change Checklist

- Refer: `code-conventions.md` + `solid-principles.md`.
- **Update file-level comments**: When modifying a file, update the header comment to reflect new functionality, changed exports, or updated purpose (use File Summary Template).
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
2. **Verify and update high-level docs** (`docs/architecture.md`, `README.md`, `docs/README.md`, `apps/*/README.md`):
   - Add new features/capabilities using descriptive names (NOT story/epic numbers).
   - Update system overview to reflect current state.
   - Ensure feature descriptions are accurate and complete.
3. **Check for knowledge base and guideline updates**:
   - Review "Technical Challenges & Solutions" section in implementation doc.
   - Extract reusable patterns to `docs/knowledge-base/` (concepts, architectural patterns, deep dives).
   - Update project guides in `docs/guides/` (setup steps, configuration, troubleshooting).
   - Update `docs/guides/code-conventions.md` if new patterns emerged (naming, error handling, testing).
   - Add cross-links between story doc, guides, and KB articles.
   - See "Knowledge Base Update Protocol" section for detailed extraction workflow.
4. **Run all feature tests before closing**:
   - Execute full test suite for the affected feature: `npm test -- --run src/features/<feature>/`
   - Verify 100% pass rate (no failures, no skipped tests except explicitly documented).
   - If tests fail, fix issues before proceeding with closure.
   - Document final test count and pass rate in implementation doc.
   - For epic closure, run tests for ALL features touched by epic stories.
5. Update `Status: Completed` in BR + implementation docs.
6. Update `Last Update` date in both.
7. Ensure PR number is referenced in both docs.
8. Commit BR + implementation changes together.

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
