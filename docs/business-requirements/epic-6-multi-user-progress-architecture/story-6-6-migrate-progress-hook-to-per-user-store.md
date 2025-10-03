# Story 6.6: Migrate Progress Logic to Per-User ProgressStore

## Description

**As a** developer,
**I want to** refactor the main progress hook and related logic to use the new per-user ProgressStore,
**So that** all progress is reliably associated with the correct user/device and persists as designed.

## Acceptance Criteria

- [x] All progress CRUD in `useMandarinProgress.ts` and related files uses the new per-user ProgressStore API
- [x] The current user/device ID (from `useUserIdentity`) is always used for progress operations
- [x] Old single-user localStorage keys are fully removed from the main app logic
- [x] Progress persists correctly per user/device across reloads, logins, and user switches
- [x] No user progress is lost during migration
- [x] Code and documentation are reviewed and updated per project guides
- [x] Manual and unit tests verify correct per-user persistence and isolation

## Business Rules

- No user progress should be lost during migration
- All progress operations must be scoped to the current user/device

## Implementation Status

Status: Completed (2025-10-03)

---

## Implementation Summary

- All progress CRUD in `useMandarinProgress.ts` and related files now uses the per-user ProgressStore API.
- The current user/device ID (from `useUserIdentity`) is always used for progress operations.
- Old single-user localStorage keys have been fully removed from the main app logic.
- Progress persists correctly per user/device across reloads and logins.
- Code and documentation have been reviewed and updated per project guides.

See [Implementation Details](../../issue-implementation/epic-6-multi-user-progress-architecture/story-6-6-migrate-progress-hook-to-per-user-store.md) for technical notes and testing.

---

## Notes

- This story covers the actual integration of the new ProgressStore into the main progress hook and all related flows.
- See also: Story 6-1 (ProgressStore implementation), Story 6-4 (User/device identification).
- Refer to `docs/guides/business-requirements-format.md` and `docs/guides/implementation-format.md` for documentation standards.
