# Project Documentation

## Navigation & Overview

### Main Reference Docs

- [architecture.md](architecture.md) – System architecture overview
- [templates/README.md](templates/README.md) – **Source of truth for all templates and formats**

### Workflow & Process Guides

- [guides/workflow.md](guides/workflow.md) – Human-friendly workflow checklist
- [guides/branch-strategy.md](guides/branch-strategy.md) – Git branch strategy and conventions
- [guides/contribution-guide.md](guides/contribution-guide.md) – How to contribute to the project

### Documentation Guides

- [guides/documentation-relationship-guide.md](guides/documentation-relationship-guide.md) – How business and technical docs work together
- [guides/business-requirements-format.md](guides/business-requirements-format.md) – Business requirements format guide
- [guides/implementation-format.md](guides/implementation-format.md) – Implementation docs format guide
- [guides/document-streamlining.md](guides/document-streamlining.md) – Making documentation concise and effective

### Code & Development Guides

- [guides/conventions.md](guides/conventions.md) – Coding, naming, and documentation conventions
- [guides/solid-principles.md](guides/solid-principles.md) – Applying SOLID principles to React/TypeScript

### AI Assistance Guides

- [guides/ai-file-operations.md](guides/ai-file-operations.md) – AI file operation guide
- [guides/structured-ai-prompts.md](guides/structured-ai-prompts.md) – Creating effective AI prompts

### Templates

- [Business Requirements Large Epic Template](templates/business-requirements-large-epic-template.md)
- [Business Requirements Small Epic Template](templates/business-requirements-small-epic-template.md)
- [Business Requirements Story Template](templates/business-requirements-story-template.md)
- [Implementation Large Epic Template](templates/implementation-large-epic-template.md)
- [Implementation Small Epic Template](templates/implementation-small-epic-template.md)
- [Implementation Story Template](templates/implementation-story-template.md)

## Project Management Documentation

- [business-requirements/README.md](business-requirements/) – Business requirements and planning documents
- [issue-implementation/README.md](issue-implementation/) – Technical implementation details for completed epics and stories

## Feature-Specific Documentation

- [src/features/<feature>/docs/](../src/features/) – Feature-specific design and API details

## Epic Structure

Epics are organized in their own directories within both business requirements and implementation folders:

```
business-requirements/
└── epic-<number>-<epic-name>/

issue-implementation/
└── epic-<number>-<epic-name>/
```

Each epic directory contains:

- README.md – Epic overview document
- Individual story documents named according to the pattern: `story-<epic-number>-<story-number>-<story-name>.md`

## Contribution Guide

To contribute to documentation:

- Use templates from [docs/templates](templates/)
- Follow commit conventions in [workflow.md](workflow.md)
- Update navigation guides and READMEs as needed
