# Story 21.10: Characters Backend Module

**Last Update:** July 24, 2026

## Description

**As a** developer/learner,
**I want to** have a dedicated characters backend module with proper API endpoints for character lookup, decomposition, phonetic components, homophones, search, and frequency data,
**So that** the LexicalHub (21.4), Phonetic Clusters (21.6), and other features can consume consistent, well-documented APIs instead of ad-hoc endpoints scattered across modules.

## Business Value

The technical audit identified that character endpoints are implemented ad-hoc across at least two modules (readers, radicals), violating the modulith pattern's single-responsibility principle. Story 21.1 and 21.2 built the full data infrastructure (Character, CharacterComponent, CharacterReading, CharacterRadical, CharacterHskLevel tables with 2,971 characters), but there is no proper API surface to expose this data. Without this story, 21.4 (LexicalHub) and 21.6 (Phonetic Clusters) will either implement inconsistent character endpoints or fall back to consuming JSON files directly — both violating the all-in-DB architecture decision. A dedicated `modules/characters/` module with 6 endpoints provides a single source of truth for all character data, enables frontend services to use typed API responses, and simplifies integration testing via MSW handlers.

## Acceptance Criteria

- [ ] `apps/backend/src/modules/characters/` directory created following the modulith pattern (container.ts, api/, services/, repositories/, types/)
- [ ] `GET /api/v1/characters/:glyph` — returns full character details (glyph, pinyin, meaning, HSK levels, stroke count, radical, classification)
- [ ] `GET /api/v1/characters/:glyph/phonetic` — returns phonetic component info for the given character
- [ ] `GET /api/v1/characters/:glyph/homophones` — returns all characters sharing the same pronunciation (same pinyin, any tone)
- [ ] `GET /api/v1/characters/:glyph/decomposition` — returns decomposition tree (constituent components with types)
- [ ] `GET /api/v1/characters/search?q=&tone=&hskLevel=` — search characters by pinyin, tone filter, or HSK level
- [ ] `GET /api/v1/characters/frequency?tier=` — returns characters ordered by frequency rank, optionally filtered by HSK tier
- [ ] Module registered in `apps/backend/src/app/container.ts` — routes wired and accessible
- [ ] All endpoints return appropriate error codes (400 for invalid glyph, 404 for not found)
- [ ] Unit tests for each service method covering success and error paths
- [ ] MSW handlers created for frontend testing covering all 6 endpoints
- [ ] Existing `modules/radicals/` audited for character-related routes — any found are refactored into the new module (with thin proxy for backward compatibility if needed)
- [ ] 0 lint errors across all new files

## Business Rules

1. **Modulith Pattern** — The characters module follows the existing modulith structure: `container.ts` for DI registration, `api/` for controllers and routes, `services/` for business logic, `repositories/` for Prisma queries, `types/` for request/response types.
2. **Prisma-First Queries** — All endpoints query Prisma against existing tables (Character, CharacterComponent, CharacterReading, CharacterRadical, CharacterHskLevel). No direct JSON file access — all-in-DB architecture.
3. **Caching** — Infrequently changing endpoints (decomposition, phonetic, frequency) may be cached server-side with Redis (TTL 1 hour). Character search and homophones should reflect current data without caching.
4. **Idempotent GET** — All endpoints are read-only GET requests. No POST/PUT/DELETE in this story — mutations are handled by seed scripts (21.1, 21.2).
5. **Route Audit** — Before finalizing routes, audit `modules/radicals/` for any existing character-related endpoints. If found, refactor into `modules/characters/` with a thin forwarding proxy for backward compatibility.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.1: Data Lifecycle** ([BR](story-21-1-data-lifecycle.md)) (dependency — Character table and schema foundation)
- **Story 21.2: Character Content Generation** ([BR](story-21-2-character-content.md)) (dependency — all character data populated)
- **Story 21.4: Reading UI + LexicalHub Phase 1** ([BR](story-21-4-reading-ui-lexical-hub.md)) (consumer — LexicalHub uses character API endpoints)
- **Story 21.6: Phonetic Clusters** ([BR](story-21-6-phonetic-clusters.md)) (consumer — phonetic cluster data via characters module)
- **Story 21.12: Pinyin Search & Homophone API** ([BR](story-21-12-pinyin-search-homophones.md)) (extension — adds pinyin search endpoints to this module)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
