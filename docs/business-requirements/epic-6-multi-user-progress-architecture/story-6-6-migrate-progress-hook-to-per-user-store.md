# Story 6.6: Migrate Progress Logic to Per-User ProgressStore

## Description

**As a** developer,
**I want to** refactor the main progress hook and related logic to use the new per-user ProgressStore,
**So that** all progress is reliably associated with the correct user/device and persists as designed.

## Acceptance Criteria

- [ ] All progress CRUD in `useMandarinProgress.ts` and related files uses the new per-user ProgressStore API
- [ ] The current user/device ID is always used for progress operations
- [ ] Old single-user localStorage keys are fully removed from the main app logic
- [ ] Progress persists correctly per user/device across reloads and logins
- [ ] Code is reviewed and documented per project guides

## Business Rules

- No user progress should be lost during migration
- All progress operations must be scoped to the current user/device

## Implementation Status

Status: Planned

---

## Notes

- This story covers the actual integration of the new ProgressStore into the main progress hook and all related flows.
- See also: Story 6-1 (ProgressStore implementation), Story 6-4 (User/device identification).
- Refer to `docs/guides/business-requirements-format.md` and `docs/guides/implementation-format.md` for documentation standards.
