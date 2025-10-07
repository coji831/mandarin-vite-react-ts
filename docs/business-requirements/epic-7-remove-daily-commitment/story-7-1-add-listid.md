# Story 7.1: Add stable listId to vocabulary manifests & normalize wordId

## Description

**As a** developer,
**I want to** add a stable `id` (aka `listId`) to each vocabulary manifest and normalize `wordId` values to strings in `csvLoader`,
**So that** routing, deep-links, and progress lookups are reliable and stable across updates.

## Business Value

Stabilizing the list identifier and normalizing `wordId` reduces bugs, simplifies progress persistence, and enables per-list deep links for learners.

## Acceptance Criteria

- [ ] All vocabulary manifests include an `id` string field (documented in Implementation notes).
- [ ] `csvLoader` normalizes `wordId` to string and rejects or logs duplicate/missing ids.
- [ ] Unit tests cover normalization, duplicate detection, and manifest validation.

## Business Rules

1. Manifests must include `id` and `name` fields.
2. `wordId` values must be stable strings.
3. CSV rows missing `wordId` should be flagged and skipped.

## Related Issues

- #7 / [**Epic 7: Remove Daily-Commit Flow**](./README.md) (parent)

## Implementation Status

- **Status**: Planned
