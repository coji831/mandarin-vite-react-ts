# Issue Implementation Format Examples

This directory contains example templates for technical implementation documentation, optimized for developer and AI comprehension.

## Template Overview

### 1. Small Epic Template ([small-epic-template.md](./small-epic-template.md))

**Purpose**: For smaller technical implementations (1-2 stories) where details can be consolidated in one document.

**Key Characteristics**:

- Consolidated technical details in a single file
- Direct code pattern examples within the document
- Streamlined architecture focused on integration points
- Complete coverage of a small feature set

**When to Use**:

- For focused features with minimal component interactions
- When implementation can be described cohesively in a single document
- For standalone improvements to existing functionality

### 2. Large Epic Template ([large-epic-template.md](./large-epic-template.md))

**Purpose**: For complex technical implementations requiring multiple stories and component interactions.

**Key Characteristics**:

- System-wide architectural overview
- Component relationship documentation
- Cross-cutting technical concerns
- Index of implementation stories with links
- Common patterns that apply across stories

**When to Use**:

- For complex features spanning multiple components
- When implementing new subsystems
- For features requiring significant architectural changes
- When multiple developers will implement different stories

### 3. Story Implementation Template ([story-template.md](./story-template.md))

**Purpose**: For documenting individual implementation stories within a larger epic.

**Key Characteristics**:

- Focused on specific component implementation
- Integration with the broader architecture
- Specific code patterns and examples
- Technical challenges encountered and their solutions

**When to Use**:

- For individual stories within a large epic
- When documenting implementation details for a specific component
- To capture technical decisions for a focused piece of functionality

## Section Structure and Importance

Each template follows a standardized structure with sections marked as [Required] or [Optional].
Additionally, sections are tagged with importance indicators for AI comprehension:

- 🔵 HIGH VALUE - Critical for AI code generation and understanding
- 🟡 MEDIUM VALUE - Provides helpful context for AI assistance
- ⚪ LOW VALUE - Less relevant for AI; useful for human developers

For detailed guidance on creating AI-optimized technical documentation, refer to the main [Issue Implementation Format Guide](../issue-implementation-format.md).
