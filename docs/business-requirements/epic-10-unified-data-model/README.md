# Epic 10: Unified Data Model for Mandarin Feature

## Epic Summary

**Goal:** Unify and normalize all data objects used for vocabulary, progress, and user state in the Mandarin feature. Ensure consistent type definitions, normalized state shape, and clear separation between static vocabulary and user progress, with linkage via `wordId`. Update all components and selectors to use the unified model.

**Key Points:**

- All vocabulary and progress data normalized by `wordId`
- State slices: `dataState`, `progressState`, `userState`, `uiState` with clear responsibilities
- Type definitions for all major objects, with explicit field names
- Selectors join static and progress data via `wordId`
- All components refactored to use unified types
- Data loaders output normalized objects matching the new types
- Documentation updated and cross-referenced

**Status:** Complete
**Last Update:** 2025-11-10

## Background

The Mandarin feature currently uses fragmented and inconsistent data objects for vocabulary, progress, and user state. This leads to maintenance overhead, bugs, and difficulty scaling or adding new features. A unified, normalized model will improve reliability, enable scalable enhancements, and simplify onboarding for new developers.

## User Stories

This epic consists of the following user stories:

1. [**Normalize Vocabulary and Progress Data**](./story-10-1-normalize-data.md)
   - As a developer, I want all vocabulary and progress data to be normalized and linked by `wordId` so that selectors and components can reliably access and join data.
2. [**Refactor Type Definitions**](./story-10-2-type-definitions.md)
   - As a developer, I want clear type definitions for all state objects so that code is maintainable and type-safe.
3. [**Refactor Components to Use Unified Types**](./story-10-3-unified-components.md)
   - As a developer, I want all components to use the unified types so that UI logic is consistent and easy to extend.
4. [**Update Selectors**](./story-10-4-update-selectors.md)
   - As a developer, I want selectors to join static and progress data via `wordId` so that data access is unified and efficient.
5. [**Refactor Data Loaders**](./story-10-5-data-loaders.md)
   - As a developer, I want data loaders to output normalized objects matching the new types so that state initialization is reliable and consistent.
6. [**Update Documentation**](./story-10-6-documentation.md)
   - As a developer, I want documentation to be updated and cross-referenced so that future maintenance and onboarding are easier.

## Story Breakdown Logic

This epic is divided into stories based on the following approach:

- Stories 10.1–10.3 focus on data model definition, type refactoring, and component updates (Planned)
- Stories 10.4–10.5 focus on selectors and data loader updates (Planned)
- Story 10.6 focuses on documentation (Planned)

## Acceptance Criteria

- [x] All vocabulary and progress data normalized by `wordId`
- [x] State slices: `dataState`, `progressState`, `userState`, `uiState` with clear responsibilities
- [x] Type definitions for all major objects, with explicit field names
- [x] Selectors join static and progress data via `wordId`
- [x] All components refactored to use unified types
- [x] Data loaders output normalized objects matching the new types
- [x] Documentation updated and cross-referenced

## Architecture Decisions

- Decision: Use normalized maps and arrays for state shape
  - Rationale: Enables fast lookup, iteration, and reliable linkage
  - Alternatives considered: Flat arrays, nested objects
  - Implications: Requires migration scripts and selector refactoring
- Decision: Separate static vocabulary and user progress, joined only via `wordId`
  - Rationale: Improves maintainability and scalability
  - Alternatives considered: Mixed state shape
  - Implications: Simplifies future enhancements

## Implementation Plan

1. Normalize vocabulary and progress data in state
2. Refactor type definitions for all major objects
3. Update selectors to join data via `wordId`
4. Refactor components to use unified types
5. Refactor data loaders to output normalized objects
6. Update documentation

## Risks & mitigations

- Risk: Refactor may break existing components — Severity: High
  - Mitigation: Incremental migration and thorough testing
  - Rollback: Restore previous state shape and types
- Risk: Data migration for existing users — Severity: Medium
  - Mitigation: Provide migration scripts and fallback logic
  - Rollback: Revert to legacy data loader and state

## Implementation notes

- Conventions: follow `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md`
- Operational notes: coordinate changes across state, components, and loaders for smooth migration
- Links: reference implementation templates at `docs/templates/implementation-large-epic-template.md`
