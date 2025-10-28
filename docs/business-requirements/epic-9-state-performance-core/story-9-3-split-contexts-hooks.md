# Story 9.3 — Split Contexts & Hooks

## Description

**As a** performance-focused engineer,
**I want** separate `ProgressStateContext` and `ProgressDispatchContext` plus selector and action hooks,
**So that** consumers can subscribe to minimal slices of state and avoid unnecessary re-renders.

## Business Value

Reduces render churn in heavy components and improves UI responsiveness for users interacting with vocabulary and conversation features.

## Acceptance Criteria

- [ ] Add `ProgressStateContext` and `ProgressDispatchContext` and update provider exports.
- [ ] Implement `useProgressState(selector)` and `useProgressActions()` with memoized outputs.
- [ ] Convert at least two high-frequency components (e.g., `VocabularyCard`, `ConversationTurns`) to use the new hooks.

## Business Rules

1. Implement incrementally starting with heaviest consumers.
2. Hooks must return stable references for actions.

## Related Issues

- `docs/business-requirements/epic-9-state-performance-core/README.md` (Epic 9)

## Implementation Status

- **Status**: Planned
- **PR**: #[PR-NUMBER]
- **Merge Date**: [Date]
- **Key Commit**: [commit-hash]

## User Journey [Optional]

- Notes: This story should be implemented incrementally: pick the heaviest consumers first.

## Business Rules

1. Implement incrementally starting with heaviest consumers.
2. Hooks must return stable references for actions.
