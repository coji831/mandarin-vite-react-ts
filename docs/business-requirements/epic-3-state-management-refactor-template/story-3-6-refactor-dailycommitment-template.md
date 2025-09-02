# Story 3-6: Refactor DailyCommitment to Use Context (Business Requirement)

## Story Summary

Refactor the `DailyCommitment` component to consume Mandarin context directly, removing all progress-related props for a cleaner interface.

## Status

Completed

## Epic Reference

Epic 3: State Management Refactor

## Background

Direct context consumption eliminates prop drilling and simplifies the component interface, making future changes easier.

## Business Rationale

- Simplifies component interface
- Eliminates prop drilling
- Improves maintainability

## Acceptance Criteria

- `DailyCommitment` uses the consumer hook for all state/actions
- All progress-related props are removed
- Component functionality remains unchanged

## Dependencies

Story 3-4: Create Consumer Hook and Add Types

## Related Issues

Epic 3: State Management Refactor
