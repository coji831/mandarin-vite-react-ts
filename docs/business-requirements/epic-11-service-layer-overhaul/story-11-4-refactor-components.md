# Story 11.4: Refactor Components to Use Services

## Description

**As a** developer,
**I want to** refactor all components and pages (e.g., PlayButton, FlashCardPage, VocabularyListPage) to use the new service layer,
**So that** UI code is decoupled from backend details and all data/audio access is consistent and maintainable.

## Business Value

Refactoring all components to use the new service layer ensures maintainability, testability, and backend flexibility. It reduces coupling and makes future backend changes or fallback logic easier to implement.

## Acceptance Criteria

- [ ] No direct fetch/API calls in components
- [ ] All data/audio access goes through service functions

## Business Rules

1. All data/audio access in components/pages must use the new service layer
2. No direct fetch/API calls are allowed in UI code
3. Refactored components must pass all existing tests

## Related Issues

- [Epic 11](./README.md) (parent epic)
- [Story 11.2](./story-11.2-vocab-data-service.md) (vocab data service)
- [Story 11.3](./story-11.3-audio-service.md) (audio service)

## Implementation Status

- **Status**: Planned
- **PR**: N/A
- **Merge Date**: N/A
- **Key Commit**: N/A

---

_Last updated: 2025-11-10_
