---
description: "Use when writing or updating business requirements, implementation docs, or knowledge base articles. Covers template compliance, high-level guidelines, technical challenges documentation, and KB extraction."
applyTo: "docs/**/*.md"
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

---

**See also:** `project-workflow.instructions.md` (when doc updates happen in the pipeline) • `docs/templates/` (all templates) • `docs/knowledge-base/` (existing articles)

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
