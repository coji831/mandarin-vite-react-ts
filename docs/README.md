# Project Documentation

## Overview Documentation

- [workflow.md](workflow.md) - Development workflow and processes
- [architecture.md](architecture.md) - System architecture overview
- [conventions.md](conventions.md) - Coding standards and structure
- [documentation-relationship-guide.md](documentation-relationship-guide.md) - How business and technical documentation work together

## Project Management Documentation

- [business-requirements/README.md](business-requirements/) - Business requirements and planning documents
- [issue-implementation/](issue-implementation/) - Technical implementation details for completed epics and stories

## Feature-Specific Documentation

- [src/features/<feature>/docs/](../src/features/) - Feature-specific design and API details

## Epic Structure

Epics are organized in their own directories within both business requirements and implementation folders:

```
business-requirements/
└── epic-<number>-<epic-name>/

issue-implementation/
└── epic-<number>-<epic-name>/
```

Each epic directory contains:

- README.md - Epic overview document
- Individual story documents named according to the pattern: `story-<epic-number>-<story-number>-<story-name>.md`
