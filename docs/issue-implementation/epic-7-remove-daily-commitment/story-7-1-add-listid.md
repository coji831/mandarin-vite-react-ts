# Story 7.1 Implementation: Add stable listId to vocabulary manifests & normalize wordId

## Technical Rationale

Add a stable `id` (listId) to each vocabulary manifest and normalize `wordId` to string for reliable routing and progress tracking.

## Implementation Steps

1. Update vocabulary manifest schema to include `id` and `name` fields
2. Refactor `csvLoader` to normalize `wordId` to string
3. Add validation and duplicate detection logic
4. Write unit tests for normalization and validation

## Key Decisions

- Use string `id` for all manifests
- Reject or log duplicate/missing wordIds

## Risks & Mitigations

- Risk: Data inconsistency — Mitigation: strict validation, test coverage

## Status

- **Status:** Planned
- **Last Update:** 2025-10-07

## Related Business Requirement

- [Story 7.1 BR](../../business-requirements/epic-7-remove-daily-commitment/story-7-1-add-listid.md)
