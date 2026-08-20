# Story 10.1: Normalize Vocabulary and Progress Data

## Description

**As a** developer,
**I want to** normalize all vocabulary and progress data in state, linking via `wordId`,
**So that** selectors and components can reliably access and join data.

## Business Value

Normalized state enables reliable data access, reduces bugs, and improves maintainability. It supports scalable features and simplifies onboarding for new developers.

## Acceptance Criteria

- [x] State slices use normalized maps and arrays for vocabulary and progress
- [x] All selectors join static and progress data via `wordId`
- [x] Tests verify normalization and linkage

## Business Rules

1. All vocabulary and progress data must be accessible via `wordId`
2. No direct mutation of state objects
3. Selectors must return joined data for UI components

## Related Issues

- #10.2 / [**Refactor Type Definitions**](./story-10-2-type-definitions.md) (depends on)
- #10.3 / [**Refactor Components to Use Unified Types**](./story-10-3-unified-components.md) (depends on)

## Implementation Status

- **Status**: Completed
- **PR**: #
- **Merge Date**:
- **Key Commit**:
