# Story 8.2: Scaffolder — Text endpoint

## Description

**As a** developer,
**I want to** have a scaffolder text endpoint that returns deterministic conversation data,
**So that** UI development can proceed with reliable mock data while the real generator is being built.

## Business Value

This story enables rapid UI development and testing without waiting for the full conversation generation pipeline. By providing a reliable scaffolder endpoint, frontend developers can build and validate the conversation UI experience while backend developers work on the real generation logic in parallel. This reduces development dependencies and accelerates overall delivery.

## Acceptance Criteria

- [ ] Express dev route implemented in `local-backend/` returning fixture data
- [ ] Endpoint gated behind `USE_CONVERSATION=true` environment variable
- [ ] API shape matches final generator specification exactly
- [ ] Returns deterministic `Conversation` objects for given `wordId` parameter
- [ ] Response includes all required fields: `id`, `wordId`, `word`, `turns`, `generatedAt`, `generatorVersion`
- [ ] Endpoint supports both GET and POST requests for flexibility
- [ ] Response time is consistently under 100ms for reliable testing
- [ ] Error handling returns appropriate HTTP status codes

## Business Rules

1. Scaffolder must return identical responses for same `wordId` input
2. Response format must match production API specification exactly
3. Endpoint must only be active when explicitly enabled via environment variable
4. Generated conversation IDs must follow pattern: `${wordId}-${generatorVersion}-${shortHash}`
5. All returned conversations must conform to 3-5 turns constraint

## Related Issues

- #8-1 / [**Design Conversation Schema & Scaffolder**](./story-8-1-design-schema-and-scaffolder.md) (Dependency)
- #8-4 / [**Conversation Box UI: wire to scaffolder**](./story-8-4-conversation-box-ui.md) (Enables this story)
- #8-5 / [**Generator — Text generation & cache (backend)**](./story-8-5-generator-text-cache.md) (Will replace this scaffolder)

## Implementation Status

- **Status**: Completed
- **PR**: #[to-fill]
- **Merge Date**: 2025-10-11
- **Key Commit**: [to-fill] (Scaffolder endpoint, business rules, and API contract fulfilled)

## User Journey

1. Developer enables conversation scaffolder with `USE_CONVERSATION=true`
2. Frontend makes request to `/conversation?wordId=hello123`
3. Scaffolder returns deterministic conversation JSON immediately
4. UI renders conversation with consistent test data
5. Developer can iterate on UI design without external dependencies
6. Automated tests receive predictable responses for validation
