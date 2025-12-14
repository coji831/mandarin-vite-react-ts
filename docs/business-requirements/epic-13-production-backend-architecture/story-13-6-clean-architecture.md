# Story 13.6: Clean Architecture Preparation for .NET Migration

## Description

**As a** developer,
**I want to** structure backend code following clean architecture principles,
**So that** business logic can be migrated to .NET in the future without rewriting everything.

## Business Value

Refactoring to clean architecture separates business logic from framework code, making it portable to .NET (Epic 14). This investment pays off by reducing the future migration effort from weeks to days, preserving the logic investment while upgrading to a more performant technology stack. It also improves code maintainability and testability immediately.

## Acceptance Criteria

- [ ] Code refactored into layers: api/ (HTTP), core/ (business logic), infrastructure/ (data access)
- [ ] Services in core/ contain zero Express/framework dependencies (pure TypeScript)
- [ ] OpenAPI 3.1 spec generated from code and accessible at /api-docs
- [ ] Swagger UI rendered at /api-docs for interactive API testing
- [ ] Migration guide documented in docs/guides/dotnet-migration.md
- [ ] All service unit tests pass with >90% coverage
- [ ] Code review checklist completed (separation of concerns verified)

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

- **Status**: Planned
- **PR**: N/A
- **Merge Date**: N/A
- **Key Commit**: N/A
