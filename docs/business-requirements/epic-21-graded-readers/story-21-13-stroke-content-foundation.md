# Story 21.13: Stroke Content Foundation

**Last Update:** July 30, 2026

## Description

**As a** learner,
**I want to** have stroke reference data be part of the structured content pipeline backed by the database as the source of truth,
**So that** stroke categories, types, and order rules are consistent across the platform and maintainable as the content library grows.

## Business Value

The current stroke reference data lives in `content/references/strokes.json` and is served via file-read by `FoundationsService.getStrokesReference()` (`apps/backend/src/modules/foundations/services/FoundationsService.ts`). While this follows the initial content pipeline pattern, it bypasses the database — meaning API consumers get file data rather than the canonical DB, the data cannot participate in relational queries (e.g., linking stroke categories to characters), and there is no schema enforcement at the DB level. This story creates a structured `content/strokes/strokes.json` extract file, adds 4 new Prisma models, writes an enrichment script that produces Phase 2 seed files, integrates those into `prisma/seed.ts`, and refactors `FoundationsService` to query the DB instead of reading the JSON file directly. The API response shape remains backward-compatible — all frontend code works unchanged.

## Acceptance Criteria

- [x] `content/strokes/strokes.json` created with 5 PRC stroke categories (点/横/竖/撇/折), 8 extended stroke types (捺/提/弯/钩/斜/挑/折/钩 variants), and 5 stroke order rules (top→bottom, left→right, horizontal→vertical, outside→inside, middle→sides); each category and extended type includes a `glyph` field (丶, 一, 丨, 丿, ㇍, etc.)
- [x] `content/manifest.json` updated with stroke entity reference count
- [x] Backend serves stroke data from the database via `GET /v1/foundations/data/strokes` (endpoint unchanged, now DB-backed instead of file-read)
- [x] Stroke data schema validated: the API response shape is backward-compatible with the existing `StrokeData` type (`strokes[]`, `strokeOrderRules[]`, `suggestedCharacters[]`) consumed by frontend components
- [x] All existing stroke-dependent features continue to work after the migration — API response shape remains unchanged
- [x] Prisma migration creates 4 stroke models (`StrokeCategory`, `StrokeExtendedType`, `StrokeOrderRule`, `StrokeCategoryOrderRule`) with proper foreign keys and indexes
- [x] Enrichment script `scripts/enrich/build-stroke-entries.ts` produces Phase 2 seed files (`content/seed/phase2/strokes-*.json`)
- [x] `prisma/seed.ts` bulk-inserts stroke data via `createMany()` in the correct dependency order
- [x] `content/references/strokes.json` removed after migration is confirmed working
- [x] 0 lint errors across all changed files

## Business Rules

1. **DB as Source of Truth** — The database (Prisma models) is the canonical source for ALL stroke data. Content JSON files in `content/` are extract/enrichment files used for DB seeding in CI/CD. All backend API endpoints must query the DB — not read JSON files directly. Frontend consumes exclusively through backend APIs.
2. **PRC Standard** — Stroke categories follow the PRC national standard (GB 13000.1-2010): 点 (diǎn), 横 (héng), 竖 (shù), 撇 (piě), 折 (zhé) as the 5 base categories.
3. **Extended Set** — Include 8 extended stroke types that are commonly referenced in stroke order pedagogy: 捺 (nà), 提 (tí), 弯 (wān), 钩 (gōu), 斜 (xié), 挑 (tiǎo), and hook/bend variants of 折.
4. **ContentPipeline Pattern** — The strokes.json file follows the same pattern as other content files: a JSON array of stroke objects with a schema that includes id, name, pinyin, category, glyph, and example characters. The manifest.json stroke count is updated accordingly.
5. **Backward Compatibility** — The API response shape must remain backward-compatible with the existing `StrokeData` type (`strokes[]`, `strokeOrderRules[]`, `suggestedCharacters[]`) consumed by frontend components. No frontend changes are required.

## Related Issues

- Epic 21: Foundation Complete — Graded Readers & Character Practice — BR (`../README.md`) (epic parent)
- Epic 18: Character Foundations (coordination — stroke content appears in Foundations feature surface)

## Implementation Status

- **Status**: Implemented
- **PR**: N/A (direct commit)
- **Merge Date**: July 30, 2026
- **Key Commit**: TBD
