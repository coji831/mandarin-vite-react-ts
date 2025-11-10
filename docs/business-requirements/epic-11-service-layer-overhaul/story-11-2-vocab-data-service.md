# Story 11.2: Implement Vocabulary Data Service

## Description

**As a** developer,
**I want to** implement a service module for fetching vocabulary lists and words, abstracting all direct fetch/API calls,
**So that** all vocabulary data fetching is centralized, maintainable, and supports fallback/backend swap logic.

## Business Value

Centralizing vocabulary data fetching in a dedicated service enables robust fallback logic, easier backend swaps, and reduces coupling between UI and backend logic. This improves maintainability and reliability.

## Acceptance Criteria

- [ ] All vocabulary data fetching is routed through the new service
- [ ] Service provides fallback logic (e.g., alternate endpoint, local cache)

## Business Rules

1. All vocabulary data fetching must use the new service in `src/features/mandarin/services/`
2. Fallback logic must be implemented and documented
3. Direct fetch/API calls in components/pages are not allowed

## Related Issues

- [Epic 11](./README.md) (parent epic)
- [Story 11.1](./story-11.1-design-service-interfaces.md) (service interface design)
- [Story 11.3](./story-11.3-audio-service.md) (audio service)

## Implementation Status

- **Status**: Planned
- **PR**: N/A
- **Merge Date**: N/A
- **Key Commit**: N/A

---

_Last updated: 2025-11-10_
