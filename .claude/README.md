# Claude Code Configuration

This directory contains Claude Code-specific configuration and context rules for the Mandarin Learning App project.

## Structure

```
.claude/
├── README.md           # This file
└── rules/              # Path-specific context rules
    ├── frontend.md     # Frontend patterns (React, hooks, state)
    ├── backend.md      # Backend patterns (Express, services, DB)
    ├── docs.md         # Documentation standards
    └── auth.md         # Authentication patterns
```

---

## How It Works

### Main Context File
**[CLAUDE.md](../CLAUDE.md)** (root) - Primary context file containing:
- Quick start commands
- State management patterns
- Naming conventions
- Documentation system overview
- Git & branching standards
- Quality gates
- References to detailed docs (using @path/to/file.md syntax)

### Path-Specific Rules
Claude Code automatically loads additional context based on your working directory:

| Working Directory | Auto-Loads | Contains |
|-------------------|------------|----------|
| `apps/frontend/` | [frontend.md](./rules/frontend.md) | Component patterns, hooks, routing, state management |
| `apps/backend/` | [backend.md](./rules/backend.md) | Clean Architecture, services, Express patterns, DB |
| `docs/` | [docs.md](./rules/docs.md) | Template compliance, BR/implementation formats, KB updates |
| `apps/frontend/src/features/auth/`<br>`apps/backend/src/api/controllers/auth*` | [auth.md](./rules/auth.md) | JWT patterns, security, token flows |

---

## Design Philosophy

### Token Efficiency
- **High-frequency rules** → CLAUDE.md (always loaded)
- **Bulky documentation** → Referenced via @path syntax (loaded on demand)
- **Path-specific context** → .claude/rules/*.md (loaded only when relevant)

### Benefits
1. **Faster responses** - Only loads relevant context
2. **Lower costs** - Reduces token usage per request
3. **Better focus** - Claude sees only what's needed for current work
4. **Easier maintenance** - Update one file per domain

---

## Migration from Copilot

This system replaces **`.github/copilot-instructions.md`** with a more token-efficient structure:

| Old (Copilot) | New (Claude Code) | Benefit |
|---------------|-------------------|---------|
| Single 356-line file | Split into focused files | Load only what's needed |
| All context always loaded | Path-based lazy loading | Reduce token usage |
| Inline docs | @reference syntax | On-demand detail |

---

## Usage Guidelines

### For AI Agents (Claude)
1. Always read **CLAUDE.md** first for high-frequency patterns
2. Auto-load path-specific rules based on working directory
3. Reference detailed docs using @path syntax when needed
4. Follow templates strictly when creating documentation

### For Human Contributors
1. Read **CLAUDE.md** for quick reference
2. Check path-specific rules for detailed patterns
3. Update rules when patterns change
4. Keep token efficiency in mind when adding context

---

## Maintenance

### When to Update CLAUDE.md
- Quick commands change (npm scripts)
- Core patterns evolve (state management, naming)
- Workflow changes (story development, git conventions)
- New automation triggers added

### When to Update .claude/rules/*.md
- Component patterns change (frontend.md)
- Architecture patterns evolve (backend.md)
- Documentation standards update (docs.md)
- Security patterns change (auth.md)

### When to Update Referenced Docs
- Detailed guides change → Update docs/guides/*.md
- Knowledge base grows → Update docs/knowledge-base/*.md
- Templates evolve → Update docs/templates/*.md
- Architecture shifts → Update docs/architecture.md

---

## File Size Guidelines

| File | Target Size | Why |
|------|-------------|-----|
| CLAUDE.md | ~300 lines | Core context, always loaded |
| .claude/rules/*.md | ~100-200 lines | Focused patterns, loaded conditionally |
| Referenced docs | Any size | Loaded on-demand via @ syntax |

---

## Related Documentation

- Main context: [../CLAUDE.md](../CLAUDE.md)
- Legacy instructions: [../.github/copilot-instructions.md](../.github/copilot-instructions.md)
- Architecture: [../docs/architecture.md](../docs/architecture.md)
- Templates: [../docs/templates/README.md](../docs/templates/README.md)
- Guides: [../docs/guides/README.md](../docs/guides/README.md)
- Knowledge Base: [../docs/knowledge-base/README.md](../docs/knowledge-base/README.md)

---

**Last Updated**: 2026-01-21
**Migration from**: GitHub Copilot Enterprise
**System**: Claude Code with path-specific context rules
