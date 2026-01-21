# Documentation Context Rules

**Auto-activated when working in**: `docs/`

---

## Documentation Structure

```
docs/
├── architecture.md                    # System architecture overview
├── guides/                           # Project-specific setup guides
│   ├── code-conventions.md
│   ├── git-convention.md
│   ├── workflow.md
│   └── ...
├── knowledge-base/                   # Transferable patterns
│   ├── frontend-react-patterns.md
│   ├── backend-architecture.md
│   └── ...
├── templates/                        # Source of truth for all templates
│   ├── epic-business-requirements-template.md
│   ├── story-business-requirements-template.md
│   └── ...
├── business-requirements/            # BR documents
│   └── epic-{num}-{slug}/
│       ├── README.md
│       └── story-{epic}-{story}-{short}.md
└── issue-implementation/             # Implementation documents
    └── epic-{num}-{slug}/
        ├── README.md
        └── story-{epic}-{story}-{short}.md
```

---

## Template Compliance (CRITICAL)

### Rule: Strict Template Matching
**All documentation MUST strictly match the structure and sections of the corresponding template.**

- ✅ Use ONLY sections defined in templates
- ❌ Do NOT add extra sections (like "Status")
- ❌ Do NOT duplicate sections
- ❌ Do NOT remove template sections
- ✅ Cross-check with latest template before creating/updating docs

### Template Locations
- Epic BR: `docs/templates/epic-business-requirements-template.md`
- Story BR: `docs/templates/story-business-requirements-template.md`
- Epic Implementation: `docs/templates/epic-implementation-template.md`
- Story Implementation: `docs/templates/story-implementation-template.md`
- Commit Message: `docs/templates/commit-message-template.md`
- File Header: `docs/templates/file-summary-template.md`

### Template Verification Checklist
Before submitting any documentation:
- [ ] Read the corresponding template file
- [ ] Verify all required sections are present
- [ ] Verify no non-template sections exist
- [ ] Verify section order matches template
- [ ] Verify heading levels match template

---

## Epic & Story Naming

### Epic Structure
```
docs/business-requirements/epic-{num}-{slug}/
├── README.md                                      # Epic overview (use epic BR template)
└── story-{epic}-{story}-{short}.md               # Story (use story BR template)

docs/issue-implementation/epic-{num}-{slug}/
├── README.md                                      # Epic implementation (use epic impl template)
└── story-{epic}-{story}-{short}.md               # Story implementation (use story impl template)
```

### Naming Conventions
- Epic number: Sequential integer (1, 2, 3, ...)
- Epic slug: kebab-case description (`production-backend-architecture`)
- Story number: `{epic}.{story}` (e.g., 13.1, 13.2)
- Story short: kebab-case brief descriptor (`authentication`, `database-schema`)

### Examples
```
epic-13-production-backend-architecture/
├── README.md
├── story-13-1-monorepo-setup.md
├── story-13-2-database-schema.md
├── story-13-3-authentication.md
└── story-13-4-progress-api.md
```

---

## Documentation Types

### 1. Guides (Project-Specific)
**Purpose**: Actionable setup and workflow documentation for THIS project.

**When to use**: You need to set up, configure, or understand workflows specific to THIS codebase.

**Format**:
- Numbered steps
- Code snippets with file paths
- Commands to run
- Specific to this project

**Examples**:
- "How to configure Vite proxy for cookie forwarding in THIS project"
- "Setup Redis caching on Railway for THIS backend"

### 2. Knowledge Base (Transferable Patterns)
**Purpose**: Transferable concepts, deep dives, architectural patterns.

**When to use**: You want to understand WHY patterns exist or apply concepts to OTHER projects.

**Format**:
- Conceptual explanations
- Diagrams and tradeoff analysis
- Alternative approaches
- General best practices

**Examples**:
- "Why dev proxies don't forward cookies by default + HTTP header mechanics"
- "Clean Architecture principles and layering strategies"

### 3. Business Requirements
**Purpose**: Feature specifications and acceptance criteria.

**Format**: Use templates exactly. Includes:
- Overview, Background, Goals
- User Stories, Acceptance Criteria
- Dependencies, Technical Considerations
- No implementation details

### 4. Implementation Docs
**Purpose**: Technical implementation details and decisions.

