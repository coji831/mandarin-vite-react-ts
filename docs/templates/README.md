# Centralized Conventional Templates & Format Files

**Last Updated:** June 2, 2026

This folder contains the single source of truth for all documentation templates and format files used in this project.

## Purpose

- Centralizes all templates for business requirements, implementation, conventions, and workflow.
- Ensures consistency and maintainability across all documentation.

## Usage Instructions

- Always use the templates in this folder when creating new business requirements, implementation docs, or updating workflow/conventions.
- Do not use or reference templates from any other location.

## Template Index

- [Business Requirements Epic Template](epic-business-requirements-template.md)
- [Business Requirements Story Template](story-business-requirements-template.md)
- [Implementation Epic Template](epic-implementation-template.md)
- [Implementation Story Template](story-implementation-template.md)
- [Commit Message Template](commit-message-template.md)
- [Feature Design Template](feature-design-template.md)
- [File Summary Template](file-summary-template.md)

## Related Guides

- [Documentation Patterns (Business Requirements)](../knowledge-base/documentation-patterns.md#business-requirements-format)

- [Workflow Checklist](../guides/operations/workflow.md)
- [Git Conventions & Branch Strategy](../guides/conventions/git.md)
- [Frontend Conventions](../guides/conventions/frontend.md)
- [Backend Conventions](../guides/conventions/backend.md)
- [SOLID Principles](../knowledge-base/solid-principles.md)

## AI & Workflow Resources

- [Copilot Instructions](../../.github/copilot-instructions.md) – Primary AI operational playbook
  - Story-Level Development Workflow
  - Automation Protocol (trigger: "refer #file:automation")
  - Quality Gates & Alignment Checklists
- [Structured AI Prompts Guide](../automation/structured-ai-prompts.md) – Detailed prompt catalog with examples

- Main README files for navigation:
  - Project root: `README.md`
  - Features: `src/features/README.md`, `src/features/mandarin/README.md`
  - Docs: `docs/README.md`, `docs/business-requirements/README.md`, `docs/issue-implementation/README.md`
  - Epics: All epic folders contain a `README.md`

---

**How to Use:**

- Reference this file when starting new epics, stories, or implementation docs
- Link to the correct template/format file in PRs, documentation, and AI prompts
- Update this file whenever a new template or format file is added
