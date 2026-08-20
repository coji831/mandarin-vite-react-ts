# Story 10.4: Update Selectors

## Description

**As a** developer,
**I want to** update selectors to join static and progress data via `wordId`,
**So that** data access is unified, efficient, and reliable for all components.

## Business Value

Unified selectors improve data access, reduce bugs, and support scalable features. They ensure components receive joined data for consistent UI logic.

## Acceptance Criteria

- [x] Selectors join static and progress data via `wordId`
- [x] All components use updated selectors
- [x] Tests verify selector logic and data joining

## Business Rules

1. Selectors must join data from normalized maps using `wordId`
2. No direct access to state slices from components
3. Selector logic must be documented in the implementation doc

## Related Issues

- #10.1 / [**Normalize Vocabulary and Progress Data**](./story-10-1-normalize-data.md) (depends on)
- #10.3 / [**Refactor Components to Use Unified Types**](./story-10-3-unified-components.md) (depends on)

## Implementation Status

- **Status**: Completed
- **PR**: #
- **Merge Date**:
- **Key Commit**:
