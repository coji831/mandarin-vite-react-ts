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

- [ ] Request interceptor added: Automatically attaches `Authorization: Bearer <token>` header to all requests
- [ ] Response interceptor added: Detects 401 responses and triggers token refresh
- [ ] Token refresh logic: Calls `/api/v1/auth/refresh` with `credentials: include` to get new access token
- [ ] Refresh race condition handled: Multiple simultaneous 401s trigger only one refresh request
- [ ] Retry after refresh: Failed request automatically retried after successful token refresh
- [ ] Retry limit enforced: Requests marked with `_retry` flag to prevent infinite loops
- [ ] Network retry interceptor: Retries requests 3 times on network errors (ECONNABORTED, ETIMEDOUT) with exponential backoff (1s, 2s, 4s)
- [ ] Logout trigger: If token refresh fails (refresh token expired), calls logout handler to clear state
- [ ] Manual testing: Simulate token expiry (modify localStorage token to expired JWT), verify auto-refresh works

## Business Rules

1. **Single refresh attempt**: Only one token refresh per request to prevent infinite loops
2. **Logout on refresh failure**: If refresh token expired, user must re-authenticate (trigger AuthContext logout)
3. **Retry limit**: Maximum 3 retry attempts for network errors to prevent indefinite hanging
4. **Exponential backoff**: 1s → 2s → 4s delays between retries to avoid overwhelming server
5. **Preserve request state**: Original request body, headers, and params must be preserved during retry

## Related Issues

- [**Epic 14 BR**](./README.md) (Parent epic)
- [**Story 14.2: Centralized Config**](./story-14-1-centralized-api-config.md) (Depends on)
- [**Story 14.4: Progress Service Migration**](./story-14-4-progress-service-migration.md) (Unblocks)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
