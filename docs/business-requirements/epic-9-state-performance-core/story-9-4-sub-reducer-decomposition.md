# Story 9.4 — Sub-Reducer Decomposition

## Description

**As a** maintainer,
**I want** the large progress reducer decomposed into focused sub-reducers (`listsReducer`, `userReducer`, `uiReducer`),
**So that** each part of state logic is testable in isolation and easier to maintain.

## Business Value

Improves maintainability and test granularity; enables targeted unit tests and clearer change impact boundaries for reviewers.

## Acceptance Criteria

- [ ] Implement `listsReducer`, `userReducer`, and `uiReducer` and export them for targeted unit tests.
- [ ] Create `rootReducer` that composes sub-reducers and is used by the `Progress` provider.
- [ ] Add unit tests covering sub-reducer behaviors and interactions.

## Business Rules

1. Changes must be compatible with provider `rootReducer` composition.
2. Unit tests should target sub-reducers in isolation.

## Related Issues

- `docs/business-requirements/epic-9-state-performance-core/README.md` (Epic 9)

## Implementation Status

- **Status**: Planned
- **PR**: #[PR-NUMBER]
- **Merge Date**: [Date]
- **Key Commit**: [commit-hash]

## User Journey [Optional]

- Notes: This work should be done after the provider has been converted to `useReducer` (stories 9.1–9.3).

## Business Rules

1. Changes must be compatible with provider `rootReducer` composition.
2. Unit tests should target sub-reducers in isolation.
