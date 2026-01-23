# Story 13.6: Clean Architecture Preparation for .NET Migration

## Description

**As a** developer,
**I want to** structure backend code following clean architecture principles,
**So that** business logic can be migrated to .NET in the future without rewriting everything.

## Business Value

Refactoring to clean architecture separates business logic from framework code, making it portable to .NET (Epic 14). This investment pays off by reducing the future migration effort from weeks to days, preserving the logic investment while upgrading to a more performant technology stack. It also improves code maintainability and testability immediately.

## Acceptance Criteria

- [x] Code refactored into layers: api/ (HTTP), core/ (business logic), infrastructure/ (data access)
- [x] Services in core/ contain zero Express/framework dependencies (pure JavaScript)
- [x] OpenAPI 3.1 spec generated from code and accessible at /api-docs
- [x] Swagger UI rendered at /api-docs for interactive API testing
- [x] Migration guide documented in docs/guides/dotnet-migration.md
- [x] All service unit tests pass with >90% coverage
- [x] Code review checklist completed (separation of concerns verified)

## Business Rules

1. Business logic (core/services/) must be framework-agnostic
2. Controllers must only handle HTTP concerns (request/response mapping)
3. Repositories must be the only layer accessing databases directly
4. All public APIs must have OpenAPI documentation

## Related Issues

- [Epic 13: Production Backend Architecture](./README.md) (Parent epic)
- [Epic 14: .NET Backend Migration](../../epic-14-dotnet-backend-migration/README.md) (Future epic this prepares for)
- [Story 13.5: Redis Caching Layer](./story-13-5-redis-caching.md) (Can run in parallel)

## Implementation Status

- **Status**: Completed
- **Last Update**: 2026-01-23
- **Branch**: epic-13-production-backend-architecture
- **PR**: N/A (direct commits to epic-13-production-backend-architecture branch)
- **Merge Date**: N/A
- **Key Commits**:
  - `aa19cbb` - Phase 0: Prerequisites & Setup (GCS migration, shared packages)
  - `0d849bc` - Phase 1: Folder Structure Setup
  - `65df6bf` - Phase 2: Extract Repository Layer
  - `d58e1c9` - Phase 3a: Cache/External/Conversation services refactor
  - `12f0a8c` - Phase 3b: AuthService refactor + VocabularyService/CsvParser
  - `f54ca60` - Phase 5a: Convert controllers to class-based DI pattern
  - `865e9af` - Phase 5b: Wire routes with DI + cleanup legacy files
  - (Phase 4 commit) - Vocabulary routes + import fixes
  - `4f5c53c` - Phase 6: OpenAPI 3.1 documentation
  - `e451c0e` - Phase 8: Documentation updates (.NET migration guide, README)
  - Testing Audit Completion - Full unit test suite for core layers (146 tests passing)

**Implementation Date**: 2026-01-23
**Total Effort**: ~18 hours (Phases 0-11)

- [x] Legacy scaffold mode removed (Node.js backend now strictly clean architecture)
