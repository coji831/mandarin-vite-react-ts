# Structured AI Prompts Guide

This guide provides a systematic approach to creating effective AI prompts for this project. Using structured prompts ensures consistent, predictable results and makes collaboration more efficient.

## Prompt Structure Template

Every AI prompt should follow this general structure:

```
[TASK]: <specific task description>
[CONTEXT]: <file path or epic/story reference>
[PARAMETERS]: <specific parameters needed>
[OUTPUT]: <expected output format>
[CONSTRAINTS]: <any limitations or requirements>
```

## Task Categories and Examples

### 1. Code Review Tasks

**Example: Component Review**

```
[TASK]: Review component for SOLID principles and React best practices
[CONTEXT]: src/features/mandarin/components/FlashCard.tsx
[PARAMETERS]:
  - Check single responsibility
  - Verify proper hook usage
  - Identify prop drilling issues
[OUTPUT]: List of issues with line references and suggested fixes
[CONSTRAINTS]: Focus on maintainability and performance
```

### 2. Documentation Tasks

**Example: Story Implementation Status Update**

```
[TASK]: Update implementation status for completed story
[CONTEXT]: docs/issue-implementation/epic-5-user-authentication/implementation-5-2-implement-login-form.md
[PARAMETERS]:
  - PR number: #42
  - Merge date: 2025-10-01
  - Key commit: 8a7b3c9
[OUTPUT]: Updated Status section with all required fields
[CONSTRAINTS]: Update both business requirements and implementation docs
```

### 3. Code Generation Tasks

**Example: New Component Creation**

```
[TASK]: Create new React component following project conventions
[CONTEXT]: Feature: User Profile display
[PARAMETERS]:
  - Name: UserProfileCard
  - Props: user (UserProfile type), isEditable (boolean), onEdit (callback)
  - Required hooks: useUserContext
[OUTPUT]: Complete TypeScript React component with comments
[CONSTRAINTS]: Follow project naming conventions and component structure
```

### 4. Refactoring Tasks

**Example: SOLID Principle Application**

```
[TASK]: Refactor component to follow Single Responsibility Principle
[CONTEXT]: src/features/mandarin/pages/VocabularyListPage.tsx
[PARAMETERS]:
  - Extract data fetching logic to custom hook
  - Separate presentation from business logic
  - Create smaller, focused components
[OUTPUT]: Refactored component and new extracted components/hooks
[CONSTRAINTS]: Maintain existing functionality and props interface
```

## Common Errors to Avoid

1. **Vague Tasks**: "Review this file" vs "Review this component for prop drilling issues"
2. **Missing Context**: Always include file paths or specific references
3. **Ambiguous Parameters**: Be specific about what you need
4. **Undefined Output Expectations**: Clearly state what you expect to receive
5. **Omitted Constraints**: Always specify important limitations or requirements

## Integration with Workflow

Always reference relevant guides and templates in your prompts:

1. For business requirements: `docs/templates/epic-business-requirements-template.md` / `story-business-requirements-template.md`
2. For implementation docs: `docs/templates/epic-implementation-template.md` / `story-implementation-template.md`
3. For code conventions: `docs/guides/code-conventions.md`
4. For SOLID principles: `docs/guides/solid-principles.md`
5. For workflow guidance: `.github/copilot-instructions.md`

## Epic Workflow Prompts

Ready-to-use structured prompts for full epic/story workflows. Each prompt references the canonical guides and templates in this repository.

### 1. Create Epic/Story Documents from Templates

```
[TASK]: Create epic and story documents from templates
[CONTEXT]: docs/business-requirements/epic-8-example-new-feature/
[PARAMETERS]:
  - Business template: docs/templates/epic-business-requirements-template.md
  - Story template: docs/templates/story-business-requirements-template.md
  - Fill: Goal, Key Points (3-5), Status: Planned, User Stories, Acceptance Criteria, Implementation Plan
  - Cross-links: placeholder issue/PR references
[OUTPUT]: Created files: README.md (epic) and story markdown files exactly matching template headings and order
[CONSTRAINTS]: Do not modify template headings; include example content for placeholders
```

### 2. Implement Code from Documentation

```
[TASK]: Implement code and tests from implementation docs
[CONTEXT]: docs/issue-implementation/epic-8-example-new-feature/
[PARAMETERS]:
  - Implementation template: docs/templates/epic-implementation-template.md
  - Coding conventions: docs/guides/code-conventions.md
  - SOLID guidance: docs/guides/solid-principles.md
  - Target files: e.g., src/features/<feature>/pages/NewPage.tsx, src/features/<feature>/components/*
  - Tests: Jest + React Testing Library, include smoke test and one behavior test
[OUTPUT]: File patches (or full files) for code, tests, and updated docs; include comments referencing doc sections
[CONSTRAINTS]: Follow TypeScript, hooks, naming, routing, and SOLID principles; include minimal tests
```

### 3. Update Related Documentation

```
[TASK]: Update documentation after code changes
[CONTEXT]: Completed code changes from step 2
[PARAMETERS]:
  - Story BR: docs/business-requirements/epic-8-example-new-feature/story-8-1-*.md
  - Story implementation: docs/issue-implementation/epic-8-example-new-feature/implementation-8-1-*.md
  - Epic docs: Update only if cross-cutting decisions or shared architecture changed
  - Design docs: src/features/<feature>/docs/design.md (if feature logic changed)
  - Architecture: docs/architecture.md (if cross-cutting changes)
  - API specs: api/api-spec.md or local-backend/docs/api-spec.md (if endpoints/contracts changed)
  - File headers: docs/templates/file-summary-template.md format for public API changes
  - Last Update: Update date fields in both BR and implementation docs
[OUTPUT]: Updated documentation files with status progress, decisions, data shape changes, performance notes
[CONSTRAINTS]: Mark progressed AC in story BR (leave unchecked until fully validated); ensure BR ↔ implementation alignment
```

### 4. Git Tasks (Branch, Commit, PR)

```
[TASK]: Prepare branch, commit message, and PR draft
[CONTEXT]: Epic: docs/business-requirements/epic-8-example-new-feature/
[PARAMETERS]:
  - Branch name: epic-8-example-new-feature (follow docs/guides/git-convention.md)
  - Commit message template: docs/templates/commit-message-template.md
  - PR title format: [EPIC-8] Story 8.1: Brief description
  - PR description: follow .github/PULL_REQUEST_TEMPLATE.md and include links to docs
[OUTPUT]: Suggested git commands, commit message, and PR description text
[CONSTRAINTS]: Use Conventional Commits format and PR naming conventions; include both code and doc updates in same commit
```

### 5. Start Full Workflow (Step-by-Step)

```
[TASK]: Start workflow for epic and proceed step-by-step
[CONTEXT]: docs/business-requirements/epic-8-example-new-feature/
[PARAMETERS]:
  - Follow .github/copilot-instructions.md → Story-Level Development Workflow
  - At each step: create/validate docs, implement code, run tests, prepare PR drafts
  - Stop and report if a required artifact or decision is missing
[OUTPUT]: Action log of steps taken, files created/updated, diffs for code changes, and any blockers or decisions
[CONSTRAINTS]: Update status fields in both business and implementation docs after each step
```

Use these prompts as starting points; adapt the context paths and parameters for your specific epic/story.
