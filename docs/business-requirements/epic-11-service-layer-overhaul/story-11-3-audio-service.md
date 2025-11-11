# Story 11.3: Implement Audio (TTS) Service

## Description

**As a** developer,
**I want to** implement a service module for TTS audio fetching, abstracting all direct fetch/API calls,
**So that** all TTS/audio fetching is centralized, maintainable, and supports fallback/backend swap logic.

## Business Value

Centralizing TTS/audio fetching in a dedicated service enables robust fallback logic, easier backend swaps, and reduces coupling between UI and backend logic. This improves maintainability and reliability.

## Acceptance Criteria

- [x] All TTS/audio fetching is routed through the new service
- [x] Service provides fallback logic (e.g., alternate API, local audio)

## Business Rules

1. All TTS/audio fetching must use the new service in `src/features/mandarin/services/`
2. Fallback logic must be implemented and documented
3. Direct fetch/API calls in components/pages are not allowed

## Related Issues

- [Epic 11](./README.md) (parent epic)
- [Story 11.1](./story-11.1-design-service-interfaces.md) (service interface design)
- [Story 11.2](./story-11.2-vocab-data-service.md) (vocab data service)

## Implementation Status

- **Status**: Complete
- **PR**: See Epic 11 PR or implementation doc
- **Merge Date**: 2025-11-10
- **Key Commit**: See repo history for Epic 11, Story 3

---

_Last updated: 2025-11-10_
