# Story 14.6: Audio Service Migration with Typed Responses

## Description

**As a** frontend developer,
**I want** the audio service to use Axios with TypeScript types for all API responses,
**So that** I catch integration bugs at compile time and benefit from automatic retry/refresh when generating audio.

## Business Value

This story completes Epic 14 by migrating the final service to Axios. Audio generation (TTS) is critical for pronunciation learning and often has higher failure rates due to external API dependencies (Google Cloud TTS), making automatic retry logic especially valuable.

**Impact:**

- **Reliability**: Automatic retries reduce failed audio generations from network timeouts or TTS API flakiness
- **Type Safety**: Compile-time checks prevent runtime errors from API contract changes
- **Epic Completion**: All frontend services now follow consistent Axios pattern
- **User Experience**: Students never lose progress due to transient audio generation failures

## Acceptance Criteria

- [x] TypeScript interfaces defined: `WordAudioApiResponse`, `TurnAudioApiResponse` in `@mandarin/shared-types`
- [x] `audioService.ts` refactored: Replace `ApiClient.authRequest` calls with `apiClient.post()`
- [x] Axios responses typed: All methods return typed promises (`Promise<WordAudio>`, not `Promise<Response>`)
- [x] Error handling updated: Use Axios error structure (`error.response.data`) instead of `response.ok` checks
- [x] Both backend implementations migrated: `DefaultAudioBackend` and `LocalAudioBackend`
- [x] All existing tests pass: No regression in audio generation functionality
- [x] Tests updated: Mock Axios instead of fetch for audio service tests
- [ ] Retry logic verified: TTS timeout scenarios trigger automatic retry (manual testing)

## Business Rules

1. **No functional changes**: Migration is purely internal refactor; user-facing behavior unchanged
2. **Backward compatibility**: Keep `ApiClient.authRequest` for 30 days in case emergency rollback needed
3. **Type strictness**: All API responses must have explicit TypeScript types (no `any` or `unknown`)
4. **Error messages**: User-friendly error messages ("Failed to generate audio" not "HTTP 500")
5. **Fallback pattern**: Preserve existing fallback from DefaultBackend → LocalBackend on failure
6. **Legacy method**: Keep `fetchConversationAudio()` stub for backward compatibility (throws error with migration notice)

## Related Issues

- [**Epic 14 BR**](./README.md) (Parent epic - completes this epic)
- [**Story 14.3: Interceptors**](./story-14-3-axios-interceptors.md) (Depends on)
- [**Story 14.5: Conversation Service**](./story-14-5-conversation-service-migration.md) (Parallel migration)
- [**Epic 12: Conversation UI**](../epic-12-conversation-ui-enhancements/README.md) (Improves reliability for)

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Last Update**: 2026-02-07
- **Implementation Doc**: [Story 14.6 Implementation](../../issue-implementation/epic-14-api-modernization/story-14-6-audio-service-migration.md)
