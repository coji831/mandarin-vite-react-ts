# Story 12.1: Backend Refactor for Modern Google API and Vercel Compatibility

## Story Summary

**Goal:**
Refactor the local backend to use modern Google API libraries and async/await, with a structure that is easy to migrate to Vercel API format, improving maintainability, security, and portability.

**Status:** Draft

**Last Update:** 2025-11-14

## Background

The current local backend uses legacy Express code and outdated Google API usage, with ad-hoc credential handling. This increases maintenance burden and security risk, and makes it difficult to share logic with Vercel API endpoints.

## Acceptance Criteria

- [ ] All Google API usage in local-backend is updated to use the latest official libraries and async/await syntax.
- [ ] Credential loading is moved to environment variables or secure config files.
- [ ] Backend modules and handlers are structured for compatibility with Vercel API format (e.g., shared logic, minimal Express coupling).
- [ ] Documentation in `local-backend/docs/` is updated to reflect new setup and usage.
- [ ] Unit/integration tests cover refactored code and credential handling.

## Implementation Approach

- Refactor Google API logic into modular, testable functions.
- Use environment variables for all credentials and sensitive config.
- Design handler signatures to be easily portable to Vercel API endpoints.
- Update documentation and add migration notes for future Vercel API conversion.

## Risks & Mitigations

- Risk: Refactor introduces regressions — Mitigation: Add/expand tests, incremental rollout.
- Risk: Migration to Vercel API is still non-trivial — Mitigation: Document all assumptions and differences.

## Implementation Notes

- Follow code conventions and solid principles.
- Use `.env` for local secrets, never commit credentials.
