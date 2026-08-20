---
purpose: "Area index for business requirements, epics, user stories, and planning docs"
status: active
last-verified: 2026-08-18
type: area-index
---

# Business Requirements

**Last Updated:** August 18, 2026

This folder contains business requirements, epics, user stories, and project planning documents for the project.

## Planning

- Epics 25+ build against the **ratified epic plan** in [../planning](../planning/); BRs for epics 25+ live here.

## Epic Status Vocabulary

Controlled vocabulary for epic status in BR docs:

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
- [Frontend Conventions](../guides/conventions/frontend.md)
- [Backend Conventions](../guides/conventions/backend.md)
- [Knowledge Base](../knowledge-base/README.md)

## Templates

- [Business Requirements Large Epic Template](../templates/epic-business-requirements-template.md)
- [Business Requirements Small Epic Template](../templates/epic-business-requirements-template.md)
- [Business Requirements Story Template](../templates/story-business-requirements-template.md)

## Usage

- Always use the templates in [../templates](../templates/) for new business requirements and stories.
- For implementation details, see [../issue-implementation](../issue-implementation/).
