# Story 21.12: Pinyin Search & Homophone API

**Last Update:** July 24, 2026

## Description

**As a** learner,
**I want to** search characters by pinyin and find homophones (characters sharing the same pronunciation),
**So that** I can discover characters by sound, understand homophone relationships, and build a foundation for IME autocomplete and phonetic cluster exploration.

## Business Value

The technical redesign identified two gaps in the current API surface: (1) there is no pinyin search endpoint — learners and features cannot search characters by pronunciation, and (2) there is no dedicated homophone discovery API — features like LexicalHub (21.4) have no way to show "same pronunciation, different character" relationships. Both endpoints leverage tables already populated by Story 21.2 (PinyinSyllable: ≥1,300 entries, PinyinCharacterMapping, CharacterReading), making the implementation effort minimal (~1-2 days) for the value delivered. The pinyin search endpoint enables LexicalHub to display homophones in the WordHubContent panel, and provides the API foundation for the IME Simulator autocomplete feature (Epic 19). The homophone endpoint supports phonetic cluster comparison and tone-based character discovery.

## Acceptance Criteria

- [ ] `GET /api/v1/pinyin/search?q=&tone=` endpoint returns characters matching the pinyin query, grouped by tone variant
- [ ] `GET /api/v1/characters/:glyph/homophones` endpoint returns all characters sharing the same pinyin+tone(s) as the given character
- [ ] Pinyin search supports partial matching (e.g., `?q=ma` matches "ma", "mā", "má", "mǎ", "mà")
- [ ] Homophone endpoint accepts `?exactTone=true` to match only the exact tone (default: all tones for the pinyin)
- [ ] Both endpoints return appropriate error codes (400 for missing query, 404 for no results)
- [ ] Both endpoints are implemented in the `modules/characters/` module (Story 21.10)
- [ ] MSW handlers created for both endpoints
- [ ] Integration tests for both endpoints (service layer + API layer)
- [ ] Unit tests covering edge cases: empty query, no matches, special characters in pinyin
- [ ] 0 lint errors across all changed files

## Business Rules

1. **Pinyin Search Scope** — Searches against the `PinyinSyllable` table (nucleus/final combinations) and `PinyinCharacterMapping` table. Returns characters whose pinyin matches the query prefix. Example: `?q=ma` returns all entries where pinyin starts with "ma".
2. **Tone Filtering** — Optional `?tone=N` (1-4, or 5 for neutral) filter narrows results to a specific tone. Without the filter, all tone variants are returned grouped by tone.
3. **Homophone Discovery** — The homophone endpoint queries `CharacterReading` for all characters with matching pinyin (and optionally tone). The source character is excluded from results. Returns minimum fields: glyph, pinyin, tone, meaning.
4. **Response Limits** — Both endpoints cap results at 50 by default, with pagination support via `?page=&pageSize=` query params.
5. **Module Placement** — Both endpoints live in `modules/characters/` (Story 21.10). The pinyin search endpoint is mounted at `/api/v1/pinyin/search` (not under `/characters`) to follow REST naming conventions for cross-entity search.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.10: Characters Backend Module** ([BR](story-21-10-characters-module.md)) (dependency — characters module provides the architecture and container registration)
- **Story 21.4: Reading UI + LexicalHub Phase 1** ([BR](story-21-4-reading-ui-lexical-hub.md)) (consumer — LexicalHub displays homophones in WordHubContent)
- Epic 19: IME Simulator (consumer — pinyin search provides autocomplete API foundation)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
