---
description: "Use when writing or updating business requirements, implementation docs, or knowledge base articles. Covers template compliance, high-level guidelines, technical challenges documentation, and KB extraction."
applyTo: "docs/**/*.md"
---

# Documentation Standards

## Strict Template Compliance

- All documentation (BR, implementation, etc.) must strictly match the structure and sections of the corresponding template in `docs/templates/`
- Do NOT add extra, duplicate, or non-template sections (such as "Status") unless they are explicitly present in the template file
- When updating or creating docs, always cross-check with the latest template to ensure full compliance

## High-Level Documentation Guidelines

- High-level docs (`docs/architecture.md`, `docs/README.md`, root `README.md`) should NOT reference specific story or epic numbers
- Use descriptive feature names instead (e.g., "Gamification System" not "Story 15.3")
- Keep high-level docs focused on current system state, not implementation history
- Story/epic references belong in BR and implementation docs only

### Epic Creation Checklist

- Create BR README and implementation README using only the sections defined in their templates
- Scaffold initial story files (BR + implementation) if known, matching template structure exactly
- Link epic ↔ implementation ↔ stories bidirectionally

### Story Creation Checklist

- Create BR story file and implementation story file using only the sections defined in their templates
- Link back to epic BR + implementation README

### File Headers

- Add/update header comments when new exported component/hook/service or public API surface changes (use File Summary Template)
- Performance or architectural shifts: update `docs/architecture.md` + feature `design.md`

## Technical Challenges Documentation

When completing story implementation, add a "Technical Challenges & Solutions" section to the implementation doc with:

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
