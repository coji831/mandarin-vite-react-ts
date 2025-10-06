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

**Example 1: Component Review**

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

**Example 2: Hook Review**

```
[TASK]: Analyze custom hook for completeness and side effects
[CONTEXT]: src/features/mandarin/hooks/useMandarinProgress.tsx
[PARAMETERS]:
  - Check dependency array completeness
  - Verify cleanup functions
  - Assess type safety
[OUTPUT]: Analysis with code snippets for improvements
[CONSTRAINTS]: Must maintain backward compatibility
```

### 2. Documentation Tasks

**Example 1: Epic Documentation Verification**

```
[TASK]: Verify documentation completeness for Epic 5
[CONTEXT]: docs/business-requirements/epic-5-user-authentication/README.md
[PARAMETERS]:
  - Template compliance
  - Cross-reference accuracy
  - Status field correctness
[OUTPUT]: Report on missing or incorrect sections with fixes
[CONSTRAINTS]: Follow template in docs/templates/business-requirements-large-epic-template.md
```

**Example 2: Story Implementation Status Update**

```
[TASK]: Update implementation status for completed story
[CONTEXT]: docs/issue-implementation/epic-5-user-authentication/story-5-2-implement-login-form.md
[PARAMETERS]:
  - PR number: #42
  - Merge date: 2025-10-01
  - Key commit: 8a7b3c9
[OUTPUT]: Updated Status section with all required fields
[CONSTRAINTS]: Update both business requirements and implementation docs
```

### 3. Code Generation Tasks

**Example 1: New Component Creation**

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

**Example 2: Test Generation**

```
[TASK]: Generate unit tests for component
[CONTEXT]: src/features/mandarin/components/SectionSelect.tsx
[PARAMETERS]:
  - Test user interactions
  - Mock context providers
  - Test error states
[OUTPUT]: Complete test file using React Testing Library
[CONSTRAINTS]: Follow project testing conventions and naming
```

### 4. Refactoring Tasks

**Example 1: SOLID Principle Application**

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

**Example 2: Performance Optimization**

```
[TASK]: Optimize component rendering performance
[CONTEXT]: src/features/mandarin/components/FlashCardList.tsx
[PARAMETERS]:
  - Implement memoization
  - Prevent unnecessary re-renders
  - Optimize list rendering
[OUTPUT]: Optimized component with comments explaining changes
[CONSTRAINTS]: No regression in functionality
```

## Common Errors to Avoid

1. **Vague Tasks**: "Review this file" vs "Review this component for prop drilling issues"
2. **Missing Context**: Always include file paths or specific references
3. **Ambiguous Parameters**: Be specific about what you need
4. **Undefined Output Expectations**: Clearly state what you expect to receive
5. **Omitted Constraints**: Always specify important limitations or requirements

## AI-Specific Commands

Our project uses specific command patterns that the AI understands:

```
create/implement/component --file "path/to/file.tsx" --template "path/to/template.tsx"
update/story/status --file "path/to/story.md" --status "Completed" --pr "42" --date "2025-10-01"
check/docs/compliance --epic "5" --template "docs/templates/business-requirements-large-epic-template.md"
review/code/solid --file "path/to/component.tsx" --principles "SRP,OCP,DIP"
```

## Integration with Workflow

Always reference relevant guides and templates in your prompts:

1. For business requirements: `docs/templates/business-requirements-story-template.md`
2. For implementation docs: `docs/templates/implementation-story-template.md`
3. For code conventions: `docs/guides/conventions.md`
4. For SOLID principles: `docs/guides/solid-principles.md`

## Automating Prompt Generation

Use the project's automation tools to generate structured prompts:

```powershell
# Generate a code review prompt
.\scripts\generate-prompt.ps1 --type "code-review" --file "src/features/mandarin/components/FlashCard.tsx"

# Generate a documentation update prompt
.\scripts\generate-prompt.ps1 --type "doc-update" --epic "5" --story "2"
```

This structured approach ensures consistent, high-quality results from AI assistance throughout the project lifecycle.

## Prompts for full epic workflow (create docs, implement, git, run)

Below are ready-to-use structured prompts aligned with the `automation` workflow you requested. Each prompt references the canonical guides and templates in this repository.

1. Create epic/story documents from templates

```
[TASK]: Create epic and story documents from templates
[CONTEXT]: docs/business-requirements/epic-8-example-new-feature/
[PARAMETERS]:
  - Epic size: large
  - Business template: docs/templates/business-requirements-large-epic-template.md
  - Story template: docs/templates/business-requirements-story-template.md
  - Fill: Goal, Key Points (3-5), Status: Planned, User Stories, Acceptance Criteria, Implementation Plan
  - Cross-links: placeholder issue/PR references
[OUTPUT]: Created files: README.md (epic) and story markdown files exactly matching template headings and order
[CONSTRAINTS]: Do not modify template headings; include example content for placeholders
```

2. Implement code from those docs (use conventions + SOLID)

```
[TASK]: Implement code and tests from implementation docs
[CONTEXT]: docs/issue-implementation/epic-8-example-new-feature/
[PARAMETERS]:
  - Implementation template: docs/templates/implementation-large-epic-template.md
  - Coding conventions: docs/guides/code-conventions.md
  - SOLID guidance: docs/guides/solid-principles.md
  - Target files: e.g., src/features/<feature>/pages/NewPage.tsx, src/features/<feature>/components/*
  - Tests: Jest + React Testing Library, include smoke test and one behavior test
[OUTPUT]: File patches (or full files) for code, tests, and updated docs; include comments referencing doc sections
[CONSTRAINTS]: Follow TypeScript, hooks, naming, routing, and SOLID principles; include minimal tests
```

3. Git tasks: branch, commit, PR per project conventions

```
[TASK]: Prepare branch, commit message, and PR draft
[CONTEXT]: Epic: docs/business-requirements/epic-8-example-new-feature/
[PARAMETERS]:
  - Branch name: epic-8-example-new-feature (follow docs/guides/git-convention.md)
  - Commit message template: docs/templates/commit-message-template.md
  - PR title format: [EPIC-8] Story 8.1: Brief description
  - PR description: follow .github/PULL_REQUEST_TEMPLATE.md and include links to docs
[OUTPUT]: Suggested git commands, commit message, and PR description text
[CONSTRAINTS]: Use Conventional Commits format and PR naming conventions
```

4. Start and run the workflow (step-by-step)

```
[TASK]: Start workflow for epic and proceed step-by-step
[CONTEXT]: docs/business-requirements/epic-8-example-new-feature/
[PARAMETERS]:
  - Follow docs/guides/workflow.md sequentially
  - At each step: create/validate docs, implement code, run tests, prepare PR drafts
  - Stop and report if a required artifact or decision is missing
[OUTPUT]: Action log of steps taken, files created/updated, diffs for code changes, and any blockers or decisions
[CONSTRAINTS]: Update status fields in both business and implementation docs after each step
```

Use these prompts as starting points; adapt the context paths and parameters for your specific epic/story.
