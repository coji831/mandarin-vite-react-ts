# Business Requirements Format Guide

## Overview

This document provides standardized templates for business requirements documentation.

> **KEY POINTS**:
>
> - **Business focus**: Captures user needs and business context
> - **Technical separation**: Technical details belong in Implementation Format
> - **Audience**: Optimized for stakeholders and business teams

## Document Focus

The Business Requirements documents should:

1. **Prioritize business context** - Focus on user needs, business value, and stakeholder requirements
2. **Include minimal technical context** - Brief technical context is permitted when needed to explain business decisions
3. **Maintain tracking information** - Include implementation status, timelines, and key milestone commits
4. **Explain the "why"** - Focus on the reasons for features rather than implementation details

## Epic Size Guidelines

### For Small Epics (1-2 stories)

1. **Single document approach** - Document epic and story details in one README.md
2. **Simplified structure** - Use abbreviated template focusing on core sections
3. **Consolidated criteria** - Combine epic and story acceptance criteria

### For Large Epics (3+ stories)

1. **Split documentation** - Use README.md for epic overview and separate files for stories
2. **Clear story divisions** - Explain how and why the epic breaks into distinct stories
3. **Cross-references** - Link related stories and maintain relationship documentation
4. **Delegated details** - Keep epic concise, put specifics in story documents
5. **Consistent terminology** - Use same terms and concepts across all documents

## Template Structures

### Epic Template Structure

Epic templates must use the following sections. Required sections are marked **[Required]** and optional sections are marked **[Optional]**. Section headers and order must match exactly in all epic documents and templates.

#### [Required] Sections

1. **Epic Summary**
2. **Status**
3. **Background**
4. **User Stories** (for large epics; for small epics, use **User Story**)
5. **Story Breakdown Logic** (for large epics only)
6. **Acceptance Criteria**
7. **Implementation Plan**

#### [Optional] Sections

8. **Implementation Timeline**
9. **Technical Context**
10. **Stakeholders**
11. **Business Metrics**
12. **Template Usage**

> **Note:** Section order and naming must be consistent across all epic and story documents and templates. See example templates for reference.

### Story Template Structure

Story templates should include:

#### [Required] Sections

1. **Title**: Clear, descriptive title
2. **Description**: User story in standard format ("As a user, I want to..., so that...")
3. **Business Value**: How this story provides value to users/business
4. **Acceptance Criteria**: Specific, testable conditions from user perspective
5. **Business Rules**: Business logic that must be followed
6. **Related Issues**: Links to related issues
7. **Implementation Status**: Current state, PR numbers, and tracking information

#### [Optional] Sections

8. **User Journey**: How this fits into the broader user experience (optional for simpler stories)
9. **Technical Context** (minimal): Brief explanation of technical considerations that impact business decisions
10. **UX/UI Considerations**: User experience requirements (optional until design phase)
11. **Stakeholder Needs**: Specific stakeholder requirements or concerns (optional until needed)

### Issue Reference Format

When referencing issues in documentation, use the following format:

```
#123 / [**Issue Title**](./relative-path-to-template.md)
```

Where:

- **For GitHub Issues**: Copy only the issue number (e.g., `#123`)
- **For Repository**: The entire line maintains working links to the detailed documentation

## Example Templates

This document provides standardized templates that you can use as starting points for your documentation.

### Template Selection Guide

Use the following guide to select the appropriate template:

| Epic Size           | Use Template        | When to Use                                         |
| ------------------- | ------------------- | --------------------------------------------------- |
| Small (1-2 stories) | Small Epic Template | For smaller features or self-contained enhancements |
| Large (3+ stories)  | Large Epic Template | For complex features requiring multiple stories     |
| Individual Story    | Story Template      | For specific implementation stories within epics    |

All templates are located in the [examples directory](./examples/) and include:

- [Small Epic Template](./examples/small-epic-template.md) - For epics with 1-2 stories or no stories
- [Large Epic Template](./examples/large-epic-template.md) - For epics with 3+ stories
- [Story Template](./examples/story-template.md) - For individual story implementations

See the [examples README](./examples/README.md) for detailed information on each template's structure and sections.

## Epic-to-Story Relationship Guidelines

When managing large epics with multiple stories:

### In the Epic Document

1. **Provide a clear overview** - Focus on the big picture and overall business goals
2. **Explain the story breakdown** - Include a section explaining how and why stories were divided
3. **Keep technical details minimal** - Reserve detailed technical explanations for story documents
4. **Maintain a summary status** - Track overall epic progress while detailed status lives in stories

### In Story Documents

1. **Include story-specific details** - Elaborate on the specific requirements for each story
2. **Reference parent epic** - Always link back to the parent epic for context
3. **Explain relationships** - Clarify dependencies between this story and other stories
4. **Provide implementation status** - Track detailed progress, PRs, and commits at the story level

For information on how this document relates to technical implementation documentation, see the [Documentation Relationship Guide](../documentation-relationship-guide.md).

## Organization and Structure

### Folder Structure

```
business-requirements/
└── epic-<number>-<epic-name>/
    ├── README.md - Epic overview (concise but complete)
    └── story-<epic-number>-<story-number>-<story-name>.md - Detailed story requirements
```

### Naming Conventions

- Epic directories: `epic-{number}-{epic-name}`
- Epic overview: `README.md` within each epic directory
- Story files: `story-{epic-number}-{story-number}-{description}.md`

## GitHub Issue Integration

> **Note:** When creating GitHub issues via CLI or automation, the issue body may be cut off if it exceeds platform or buffer limits. Always notify the user if content has been truncated, and recommend including a link to the full documentation or attaching additional details as needed. **The issue description must always include the Acceptance Criteria section, even if other content is truncated.**
> If the issue body is truncated, add a line at the end of the issue to notify the user that the content was cut off due to platform limits.

### GitHub Issue Template

```markdown
## User Story

As a [user role],
I want to [action/feature],
so that [benefit/value].

## Business Value

[1-2 sentences on business impact]

## Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Related Epic

#[epic-issue-number]

## Dependencies

- [ ] #[dependency-issue-number] ([brief description])
```

### Using Templates with GitHub

1. **Create epic issues first** - Use the epic template to establish parent issues
2. **Reference in story issues** - Include epic number in each story issue
3. **Transfer to documentation** - After GitHub creation, copy details to corresponding documentation files

### Repository Documentation

1. Use full format with links for cross-referencing
2. Maintain consistent naming conventions
3. Keep epic READMEs up to date but concise
4. Ensure all links are valid as the folder structure evolves
