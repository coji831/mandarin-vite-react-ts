# Story 13.1: Monorepo Structure Setup

## Description

**As a** developer,
**I want to** set up npm workspaces with apps/frontend and apps/backend,
**So that** frontend and backend can be developed and deployed independently while sharing common code.

## Business Value

Establishing a monorepo structure eliminates the dual-backend maintenance burden (local-backend + api/), reduces deployment complexity, and enables code sharing between frontend and backend. This foundation is critical for all subsequent stories in Epic 13, enabling independent deployment cycles and better separation of concerns.

## Acceptance Criteria

- [ ] Root package.json configured with npm workspaces for apps/frontend and apps/backend
- [ ] packages/shared-types and packages/shared-constants created for shared code
- [ ] All workspace packages can be installed with single `npm install` at root
- [ ] `npm run dev` starts both frontend (port 5173) and backend (port 3001) concurrently
- [ ] Vercel deployment configuration updated to deploy both apps correctly
- [ ] Existing local-backend and api/ code consolidated into new structure

## Business Rules

1. Frontend and backend must be independently buildable and deployable
2. Shared types must be consumed as workspace dependencies (not duplicated)
3. Development workflow must not be slower than current setup (maintain <5s startup time)

## Related Issues

- [Epic 13: Production Backend Architecture](./README.md) (Parent epic)
- [Story 13.2: Database Schema & ORM Configuration](./story-13-2-database-schema.md) (Follows this story)

## Implementation Status

- **Status**: Planned
- **PR**: N/A
- **Merge Date**: N/A
- **Key Commit**: N/A
