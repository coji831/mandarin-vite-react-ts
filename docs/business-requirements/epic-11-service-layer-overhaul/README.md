# Epic 11: Service Layer Overhaul for Data & Audio

## Epic Summary

**Goal:** Design and implement a unified, robust, and easily swappable service layer for all data and audio (TTS) fetching in the Mandarin learning app.

**Key Points:**

- All data/audio fetching logic will be abstracted behind a service layer
- Enables backend flexibility and robust fallback logic
- Improves maintainability and testability
- Decouples UI from backend implementation details
- Provides a single point for error handling and configuration

**Status:** Complete

**Last Update:** 2025-11-11

## Background

Current data and audio fetching logic is scattered and tightly coupled to specific APIs or backend implementations. There is no unified abstraction for data/audio services, making backend swaps or fallback logic difficult. A robust service layer will improve maintainability, enable easier backend changes, and provide a single point for error handling and fallback.

## User Stories

This epic consists of the following user stories:

1. [Story 11.1: Design Unified Service Layer Interfaces](./story-11.1-design-service-interfaces.md)
   - As a developer, I want clear interfaces and base classes for all data/audio services, so that future changes and backend swaps are easy and safe.
2. [Story 11.2: Implement Vocabulary Data Service](./story-11.2-vocab-data-service.md)
   - As a developer, I want all vocabulary data fetching to go through a dedicated service, so that fallback and backend swap logic is centralized.
3. [Story 11.3: Implement Audio (TTS) Service](./story-11.3-audio-service.md)
   - As a developer, I want all TTS/audio fetching to go through a dedicated service, so that fallback and backend swap logic is centralized.
4. [Story 11.4: Refactor Components to Use Services](./story-11.4-refactor-components.md)
   - As a developer, I want all components to use the new service layer, so that UI code is decoupled from backend details.
5. [Story 11.5: Implement and Document Backend Swap & Fallback](./story-11.5-backend-swap-fallback.md)
   - As a developer, I want robust backend swap and fallback logic, so that the app is reliable and maintainable.

## Story Breakdown Logic

- Stories 11.1–11.3 focus on designing and implementing the core service layer and its interfaces (Planned)
- Stories 11.4–11.5 focus on refactoring usage and ensuring robust fallback and backend swap (Planned)

Stories are divided to separate interface design, service implementation, and UI refactor, allowing for incremental delivery and easier review/testing.

## Acceptance Criteria

- [x] All data and audio fetching is routed through the new service layer
- [x] Service layer provides fallback logic for failures (e.g., alternate API, local fallback)
- [x] Backend can be swapped via config or DI with minimal code changes
- [x] All relevant components refactored to use service functions
- [x] Service layer and usage patterns are documented for maintainers

## Architecture Decisions

- Decision: Use TypeScript interfaces and base classes for all service layer contracts
  - Rationale: Ensures type safety and extensibility
  - Alternatives considered: Ad-hoc functions, direct fetch in components
  - Implications: Slightly more boilerplate, but much better maintainability
- Decision: Fallback logic and backend swap via config/DI
  - Rationale: Enables robust error handling and future backend changes

## Implementation Plan

1. Design TypeScript interfaces and base classes for data/audio services
2. Implement vocabulary data service with fallback logic
3. Implement audio (TTS) service with fallback logic
4. Refactor all components/pages to use the new service layer
5. Implement backend swap/configuration logic
6. Update documentation and usage examples

## Risks & mitigations

- Risk: Breaking changes in component data flow — Severity: Medium
  - Mitigation: Incremental refactor, comprehensive tests
  - Rollback: Revert to previous component/service usage
- Risk: Fallback logic complexity — Severity: Medium
  - Mitigation: Clear interface contracts, staged implementation
  - Rollback: Disable fallback, use primary backend only

## Implementation notes

- Conventions: follow `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md`
- Operational notes: All new services must be documented and tested
- Links: reference implementation templates at `docs/templates/epic-implementation-template.md`

---

_Epic Owner: TBD_
_Epic ID: 11_
_Links: [Implementation Doc](../../issue-implementation/epic-11-service-layer-overhaul/README.md)_
