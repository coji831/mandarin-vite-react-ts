# Story 21.8: Measure Word Foundation

**Last Update:** July 30, 2026

## Description

**As a** learner,
**I want to** see measure words paired with their associated nouns during vocabulary lookup,
**So that** I can learn which measure word to use with which noun in context.

## Business Value

Business audit §7 identified measure words as "the single biggest grammar omission" and "#3 difficulty point" for learners. Mandarin requires measure words (量词) between numbers and nouns (e.g., 一个人, 两本书, 三张桌子), and learners frequently produce errors like *一人 or *两书 without them. Exposing the existing MeasureWord + MeasureWordWord data models via API closes this gap. This story lays the data foundation; the LexicalHub integration (displaying measure words alongside vocabulary lookup) is a sub-AC of Story 21.4.

## Acceptance Criteria

- [x] MeasureWord model exists in Prisma schema with permanent content IDs (mw_001 pattern)
- [x] MeasureWordWord junction model exists for many-to-many noun pairing
- [x] Seed data has 52 common measure words with `category` and `usageNote` fields populated
- [x] Seed data has 135 MeasureWordWord noun-pairing records (pre-existing, no changes needed)
- [x] `GET /api/v1/words/:id/measure-words` endpoint returns array of compatible measure words for a given noun
- [x] Endpoint returns 400 for unknown wordId, 200 with empty array for words with no measure words
- [x] LexicalHub (Story 21.4) displays measure words in WordHubContent — integration point established
- [x] Seed script is idempotent (`skipDuplicates: true` — safe to re-run)
- [x] Measure words include fields: category tag (general, measure, time, abstract, verb, formal, container), usage notes, pinyin with tone marks

## Business Rules

1. **Permanent Content IDs** — Every measure word gets a stable business key: `mw_001`, `mw_002`, etc. (3-digit, matching Phase 2 data format). Never auto-increment integers. IDs are determined by the seed data and never change.
2. **Noun Pairing** — MeasureWordWord junction table pairs measure words with Word records. A single measure word (e.g., 个) pairs with many nouns. A single noun (e.g., 书) may pair with multiple measure words (e.g., 本 for books, 张 for pages).
3. **Category System** — Each measure word has one category tag from 7 possible values:
   - `"general"` — Fallback measure word (currently only 个)
   - `"measure"` — Size/weight/quantity (尺, 斤, 块, 条, 张)
   - `"time"` — Time units (年, 月, 天, 小时 — reserved for future expansion)
   - `"abstract"` — Abstract categories (种, 些, 点, 点)
   - `"verb"` — Verbal measure (次, 遍, 下, 回)
   - `"formal"` — Polite/formal usage (位, 座, 所)
   - `"container"` — Container measures (杯, 碗, 瓶, 盒)

   This enables future filtering and pedagogical grouping.

4. **Usage Notes** — Each measure word includes learner-facing notes: e.g., "个 is the most common general measure word — can be used as a fallback when unsure which MW to use."
5. **API Returns Full Measure Word Objects** — `GET /api/v1/words/:id/measure-words` returns `{ wordId, simplified, measureWords: [{ id, simplified, pinyin, meaning, category, usageNote, isDefault, exampleSentence }] }`. The `isDefault` flag indicates the most common measure word for this noun (e.g., 个 for 人).
6. **HSK 1-3 Focus** — Seed data covers the most common measure words encountered by beginners. Expanded to HSK 4+ in a future story.
7. **Idempotent Seed** — Seed uses `skipDuplicates: true` (equivalent to `ON CONFLICT DO NOTHING`) for both MeasureWord and MeasureWordWord. Re-running the seed does not duplicate records.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.1: Data Lifecycle** ([BR](story-21-1-data-lifecycle.md)) (dependency — Word table and schema foundation needed)
- **Story 21.2: Character Content Generation** ([BR](story-21-2-character-content.md)) (dependency — character enrichment for supporting data)
- **Story 21.4: Reading UI + LexicalHub Phase 1** ([BR](story-21-4-reading-ui-lexical-hub.md)) (consumer — LexicalHub displays measure words in WordHubContent)

## Implementation Status

- **Status**: Complete
- **PR**: N/A (direct commit — no PR)
- **Merge Date**: N/A
- **Key Commit**: `51487da7`
