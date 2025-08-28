# Story 3-7: Refactor SectionConfirm to Use Context (Business Requirement)

## Story Summary

Refactor the `SectionConfirm` component to consume Mandarin context directly, removing all progress-related props for a cleaner interface.

## Status

Planned

## Epic Reference

Epic 3: State Management Refactor

## Background

Direct context consumption eliminates prop drilling and simplifies the component interface, making future changes easier.

## Business Rationale

- Simplifies component interface
- Eliminates prop drilling
- Improves maintainability

## Acceptance Criteria

- `SectionConfirm` uses the consumer hook for all state/actions
- All progress-related props are removed
- Component functionality remains unchanged

## Dependencies

Story 3-4: Create Consumer Hook and Add Types

## Related Issues

Epic 3: State Management Refactor
