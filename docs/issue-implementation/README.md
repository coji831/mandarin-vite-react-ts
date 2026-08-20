---
purpose: Area index for technical implementation docs (epics and stories)
status: active
last-verified: 2026-08-18
type: area-index
---

# Issue Implementation

**Last Updated:** August 18, 2026

This folder contains technical implementation documents for epics and stories.

## Planning

- Epics 25+ implement against the **ratified epic plan** in [../planning](../planning/); implementation docs for epics 25+ live here.

## Epic Status Vocabulary

Controlled vocabulary for epic status in implementation docs:

| Status      | Meaning                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------- |
| Planned     | Scheduled in the ratified epic plan; BR drafted, work not started                               |
| In Progress | Work active                                                                                     |
| Completed   | All ACs met, closed                                                                             |
| Parked      | Halted pending revalidation (gate unmet)                                                        |
| Retired     | Superseded/abandoned; preserved for traceability                                                |
| Deferred    | Real, committed scope intentionally scheduled outside the current plan (e.g., epic-41, Phase-4) |

## Active Epics

| Epic                                                                                | Status                  |
| ----------------------------------------------------------------------------------- | ----------------------- |
| [Epic 24: NestJS Shell Migration](./epic-24-nestjs-shell-migration/README.md)       | Planned (D7 shell-swap) |
| [Epic 41: Traditional Character Toggle](./epic-41-traditional-characters/README.md) | Deferred (Phase-4)      |

## Archived Epics

Completed epics (1–23) are archived in [./archive](./archive/README.md) — a per-epic **outcome record** table (portfolio evidence shelf). Content is preserved verbatim.

## Guides

- [Workflow Checklist](../guides/operations/workflow.md)
- [Git Conventions & Branch Strategy](../guides/conventions/git.md)
- [SOLID Principles](../knowledge-base/practices/solid-principles.md)
- [Frontend Conventions](../guides/conventions/frontend.md)
- [Backend Conventions](../guides/conventions/backend.md)

## Templates

- [Implementation Large Epic Template](../templates/epic-implementation-template.md)
- [Implementation Small Epic Template](../templates/epic-implementation-template.md)
- [Implementation Story Template](../templates/story-implementation-template.md)

## Usage

- Always use the templates in [../templates](../templates/) for new implementation docs and stories.
- For business requirements and planning, see [../business-requirements](../business-requirements/).
