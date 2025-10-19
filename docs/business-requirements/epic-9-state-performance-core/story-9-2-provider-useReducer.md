# Story 9.2 — Provider -> useReducer

## Description

**As a** platform engineer,
**I want** the `Progress` provider internals converted to `useReducer` with an exported initial state,
**So that** provider initialization is testable, stable, and can reset legacy persisted progress reliably.

## Business Value

Improves testability and reduces runtime bugs by centralizing state updates in a reducer; ensures a deterministic startup state for the feature.

## Acceptance Criteria

- [ ] `Progress` provider wired to `useReducer` with exported `initialState`.
- [ ] Legacy persisted progress (if found) is cleared during provider initialization to ensure a normalized start state.
- [ ] Provider internals are covered by unit tests verifying initialization and reset behavior.

## Business Rules

1. Do not change consumer imports in this story.
2. Provider initialization must clear legacy persisted progress when detected.

## Related Issues

- `docs/business-requirements/epic-9-state-performance-core/README.md` (Epic 9)

## Implementation Status

- **Status**: Planned
- **PR**: #[PR-NUMBER]
- **Merge Date**: [Date]
- **Key Commit**: [commit-hash]

## User Journey [Optional]

- Notes: Keep public API stable during this story; do not yet change consumer imports.

## Business Rules

1. Do not change consumer imports in this story.
2. Provider initialization must clear legacy persisted progress when detected.
