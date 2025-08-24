# Business Requirements Format Examples

This directory contains example templates for the business requirements format. These templates provide standardized structures for documenting business requirements across different types of work items.

## Template Types

### 1. Small Epic Template

**When to use:** For epics with 1-2 stories or self-contained features that don't need to be broken down further.

**Sections:**

- Epic Summary [Required]
- Status [Required]
- Background [Required]
- User Story [Required] (use singular for small epics)
- Acceptance Criteria [Required]
- Implementation Plan [Required]
- Implementation Status [Required]
- Business Metrics [Optional]
- Stakeholders [Optional]
- Technical Context [Optional]
- Implementation Timeline [Optional]

**Template file:** [small-epic-template.md](./small-epic-template.md)

### 2. Large Epic Template

**When to use:** For epics with 3+ stories or complex features that need to be broken down into multiple stories.

**Sections:**

- Epic Summary [Required]
- Status [Required]
- Background [Required]
- User Stories [Required]
- Story Breakdown Logic [Required]
- Acceptance Criteria [Required]
- Implementation Plan [Required]
- Implementation Status [Required]
- Business Metrics [Optional]
- Stakeholders [Optional]
- Technical Context [Optional]
- Implementation Timeline [Optional]

**Template file:** [large-epic-template.md](./large-epic-template.md)

### 3. Story Template

**When to use:** For individual story implementations within larger epics.

**Sections:**

- Title [Required]
- Description [Required]
- Business Value [Required]
- Acceptance Criteria [Required]
- Business Rules [Required]
- Related Issues [Required]
- Implementation Status [Required]
- User Journey [Optional]
- Technical Context [Optional]
- UX/UI Considerations [Optional]
- Stakeholder Needs [Optional]

**Template file:** [story-template.md](./story-template.md)

## Usage Guidelines

1. **Section Headers:** Always use the section headers exactly as listed above. Do not add, remove, or rename required sections.
2. **Optional Sections:** Optional sections may be omitted if not relevant.
3. **Singular vs. Plural:** For small epics, use "User Story" (singular); for large epics, use "User Stories" (plural).
4. **Story Breakdown Logic:** This section is required for large epics only, to explain how and why the epic was divided into specific stories.
5. **Cross-referencing:** Maintain consistent links between related documents.

For full guidelines on business requirements documentation, refer to the main [Business Requirements Format Guide](../business-requirements-format.md).