**Format**: Use templates exactly. Includes:
- Implementation approach
- Technical decisions and rationale
- Files changed
- Testing strategy
- No business justification (that's in BR)

---

## Cross-Document Linking

### Bidirectional Links
Epic and story documents must link to each other:

**Epic BR → Story BR:**
```markdown
## Stories
1. [Story 13.1: Monorepo Setup](./story-13-1-monorepo-setup.md)
2. [Story 13.2: Database Schema](./story-13-2-database-schema.md)
```

**Story BR → Epic BR:**
```markdown
**Epic**: [Epic 13: Production Backend Architecture](./README.md)
```

**Epic Impl → Story Impl:**
```markdown
## Stories
1. [Story 13.1 Implementation](./story-13-1-monorepo-setup.md)
```

**Story Impl → Epic Impl:**
```markdown
**Epic Implementation**: [Epic 13 Implementation](./README.md)
```

### Cross-Reference Pattern
```markdown
**Related Documentation:**
- Business Requirements: [Story 13.3 BR](../business-requirements/epic-13-production-backend-architecture/story-13-3-authentication.md)
- Architecture: [System Architecture](../architecture.md)
- Guide: [Backend Setup Guide](../guides/backend-setup-guide.md)
- Knowledge Base: [Authentication Patterns](../knowledge-base/backend-authentication.md)
```

---

## Knowledge Base Update Protocol

### Triggers for KB Updates
Update KB after resolving non-trivial technical struggles:
- Story took 2x+ longer than estimated due to complexity
- Discovered reusable architectural pattern
- Solved cross-cutting technical issue (CORS, cookies, pooling, React lifecycle)
- Found non-obvious configuration requirement
- Implemented security pattern with measurable impact
- Performance optimization (>20% improvement)

### Extraction Workflow
1. **Identify Reusable Content** - Review story implementation's "Technical Challenges & Solutions"
2. **Determine Target**:
   - Project setup → Update guide in `docs/guides/`
   - Deep technical concept → Update/create KB article in `docs/knowledge-base/`
   - Both? Add quick reference to guide with "Learn more: [KB Article]" link
3. **Extract & Organize**:
   - Remove verbose postmortem from story implementation doc
   - Actionable patterns → guides (concise, directive)
   - Conceptual explanations → KB (detailed, educational)
   - Keep story doc focused on WHAT, not WHY/HOW details
4. **Cross-Link**:
   - Story implementation → Add "Related Documentation" links
   - Guide → Add "Learn more" links to KB
   - KB README → Update index
5. **Maintain Template Compliance** - Verify story/epic docs still match templates

### KB Article Structure
```markdown
# Pattern/Concept Name

**When Adopted**: Epic {num}, Story {num}.{num}
**Last Updated**: YYYY-MM-DD

## Overview
[One-sentence summary]

## Use Case
[What problem it solves]

## When to Use
[Decision criteria]

## When NOT to Use
[Anti-patterns, limitations]

## Implementation Pattern
[Code examples with before/after]

## Tradeoffs
[Pros, cons, alternatives considered]

## Key Lessons
[What we learned]

## Related Resources
- [Related KB Article](./related.md)
- [External Authoritative Source](https://...)
```

---

## Commit Message Format

### Conventional Commits
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `wip`

**Scopes**:
- `epic-{num}` - Epic-level changes
- `story-{epic}-{story}` - Story-specific changes
- `component`, `hook`, `api`, `docs` - Component-level changes

**Examples**:
```
feat(story-13-4): implement progress sync reducer
fix(epic-13): resolve cookie forwarding in Vite proxy
docs(story-13-6): update implementation plan
refactor(backend): convert controllers to DI pattern
test(story-11-2): add unit tests for vocab reducer
```

**Full template**: `docs/templates/commit-message-template.md`

---

## Documentation Update Workflow

### When Creating Epic/Story
1. Create BR file using correct template
2. Create implementation file using correct template
3. Link epic ↔ story bidirectionally
4. Update parent README indices
5. Verify all template sections present

### When Updating Story Progress
1. Mark AC progress in story BR (leave unchecked until validated)
2. Record decisions in story implementation
3. Update "Last Update" date in both
4. If cross-cutting changes, update epic docs
5. Verify cross-doc alignment checklist

### When Closing Epic/Story
1. Confirm all AC checked in BR
2. Update Status to "Completed" in both BR + implementation
3. Update "Last Update" dates
4. Reference PR number in both docs
5. Commit BR + implementation changes together

---

## Cross-Doc Alignment Checklist

Before committing documentation:
- [ ] BR ↔ implementation ↔ stories all cross-link
- [ ] Status & Last Update synchronized
- [ ] Templates followed (all required sections present)
- [ ] AC list maps to stories or tests
- [ ] Architecture/design/API decisions recorded if changed
- [ ] No extra non-template sections added
- [ ] Bidirectional links between epic and stories

---

## Quality Gates for Documentation

- [ ] Uses correct template for document type
- [ ] All template sections present and in order
- [ ] No non-template sections added
- [ ] Cross-links bidirectional and correct
- [ ] Status and dates up to date
- [ ] Clear, concise language (no verbosity)
- [ ] Code examples use correct file paths
- [ ] Technical terms defined or linked

---

## Common Pitfalls

### ❌ Don't
```markdown
# Story 13.3: Authentication

## Status
In Progress  ❌ (not in template)

## Overview
[content]

## Extra Section  ❌ (not in template)
[content]
```

### ✅ Do
```markdown
# Story 13.3: Authentication

**Last Updated**: 2026-01-21

## Overview
[content]

## Acceptance Criteria
- [ ] Item 1
- [ ] Item 2

[All sections from template, in order]
```

---

## Documentation Commands

```bash
# Find all BR files
find docs/business-requirements -name "*.md"

# Find all implementation files
find docs/issue-implementation -name "*.md"

# Verify template compliance (manual)
# 1. Open template file
# 2. Open your doc file
# 3. Compare section by section
```

---

## Related Documentation

- Business requirements format: @docs/guides/business-requirements-format-guide.md
- Implementation format: @docs/guides/implementation-format-guide.md
- All templates: @docs/templates/README.md
- Git conventions: @docs/guides/git-convention.md
- Workflow guide: @docs/guides/workflow.md
- Documentation patterns: @docs/knowledge-base/documentation-patterns.md
