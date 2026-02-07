# Story 14.5: Conversation Service Migration with Typed Responses

## Description

**As a** frontend developer,
**I want** the conversation service to use Axios with TypeScript types for all API responses,
**So that** I catch integration bugs at compile time and benefit from automatic retry/refresh when generating conversations.

## Business Value

This story completes the API modernization for conversation features, which are central to the learning experience. Conversation generation involves LLM API calls that can be slow or timeout-prone, making automatic retry logic especially valuable.

**Impact:**

- **Reliability**: Automatic retries reduce failed conversation generations from network timeouts
- **Type Safety**: Compile-time checks prevent runtime errors from API contract changes
- **Consistent Patterns**: All API services follow the same Axios pattern established in Story 14.4
- **User Experience**: Seamless token refresh means users never see 401 errors mid-conversation

## Acceptance Criteria

- [ ] TypeScript interfaces defined: `ConversationApiResponse`, `ConversationGenerateRequest` in `@mandarin/shared-types`
- [ ] `conversationService.ts` refactored: Replace `ApiClient.authRequest` calls with `apiClient.post()`
- [ ] Axios responses typed: All methods return typed promises (`Promise<Conversation>`, not `Promise<Response>`)
- [ ] Error handling updated: Use Axios error structure (`error.response.data`) instead of `response.ok` checks
- [ ] Both backend implementations migrated: `DefaultConversationBackend` and `LocalConversationBackend`
- [ ] All existing tests pass: No regression in conversation generation functionality
- [ ] Tests updated: Mock Axios instead of fetch for conversation service tests
- [ ] Retry logic verified: Slow/timeout scenarios trigger automatic retry (manual testing)

## Business Rules

1. **No functional changes**: Migration is purely internal refactor; user-facing behavior unchanged
2. **Backward compatibility**: Keep `ApiClient.authRequest` for 30 days in case emergency rollback needed
3. **Type strictness**: All API responses must have explicit TypeScript types (no `any` or `unknown`)
4. **Error messages**: User-friendly error messages ("Failed to generate conversation" not "HTTP 500")
5. **Fallback pattern**: Preserve existing fallback from DefaultBackend → LocalBackend on failure

## Related Issues

- [**Epic 14 BR**](./README.md) (Parent epic)
- [**Story 14.3: Interceptors**](./story-14-3-axios-interceptors.md) (Depends on)
- [**Story 14.4: Progress Service**](./story-14-4-progress-service-migration.md) (Establishes pattern)
- [**Epic 12: Conversation UI**](../epic-12-conversation-ui-enhancements/README.md) (Improves reliability for)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Last Update**: 2026-02-07
