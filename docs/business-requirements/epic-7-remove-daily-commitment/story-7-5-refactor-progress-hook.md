# Story 7.5: Refactor useMandarinProgress API

## Description

**As a** developer,
**I want to** refactor `useMandarinProgress` to expose list-focused APIs (`selectVocabularyList`, `loadProgressForList`, `markWordLearned`) and remove `selectedSectionId`,
**So that** components use a consistent, list-first progress API.

## Business Value

Cleaner APIs reduce bugs, make tests simpler, and align component behavior with the new data model.

## Acceptance Criteria

- [ ] `useMandarinProgress` exposes the new APIs and deprecates section-based APIs.
- [ ] Backward compatibility adapter is available while migrating.
- [ ] Unit tests cover the new API surface.

## Related Issues

## Implementation Status

**Status:** Completed
**Last Update:** 2025-10-08
