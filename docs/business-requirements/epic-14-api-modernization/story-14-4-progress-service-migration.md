# Story 14.4: Progress Service Migration with Typed Responses

## Description

**As a** frontend developer,
**I want** the progress service to use Axios with TypeScript types for all API responses,
**So that** I catch integration bugs at compile time and benefit from IDE autocomplete when working with progress data.

## Business Value

This story validates the Epic 14 architecture by migrating the most critical service (progress tracking) to Axios with full type safety. Progress service is used in multiple features (flashcards, stats, word lists), so proving the migration pattern here ensures smooth migration for other services in future epics.

**Impact:**

- **Type Safety**: Compile-time checks prevent runtime errors from API contract changes
- **Developer Experience**: IDE autocomplete for API responses reduces bugs and speeds development
- **Validation**: Proves Epic 14 architecture works end-to-end (config → interceptors → service → hooks)

## Acceptance Criteria

- [x] TypeScript interfaces defined: `ProgressResponse`, `UpdateProgressRequest`, `BatchUpdateRequest` in `@mandarin/shared-types`
- [x] `progressService.ts` refactored: Replace `authFetch` calls with `apiClient.get()`, `apiClient.put()`, `apiClient.post()`
- [x] Axios responses typed: All methods return typed promises (`Promise<WordProgress[]>`, not `Promise<Response>`)
- [x] Error handling updated: Use Axios error structure (`error.response.data`) instead of `response.ok` checks
- [x] `useProgressActions.ts` updated: Import `progressApi` (uses `apiClient` internally)
- [x] All existing tests pass: 19 tests covering all progressApi methods
- [x] AuthContext logout callback integrated: `setLogoutCallback` wired in AuthContext useEffect
- [ ] Manual testing: Verify progress updates work in flashcard flow (mark word learned, check backend sync)
- [x] Rollback plan documented: `authFetch` kept in codebase but unused (can revert if critical issues found)

## Business Rules

1. **No functional changes**: Migration is purely internal refactor; user-facing behavior unchanged
2. **Backward compatibility**: Keep `authFetch` implementation for 30 days in case emergency rollback needed
3. **Type strictness**: All API responses must have explicit TypeScript types (no `any` or `unknown`)
4. **Error messages**: User-facing error messages must remain user-friendly ("Failed to save progress" not "HTTP 500")

## Related Issues

- [**Epic 14 BR**](./README.md) (Parent epic)
- [**Story 14.2: Centralized Config**](./story-14-2-centralized-api-config.md) (Depends on)
- [**Story 14.3: Interceptors**](./story-14-3-axios-interceptors.md) (Depends on)
- [**Epic 15: Learning Retention**](../epic-15-learning-retention/README.md) (Unblocks - requires robust progress API)

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Last Update**: 2026-02-07
- **Implementation Doc**: [Story 14.4 Implementation](../../issue-implementation/epic-14-api-modernization/story-14-4-progress-service-migration.md)
