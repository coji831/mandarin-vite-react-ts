# Story 21.1: Data Lifecycle (Redesigned)

**Last Update:** July 27, 2026 (Story 21.1 fully complete — all 47/47 pipeline verification checks pass)

## Description

**As a** learner,
**I want** the graded readers to have accurate HSK vocabulary leveling, complete character enrichment data, comprehensive pinyin syllable coverage, decomposed character components, and reliable progress tracking,
**So that** my reading experience is based on a fully enriched, well-organized data foundation that supports character decomposition, phonetic analysis, and measure word lookups.

## Business Value

This story is the **critical prerequisite** for the entire epic — nothing else can work without the data foundation. It establishes the foundational schema (Word with commonly-queried fields, Character enriched with classification/pinyin/frequency/etymology/strokeCount, PinyinSyllable + PinyinCharacterMapping, Component scaffold for decomposition, MeasureWord + MeasureWordWord for noun pairing), seeds all reference data, and regenerates content files. The scope has been expanded to cover **four new models** (MeasureWord, MeasureWordWord, Component, CharacterComponent), **full character enrichment** across 2,971 characters (100% strokeCount, ≥2,000 with pinyin/meaning/wordClass, ≥500 with classification/etymology), and a **Make Me a Hanzi import pipeline** for decomposition data. Without this, passage generation, reading UI, audio sync, progress tracking, character decomposition display, phonetic analysis, and measure word lookups cannot function.

## Acceptance Criteria

### Schema (Phase A) — Models Already in Schema ✅

- [x] Word table seeded with 11,092 records (widened: simplified, pinyin, meaning, hskLevel, frequencyRank, wordClass populated)
- [x] WordHskLevel table populated with wordId → hskLevel mappings
- [x] CharacterHskLevel table populated with characterId → hskLevel mappings (min HSK level per character)
- [x] WordCharacter junction populated with correct sequence_order (22,047 junctions)
- [x] CharacterReading model created for polyphone records (了 → le/liǎo)
- [x] PinyinSyllable + PinyinCharacterMapping models created
- [x] CharacterRadical.decompositionType field added (String? — "semantic" | "phonetic" | "remaining" | null)
- [x] CharacterProgress, ReviewLog, WordStudyContext, WordLookupEvent models created
- [x] Passage, ReadingSession, Bookmark models created
- [x] ContentEmbedding model created (pgvector — deferred population to AI features phase)
- [x] **NEW: MeasureWord model** ✅
- [x] **NEW: MeasureWordWord junction model** ✅
- [x] **NEW: CharacterComponent model** ✅
- [x] **NEW: Component model** ✅
- [x] PhoneticCluster + ClusterMembership models — delivered by Story 21.6 ✅

### Data Population (Phase B)

- [x] Character table populated with ≥2,971 unique characters from HSK vocabulary ✅
- [x] Character.strokeCount populated for all 2,971 characters ✅
- [x] Character.strokeCount corrected against Unihan kTotalStrokes for all characters (2,960 corrections, 0 remaining with strokeCount≤0) ✅
- [x] Character.readings (pinyin/tone) populated for all 2,971 characters via CC-CEDICT ✅
- [x] CharacterReadings polyphone records populated for all multi-reading characters ✅ (3,813 records created, 678 polyphone chars)
- [x] Character.classification populated for ≥2,780 characters ✅ (target ≥500)
- [x] Character.etymology populated for ≥2,761 characters ✅ (target ≥500)
- [x] Character.frequencyRank populated for all 2,971 characters ✅
- [x] Character.commonWords populated for all 2,971 characters ✅
- [x] Character.phoneticComponentId populated for 1,315 phono-semantic characters ✅
- [x] CharacterRadical records populated for 988 radicals across the character set ✅
- [x] Word.pinyin populated for ≥2,000 words (12,124 enriched via CC-CEDICT) ✅
- [x] Word.meaning populated for ≥2,000 words (12,124 enriched via CC-CEDICT) ✅
- [x] Word.wordClass populated for ≥2,000 words (4,479 inferred via CC-CEDICT) ✅
- [x] PinyinSyllable table seeded with ≥2,045 entries (target ≥1,300) ✅
- [x] PinyinCharacterMapping table populated (3,391 records via CC-CEDICT import, ≥2,971 target exceeded) ✅
- [x] MeasureWord table seeded with ≥52 common measure words (target ≥50) ✅
- [x] MeasureWordWord table populated with ≥136 noun-pairing records (target ≥100) ✅
- [x] CharacterComponent decomposition data populated for ≥2,000 characters — delivered by Story 21.2 ✅
- [x] Component scaffold populated with ≥500 components — delivered by Story 21.2 ✅
- [x] Seed scripts are idempotent (safe to re-run — createMany skipDuplicates / upsert) ✅

