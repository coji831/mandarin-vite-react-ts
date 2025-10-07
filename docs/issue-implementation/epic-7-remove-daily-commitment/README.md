# Epic 7 Implementation: Remove Daily-Commit Flow — Simplify Vocabulary → Flashcard Flow

## Implementation Summary

This document tracks the technical implementation of Epic 7, which removes the daily commitment and section-selection workflow, migrating to a list-based flashcard flow with per-list progress.

## Technical Rationale

- Migrates from section-based progress to per-list, per-word progress keyed by `wordId` and stable `listId`.
- Refactors routing, navigation, and progress persistence for a simpler, more robust UX.
- Ensures migration is safe, idempotent, and reversible.

## Implementation Steps

1. Data model & loader updates
2. Routing & navigation changes
3. Refactor hooks & UI components
4. Show per-list progress on ListSelect page cards
5. Archive/remove legacy pages & code
6. Update docs and references

## Key Decisions

- Use `listId` for all vocabulary list routing and progress.
- Remove all daily commitment and section-based code.
- Implement feature flags for migration window if needed.

## Risks & Mitigations

- Risk: Data loss during migration — Mitigation: local backup, rollback docs
- Risk: Deep-link breakage — Mitigation: compatibility redirects
- Risk: Performance issues with large lists — Mitigation: lazy loading, virtualization

## Status

- **Status:** Planned
- **Last Update:** 2025-10-07

## Related Business Requirements

- [Epic 7 BR README](../../business-requirements/epic-7-remove-daily-commitment/README.md)

## Related Stories

See individual story implementation docs in this folder.
