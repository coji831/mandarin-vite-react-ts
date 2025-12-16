# Story 13.3: JWT Authentication System

## Description

**As a** user,
**I want to** register an account and log in with email/password,
**So that** my progress is saved and accessible from any device.

## Business Value

Implementing secure authentication enables multi-user support, allowing users to access their progress from any device. This unblocks the team-based learning feature required for the $1000 customer contract and establishes the security foundation for all user-specific backend APIs.

## Acceptance Criteria

- [x] POST /api/v1/auth/register endpoint creates new user with hashed password (bcrypt)
- [x] POST /api/v1/auth/login endpoint validates credentials and returns JWT access + refresh tokens
- [x] POST /api/v1/auth/refresh endpoint exchanges valid refresh token for new access token
- [x] POST /api/v1/auth/logout endpoint invalidates refresh token
- [x] Auth middleware (requireAuth) validates JWT tokens on protected routes
- [x] Frontend login/register forms integrated with backend auth endpoints
- [x] JWT access tokens expire after 15 minutes, refresh tokens after 7 days
- [x] Rate limiting enforced: max 5 login attempts per minute per IP

## Business Rules

1. Passwords must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number
2. Refresh tokens must be stored in database (not just signed JWTs)
3. httpOnly cookies must be used for refresh tokens (prevent XSS attacks)
4. Failed login attempts must be logged for security monitoring

## Related Issues

- [Epic 13: Production Backend Architecture](./README.md) (Parent epic)
- [Story 13.2: Database Schema & ORM Configuration](./story-13-2-database-schema.md) (Prerequisite)
- [Story 13.4: Multi-User Progress API](./story-13-4-progress-api.md) (Follows this story)

## Implementation Status

- **Status**: Completed
- **PR**: #[TBD]
- **Merge Date**: [TBD]
- **Key Commit**: [TBD]
