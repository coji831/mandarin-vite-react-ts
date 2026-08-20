# Story 20.1: Mnemonic Generation Backend

## Description

**As a** backend developer,
**I want to** implement Gemini API integration for mnemonic story generation with Redis caching,
**So that** learners receive AI-generated mnemonics on demand.

## Business Value

This is the core engine of Epic 20. Without this, there are no mnemonic stories to display or interact with. By reusing the proven Epic 15 pattern (`CachedAIFeedbackService`), we gain reliable AI integration with Redis caching, rate limiting, and error handling — reducing API costs and preventing abuse.

## Acceptance Criteria

- [x] `GET /api/mnemonics/:character` returns existing mnemonic following lookup order: user-edited → Redis cache → AI-generated DB → generate
- [x] `POST /api/mnemonics/:character` generates a mnemonic via Gemini, auto-saves to DB + cache
- [x] `PUT /api/mnemonics/:character` edits a saved mnemonic and sets `isEdited=true`
- [x] `DELETE /api/mnemonics/:character` resets to AI-generated version (deletes user edit)
- [x] Redis caching with 30-day TTL for AI-generated stories
- [x] Cache stampede prevention via Redis `SETNX` lock with 20s TTL per glyph
- [x] Rate limiting: POST 10 req/min per-user, PUT 30 req/min, GET 60 req/min
- [x] Input validation: characterGlyph must be single Han character (`/^\p{Script=Han}$/u`)
- [x] Pictograph characters return 422 from POST instead of generating
- [x] All error responses follow `{ error, code, message }` format per backend-error-messages.instructions.md

## Business Rules

1. Auto-save on generation — no explicit save action needed
2. User can edit (PUT) or regenerate (DELETE + POST) later
3. AI-generated stories are shared across users (cache key = character only)
4. User-edited stories are per-user (userId in unique constraint)
5. Story body is sanitized server-side — HTML tags stripped on PUT
6. Pictograph rejection enforced server-side as defense-in-depth

## Related Issues

- **Epic 20: Mnemonic Stories** _(link to `../README.md`)_ (Parent epic)
- **Story 20.3: Character Decomposition Data** _(link to `story-20-3-character-decomposition-data.md`)_ (Prerequisite)
- **Story 20.2: Mnemonic Display UI** _(link to `story-20-2-mnemonic-display-ui.md`)_ (Downstream consumer)

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
