---
description: "Use when writing or updating business requirements, implementation docs, or knowledge base articles. Covers template compliance, high-level guidelines, technical challenges documentation, and KB extraction."
applyTo: "docs/**/*.md, apps/frontend/src/features/**/docs/**/*.md, apps/backend/src/modules/**/docs/**/*.md, apps/backend/docs/**/*.md"
---

# Documentation Standards

## How To Create/Update Docs (Numbered Steps)

### Creating a New Epic

1. Copy `docs/templates/epic-business-requirements-template.md` → `docs/business-requirements/epic-<num>-<slug>/README.md`
2. Copy `docs/templates/epic-implementation-template.md` → `docs/issue-implementation/epic-<num>-<slug>/README.md`
3. Fill all sections following the template structure exactly — no extra sections
4. Link epic BR ↔ epic Implementation ↔ story files bidirectionally
5. If stories are known, scaffold story files using story templates

### Creating a New Story

1. Copy `docs/templates/story-business-requirements-template.md` → `docs/business-requirements/epic-<num>-<slug>/story-<epic>-<story>-<short>.md`
2. Copy `docs/templates/story-implementation-template.md` → `docs/issue-implementation/epic-<num>-<slug>/story-<epic>-<story>-<short>.md`
3. Fill all sections — link back to epic BR + implementation README
4. During implementation, add "Technical Challenges & Solutions" for non-trivial problems (debugging >1h, schema issues, architectural decisions)

### Story Numbering Convention

1. **Stories are 1-indexed.** Always start at 1 (21.1, 21.2, 21.3), never 0 (21.0).
2. A "prerequisite" or "data migration" story is still a real story — give it the first number (21.1), not 21.0.
3. If a new story needs to be inserted before existing ones, **renumber all subsequent stories** to maintain sequential order. Do not leave gaps or use .0/.5 suffixes.
4. Story file names use zero-padded single digits: `story-21-1-data-lifecycle.md`, `story-21-2-passage-generation.md`.
5. Epic-level story tables must use the same 1-indexed numbering.

### Updating Existing Docs

1. Open the template at `docs/templates/` to cross-check current structure
2. Update content — do NOT add sections not in the template
3. Update "Last Updated" date
4. For high-level docs (`docs/architecture.md`, `README.md`): use descriptive feature names, never story/epic numbers

### Extracting Knowledge Base Articles

After resolving struggles >3h or discovering reusable patterns:

1. Create file in `docs/knowledge-base/` (actionable patterns → `docs/guides/`)
2. Use format: Problem → Root Cause → Solution → Impact → Alternatives
3. Cross-link between story docs, guides, and KB articles
4. Remove verbose postmortems from story implementation docs after extraction
5. Verify story/epic docs still match templates exactly after removal

## Strict Template Compliance

- All documentation must strictly match the structure and sections of the corresponding template
- Do NOT add extra, duplicate, or non-template sections
- When updating, always cross-check with the latest template

## Doc Truth-Check (Verify Docs Against Code)

Before writing or updating any doc, verify every claim against the actual codebase. A doc that names things that don't exist (or keeps stale names for things that changed) is worse than no doc.

1. **Endpoints** — Before writing any endpoint, find the matching `ROUTE_PATTERNS.*` in `packages/shared-constants/src/index.js` and copy the path + verb exactly.
   - ✅ DO copy the path and verb verbatim from `ROUTE_PATTERNS`.
   - ❌ DON'T document an endpoint that is not in `ROUTE_PATTERNS` — it does not exist; flag it instead.
   - ❌ DON'T name a module (learning/gamification/vocabulary) unless a folder exists under `apps/backend/src/modules/`.
2. **Names & counts** — Before writing a feature/module/component/function name or count, list `apps/backend/src/modules/` and `apps/frontend/src/features/` and copy the names verbatim.
   - ✅ DO re-derive counts by listing the directories.
   - ❌ DON'T copy names or counts from an older doc.
3. **Data source** — When a doc claims static JSON vs Postgres/API, grep the backing service/repository for `prisma` vs `content/` / `fs.readFile` and write only what the code shows.
   - ✅ DO match the claim to the actual backing code.
   - ❌ DON'T guess the data source.
4. **Links** — Every relative markdown link must resolve.
   - ✅ DO verify each target exists before commit.
   - ❌ DON'T commit a doc with a broken relative link.
5. **Dates & tooling** — Update `Last Updated` / `Last Update` in the same commit as the edit; never name a tool/framework (e.g. Jest, Storyshots) without confirming it in the relevant `package.json` (this repo is Vitest-only).
   - ✅ DO bump the date in the same commit as the content edit.
   - ❌ DON'T name a test runner/framework not present in `package.json`.
6. **High-level claims** — Re-derive README / `docs/architecture.md` claims (counts, commands, state pattern): list dirs, diff `package.json` scripts, confirm Context/reducer vs Zustand in the actual feature.
   - ✅ DO re-derive claims from the code.
   - ❌ DON'T trust an older doc for current state-pattern or script claims.
7. **Rename hygiene** — When code renames a feature folder/component/method/endpoint, the SAME commit must update every doc referencing the old name.
   - ✅ DO grep the old name across `docs/` + `apps/**/docs/` and fix all hits.
   - ❌ DON'T leave stale references to renamed items in any doc.

---

**See also:** `project-workflow.instructions.md` (when doc updates happen in the pipeline) • `docs/templates/` (all templates) • `docs/knowledge-base/` (existing articles)

## Technical Challenges & Solutions Format

- **Challenge title**: Descriptive name (e.g., "Race Condition in Streak Updates")
- **Problem**: What went wrong or what obstacle was encountered
- **Root Cause**: Why the problem occurred (schema mismatch, wrong assumptions, etc.)
- **Solution**: How it was resolved (include code examples if relevant)
- **Impact/Benefits**: What improved or what was learned
- **Alternatives Considered**: Other approaches evaluated (optional)

Document challenges when:

- Debugging took >1 hour to resolve
- Test failures required significant refactoring
- Schema/API misalignment discovered
- Architectural pattern clarified through implementation
- Error handling strategy decided
- Performance issue identified and fixed

## Knowledge Base Extraction

After resolving non-trivial struggles (3+ hours debugging, infrastructure complexity, reusable patterns):

- **Actionable patterns** → `docs/guides/` — concise, directive format with numbered steps
- **Conceptual deep dives** → `docs/knowledge-base/` — detailed, educational format with tradeoff analysis
- **Cross-link** between story docs, guides, and KB articles
- **Remove verbose postmortems** from story implementation docs after extraction; keep doc focused on WHAT was built, not WHY/HOW in detail
- **Maintain template compliance** — after extraction, verify story/epic docs still match templates exactly
