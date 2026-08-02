# Story 21.6: Phonetic Clusters

**Last Update:** July 30, 2026

## Description

**As a** learner,
**I want to** browse characters grouped by shared phonetic elements,
**So that** I can recognize pronunciation patterns and guess how new characters sound.

## Business Value

Phonetic clusters help learners recognize patterns in character pronunciation — a key skill for Chinese literacy. By grouping characters that share a phonetic component (e.g., 青 family: 请情清晴), learners can more easily remember pronunciations and make educated guesses about unfamiliar characters. This is a standalone bonus feature that can be built independently of the reader pipeline.

## Acceptance Criteria

- [x] Characters grouped by shared phonetic element (e.g., 青 family: 请情清晴)
- [x] Each group card shows: phonetic pattern, characters in group, pronunciation changes
- [x] Clickable character → opens CharacterHub
- [x] Filter by HSK level (dropdown/pills)
- [x] **DB-driven** — Data seeded via Prisma pipeline (`PhoneticCluster` + `PhoneticClusterMember` models), served by a dedicated `modules/phonetic-clusters/` REST API
- [x] `GET /v1/phonetic-clusters` endpoint returns all clusters with optional `?hskLevel=N` filter
- [x] `GET /v1/phonetic-clusters/:id` endpoint returns single cluster with full member details
- [x] Backend module registered in app `container.ts` — routes accessible
- [x] `ROUTE_PATTERNS` shared constants package updated with phonetic cluster route definitions
- [x] All states: loading (skeleton grid), error (with retry), empty (no clusters exist), populated, filtered-empty (no clusters match HSK filter)

## Business Rules

1. **DB-driven** — Data seeded via Prisma pipeline (`content/seed/phase2/`), served by `modules/phonetic-clusters/` REST API. No static JSON files consumed by the frontend.
2. **Hand-curated + script-assisted generation** — The flagship families (青, 包) remain hand-curated with authored pronunciation notes and are preserved verbatim. The remaining Phase 2 families (target: top 10 by character count) are generated deterministically from the phase2 `characters.json` `phoneticComponentId` self-relation by `apps/backend/scripts/enrich/build-phonetic-clusters.ts` (verified data foundation: ~1,500 phonetic component targets mapping to `Component` by glyph). Generated pronunciation notes are data-derived, not authored. Seed files are version-controlled in `content/seed/phase2/`.
3. **HSK 1-2 focus** — Only characters in HSK levels 1 and 2 are included initially. Can be expanded later via additional seed data.
4. **HSK filter via query param** — The `GET /v1/phonetic-clusters` endpoint supports an optional `?hskLevel=N` query parameter to filter clusters that contain at least one character at the specified HSK level. Client-side filtering is acceptable as a fallback.
5. **CharacterHub integration** — Clicking a character opens CharacterHub for full detail view.
6. **Backend module registration** — The `modules/phonetic-clusters/` module follows the modulith pattern and is self-contained with `container.ts`, `api/`, `services/`, `repositories/`, and `types/` directories. Registered in the app-level container.
7. **Routing model** — `PhoneticClustersPage` renders at `/learn/phonetic-clusters`, replacing the existing `ContentPlaceholderPage`. Phase gating is handled by `LearnLayout`.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.1: Data Lifecycle** ([BR](story-21-1-data-lifecycle.md)) (dependency — `Character` table populated)
- **Story 21.2: Character Content Generation** ([BR](story-21-2-character-content.md)) (dependency — character enrichment with phonetic component data)
- **Story 21.10: Characters Backend Module** ([BR](story-21-10-characters-module.md)) (dependency — provides backend module infrastructure pattern; phonetic cluster data sourced independently)
- Can run in parallel with Stories 21.3–21.5, 21.7–21.9

## Implementation Status

- **Status**: Completed
- **PR**: N/A (direct commit — no PR)
- **Merge Date**: N/A
- **Key Commit**: `3091eec4`
