# Project Documentation

## Navigation & Overview

- [guides/workflow.md](guides/workflow.md) – Human-friendly workflow checklist
- [guides/ai-file-operations.md](guides/ai-file-operations.md) – AI file operation guide
- [guides/conventions.md](guides/conventions.md) – Coding, naming, and documentation conventions
- [guides/documentation-relationship-guide.md](guides/documentation-relationship-guide.md) – How business and technical documentation work together
- [architecture.md](architecture.md) – System architecture overview
- [templates/README.md](templates/README.md) – **Source of truth for all templates and formats**
  [Business Requirements Format Guide](guides/business-requirements-format.md)
  - [Business Requirements Large Epic Template](templates/business-requirements-large-epic-template.md)
  - [Business Requirements Small Epic Template](templates/business-requirements-small-epic-template.md)
  - [Business Requirements Story Template](templates/business-requirements-story-template.md)
    [Implementation Format Guide](guides/implementation-format.md)
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
