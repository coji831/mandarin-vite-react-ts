# Issue Implementation Format Guide

## Overview

This document provides standardized templates for technical implementation documentation.

> **KEY POINTS**:
>
> - **Technical focus**: Captures implementation details, patterns, and architecture
> - **AI optimization**: Structured for maximum AI comprehension and assistance
> - **Audience**: Developers and AI coding agents

## Document Focus

The Technical Implementation documents should:

1. **Prioritize technical details** 🔵 - Focus on patterns, architecture, and implementation
2. **Include practical code examples** 🔵 - Provide representative code patterns
3. **Explain technical decisions** 🔵 - Document why certain technical choices were made
4. **Document relationships** 🟡 - Clarify how components interact with each other
5. **Support AI assistance** 🔵 - Structure documentation to optimize for AI comprehension

## Epic Size Guidelines

### For Small Epics (1-2 stories)

1. **Consolidated document** - Use a single README.md with comprehensive technical details
2. **Direct code patterns** - Include implementation patterns directly in the epic document
3. **Simplified architecture** - Focus on integration with existing systems rather than complex architecture
4. **Streamlined sections** - Use only the most relevant sections for small implementations

### For Large Epics (3+ stories)

1. **Split documentation** - Use README.md for epic overview and separate files for stories
2. **High-level overview** - Keep the epic README focused on system-wide patterns and decisions
3. **Component diagrams** - Include relationship diagrams showing major subsystems
4. **Cross-cutting concerns** - Document authentication, logging, error handling at epic level
5. **Implementation index** - Include links to detailed story implementation documents

## Template Structures

### Epic Template Structure

Epic templates should include:

#### [Required] Sections

1. **Title**: Clear, descriptive title 🔵
2. **Technical Overview**: Technical objectives and implementation scope 🔵
3. **Status**: Current implementation status 🟡
4. **Architecture Decisions**: Key technical choices with rationale 🔵
5. **Technical Implementation**: Architecture, components, and flows 🔵
6. **Design Decisions & Tradeoffs**: Technical reasoning and alternatives 🔵
7. **Known Issues & Limitations**: Identified technical constraints 🔵

#### [Optional] Sections

8. **Configuration**: Environment variables and config files 🟡
9. **API Endpoints**: Interface definitions if applicable 🔵
10. **Testing Information**: Test coverage and verification approach 🟡
11. **Component Reference**: Core components and relationships (keep concise, reference detailed docs) 🔵
12. **References**: Links to related technical documentation 🟡
13. **Lessons Learned & Future Considerations**: Key insights and improvement areas (combined, concise) 🟡

### Story Implementation Structure

Story templates should include:

#### [Required] Sections

1. **Title**: Clear, descriptive title 🔵
2. **Technical Scope**: Specific components and functionality 🔵
3. **Implementation Details**: Code patterns and approach 🔵
4. **Architecture Integration**: Connection to broader system 🔵
5. **Technical Challenges & Solutions**: Problems encountered and resolved 🔵

#### [Optional] Sections

6. **Testing Implementation**: Specific test approaches for this story 🟡
7. **Performance Considerations**: Optimization approaches 🟡
8. **Security Implications**: Security-related implementation details 🟡
9. **Accessibility Considerations**: A11y implementation details ⚪

## Template Selection Guide

Use the following guide to select the appropriate template:

| Implementation Type      | Use Template        | When to Use                                               |
| ------------------------ | ------------------- | --------------------------------------------------------- |
| Small Epic (1-2 stories) | Small Epic Template | For focused features with minimal component interactions  |
| Large Epic (3+ stories)  | Large Epic Template | For complex features with multiple component interactions |
| Individual Story         | Story Template      | For specific implementation stories within large epics    |

All templates are located in the [examples directory](./examples/) and include:

- [Small Epic Template](./examples/small-epic-template.md) - For epics with 1-2 stories
- [Large Epic Template](./examples/large-epic-template.md) - For epics with 3+ stories
- [Story Template](./examples/story-template.md) - For individual story implementations

See the [examples README](./examples/README.md) for detailed information on each template's structure and sections.

## Epic-to-Story Technical Relationship Guidelines

When managing large epics with multiple stories:

### In the Epic Document

