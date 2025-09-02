# Step-by-Step Development Workflow with AI Prompts

## 1. Design Epic/Story

### Step-by-Step Guidance

- Draft or update architecture and feature design docs.

**AI Prompts:**

- "Read `docs/architecture.md` and `src/features/<feature>/docs/design.md`. Compare all section headers to those in `docs/templates/feature-design-template.md`. List any missing, misnamed, or extra sections."
- "Update design docs if any section is missing, misnamed, or outdated. Use `docs/templates/feature-design-template.md` for exact section names and order."

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

**AI Prompts:**

- "Read `docs/business-requirements/epic-X-name/README.md` and story files. Compare all section headers to those in `docs/templates/epic-business-requirements-template.md` and `docs/templates/story-business-requirements-template.md`. List any missing, misnamed, or extra sections."
- "Update or create docs if any section is missing, misnamed, or out of order. Ensure all required links to related stories/epics are present and correct."

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

**AI Prompts:**

- "Read `docs/issue-implementation/epic-X-name/README.md` and `story-X-Y-name.md`. Compare all section headers to those in `docs/issue-implementation/issue-implementation-format.md`. List any missing, misnamed, or extra sections. Check that rationale and technical details are present and complete."
- "Update code in `src/features/<feature>/components/ComponentName.tsx` to match the implementation plan. Ensure logic, structure, and naming follow conventions."
- "Update file-level comments to reflect new logic, context usage, and any changes. Use `docs/conventions.md` for required comment style and information."

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

**AI Prompts:**

- "Read `.github/PULL_REQUEST_TEMPLATE.md`. Compare the PR description to the template. List any missing, incomplete, or misnamed fields."
- "Check that the PR references the correct story/epic and branch. Ensure the summary of changes is clear and complete."
- "Create PR description using workflow guidelines and ensure all required fields are filled and accurate."

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

**AI Prompts:**

- "Read implementation and code files. Compare them to the review checklist in `docs/guides/review-checklist.md`. List any checklist items not met, guideline violations, or unresolved feedback."
- "Update docs or code to resolve all review feedback and ensure full checklist and guideline compliance before merging."

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

**AI Prompts:**

- "Update the status section in BOTH `docs/business-requirements/epic-X-name/README.md` AND `docs/issue-implementation/epic-X-name/README.md` and all related story files. Check for missing, outdated, or incorrectly formatted status sections in BOTH documents."
- "Finalize all documentation, ensuring all changes and clarifications are included."
- "Update file-level comments in code files if any changes were made during closure. List any files with outdated or missing comments."

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

**AI Prompts:**

- "Create commit message using Conventional Commits format (type: scope: message). Ensure the scope references the correct story/epic and the message is clear and descriptive. List any commit messages that do not meet these standards."
- "Update `CHANGELOG.md` with a summary of all relevant changes for the release. Check for missing, incomplete, or unclear release notes."

**Check:**

- "Is the commit message fully compliant with Conventional Commits (type, scope, message), scoped to the correct story/epic, and clear? Are release notes in `CHANGELOG.md` complete, accurate, and descriptive?"

### Command Reference

```
create/commit/message --type "feat|fix|docs|style|refactor|test|chore" --scope "story-X-Y" --guideline "docs/workflow.md"
update/release/notes --file "CHANGELOG.md" --guideline "docs/conventions.md"
```