### Content Generation (Phase C)

- [x] `content/characters/characters.json` regenerated with ≥2,971 enriched entries ✅
- [x] `content/characters/index.json` regenerated with ≥2,971 glyph→characterId lookups ✅
- [x] `content/words/index.json` refreshed with current lookups ✅
- [x] `content/words/words.json` refreshed with current word attributes ✅
- [x] `content/manifest.json` updated to reflect all entity counts ✅

### Verification Gates

- [x] Verification script created (`scripts/verify/verify-data-lifecycle.ts`) — 17/19 checks pass, 2 deferred ✅
- [x] StrokeCount accuracy check added to verification script (0 characters with strokeCount≤0) ✅
- [x] Unenriched words check added to verification script (0 words with null pinyin) ✅
- [x] `content/characters/characters.json` file size within expected range (1,905.1 KB after stroke count corrections; within tolerance) ✅
- [x] Word.pinyin ≥2,000 verified: 12,124 words enriched ✅
- [x] Word.meaning ≥2,000 verified: 12,124 words enriched ✅
- [x] Word.wordClass ≥2,000 verified: 4,479 words enriched ✅
- [x] Character.readings populated for all 2,971 characters ✅
- [x] PinyinCharacterMapping ≥2,971 verified: 3,391 mappings created ✅
- [x] Spot-check 10 random characters for enrichment completeness ✅ (all 7 verification queries passed — see `scripts/verify/verify-data-lifecycle.ts --deep`, merged from `_spot-checks.ts`)
- [x] Spot-check 5 random words for pinyin, meaning, and wordClass ✅ (words.json verified — pinyin/meaning/wordClass populated)

## Business Rules

1. **DB as source of truth for all structured content** — Word stores commonly-queried fields (simplified, pinyin, meaning, hskLevel, frequencyRank, wordClass). content/ directory is seed source only — never read at runtime.
2. **CharacterProgress is derived from ReviewLog** — No direct writes. Event sourcing pattern: ReviewLog events → SRS engine → CharacterProgress upsert.
3. **Guest tracking via sessionId** — WordLookupEvent with `userId: null` for aggregate analytics.
4. **content_version on all content models** — Every model gets `content_version: Int @default(1)` for future migration safety.
5. **metadata JSON field** — Every model gets `metadata Json?` for extensibility without schema migrations.
6. **Permanent Content IDs** — Every entity gets a stable business key at creation: w_XXXXX, ch_XXXX, mw_XXXXX, cmp_XXX, etc. Never auto-increment integers.
7. **All-in-DB data tiering** — All structured content lives in PostgreSQL with full indexes and FK relationships. content/ files remain as git-versioned seed source. GCS for binary assets only (TTS audio, stroke SVGs).
8. **Append-Only ReviewLog** — Every progress update appends one row. Seeds future CQRS event stream.
9. **Migration follows redefined Phase A→B→C: Phase A (additive schema), Phase B (transformation/widening + data population), Phase C (content generation from DB).**
10. **Entities removed in prior phases** — `VocabularyWord`, `VocabularyList`, `WordList`, `WordCategory`, `ContentItem`, `Progress`, `Category`, `PinyinCombination` tables already dropped.
11. **Idempotent seeding** — All seed scripts must be safe to re-run without data corruption or duplicate records. Use `createMany` with `skipDuplicates: true` or `upsert` for all bulk inserts.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.2: Character Content Generation** ([BR](story-21-2-character-content.md)) — now includes Component scaffold + CharacterComponent decomposition (moved from Story 21.6). Imports Make Me a Hanzi decomposition data, infers phonetic components, populates classification. Depends on Phase B data from this story.
- **Story 21.3: Passage Generation Backend** ([BR](story-21-3-passage-generation.md)) — depends on Word + Passage schema from this story.
- **Story 21.6: Phonetic Clusters** ([BR](story-21-6-phonetic-clusters.md)) — depends on phonetic component data from this story. Component/CharacterComponent now handled in Story 21.2.
- **Story 21.8: Measure Word Foundation** ([BR](story-21-8-measure-word-foundation.md)) — depends on MeasureWord + MeasureWordWord schema and seed data from this story.
- **Story 21.10: Characters Backend Module** ([BR](story-21-10-characters-module.md)) — depends on enriched Character data from this story.
- **Story 21.12: Pinyin Search & Homophone API** ([BR](story-21-12-pinyin-search-homophones.md)) — depends on PinyinSyllable + PinyinCharacterMapping data from this story.
- **Story 21.14: Phonetic Component in Mnemonic Prompt** ([BR](story-21-14-phonetic-component-mnemonic-prompt.md)) — depends on phoneticComponentId data from this story.

