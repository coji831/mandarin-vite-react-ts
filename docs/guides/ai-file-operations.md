# Step-by-Step Development Workflow with AI Prompts

> **⚠️ IMPORTANT**: This workflow guide remains valid, but all prompt examples should now follow the structured format from the [Structured AI Prompts Guide](./structured-ai-prompts.md).
>
> **Integration Notice**: While this document provides the overall workflow steps, use the structured prompt format for all AI interactions:
>
> ```
> [TASK]: <specific task description>
> [CONTEXT]: <file path or epic/story reference>
> [PARAMETERS]: <specific parameters needed>
> [OUTPUT]: <expected output format>
> [CONSTRAINTS]: <any limitations or requirements>
> ```

## 1. Design Epic/Story

### Step-by-Step Guidance

- Draft or update architecture and feature design docs.

**Structured AI Prompts:**

```
[TASK]: Review design document for template compliance
[CONTEXT]: docs/architecture.md and src/features/<feature>/docs/design.md
[PARAMETERS]:
  - Template: docs/templates/feature-design-template.md
  - Check section headers
  - Verify required sections
[OUTPUT]: List of missing or incorrect sections
[CONSTRAINTS]: Follow template exactly
```

**Check:**

- "Has the design doc been reviewed for exact section name and order compliance with the template/guideline? Are all required sections present and correctly named?"

### Command Reference

```
read/design/architecture --file "docs/architecture.md"
read/design/feature --file "src/features/<feature>/docs/design.md"
update/design/feature --file "src/features/<feature>/docs/design.md" --template "docs/templates/feature-design-template.md"
create/design/feature --file "src/features/<new-feature>/docs/design.md" --template "docs/templates/feature-design-template.md"
```

## 2. Plan (Business Requirements)

### Step-by-Step Guidance

- Create or update business requirements for epic and stories.

**Structured AI Prompts:**

```
[TASK]: Review business requirements for template compliance
[CONTEXT]: docs/business-requirements/epic-X-name/
[PARAMETERS]:
  - Epic template: docs/templates/business-requirements-large-epic-template.md
  - Story template: docs/templates/business-requirements-story-template.md
  - Check section headers
  - Verify related links
[OUTPUT]: List of missing or incorrect sections with suggestions
[CONSTRAINTS]: Follow templates exactly
```

**Check:**

- "Do all business requirement docs match the template for section names and order, and include correct links to related stories/epics?"

### Command Reference

```
update/plan/epic --file "docs/business-requirements/epic-X-name/README.md" --template "docs/templates/epic-business-requirements-template.md"
update/plan/story --file "docs/business-requirements/epic-X-name/story-X-Y-name.md" --template "docs/templates/story-business-requirements-template.md"
create/plan/epic --file "docs/business-requirements/epic-X-name/README.md" --template "docs/templates/epic-business-requirements-template.md"
create/plan/story --file "docs/business-requirements/epic-X-name/story-X-Y-name.md" --template "docs/templates/story-business-requirements-template.md"
```

## 3. Implementation (Code & Docs)

### Step-by-Step Guidance

- Implement code and technical documentation for epic/story.

**Structured AI Prompts:**

```
[TASK]: Review implementation docs for template compliance
[CONTEXT]: docs/issue-implementation/epic-X-name/
[PARAMETERS]:
  - Epic template: docs/templates/implementation-large-epic-template.md
  - Story template: docs/templates/implementation-story-template.md
  - Check rationale and technical details sections
[OUTPUT]: List of missing or incomplete sections with suggestions
[CONSTRAINTS]: Follow templates exactly
```

```
[TASK]: Update component to implement feature
[CONTEXT]: src/features/<feature>/components/ComponentName.tsx
[PARAMETERS]:
  - Implementation plan: docs/issue-implementation/epic-X-name/story-X-Y-name.md
  - Coding conventions: docs/guides/conventions.md
[OUTPUT]: Updated component code with proper formatting and comments
[CONSTRAINTS]: Follow SOLID principles and React best practices
```

**Check:**

- "Does the implementation doc match the template for section names, order, and required content (rationale, technical details)? Does the code match the implementation plan and conventions? Are file comments present, accurate, and compliant with guidelines?"

### Command Reference

