# Story 10.5: Refactor Data Loaders

## Description

**As a** developer,
**I want to** refactor data loaders to output normalized objects matching the new types,
**So that** state initialization is reliable, consistent, and maintainable.

## Business Value

Normalized data loaders ensure reliable state initialization, reduce bugs, and support future enhancements. They simplify onboarding and maintenance.

## Acceptance Criteria

- [ ] Data loaders output normalized objects matching the new types
- [ ] State initialization uses normalized data
- [ ] Tests verify loader output and state shape

## Business Rules

1. Data loaders must output objects matching the unified types
2. No direct mutation of loaded data
3. Loader logic must be documented in the implementation doc

## Related Issues

- #10.2 / [**Refactor Type Definitions**](./story-10-2-type-definitions.md) (depends on)
- #10.4 / [**Update Selectors**](./story-10-4-selectors.md) (depends on)

## Implementation Status

- **Status**: Planned
- **PR**: #
- **Merge Date**:
- **Key Commit**:
