# Epic 10: Unified Data Model for Mandarin Feature

## Epic Summary

**Goal:** Unify and normalize all data objects for vocabulary, progress, and user state in the Mandarin feature, with normalized state shape and linkage via `wordId`.

**Key Points:**

- Normalize all vocabulary and progress data by `wordId`
- Refactor state slices and type definitions
- Update selectors, components, and data loaders
- Documentation and cross-referencing

**Status:** Complete

## Technical Overview

**Implementation Goal:** Refactor all state, selectors, components, and loaders to use a unified, normalized data model for Mandarin vocabulary and progress.
**Status:** Complete
**Last Update:** 2025-11-10
**Completion Note:** All state, types, reducers, selectors, components, and data loaders are now fully normalized and unified by `wordId`. No legacy or duplicate fields remain. All acceptance criteria are met and the implementation is production-ready.

## Architecture Decisions

1. Use normalized maps and arrays for state shape (fast lookup, reliable linkage)
2. Separate static vocabulary and user progress, joined only via `wordId` (maintainability, scalability)

## Technical Implementation

### Architecture

- State slices: `dataState`, `progressState`, `userState`, `uiState`
- Type definitions: `WordBasic`, `WordList`, `WordProgress`, `UserState`, `UiState`
- Selectors join static and progress data via `wordId`
- Components and loaders refactored to use unified types

### Component Relationships

- Vocabulary and progress data flow from loaders to state
- Selectors provide joined data to components
- Components render UI based on unified types

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
