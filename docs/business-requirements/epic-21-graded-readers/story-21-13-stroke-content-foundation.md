# Story 21.13: Stroke Content Foundation

**Last Update:** July 24, 2026

## Description

**As a** learner,
**I want to** have stroke reference data be part of the structured content pipeline rather than hardcoded frontend constants,
**So that** stroke categories, types, and order rules are consistent across the platform and maintainable as the content library grows.

## Business Value

The current stroke reference data is hardcoded as frontend constants, making it impossible for content teams to update without code changes and creating inconsistency risks as more features consume stroke data. This story creates a structured `content/strokes/strokes.json` file following the existing content pipeline pattern (characters, radicals, pinyin), updates the content manifest, and wires the frontend's ContentIndexService to load stroke data like any other content type. This enables stroke data to be versioned, validated, and updated independently of code deploys. Estimated effort is ~1 day for a standalone data task ideal for onboarding.

## Acceptance Criteria

- [ ] `content/strokes/strokes.json` created with 5 PRC stroke categories (点/横/竖/撇/折), 8 extended stroke types (捺/提/弯/钩/斜/挑/折/钩 variants), and 5 stroke order rules (top→bottom, left→right, horizontal→vertical, outside→inside, middle→sides)
- [ ] `content/manifest.json` updated with stroke entity reference count
- [ ] Frontend loads stroke data from `content/strokes/` via ContentIndexService instead of hardcoded constants
- [ ] Stroke data schema validated: each stroke entry includes id, glyph, name (Chinese), pinyin, category, stroke count, order rules, and example characters
- [ ] All existing stroke-dependent features continue to work after the migration
- [ ] ContentIndexService test updated for stroke content type
- [ ] 0 lint errors across all changed files

## Business Rules

1. **PRC Standard** — Stroke categories follow the PRC national standard (GB 13000.1-2010): 点 (diǎn), 横 (héng), 竖 (shù), 撇 (piě), 折 (zhé) as the 5 base categories.
2. **Extended Set** — Include 8 extended stroke types that are commonly referenced in stroke order pedagogy: 捺 (nà), 提 (tí), 弯 (wān), 钩 (gōu), 斜 (xié), 挑 (tiǎo), and hook/bend variants of 折.
3. **ContentPipeline Pattern** — The strokes.json file follows the same pattern as other content files: a JSON array of stroke objects with a schema that includes id, name, pinyin, category, and example characters. The manifest.json stroke count is updated accordingly.
4. **No Database Changes** — Stroke reference data is static content, not user-generated data. It stays in the content pipeline (not in the database) to avoid over-engineering for data that rarely changes.
5. **Backward Compatibility** — Any frontend code that currently hardcodes stroke constants is updated to use ContentIndexService. The shape of the data made available to components should match what components already expect.

## Related Issues

- Epic 21: Foundation Complete — Graded Readers & Character Practice — BR (`../README.md`) (epic parent)
- Epic 18: Character Foundations (coordination — stroke content appears in Foundations feature surface)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
