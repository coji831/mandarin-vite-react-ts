# Story 9.5 — Cleanup & Finalization (no migration)

## Description

**As a** release manager,
**I want** the cleanup and finalization work completed after consumer migrations,
**So that** the codebase no longer contains legacy shims and documentation correctly reflects the reset behavior for users.

## Business Value

Removes maintenance burden from legacy code, reduces surface for bugs, and ensures release notes communicate the user-impacting reset behavior clearly.

## Acceptance Criteria

- [ ] Remove or deprecate the legacy flattened `types/Progress.ts` (move to `types/legacy/` with a deprecation notice if desired).
- [ ] Remove the legacy single-export `ProgressContext` API once no consumers depend on it.
- [ ] Update documentation and finalize testing (integration and unit tests pass).

## Business Rules

1. Ensure release notes clearly state that persisted progress will be reset on upgrade.
2. Keep a short deprecation window if moving legacy types to `types/legacy/`.

## Related Issues

- `docs/business-requirements/epic-9-state-performance-core/README.md` (Epic 9)

## Implementation Status

- **Status**: Planned
- **PR**: #[PR-NUMBER]
- **Merge Date**: [Date]
- **Key Commit**: [commit-hash]

## User Journey [Optional]

- Notes: This story is intended as the final cleanup PR after 9.1–9.4 are complete. Implementers must ensure the system reset behavior is clearly documented in release notes and migration guides so users understand persisted progress will be cleared.

## Business Rules

1. Ensure release notes clearly state that persisted progress will be reset on upgrade.
2. Keep a short deprecation window if moving legacy types to `types/legacy/`.
