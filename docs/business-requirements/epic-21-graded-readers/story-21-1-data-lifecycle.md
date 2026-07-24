# Story 21.1: Data Lifecycle

**Last Update:** July 24, 2026

## Description

**As a** learner,
**I want** the graded readers to have accurate HSK vocabulary leveling, normalized content, and reliable progress tracking,
**So that** my reading experience is based on well-organized, level-appropriate content.

## Business Value

This story is the **critical prerequisite** for the entire epic — nothing else can work without the data foundation. It establishes the foundational schema (Word with commonly-queried fields, Character enhanced with classification, PinyinSyllable, Component scaffold), seeds all reference data, and runs Phase B migration scripts. Without this, passage generation, reading UI, audio sync, and progress tracking cannot function.

## Acceptance Criteria

- [x] Word table seeded with 11,092 records (original pure ID-only; Phase B widening pending)
- [x] WordHskLevel table populated with wordId → hskLevel mappings
- [x] Character table expanded with 2,971 unique characters from HSK vocabulary
- [x] CharacterHskLevel table populated with characterId → hskLevel mappings (min HSK level per character)
- [x] WordCharacter junction populated with correct sequence_order (21,881 junctions)
- [x] Word index JSON file created: `content/words/index.json` (472 KB, 10,912 lookups)
- [x] Word attributes JSON file created: `content/words/words.json` (2.5 MB, 11,092 word entries)
- [x] Character enrichment aggregate file created: `content/characters/characters.json`
- [x] CharacterReading records created for polyphone characters
- [ ] Progress table dropped (Phase C — immediate, no safety window)
- [ ] [A1] CharacterRadical.decompositionType field added (String? — "semantic" | "phonetic" | "remaining" | null)
- [ ] [A2] PhoneticCluster + ClusterMembership models created (empty until 21.5 populates)
- [ ] [A3] PinyinSyllable table seeded with ≥1,300 entries
- [ ] [A4] pgvector extension enabled on Neon
- [ ] [A4] ContentEmbedding table created for vector storage
- [ ] [B1] content/characters/characters.json generated from DB for all 2,971 characters
- [ ] [B1] content/characters/index.json generated (glyph → character ID lookup)
- [ ] [B2] Character.classification populated in metadata for pictographs/ideographs
- [x] ReviewLog table created with content_version field
- [x] WordLookupEvent table created for word tap tracking
- [x] 6 demo passages seeded (1 per HSK level 1-6)
- [x] Seed scripts are idempotent (safe to re-run)
- [x] Content files verified: `content/words/index.json` (472 KB), `content/words/words.json` (2.5 MB), `content/characters/characters.json`
- [ ] Verification gates passed: spot-check 10 user records, segmenter tokenizes 5 test passages correctly (pending Story 21.2 segmenter)

## Business Rules

1. **DB as source of truth for all structured content** — Word stores commonly-queried fields (simplified, pinyin, meaning, hskLevel, frequencyRank, wordClass). content/ directory is seed source only — never read at runtime.
2. **CharacterProgress is derived from ReviewLog** — No direct writes. Event sourcing pattern: ReviewLog events → SRS engine → CharacterProgress upsert.
3. **Guest tracking via sessionId** — WordLookupEvent with `userId: null` for aggregate analytics.
4. **content_version on all content models** — Every model gets `content_version: Int @default(1)` for future migration safety.
5. **metadata JSON field** — Every model gets `metadata Json?` for extensibility without schema migrations.
6. **Permanent Content IDs** — Every entity gets a stable business key at creation: w_XXXXX, ch_XXXX, etc. Never auto-increment integers.
7. **All-in-DB data tiering** — All structured content lives in PostgreSQL with full indexes and FK relationships. content/ files remain as git-versioned seed source. GCS for binary assets only (TTS audio, stroke SVGs).
8. **Append-Only ReviewLog** — Every progress update appends one row. Seeds future CQRS event stream.
9. **Migration follows redefined Phase A→B→C: Phase A (additive schema), Phase B (transformation/widening), Phase C (cleanup/drops — immediate, no safety window).**
10. **Entities being removed** — `VocabularyWord`, `VocabularyList`, `WordList`, `ContentItem`, `Progress`, `Category`, `PinyinCombination` tables are dropped after migration.
11. **Phase C drops are irreversible** — Verify all Phase B transforms before proceeding. No safety window for deprecated tables from previous schema.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.2: Character Content Generation** ([BR](story-21-2-character-content.md)) (NEW — depends on this story)
- **Story 21.6: Phonetic Clusters** ([BR](story-21-6-phonetic-clusters.md)) (depends on 21.2)
- **Story 21.3: Passage Generation Backend** ([BR](story-21-3-passage-generation.md)) (depends on this story)

## Implementation Status

- **Status**: Phase A original complete. A1-A4 schema additions + B1-B2 content generation pending. Phase B migration scripts ready. Phase C pending (immediate drop, no 2-week window).
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
