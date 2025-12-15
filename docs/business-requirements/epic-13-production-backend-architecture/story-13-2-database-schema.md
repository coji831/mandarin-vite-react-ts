# Story 13.2: Database Schema & ORM Configuration

## Description

**As a** developer,
**I want to** configure PostgreSQL with Prisma ORM and define User, Progress, and Word models,
**So that** user data persists reliably across sessions and devices.

## Business Value

Implementing a proper database layer replaces localStorage-only progress tracking, enabling true multi-user support and cross-device synchronization. This is the foundation for the $1000 customer contract requirement, allowing team-based learning scenarios and reliable data persistence at scale.

## Acceptance Criteria

- [x] Prisma schema defined with User, Session, Progress, and VocabularyWord models
- [x] Initial database migration created and successfully applied to development database (Supabase PostgreSQL)
- [x] Prisma Client generated with type-safe query methods (Prisma 7.1.0 with adapter)
- [x] Database connection pooling configured (pg Pool + Supabase Session Pooler)
- [x] Seed script populates development database with sample vocabulary and test users
- [x] Database accessible via Supabase Dashboard Table Editor and CLI tools

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

- **Status**: Completed
- **Database**: Supabase PostgreSQL (aws-1-ap-south-1 region)
- **Prisma Version**: 7.1.0 with @prisma/adapter-pg
- **Completion Date**: December 15, 2025
- **Key Achievement**: Successfully migrated from SQLite to PostgreSQL with Prisma 7, resolved IPv4 connectivity and adapter pattern requirements