```
read/implement/epic-doc --file "docs/issue-implementation/epic-X-name/README.md"
read/implement/story-doc --file "docs/issue-implementation/epic-X-name/story-X-Y-name.md"
read/implement/code --file "src/features/<feature>/components/ComponentName.tsx"
update/implement/epic-doc --file "docs/issue-implementation/epic-X-name/README.md" --guideline "docs/issue-implementation/issue-implementation-format.md"
update/implement/story-doc --file "docs/issue-implementation/epic-X-name/story-X-Y-name.md" --guideline "docs/issue-implementation/issue-implementation-format.md"
update/implement/code --file "src/features/<feature>/components/ComponentName.tsx" --guideline "docs/conventions.md"
create/implement/epic-doc --file "docs/issue-implementation/epic-X-name/README.md" --template "docs/templates/epic-implementation-template.md"
create/implement/story-doc --file "docs/issue-implementation/epic-X-name/story-X-Y-name.md" --template "docs/templates/story-implementation-template.md"
create/implement/component --file "src/features/<feature>/components/NewComponent.tsx" --template "src/features/<feature>/components/ExistingComponent.tsx"
```

## 4. Open Pull Request

### Step-by-Step Guidance

- Prepare and open a pull request.

**Structured AI Prompts:**

```
[TASK]: Verify PR template compliance
[CONTEXT]: .github/PULL_REQUEST_TEMPLATE.md
[PARAMETERS]:
  - Current PR description
  - Required fields from template
[OUTPUT]: List of missing or incomplete fields with suggested content
[CONSTRAINTS]: All template fields must be present and complete
```

```
[TASK]: Generate PR description
[CONTEXT]: docs/workflow.md
[PARAMETERS]:
  - Template: .github/PULL_REQUEST_TEMPLATE.md
  - Epic/Story: docs/business-requirements/epic-X-name/story-X-Y-name.md
  - Branch: feature/epic-X-name
[OUTPUT]: Complete PR description following template format
[CONSTRAINTS]: Must reference correct issue numbers and include summary of changes
```

**Check:**

- "Is the PR description fully compliant with the template (all fields present, correctly named, and complete)? Is the PR linked to the correct issue/story and branch? Does it include a clear, complete summary of changes?"

### Command Reference

```
read/pr/template --file ".github/PULL_REQUEST_TEMPLATE.md"
create/pr/description --guideline "docs/workflow.md" --template ".github/PULL_REQUEST_TEMPLATE.md"
```

## 5. Review & Merge

### Step-by-Step Guidance

- Review code and documentation before merging.

**Structured AI Prompts:**

```
[TASK]: Perform code review using checklist
[CONTEXT]: src/features/<feature>/components/ComponentName.tsx
[PARAMETERS]:
  - Checklist: docs/guides/review-checklist.md
  - Conventions: docs/guides/conventions.md
  - Implementation doc: docs/issue-implementation/epic-X-name/story-X-Y-name.md
[OUTPUT]: List of issues found with reference to checklist items and specific code locations
[CONSTRAINTS]: Focus on code quality, documentation completeness, and adherence to project standards
```

```
[TASK]: Verify review feedback resolution
[CONTEXT]: PR comments and requested changes
[PARAMETERS]:
  - Original feedback items
  - Updated code/docs
[OUTPUT]: Confirmation of resolved items or list of remaining issues
[CONSTRAINTS]: All feedback must be addressed before approval
```

**Check:**

- "Has the review checklist been fully completed, all feedback resolved, and all guidelines followed before merging?"

### Command Reference

```
read/review/story-doc --file "docs/issue-implementation/epic-X-name/story-X-Y-name.md"
read/review/code --file "src/features/<feature>/components/ComponentName.tsx"
update/review/story-doc --file "docs/issue-implementation/epic-X-name/story-X-Y-name.md" --guideline "docs/issue-implementation/issue-implementation-format.md"
update/review/code --file "src/features/<feature>/components/ComponentName.tsx" --guideline "docs/conventions.md"
```

## 6. Close Issue/Epic & Update Documentation

### Step-by-Step Guidance

- Mark issues/stories as complete and update status in BOTH business requirements and implementation docs.

**Structured AI Prompts:**

```
[TASK]: Update completion status in all docs
[CONTEXT]: docs/business-requirements/epic-X-name/ and docs/issue-implementation/epic-X-name/
[PARAMETERS]:
  - Epic files: README.md in both folders
  - Story files: story-X-Y-name.md in both folders
  - Status fields to update: "Status: Completed" with completion date
[OUTPUT]: List of all files updated with their new status values
[CONSTRAINTS]: All relevant documents must be updated with consistent status information
```

```
[TASK]: Verify documentation completeness
[CONTEXT]: All affected project files
[PARAMETERS]:
  - Code files: src/features/<feature>/
  - Documentation files: docs/business-requirements/ and docs/issue-implementation/
  - Comment standards: docs/guides/conventions.md
[OUTPUT]: Report of any outdated or missing documentation with suggestions
[CONSTRAINTS]: All file-level comments must be updated to match final implementation
```

**Check:**

- "Are all status sections present, up to date, and correctly formatted in BOTH business requirements and implementation docs? Is all documentation finalized and accurate? Are file-level comments updated in all affected code files?"

### Command Reference

```
update/close/business-epic-status --file "docs/business-requirements/epic-X-name/README.md" --section "Status"
update/close/business-story-status --file "docs/business-requirements/epic-X-name/story-X-Y-name.md" --section "Status"
update/close/implementation-epic-status --file "docs/issue-implementation/epic-X-name/README.md" --section "Status"
update/close/implementation-story-status --file "docs/issue-implementation/epic-X-name/story-X-Y-name.md" --section "Status"
update/docs/file-comments --file "src/features/<feature>/components/ComponentName.tsx" --guideline "docs/conventions.md"
```

## 7. Commit & Release

### Step-by-Step Guidance

- Create a commit and update release notes.

**Structured AI Prompts:**

```
[TASK]: Generate commit message
[CONTEXT]: Current changes and story/epic information
[PARAMETERS]:
  - Type: feat|fix|docs|style|refactor|test|chore
  - Scope: story-X-Y or epic-X
  - Convention: docs/templates/commit-message-template.md
[OUTPUT]: Properly formatted commit message following project standards
[CONSTRAINTS]: Must follow Conventional Commits format and reference correct scope
```

```
[TASK]: Update changelog
[CONTEXT]: CHANGELOG.md
[PARAMETERS]:
  - Version: current release version
  - Changes: list of completed stories and fixes
  - Format: docs/guides/conventions.md section on changelogs
[OUTPUT]: Updated changelog entry with all relevant changes organized by type
[CONSTRAINTS]: Must be comprehensive and follow project format
```

**Check:**

- "Is the commit message fully compliant with Conventional Commits (type, scope, message), scoped to the correct story/epic, and clear? Are release notes in `CHANGELOG.md` complete, accurate, and descriptive?"

### Command Reference

```
create/commit/message --type "feat|fix|docs|style|refactor|test|chore" --scope "story-X-Y" --guideline "docs/workflow.md"
update/release/notes --file "CHANGELOG.md" --guideline "docs/conventions.md"
```

## Using This Guide Effectively

### Combining Workflow Steps with Structured Prompts

For maximum effectiveness, use this workflow guide in conjunction with the structured prompts format:

1. **Follow the Workflow Sequence** - Use the steps in this document as your overall project roadmap
2. **Use Structured Prompts** - Apply the structured format from [Structured AI Prompts Guide](./structured-ai-prompts.md) for all AI interactions
3. **Adapt Examples** - Customize the provided structured prompt examples to your specific task needs
4. **Reference Legacy Commands** - While using the new prompt structure, you can still reference the command patterns in the Command Reference sections

### Automating Prompt Generation

To streamline your workflow, consider creating scripts that generate structured prompts based on:

1. Current git branch (for epic/story context)
2. Modified files (for context)
3. Project template references (for parameters)

This automation will help maintain consistency and reduce the manual effort of creating structured prompts.

### Recommended Workflow Integration

1. Use a split-screen approach with this guide open alongside your code editor
2. Reference the appropriate workflow step based on your current phase
3. Copy and adapt the structured prompt example for your specific task
4. Execute the prompt with the AI assistant
5. Validate the results against the "Check" items in each section

By following this integrated approach, you'll maintain the structured consistency that enhances AI assistance while benefiting from the established workflow patterns in this guide.

```

```
