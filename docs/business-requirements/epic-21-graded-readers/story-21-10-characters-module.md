# Story 21.10: Characters Backend Module

**Last Update:** July 30, 2026

## Description

**As a** developer/learner,
**I want to** have a dedicated characters backend module with proper API endpoints for character lookup, decomposition, phonetic components, homophones, search, and frequency data,
**So that** the LexicalHub (21.4), Phonetic Clusters (21.6), and other features can consume consistent, well-documented APIs instead of ad-hoc endpoints scattered across modules.

## Business Value

The technical audit identified that character endpoints are implemented ad-hoc across at least two modules (readers, radicals), violating the modulith pattern's single-responsibility principle. Story 21.1 and 21.2 built the full data infrastructure (Character, CharacterComponent, CharacterReading, CharacterRadical, CharacterHskLevel tables with 2,971 characters), but there is no proper API surface to expose this data. Without this story, 21.4 (LexicalHub) and 21.6 (Phonetic Clusters) will either implement inconsistent character endpoints or fall back to consuming JSON files directly — both violating the all-in-DB architecture decision. A dedicated `modules/characters/` module with 6 endpoints provides a single source of truth for all character data, enables frontend services to use typed API responses, and simplifies integration testing via MSW handlers.

## Acceptance Criteria

- [x] `apps/backend/src/modules/characters/` directory created following the modulith pattern (container.ts, api/, services/, repositories/, types/)
- [x] `GET /api/v1/characters/:glyph` — returns full character details (glyph, pinyin, meaning, HSK levels, stroke count, radical, classification)
- [x] `GET /api/v1/characters/:glyph/phonetic` — returns phonetic component info for the given character (via Character.phoneticComponent self-relation)
- [x] `GET /api/v1/characters/:glyph/homophones` — returns all characters sharing the same pronunciation, grouped by reading for multi-pronunciation characters
- [x] `GET /api/v1/characters/:glyph/decomposition` — returns decomposition tree (constituent components with types and positions)
- [x] `GET /api/v1/characters/search?q=&tone=&hskLevel=` — search characters by pinyin, tone filter, or HSK level (at least one filter required)
- [x] `GET /api/v1/characters/frequency?tier=` — returns characters ordered by frequency rank, optionally filtered by HSK tier
- [x] Module registered in `apps/backend/src/app/container.ts` and `apps/backend/src/app/routes.ts` — routes wired with controller-injection middleware
- [x] All endpoints return appropriate error codes (`NOT_FOUND` for 404, `VALIDATION_ERROR` for 400, `INTERNAL_ERROR` for 500)
- [x] Unit tests for each service method covering success and error paths (character not found, invalid glyph, empty params, etc.)
- [x] MSW handlers created for frontend testing covering all 6 endpoints (for both Storybook stories and Vitest tests)
- [x] Barrel file `modules/characters/index.ts` re-exports all module types and classes
- [x] 5 new route constants added to `@mandarin/shared-constants`: `charactersPhonetic`, `charactersHomophones`, `charactersDecomposition`, `charactersSearch`, `charactersFrequency`
- [x] 0 lint errors across all new files
- [x] Route audit confirms `GET /v1/radicals/character/:glyph` in `modules/radicals/` returns radicals (not characters) — no routes need refactoring

## Business Rules

1. **Modulith Pattern** — The characters module follows the existing modulith structure: `container.ts` for DI registration, `api/` for controllers and routes, `services/` for business logic, `repositories/` for Prisma queries, `types/` for request/response types. All module files are re-exported from `modules/characters/index.ts`.

2. **Prisma-First Queries** — All endpoints query Prisma against existing tables (Character, CharacterComponent, CharacterReading, CharacterRadical, CharacterHskLevel). No direct JSON file access — all-in-DB architecture.

3. **Caching** — Infrequently changing endpoints (decomposition, phonetic, frequency) may be cached server-side with Redis (TTL 1 hour). Character search and homophones should reflect current data without caching.

4. **Idempotent GET** — All endpoints are read-only GET requests. No POST/PUT/DELETE in this story — mutations are handled by seed scripts (21.1, 21.2).

5. **Route Audit** — Before finalizing routes, audit `modules/radicals/` for any existing character-related endpoints. Finding: `GET /v1/radicals/character/:glyph` returns radical data filtered by character glyph — it belongs in the radicals module and does NOT need refactoring. No character-specific routes exist outside `modules/characters/`.

6. **Error Code Convention** — All errors use the standard set: `NOT_FOUND` (404, resource not found), `VALIDATION_ERROR` (400, invalid or missing input), `INTERNAL_ERROR` (500, unexpected server error). No custom error codes like `CHARACTER_NOT_FOUND`.

7. **Empty Search Params** — If all search params (`q`, `tone`, `hskLevel`) are empty/absent, the endpoint returns 400 `VALIDATION_ERROR` requiring at least one filter parameter.

8. **CharacterRadial Dual-Key Fallback** — The `CharacterRadical` table has both `characterId` (FK to Character.id) and `characterGlyph` (denormalized string). The character detail endpoint's radical join prefers `characterId` FK where available; falls back to `characterGlyph` string for records not yet migrated. See Prisma schema for the dual-key design.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.1: Data Lifecycle** ([BR](story-21-1-data-lifecycle.md)) (dependency — Character table and schema foundation)
- **Story 21.2: Character Content Generation** ([BR](story-21-2-character-content.md)) (dependency — all character data populated)
- **Story 21.4: Reading UI + LexicalHub Phase 1** ([BR](story-21-4-reading-ui-lexical-hub.md)) (consumer — LexicalHub uses character API endpoints)
- **Story 21.6: Phonetic Clusters** ([BR](story-21-6-phonetic-clusters.md)) (consumer — phonetic cluster data via characters module)
- **Story 21.12: Pinyin Search & Homophone API** ([BR](story-21-12-pinyin-search-homophones.md)) (extension — adds pinyin search endpoints to this module)

## Implementation Status

- **Status**: Implemented
- **PR**: N/A (direct commit — no PR)
- **Merge Date**: N/A
- **Key Commit**: `e4a5ce7d`
