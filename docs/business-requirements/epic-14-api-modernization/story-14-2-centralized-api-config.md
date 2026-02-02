# Story 14.2: Centralized API Config & Axios Client Setup

## Description

**As a** frontend developer,
**I want to** configure a centralized Axios client instance with base URL, timeout, and credentials,
**So that** all API services use consistent configuration and I can add interceptors in a single location.

## Business Value

This foundational story eliminates configuration duplication and establishes the infrastructure for automatic token refresh and retry logic. It unblocks Stories 14.3 and 14.4 by providing the Axios client that subsequent stories will enhance with interceptors and migrate services to.

**Impact:**

- Reduces maintenance burden (single config source vs. scattered declarations)
- Enables Stories 14.3-14.4 (interceptors require Axios instance)
- Improves developer experience (import one client, not multiple utilities)

## Acceptance Criteria

- [ ] `axios` package installed (`npm install axios` - version ^1.6.0)
- [ ] `src/config/api.ts` updated to export Axios-compatible config object
- [ ] `src/services/axiosClient.ts` created with configured Axios instance
- [ ] Axios instance uses `API_CONFIG.baseURL`, `timeout`, and `withCredentials: true`
- [ ] Axios instance exports both default export and named `apiClient`
- [ ] No breaking changes to existing services (they continue using `authFetch`/`ApiClient`)
- [ ] Documentation updated: Add Axios client usage example to `docs/guides/code-conventions.md`

## Business Rules

1. **Backward compatibility**: Existing `authFetch` and `ApiClient` remain functional during migration
2. **Environment variables**: Must respect `VITE_API_URL` for local/staging/production environments
3. **Credentials**: Always include cookies (`withCredentials: true`) for JWT refresh token
4. **Timeout**: 10-second timeout prevents hanging requests on slow networks

## Related Issues

- [**Epic 14 BR**](./README.md) (Parent epic)
- [**Story 14.3: Interceptors**](./story-14-3-axios-interceptors.md) (Blocked by this story)
- [**Story 14.4: Progress Service Migration**](./story-14-4-progress-service-migration.md) (Blocked by this story)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
