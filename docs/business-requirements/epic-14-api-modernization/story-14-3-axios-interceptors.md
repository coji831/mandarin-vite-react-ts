# Story 14.3: Axios Interceptors (Auth Refresh + Retry Logic)

## Description

**As a** user,
**I want** my authentication to work seamlessly without manual re-login when my access token expires,
**So that** I have an uninterrupted learning experience even during long study sessions.

## Business Value

This story implements the core functionality that makes Epic 14 valuable: automatic token refresh and retry logic. Users never see 401 errors if their refresh token is valid, and transient network failures auto-retry instead of failing immediately.

**Impact:**

- **User Experience**: Eliminates "Session expired, please log in again" interruptions
- **Reliability**: Transient network errors (Wi-Fi drops, mobile connectivity issues) auto-recover
- **Developer Experience**: Services no longer need to handle token refresh manually

## Acceptance Criteria

- [x] Request interceptor added: Automatically attaches `Authorization: Bearer <token>` header to all requests
- [x] Proactive token refresh: Expired tokens refreshed before request (30s buffer)
- [x] Response interceptor added: Detects 401 responses and triggers reactive token refresh
- [x] Token refresh logic: Calls `/api/v1/auth/refresh` with `withCredentials: true` to get new access token
- [x] Refresh race condition handled: refreshPromise singleton prevents multiple simultaneous refresh requests
- [x] Retry after refresh: Failed request automatically retried once after successful token refresh
- [x] Retry limit enforced: Requests marked with `_retry` flag to prevent infinite 401 loops
- [x] Network retry interceptor: Retries requests on network errors (ECONNABORTED, ERR_NETWORK) with exponential backoff (1s, 2s, 4s), max 3 attempts
- [x] Logout trigger: Callback pattern (setLogoutCallback) for AuthContext integration on refresh failure
- [x] All errors normalized to NormalizedError structure
- [x] Test coverage: 23/23 tests passing (100%)
- [ ] Manual testing: Simulate token expiry (modify localStorage token to expired JWT), verify auto-refresh works (Pending AuthContext integration)

## Business Rules

1. **Single refresh attempt**: Only one token refresh per request to prevent infinite loops
2. **Logout on refresh failure**: If refresh token expired, user must re-authenticate (trigger AuthContext logout)
3. **Retry limit**: Maximum 3 retry attempts for network errors to prevent indefinite hanging
4. **Exponential backoff**: 1s → 2s → 4s delays between retries to avoid overwhelming server
5. **Preserve request state**: Original request body, headers, and params must be preserved during retry

## Related Issues

- [**Epic 14 BR**](./README.md) (Parent epic)
- [**Story 14.2a: Centralized Config**](./story-14-2-centralized-api-config.md) (Depends on)
- [**Story 14.4: Progress Service Migration**](./story-14-4-progress-service-migration.md) (Unblocks)

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Last Update**: 2026-01-03
- **Implementation Doc**: [Story 14.3 Implementation](../../issue-implementation/epic-14-api-modernization/story-14-3-axios-interceptors.md)
