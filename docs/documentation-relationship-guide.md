# Documentation Relationship Guide

This guide explains how different documentation formats in this project work together to provide complete coverage of both business and technical aspects.

## Document Relationship Map

The Business Requirements and Technical Implementation documents work together as complementary resources:

```
┌─────────────────────────────┐         ┌───────────────────────────────────────┐
│  BUSINESS REQUIREMENTS      │         │  TECHNICAL IMPLEMENTATION             │
├─────────────────────────────┤         ├───────────────────────────────────────┤
│                             │         │                                       │
│  • Epic Summary [R] ────────┼─────────┼──> • Technical Overview [R]           │
│  • Status [R] ──────────────┼─────────┼──> • Status [R]                       │
│  • Background [R]           │         │    • Architecture Decisions [R]       │
│  • User Stories [R] ────────┼─────────┼──> • Technical Implementation [R]     │
│  • Story Breakdown [R]* ────┼─────────┼──> • Design Decisions & Tradeoffs [R] │
│  • Acceptance Criteria [R] ─┼─────────┼──> • Testing Information [O]          │
│  • Implementation Plan [R] ─┼─────────┼──> • Known Issues & Limitations [R]   │
│  • Technical Context [O]    │         │    • API Endpoints [O]                │
│  • Stakeholders [O]         │         │    • Component Reference [O]          │
│  • Business Metrics [O]     │         │    • References [O]                   │
│                             │         │                                       │
└─────────────────────────────┘         └───────────────────────────────────────┘
   Optimized for:                          Optimized for:
   • Business stakeholders                 • Developers
   • Project managers                      • AI coding agents
   • Non-technical team members            • Future maintenance

[R] = Required section
[O] = Optional section
* = Required only for large epics (3+ stories)
```

## Content Separation Guide

### Business Requirements Format

The [Business Requirements Format](./business-requirements/business-requirements-format.md) should contain:

#### Required Sections

- Epic Summary - Business objectives and goals
- Status - Current implementation status
- Background - Context and business rationale
- User Stories - Formatted using "As a... I want... so that..."
- Story Breakdown Logic (for large epics only) - How and why stories were divided
- Acceptance Criteria - Specific, testable conditions
- Implementation Plan - High-level approach and strategy

#### Optional Sections

- Implementation Timeline - Project milestones and deadlines
- Technical Context - Brief technical context for business decisions
- Stakeholders - Stakeholder information and requirements
- Business Metrics - KPIs and success metrics
- Template Usage - Documentation on template usage (in templates only)

### Technical Implementation Format

The [Issue Implementation Format](./issue-implementation/issue-implementation-format.md) should contain:

#### Required Sections

- Technical Overview - Technical objectives and implementation scope
- Status - Current implementation status
- Architecture Decisions - Key technical choices with rationale
- Technical Implementation - Architecture, components, and flows
- Design Decisions & Tradeoffs - Technical reasoning and alternatives
- Known Issues & Limitations - Identified technical constraints

#### Optional Sections

- Configuration - Environment variables and config files
- API Endpoints - Interface definitions if applicable
- Testing Information - Test coverage and verification approach
- Component Reference - Core components and relationships
- References - Links to related technical documentation
- Lessons Learned & Future Considerations - Key insights and improvement areas

## Documentation Workflow

1. **Select Appropriate Template**:

   - Determine epic size (small: 1-2 stories, large: 3+ stories)
   - Choose template based on [Template Selection Guide](./business-requirements/business-requirements-format.md#template-selection-guide)
   - Consider business complexity and implementation needs

2. **Start with Business Requirements**:

   - Define the epic and stories from a business perspective
   - Focus on user needs and business value
   - Create GitHub issues based on these requirements
   - Ensure all required sections are completed

3. **Develop Technical Implementation**:

   - Reference business requirements
   - Document technical decisions and implementation details
   - Provide code patterns and architecture information
   - Match the document structure (small/large epic approach)

4. **Update Status Information**:
   - Keep implementation status updated in both documents
   - Link to relevant PRs and commits
   - Document any deviations from original plans
   - Ensure cross-document references remain valid

## Cross-Document References

When referencing between documents:

- **From Business Requirements to Technical Implementation**:

  ```markdown
  For technical details, see [Technical Implementation](../issue-implementation/epic-1-name/README.md)
  ```

- **From Technical Implementation to Business Requirements**:

  ```markdown
  For business context and user stories, see [Business Requirements](../business-requirements/epic-1-name/README.md)
  ```

- **Story to Epic References**:

  ```markdown
  This story is part of [Epic X: Epic Name](./README.md)
  ```

- **Issue Reference Format**:
  ```markdown
  #123 / [**Issue Title**](./relative-path-to-template.md)
  ```

## Epic Size Considerations

Both documentation formats support different approaches based on epic size:

### Small Epics (1-2 stories)

- **Consolidated documentation** - Document epic and story details in one README.md
- **Simplified structure** - Use abbreviated template focusing on core sections
- **Single User Story section** - Use "User Story" instead of "User Stories"
- **Consolidated criteria** - Combine epic and story acceptance criteria in one section

### Large Epics (3+ stories)

- **Split documentation** - Use README.md for epic overview and separate files for stories
- **Required Story Breakdown Logic section** - Explain how and why the epic breaks into distinct stories
- **Multiple User Stories** - Use "User Stories" section with list of stories
- **Cross-references** - Link related stories and maintain relationship documentation
- **Delegated details** - Keep epic README concise, put specifics in story documents

This separation ensures that each document serves its intended audience while maintaining clear cross-references between business and technical aspects.