1. **Provide system architecture** - Focus on the overall technical architecture and patterns
2. **Define component boundaries** - Establish clear interfaces between components
3. **Document cross-cutting concerns** - Address authentication, logging, and error handling
4. **Define data flows** - Document key data structures and how they flow through the system
5. **Establish coding patterns** - Document patterns that should be consistent across stories

### In Story Documents

1. **Reference epic architecture** - Show how this story fits into the larger architecture
2. **Maintain pattern consistency** - Follow patterns established in the epic document
3. **Document integration points** - Clearly explain how this component interacts with others
4. **Capture implementation challenges** - Document specific technical hurdles and solutions
5. **Include representative code** - Show actual implementation patterns used

For information on how this document relates to business requirements documentation, see the [Documentation Relationship Guide](../documentation-relationship-guide.md).

## Organization and Structure

### Folder Structure

```

issue-implementation/
└── epic-<number>-<epic-name>/
├── README.md - Epic technical overview
└── story-<epic-number>-<story-number>-<story-name>.md - Individual story implementations

```

### Naming Conventions

- Epic directories: `epic-<number>-<epic-name>`
- Epic overview: `README.md` within each epic directory
- Story files: `story-<epic-number>-<story-number>-<descriptive-name>.md`

## GitHub PR Integration

### Technical PR Template

```

## Implementation Reference

- Epic: #<epic-number>
- Story: #<story-number>
- Documentation: [Implementation Doc](../issue-implementation/epic-<num>/story-<num>.md)

## Technical Overview

Brief technical description of what was implemented.

## Testing

How this implementation was tested.

## Screenshots

(If applicable, include screenshots of UI changes)

```

### Commit Message Format

```

[Epic-<num>/Story-<num>] Brief description of the change

More detailed explanation if needed. Reference technical implementation document.

```

### Code Review Guidelines

1. Verify implementation follows the documented architecture decisions
2. Ensure code patterns match those defined in the technical documentation
3. Check that integration points match the technical design
4. Validate that technical challenges were addressed according to documentation

## AI Optimization Guidelines

### Section Importance Indicators

- **HIGH VALUE sections** (🔵): Critical for AI code generation and modification
- **MEDIUM VALUE sections** (🟡): Provides helpful context for AI assistance
- **LOW VALUE sections** (⚪): Less relevant for AI; move to Business Requirements

### AI-Friendly Documentation by Stage

#### When Creating Documentation

1. **Structure with clarity** - Use consistent header levels and section ordering
2. **Provide context first** - Start with overview before diving into details
3. **Use precise terminology** - Match variable/component names exactly as in code
4. **Show relationships** - Make component interactions explicit with diagrams or descriptions
5. **Include rationale** - Always explain "why" alongside "what" was implemented

#### When Reviewing Documentation

1. **Verify terminology consistency** - Ensure terms match actual code identifiers
2. **Check for relationship clarity** - Confirm component interactions are clearly documented
3. **Validate decision explanations** - Ensure technical choices have clear rationales
4. **Look for pattern examples** - Confirm code patterns are explicitly documented
5. **Ensure navigability** - Check that section structure is consistent and logical

#### When Updating Documentation

1. **Maintain section order** - Keep the established section structure
2. **Update relationships** - Adjust component interaction documentation
3. **Preserve decisions history** - Add to, don't replace, technical decision explanations
4. **Update code examples** - Ensure code patterns reflect current implementation
5. **Maintain cross-references** - Verify links to related documentation remain valid

### Documentation Conciseness Guidelines

1. **Be concise** - Keep descriptions brief and focused on technical essence
2. **Use formatting** - Utilize headers, lists, and tables to organize information
3. **Reference over duplication** - Link to detailed docs rather than duplicating content
4. **Prioritize technical value** - Include information based on its technical relevance
5. **Combine related sections** - Merge related optional sections when appropriate

## AI-Optimized Quick Reference

When documenting for AI assistance:

1. **Prioritize code patterns** 🔵 - Show representative, non-trivial code examples
2. **Explain relationships** 🔵 - Document how components interact, not just their purpose
3. **Include "why"** 🔵 - Explain rationale behind technical decisions
4. **Document constraints** 🔵 - Note limitations, edge cases, and workarounds
5. **Use consistent terminology** 🔵 - Match naming patterns in code and documentation
6. **Balance detail and brevity** 🔵 - Provide enough context without overwhelming detail
