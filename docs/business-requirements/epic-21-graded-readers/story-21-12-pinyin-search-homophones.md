# Story 21.12: Pinyin Search API

**Last Update:** July 30, 2026

## Description

**As a** learner,
**I want to** search characters by pinyin (without requiring tone marks),
**So that** I can discover characters by sound and build a foundation for IME autocomplete and phonetic cluster exploration.

## Business Value

The technical redesign identified a gap in the current API surface: there is no pinyin-specific search endpoint that leverages the structured `PinyinSyllable` data. While a general character search exists at `GET /v1/characters/search` (Story 21.10), it uses `contains`-based matching on raw pinyin strings. A dedicated pinyin search endpoint using the structured `PinyinSyllable` + `PinyinCharacterMapping` tables enables:

- **Normalized prefix matching**: Type "ma" → matches all tone variants without tone marks
- **Tone grouping**: Results grouped for phonetic discovery
- **IME autocomplete foundation**: Pinyin-aware prefix search for the IME Simulator (Epic 19)
- **Phonetic cluster exploration**: Discover character sets sharing initial/final patterns

The `PinyinSyllable` table (≥1,300 entries, populated by Story 21.2) stores pinyin in both normalized form (`syllable`: "ma1") and accented form (`syllablePretty`: "mā"), making prefix search on normalized data trivial.

**Note:** The homophone endpoint (`GET /v1/characters/:glyph/homophones`) was delivered early in Story 21.10. This story focuses solely on the pinyin search endpoint.

## Acceptance Criteria

- [x] `GET /api/v1/pinyin/search?q=&tone=&page=&pageSize=` endpoint returns characters matching the pinyin query
- [x] Pinyin search uses `PinyinSyllable` + `PinyinCharacterMapping` tables for structured lookup
- [x] Supports prefix matching on normalized pinyin (e.g., `?q=ma` matches "ma1", "ma2", "ma3", "ma4", "ma5")
- [x] Optional `?tone=N` (1-5) filter narrows results to a specific tone
- [x] Paginated response with `page`, `pageSize`, `totalResults` (default: 50, max: 100)
- [x] Returns 400 with `VALIDATION_ERROR` for missing `q` parameter
- [x] Returns 200 with empty `results` array for no matches
- [x] Implemented in `modules/characters/` as a dedicated sub-module (PinyinController, PinyinSearchService, PinyinSearchRepository)
- [x] Route constant `pinyinSearch` added to `@mandarin/shared-constants`
- [x] MSW handlers created for the endpoint (default, loading, empty, error)
- [x] Unit tests for PinyinSearchService
- [x] 0 lint errors across all changed files

## Business Rules

1. **Pinyin Search Scope** — Searches against `PinyinSyllable.syllable` (normalized form with tone number, e.g., "ma1") using `startsWith`. The user's query is lowercased and tone marks are stripped before matching.
2. **Tone Filtering** — Optional `?tone=N` (1-4, or 5 for neutral) filter narrows results to a specific tone. Without the filter, all tone variants are included.
3. **Normalized Matching** — The `syllable` field stores pinyin with tone NUMBER (e.g., "ma1"), not tone MARKS (e.g., "mā"). This enables straightforward prefix matching: `?q=ma` → `syllable: { startsWith: "ma" }` matches all tone variants.
4. **Response Limits** — Results are capped at 50 by default, with pagination via `?page=&pageSize=`. `pageSize` is capped at 100.
5. **Module Placement** — The pinyin search endpoint lives in `modules/characters/` but gets its own sub-router mounted at `/api/v1/pinyin/search` (separate from `/characters/` routes).
6. **Empty Results** — No-match queries return 200 with `results: []`, not 404. 400 is only returned for missing required parameters.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.10: Characters Backend Module** ([BR](story-21-10-characters-module.md)) (dependency — characters module provides the architecture and container registration)
- **Story 21.2: Character Content Generation** ([BR](story-21-2-character-content.md)) (dependency — PinyinSyllable + PinyinCharacterMapping tables populated)
- Epic 19: IME Simulator (consumer — pinyin search provides autocomplete API foundation)
- Story 21.10 also delivered the homophone endpoint (`GET /v1/characters/:glyph/homophones`) ahead of this story

## Implementation Status

- **Status**: Implemented
- **PR**: N/A (direct commit — no PR)
- **Merge Date**: N/A
- **Key Commit**: `af1e83f8`
