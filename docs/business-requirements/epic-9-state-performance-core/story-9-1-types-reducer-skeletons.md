# Story 9.1 — Types & Reducer Skeletons

## Description

**As a** developer,
**I want** canonical normalized types and reducer skeletons for the Mandarin progress domain,
**So that** downstream work can rely on a stable type surface and unit tests can exercise reducer behavior.

## Business Value

Provides a stable type contract and testing surface so future refactors and consumers can be updated with lower risk and clearer unit tests.

## Acceptance Criteria

- [x] Add `src/features/mandarin/types/ProgressNormalized.ts` (types defined — developer may implement later).
- [x] Add reducer skeletons with basic action types and exported initial state.

## Business Rules

1. Avoid consumer-facing API changes in this story.
2. Keep initial types minimal and extensible.
3. Export `initialState` for test usage.

## Related Issues

- `docs/business-requirements/epic-9-state-performance-core/README.md` (Epic 9)

## Implementation Status

- **Status**: Completed
- **PR**: #[PR-NUMBER]
- **Merge Date**: [Date]
- **Key Commit**: 39dbb5b

## User Journey [Optional]

Notes: This story is low-risk and should avoid changes to consumers.

## Business Rules

1. Avoid consumer-facing API changes in this story.
2. Keep initial types minimal and extensible.
3. Export `initialState` for test usage.
