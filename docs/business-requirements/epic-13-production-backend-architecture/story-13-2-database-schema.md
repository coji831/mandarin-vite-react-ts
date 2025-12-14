# Story 13.2: Database Schema & ORM Configuration

## Description

**As a** developer,
**I want to** configure PostgreSQL with Prisma ORM and define User, Progress, and Word models,
**So that** user data persists reliably across sessions and devices.

## Business Value

Implementing a proper database layer replaces localStorage-only progress tracking, enabling true multi-user support and cross-device synchronization. This is the foundation for the $1000 customer contract requirement, allowing team-based learning scenarios and reliable data persistence at scale.

## Acceptance Criteria

- [ ] Prisma schema defined with User, Session, Progress, and VocabularyWord models
- [ ] Initial database migration created and successfully applied to development database
- [ ] Prisma Client generated with type-safe query methods
- [ ] Database connection pooling configured (5-10 connections)
- [ ] Seed script populates development database with sample vocabulary and test users
- [ ] Prisma Studio accessible at localhost:5555 for database inspection

## Business Rules

1. User emails must be unique and validated
2. Progress records must enforce unique constraint on userId + wordId combination
3. All timestamps must use UTC timezone
4. Soft deletes required for User records (preserve data integrity)

## Related Issues

- [Epic 13: Production Backend Architecture](./README.md) (Parent epic)
- [Story 13.1: Monorepo Structure Setup](./story-13-1-monorepo-setup.md) (Prerequisite)
- [Story 13.3: JWT Authentication System](./story-13-3-authentication.md) (Follows this story)

## Implementation Status

- **Status**: Planned
- **PR**: N/A
- **Merge Date**: N/A
- **Key Commit**: N/A
