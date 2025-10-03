# Implementation: Story 6.6 – Migrate Progress Logic to Per-User ProgressStore

## Story Summary

Refactor the main progress hook (`useMandarinProgress.ts`) and related logic to use the new per-user ProgressStore, ensuring all progress is reliably associated with the correct user/device and persists as designed.

## Technical Tasks

- Refactor all progress CRUD in `useMandarinProgress.ts` to use ProgressStore API
- Inject/use current user/device ID for all progress operations
- Remove all usage of the old single-user localStorage key from app logic
- Test persistence and correct association for multiple users/devices
- Review and document changes per project guides

## Data Model/Types

- UserProgress, UserIdentity (from ProgressStore)

## Edge Cases

- Migration of existing progress data
- Switching users/devices

## Testing

- Unit: ProgressStore integration, CRUD
- Manual: Progress persists per user/device, no data loss

## References

- [Business Requirements Story 6.6](../../business-requirements/epic-6-multi-user-progress-architecture/story-6-6-migrate-progress-hook-to-per-user-store.md)

## Status

Planned
