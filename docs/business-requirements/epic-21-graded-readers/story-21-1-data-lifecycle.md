# Story 21.1: Data Lifecycle

## Description

**As a** learner,
**I want** the graded readers to have accurate HSK vocabulary leveling, normalized content, and reliable progress tracking,
**So that** my reading experience is based on well-organized, level-appropriate content.

## Business Value

This story is the **critical prerequisite** for the entire epic — nothing else can work without the data foundation. It establishes the pure ID-only Word model, classification tables (WordHskLevel/CharacterHskLevel), the three-tier cache, event-sourced ReviewLog, and normalized character IDs. Without this, passage generation, reading UI, audio sync, and progress tracking cannot function.

## Acceptance Criteria

- [ ] Word table seeded with ~11,000 records (pure ID-only) from andycburke/HSK-3.0-Word-List CSV
- [ ] WordHskLevel table populated with wordId → hskLevel mappings
- [ ] Character table expanded with unique characters from HSK vocabulary
- [ ] CharacterHskLevel table populated with characterId → hskLevel mappings
- [ ] WordCharacter junction populated with correct sequence_order
- [ ] Word index JSON file created: `content/words/index.json` with simplified→wordId + wordId→hskLevel maps
- [ ] Individual word JSON files created: `content/words/w_XXXXX.json` with full attributes
- [ ] CharacterReading records created for polyphone characters
- [ ] Old Progress records migrated to CharacterProgress + WordStudyContext (verified by row count)
- [ ] Old Progress table renamed to Progress_old (2-week safety period before drop)
- [ ] Old VocabularyWord/VocabularyList/WordList tables dropped
- [ ] Old ContentItem table dropped
- [ ] HSK 3.0 Band 1 CSV directory deleted from frontend public/
- [ ] Character IDs normalized: ch_hsk_* → ch_XXXX, duplicates deduplicated (ch_1001 = ch_hsk_hao)
- [ ] ReviewLog table created with content_version field
- [ ] WordLookupEvent table created for word tap tracking
- [ ] 6 demo passages seeded (1 per HSK level 1-6)
- [ ] Seed scripts are idempotent (safe to re-run)
- [ ] Verification gates passed: row counts match, spot-check 10 user records, segmenter tokenizes 5 test passages correctly

## Business Rules

1. **DB for relationships only** — Word is pure ID-only (`{ id }`). All attributes (simplified, pinyin, definitions, POS, examples) in `content/words/*.json` static files.
2. **CharacterProgress is derived from ReviewLog** — No direct writes. Event sourcing pattern: ReviewLog events → SRS engine → CharacterProgress upsert.
3. **Guest tracking via sessionId** — WordLookupEvent with `userId: null` for aggregate analytics.
4. **content_version on all content models** — Every model gets `content_version: Int @default(1)` for future migration safety.
5. **metadata JSON field** — Every model gets `metadata Json?` for extensibility without schema migrations.
6. **Permanent Content IDs** — Every entity gets a stable business key at creation: w_XXXXX, ch_XXXX, etc. Never auto-increment integers.
7. **File-per-entity** — One JSON file per entity in `content/`. Files store attributes only; relationships go in DB junction tables.
8. **Append-Only ReviewLog** — Every progress update appends one row. Seeds future CQRS event stream.
9. **Migration follows Phase A→B→C sequence** — Phase A creates new tables and seeds data (no downtime). Phase B migrates old progress records with row-count verification before safety rename. Phase C drops deprecated tables after a 2-week safety period.
10. **Entities being removed** — `VocabularyWord`, `VocabularyList`, `WordList`, `ContentItem` tables are dropped after migration. Old `Progress` table is renamed to `Progress_old` during Phase B and dropped in Phase C. All `ch_hsk_*` character files renamed to `ch_XXXX` format with deduplication.
11. **Rollback safety** — `Progress_old` retained for 2 weeks. Each failure scenario (CSV parse errors, data loss, ID rename conflicts) has a defined rollback action. Feature-flag gates the entire readers module.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.6: Phonetic Clusters** ([BR](story-21-6-phonetic-clusters.md)) (can run in parallel)
- **Story 21.2: Passage Generation Backend** ([BR](story-21-2-passage-generation.md)) (depends on this story)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