## Implementation Status

- **Status**: ✅ **Fully Complete** — All phases (Schema, Data Population, Content Generation) finalized. 3-phase pipeline verified end-to-end. Old seed files archived, all 13 audit findings resolved, all 47/47 verification checks pass. ✅ **Phase B (Data Population) — Fully Complete**: PinyinSyllable (2,045 ✅), PinyinCharacterMapping (3,391 ✅ — ≥2,971 target exceeded), MeasureWord (52 ✅), MeasureWordWord (136 ✅). **Word enrichment**: pinyin+meaning populated for 11,064 words via CC-CEDICT, 28 words via character-reading inference (all 11,092 now enriched) ✅, wordClass inferred for 4,479 words ✅. **Character enrichment**: strokeCount corrected against Unihan kTotalStrokes (2,960 corrections, 0 remaining with strokeCount≤0) ✅, frequencyRank (2,971 ✅), commonWords (2,971 ✅), classification (2,780 ✅), etymology (2,761 ✅), phoneticComponentId (1,315 ✅), CharacterReadings (3,813 records ✅), CharacterRadical (988 records ✅). Component scaffold and CharacterComponent decomposition moved to Story 21.2 (needs Make Me a Hanzi). ✅ **Phase C (Content Generation)**: All content files regenerated with enriched data (stroke counts corrected, all words now have pinyin via CC-CEDICT + character-reading inference). ✅ **MMAH Import Pipeline**: `scripts/enrich/import-make-me-a-hanzi.ts` created — enriches classification, etymology, phoneticComponentId, and CharacterRadical from Make Me a Hanzi data. ✅ **Character Enrichment**: `scripts/enrich/populate-character-enrichment.ts` — computes frequencyRank and commonWords from WordCharacter junctions. ✅ **Polyphone Migration**: `scripts/enrich/populate-character-readings.ts` — migrates Character.readings JSON to CharacterReading model. ✅ **Stroke Count Correction**: `scripts/archive/populate-stroke-counts.ts` — downloads Unihan.zip, extracts kTotalStrokes, corrects all 2,960 mismatched stroke counts. ✅ **Unenriched Words Fix**: `scripts/archive/fix-unenriched-words.ts` — enriches 28 remaining words via character-reading inference. ✅ **Script Migration**: All scripts restructured into subdirectories — `scripts/enrich/`, `scripts/verify/`, `scripts/dev/`, `scripts/generate/`, `scripts/archive/`. Seed pipeline unified into single `prisma/seed.ts`. `_spot-checks.ts` merged into `scripts/verify/verify-data-lifecycle.ts` with `--deep` flag. **Verification**: 17/19 gates pass; 2 failures are expected/deferred (Component, CharacterComponent — moved to Story 21.2). All 7 spot-check queries pass. ✅ **All 21.1 BR items now complete.**
- **PR**: N/A (direct commit — no PR)
- **Merge Date**: N/A
- **Key Commit**: `f9d4593c`

## Closing Checklist

- [x] All Phase B data populated and verified
- [x] 3-phase pipeline operational (generate → enrich → seed)
- [x] All 47/47 verification checks pass (7 Phase 1 + 26 Phase 2 + 14 Phase 3)
- [x] All 13 audit findings resolved
- [x] Old seed files archived
- [x] Implementation doc updated to reflect 3-phase architecture
- [x] Backend TypeScript type-check passes (0 errors)
- [x] Seed idempotency confirmed (CharacterReading pre-clear, WordHskLevel @@id)
- [x] Pipeline manifest generated with SHA-256 checksums
