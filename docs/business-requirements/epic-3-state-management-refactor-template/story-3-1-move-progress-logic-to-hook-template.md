# Story 3-1: Move Progress Tracking Logic to Custom Hook (Business Requirement)

## Story Summary

Move all progress tracking state and functions from `Mandarin.tsx` into a new custom hook `useMandarinProgress` to improve maintainability and separation of concerns.

## Status

Planned

## Epic Reference

Epic 3: State Management Refactor

## Background

Currently, progress tracking logic is tightly coupled with UI logic in `Mandarin.tsx`. This makes the component hard to maintain and extend. Decoupling this logic into a hook will make future changes easier and safer.

## Business Rationale

- Improves code organization and maintainability
- Enables easier future enhancements
- Reduces risk of bugs due to tightly coupled logic

## Acceptance Criteria

- Progress tracking logic is moved to a custom hook
- Main component only uses the hook
- No progress logic remains in the main component

## Dependencies

None

## Related Issues

Epic 3: State Management Refactor
