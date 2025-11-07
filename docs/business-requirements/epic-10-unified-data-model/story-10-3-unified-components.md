# Story 10.3: Refactor Components to Use Unified Types

## Description

**As a** developer,
**I want to** refactor all components to use unified types for props and state,
**So that** UI logic is consistent, maintainable, and easy to extend.

## Business Value

Unified types in components reduce bugs, improve maintainability, and enable scalable UI features. They support consistent data flow and easier onboarding.

## Acceptance Criteria

- [ ] All components accept unified types for props and state
- [ ] Component logic uses normalized selectors
- [ ] Tests verify component usage of unified types

## Business Rules

1. All component props and state must use explicit unified types
2. Components must use selectors to access normalized state
3. No prop drilling; use context/hooks for state access

## Related Issues

- #10.1 / [**Normalize Vocabulary and Progress Data**](./story-10-1-normalize-data.md) (depends on)
- #10.2 / [**Refactor Type Definitions**](./story-10-2-type-definitions.md) (depends on)

## Implementation Status

- **Status**: Planned
- **PR**: #
- **Merge Date**:
- **Key Commit**:
