# Story 7.13: Archive/remove commitment & section pages

## Description

**As a** developer,
**I want to** archive or remove `DailyCommitmentPage`, `SectionSelectPage`, and related pages to reduce dead code,
**So that** the codebase remains maintainable and free of unused flows.

## Business Value

Removing dead code simplifies maintenance and reduces surface area for bugs.

## Acceptance Criteria

- [ ] Identify and archive or remove legacy pages and related routes after migration verification.
- [ ] Update imports and references; run tests to ensure no regressions.

## Business Rules

1. Archival should be reversible until the release cutover.

## Related Issues

- #7 / [**Epic 7: Remove Daily-Commit Flow**](./README.md) (parent)

## Implementation Status

- **Status**: Completed
