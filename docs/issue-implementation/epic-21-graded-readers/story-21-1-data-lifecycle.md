# Implementation 21-1: Data Lifecycle (Redesigned)

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-1-data-lifecycle.md`
> **Last Updated:** 2026-07-27 (Story 21.1 fully complete — all 47/47 verification checks pass)
> **Status:** ✅ Complete

## Technical Scope

Create the entire data foundation for Epic 21: new Prisma models, 3-phase data pipeline (generate → enrich → seed), character enrichment from Make Me a Hanzi (Part A — character enrichment; Part B decomposition deferred), pinyin syllable table generation, measure word seeding, component scaffold (moved to Story 21.2), content file regeneration, and verification gates.

The scope has been **redesigned** to cover four phases: Schema (Phase A — already complete for existing models, needs 4 new models), Data Population (Phase B — 3-phase pipeline: generate external→JSON, enrich JSON→JSON, seed JSON→DB), Content Generation (Phase C — regenerate all aggregate files from populated DB), and Verification Gates (SQL queries, file size checks, spot-checks).

**Files:**

- `apps/backend/prisma/schema.prisma` — add MeasureWord, MeasureWordWord, Component, CharacterComponent models
- `apps/backend/prisma/migrations/` — new migration for 4 new models
- `apps/backend/prisma/seed.ts` — Phase 3: Bulk-insert all Phase 2 JSON into DB
- `apps/backend/scripts/generate/*` — Phase 1: External → raw JSON (6 scripts)
- `apps/backend/scripts/enrich/*` — Phase 2: Raw JSON → per-table JSON (8 scripts)
- `apps/backend/scripts/generate/generate-word-content.ts` — Regenerate content files from DB
- `apps/backend/scripts/enrich/seed-character-classification.ts` — Populate Character.classification from etymology data
- `apps/backend/scripts/enrich/import-make-me-a-hanzi.ts` — **NEW (Part A)**: Import Make Me a Hanzi dictionary.txt for character enrichment (classification, etymology, phoneticComponentId, radical); Part B (Component + CharacterComponent) moved to Story 21.2
- `apps/backend/scripts/enrich/import-cc-cedict.ts` — **NEW**: Import CC-CEDICT or Unihan data for pinyin/readings enrichment
- `apps/backend/scripts/enrich/populate-character-enrichment.ts` — **NEW**: Batch populate Character enrichment fields (strokeCount, classification, etymology, frequencyRank, commonWords, phoneticComponentId)
- `apps/backend/scripts/verify/verify-data-lifecycle.ts` — **NEW**: Verification gate SQL queries (record counts, file sizes, spot-check helpers)
- `apps/backend/scripts/database/migrate-progress.ts` — Progress → CharacterProgress + WordStudyContext
- `apps/backend/scripts/database/normalize-character-ids.ts` — Rename ch_hsk_* → ch_XXXX
- `apps/backend/scripts/archive/cleanup-deprecated.ts` — Clean up old tables + files
- `content/words/words.json` — Per-word attributes (simplified, hskLevel, characters, sequenceOrder)
- `content/words/index.json` — Lookup maps (simplified→wordId, wordId→hskLevel)
- `content/characters/characters.json` — Regenerated character content from DB (≥2,971 entries, enriched)
- `content/characters/index.json` — Glyph → characterId lookup map
- `content/manifest.json` — Updated with entity counts
- `packages/shared-constants/src/hsk-word-counts.ts` — Shared constants module

## Implementation Details

### New Prisma Models (Existing + 4 New)

The following models already exist in `schema.prisma` and were created in prior phases:
Word, WordHskLevel, Character, CharacterHskLevel, WordCharacter, CharacterReading, CharacterRadical, CharacterProgress, WordStudyContext, ReviewLog, WordLookupEvent, Passage, ReadingSession, Bookmark, PinyinSyllable, PinyinCharacterMapping, ContentEmbedding.

**Four new models must be added:**

```prisma
// ── MeasureWord: Measure word (量词) entity ──
// ID format: "mw_XXXXX" where XXXXX is a zero-padded integer.
// Seeded from content/measure-words/ source data.
model MeasureWord {
  id        String   @id                // "mw_00001"
  simplified String  @unique            // "个", "条", "张"
  pinyin    String?                     // "gè", "tiáo", "zhāng"
  meaning   String?                     // "general individual", "for long slender objects"
  category  String?                     // "measure", "time", "abstract", "verb", "formal"
  usageNotes String?                    // "Used for people, general objects"
  nouns     MeasureWordWord[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([category])
}

// ── MeasureWordWord: Measure word ↔ Word (noun) junction ──
// Pairs a measure word with the nouns it modifies.
// Example: 个 → 人, 学生, 苹果; 条 → 路, 鱼, 狗
model MeasureWordWord {
  id              String   @id @default(uuid())
  measureWordId   String
  wordId          String                // "w_00001" — FK to Word table (noun)
  exampleSentence String?               // "一个人" — illustrative example
  isDefault       Boolean  @default(false) // true if this is the default MW for this noun
  measureWord     MeasureWord @relation(fields: [measureWordId], references: [id])
  word            Word        @relation(fields: [wordId], references: [id])

  @@unique([measureWordId, wordId])
  @@index([wordId])
  @@index([measureWordId])
}

// ── Component: Reusable sub-character component ──
// Represents a structural component that appears inside characters.
// Can be a radical (氵, 口) or a phonetic component (青, 可).
// ID format: "cmp_001" — zero-padded integer.
model Component {
  id        String   @id                // "cmp_001"
  glyph     String   @unique            // "氵", "口", "青", "可"
  meaning   String?                     // "water", "mouth", "blue/green", "able"
  type      String?                     // "radical" | "phonetic" | "both"
  variantOf String?                     // References another Component ID (e.g., 氵 is variant of 水)
  strokes   Int?                        // Stroke count for this component
  characters CharacterComponent[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([type])
  @@index([variantOf])
}

// ── CharacterComponent: Character ↔ Component decomposition junction ──
// Links a character to its constituent components with positional info.
// Example: 河 → 氵 (left, semantic) + 可 (right, phonetic)
model CharacterComponent {
  id            String   @id @default(uuid())
  characterId   String                 // FK to Character.id
  componentId   String                 // FK to Component.id
  position      String?                // "left" | "right" | "top" | "bottom" | "outside" | "inside" | "center"
  function      String?                // "semantic" | "phonetic" | "remaining"
  character     Character @relation(fields: [characterId], references: [id])
  component     Component @relation(fields: [componentId], references: [id])

  @@unique([characterId, componentId])
  @@index([characterId])
  @@index([componentId])
  @@index([function])
}
```

### Deprecated Models (Already Removed in Prior Phases)

- `VocabularyWord` — replaced by Word + WordDefinition
- `VocabularyList` — replaced by hskLevel on Word
- `WordList` — junction no longer needed
- `Progress` (free-form String wordId) — replaced by CharacterProgress
- `ContentItem` — deprecated, no replacement needed
- `PinyinCombination` — replaced by PinyinSyllable + PinyinCharacterMapping
- `Category` — deprecated, no replacement needed

### 3-Phase Data Pipeline

The old approach of individual seed scripts under `prisma/seeds/` has been replaced by a **3-phase data pipeline** that separates generation, enrichment, and database population:

| Phase       | Directory           | Purpose                                                                       | Entry Point                 |
| ----------- | ------------------- | ----------------------------------------------------------------------------- | --------------------------- |
| **Phase 1** | `scripts/generate/` | Extract raw data from external sources → write JSON to `content/seed/phase1/` | `npm run script:gen-all`    |
| **Phase 2** | `scripts/enrich/`   | Transform/merge Phase 1 JSON into per-table JSON at `content/seed/phase2/`    | `npm run script:enrich-all` |
| **Phase 3** | `prisma/seed.ts`    | Bulk-insert Phase 2 JSON into the database via Prisma                         | `npm run db:seed`           |

#### Phase 1 — Generate (scripts/generate/)

Extracts raw data from external sources into JSON files. Idempotent — same inputs = same outputs.

| Script                 | Output                                     | Source                                       |
| ---------------------- | ------------------------------------------ | -------------------------------------------- |
| `hsk-words.ts`         | `hsk-words.json`                           | `data/HSK-3.0-Word-List.csv` (~11,000 words) |
| `cc-cedict-entries.ts` | `cc-cedict-entries.json`                   | CC-CEDICT dataset                            |
| `mmah-entries.ts`      | `mmah-entries.json`                        | Make Me a Hanzi `dictionary.txt`             |
| `unihan-strokes.ts`    | `unihan-strokes.json`                      | Unihan `IRGSources.txt`                      |
| `pinyin-syllables.ts`  | `pinyin-syllables.json`                    | Pinyin reference data                        |
| `static-seed-data.ts`  | `measure-words.json`, `demo-passages.json` | Hardcoded static data                        |

Run: `npm run script:gen-all` (calls all 6 scripts in sequence)

#### Phase 2 — Enrich (scripts/enrich/)

Merges and transforms Phase 1 JSON into per-table seed data. Pure JSON-to-JSON transforms — no database access.

| Script                                        | Reads                                     | Writes                                                                         |
| --------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------ |
| `build-character-entries.ts` (Enrich 1)       | MMAH, Unihan, HSK, existing content files | `characters.json`                                                              |
| `build-character-readings.ts` (Enrich 2)      | Characters JSON                           | `character-readings.json`                                                      |
| `build-pinyin-mappings.ts` (Enrich 3)         | Characters, readings, pinyin syllables    | `pinyin-character-mappings.json`                                               |
| `build-word-entries.ts` (Enrich 4)            | HSK words, CC-CEDICT, characters          | `words.json`, `word-hsk-levels.json`                                           |
| `build-word-character-junction.ts` (Enrich 5) | Words, characters                         | `word-characters.json`, `character-hsk-levels.json`, updates `characters.json` |
| `build-character-radicals.ts` (Enrich 6)      | Characters, radicals                      | `character-radicals.json`                                                      |
| `build-measure-word-words.ts` (Enrich 7)      | Measure words, words                      | `measure-word-words.json`                                                      |
| `pass-through.ts` (Enrich 8)                  | Various Phase 1 files                     | `component-entries.json`, `character-components.json`, `pinyin-syllables.json` |

Run: `npm run script:enrich-all` (calls all 8 scripts in dependency order)

#### Phase 3 — Seed (prisma/seed.ts)

Reads all Phase 2 JSON files from `content/seed/phase2/` and bulk-inserts into the database using `createMany` with `skipDuplicates: true` for idempotency.

Run: `npm run db:seed` (wired to `prisma db seed` via `prisma.seed` in `package.json`)

**Execution order:** The seed script inserts tables in dependency order: Characters → Words → CharacterReadings → PinyinSyllables → PinyinCharacterMappings → WordHskLevels → WordCharacters → CharacterHskLevels → CharacterRadicals → MeasureWords → MeasureWordWords → Components → CharacterComponents → Passages.

**Component + CharacterComponent** seeding is deferred to Story 21.2 (models exist in schema but Phase 2 data is pass-through with minimal entries until the decomposition pipeline is built).

### Import Pipelines

#### Make Me a Hanzi Import (`import-make-me-a-hanzi.ts`)

**Source:** `data/make-me-a-hanzi/dictionary.txt`.

**Purpose (Part A — Story 21.1):** Enrich Character records with classification, etymology, phoneticComponentId, and radical data from Make Me a Hanzi.

**Strategy (Part A):**

1. Read the Make Me a Hanzi dictionary file line by line
2. For each CJK character entry, extract:
   - Kangxi radical ID (maps to our radical IDs)
   - Etymology type and phonetic component hint
   - Classification (pictophonetic, compound_ideograph, etc.)
3. Update Character records with classification, etymology, phoneticComponentId
4. Create/update CharacterRadical records with decomposition type annotations
5. Skip characters that already have classification set (idempotent)

**Part B (Component + CharacterComponent creation) is deferred to Story 21.2.**

**Fallback:** For characters not covered by Make Me a Hanzi, use a rule-based decomposition inference:

- Check if glyph appears as a component in other characters
- Use radical assignments as semantic component hints
- Default to "remaining" type when ambiguous

#### CC-CEDICT / Unihan Import (`import-cc-cedict.ts`)

**Source:** CC-CEDICT dataset or Unihan database for pinyin and definitions.

**Purpose:** Populate `Word.pinyin`, `Word.meaning`, `Word.wordClass`, and `Character.readings` for enrichment.

**Strategy:**

1. Parse CC-CEDICT entries (format: `traditional simplified [pinyin] /meaning1/meaning2/`)
2. Match entries to existing Word records by `simplified` glyph
3. Update `Word.pinyin`, `Word.meaning`, `Word.wordClass` from matched entries
4. For characters, extract all unique pinyin readings from word matches
5. Create/update CharacterReading records for polyphone characters
6. Mark primary reading as the most frequent across all matched words

**Target:** ≥2,000 words with pinyin, meaning, and wordClass populated.

### Character Enrichment Field Population

| Field               | Source                                  | Target     | Strategy                                                                      |
| ------------------- | --------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| strokeCount         | Make Me a Hanzi / Unihan                | 2,971      | Extract from Make Me a Hanzi stroke_count field or Unihan kTotalStrokes       |
| classification      | Etymology keyword matching              | ≥500       | Infer from etymology string keywords (see `seed-character-classification.ts`) |
| etymology           | Make Me a Hanzi / CC-CEDICT / Unihan    | ≥500       | Extract decomposition notes from Make Me a Hanzi; format as readable string   |
| frequencyRank       | HSK 3.0 CSV usage column                | 2,971      | Compute from word frequency across HSK levels; higher HSK = lower rank        |
| commonWords         | Word table (words containing this char) | 2,971      | Query Word table for all words containing this character glyph                |
| phoneticComponentId | Make Me a Hanzi decomposition           | phono-sem. | Parse decomposition to identify the phonetic component element                |
| pinyin (primary)    | CC-CEDICT / Unihan                      | ≥2,000     | Most frequent pinyin reading across matched words                             |
| CharacterReadings   | CC-CEDICT / Unihan                      | polyphones | All unique pinyin readings from matched word entries                          |

### Verification Gates

After Phase B population and Phase C content generation, run verification:

```sql
-- 1. Character count check
SELECT COUNT(*) AS character_count FROM "Character";
-- Expected: ≥2,971

-- 2. Stroke count completeness
SELECT COUNT(*) AS with_strokes FROM "Character" WHERE "strokeCount" IS NOT NULL;
-- Expected: ≥2,971

-- 3. Pinyin completeness
SELECT COUNT(*) AS with_pinyin FROM "Character" WHERE "readings" != '[]'::jsonb;
-- Expected: ≥2,000

-- 4. Classification coverage
SELECT classification, COUNT(*) AS count FROM "Character" GROUP BY classification;
-- Expected: ≥500 total classified entries

-- 5. PinyinSyllable count
SELECT COUNT(*) AS syllable_count FROM "PinyinSyllable";
-- Expected: ≥1,300

-- 6. PinyinCharacterMapping count
SELECT COUNT(*) AS mapping_count FROM "PinyinCharacterMapping";
-- Expected: ≥2,971

-- 7. MeasureWord count
SELECT COUNT(*) AS mw_count FROM "MeasureWord";
-- Expected: ≥50

-- 8. MeasureWordWord count
SELECT COUNT(*) AS mww_count FROM "MeasureWordWord";
-- Expected: ≥100

-- 9. Component count (deferred to Story 21.2)
-- SELECT COUNT(*) AS comp_count FROM "Component";
-- Expected: ≥500 (when seeded)

-- 10. CharacterComponent count (deferred to Story 21.2)
-- SELECT COUNT(*) AS cc_count FROM "CharacterComponent";
-- Expected: ≥2,000 (when seeded)
```

> **Note:** The verify script (`scripts/verify/verify-data-lifecycle.ts`) expands on these SQL checks with 19 total checks (17 active + 2 deferred for Component/CharacterComponent). Added checks include: Word count ≥10,000, WordCharacter junctions ≥20,000, WordHskLevel count, CharacterHskLevel count, ReadingSession count, strokeCount quality (no zero/unlikely values), null pinyin detection, totally unenriched words detection, and 4 file-size checks. See the script for the full list. Use `--deep` flag to run additional spot-check queries (merged from `_spot-checks.ts`).

File size verification:

- `content/characters/characters.json` — expected ~800 KB–1.2 MB (2,971 enriched entries)
- `content/characters/index.json` — expected ~70–100 KB
- `content/words/words.json` — expected ~2.5–3.0 MB
- `content/words/index.json` — expected ~400–500 KB

Spot-check verification:

- Pick 10 random characters; verify each has: glyph, strokeCount, at least one reading, classification (if available), frequencyRank, commonWords
- Pick 5 random words; verify each has: pinyin, meaning, wordClass
- Verify 3 random measure words have at least one noun pairing

### Seed Unification

All seed scripts are now unified into a single entry point: **`prisma/seed.ts`** (TypeScript, replaces the old `prisma/seed.js`). Run via `npm run db:seed` (which executes `npx tsx prisma/seed.ts`).

The unified seed calls all 8 seed functions in strict dependency order:

1. `seedCharacters` — `./seeds/seed-characters.js`
2. `seedCharacterRadicals` — `./seeds/seed-character-radicals.js`
3. `seedWords` — `./seeds/seed-word.js`
4. `seedPinyinSyllables` — `./seeds/seed-pinyin-syllables.ts` (⚠️ clears existing data)
5. `seedPinyinMappings` — `./seeds/seed-pinyin-mappings.ts`
6. `seedMeasureWords` — `./seeds/seed-measure-words.ts`
7. `seedDemoPassages` — `./seeds/seed-demo-passages.js`
8. `seedCharacterContent` — `./seeds/seed-character-content.ts`
   Plus test user creation (dev only). Steps 4-5 wrapped in try-catch with rollback warning.

### Script Execution Order

```
1. (Already done) migrate-progress.ts         — Migrate old Progress → CharacterProgress
2. (Already done) normalize-character-ids.ts   — Rename ch_hsk_* → ch_XXXX
3. (Already done) scripts/archive/cleanup-deprecated.ts — Drop deprecated tables
4. prisma/seed.ts (unified)                    — Seeds: Characters, CharacterRadicals, Words,
   │                                              PinyinSyllables, PinyinMappings, MeasureWords,
   │                                              DemoPassages, CharacterContent + test users
   └── Calls all 8 seed functions in dependency order
5. scripts/enrich/import-make-me-a-hanzi.ts    — Import MMAH for character enrichment;
   (Part A)                                       Part B (Component/CharacterComponent) → Story 21.2
6. scripts/enrich/import-cc-cedict.ts          — Import pinyin + definitions
7. scripts/enrich/populate-character-enrichment.ts — Batch fill enrichment fields
8. (Word enrichment done via import-cc-cedict.ts — see step 6)
9. scripts/verify/verify-data-lifecycle.ts     — Run verification gates (use --deep for spot-checks)
```

### Data Flow

```
data/HSK-3.0-Word-List CSV (~11000 words, 6 columns)    data/make-me-a-hanzi/dictionary.txt
│                                                            │
▼                                                            ▼
seed-word.js parsing:                                import-make-me-a-hanzi.ts (Part A)
├── Word record → Word table                         ├── Character enrichment (classification,
├── WordHskLevel → WordHskLevel table                │    etymology, phoneticComponentId, radical)
├── Character (dedup by glyph) → Character table     └── Does NOT seed Component/CharacterComponent
├── WordCharacter (with order) → WordCharacter table       │         (→ Story 21.2)
└── CharacterHskLevel → CharacterHskLevel table            ▼
│                                                   populate-character-enrichment.ts
▼                                                   ├── strokeCount ← Make Me a Hanzi
CC-CEDICT / Unihan Import                           ├── classification ← etymology keywords
│                                                   ├── etymology ← formatted
├── Word.pinyin/meaning/wordClass ← matched entries  ├── frequencyRank ← computed from HSK
├── CharacterReadings ← extracted readings           ├── commonWords ← Word table query
└── Primary pinyin ← most frequent reading           └── phoneticComponentId ← decomposition
        │                                                   │
        ▼                                                   ▼
seed-pinyin-combinations.js (REWRITTEN)             seed-measure-words.js (NEW)
├── PinyinSyllable table (≥1,300)                   ├── MeasureWord records (≥50)
└── PinyinCharacterMapping (≥2,971)                 └── MeasureWordWord pairings (≥100)
                                                            │
                                                            ▼
                                          ┌─────────────────────────────────────┐
                                          │  seed-components.js — MOVED to 21.2 │
                                          │  (Component + CharacterComponent)   │
                                          └─────────────────────────────────────┘
                                                            │
                                                            ▼
                                                   seed-character-content.ts
                                                   ├── content/characters/characters.json (enriched)
                                                   ├── content/characters/index.json
                                                   ├── content/words/words.json (refreshed)
                                                   ├── content/words/index.json (refreshed)
                                                   └── content/manifest.json (updated)
                                                            │
                                                            ▼
                                                   verify-data-lifecycle.ts
                                                   ├── SQL record count queries
                                                   ├── File size checks
                                                   ├── Spot-check helpers (--deep flag)
                                                   └── Located at: scripts/verify/verify-data-lifecycle.ts
```

### Seed Script Idempotency

All seed scripts must be idempotent:

- `seed-word.js`: Checks `Word.count() >= 10000` and skips if already seeded. Uses `createMany` with `skipDuplicates: true`, `upsert` on glyph for Character.
- `seed-pinyin-combinations.js` (REWRITTEN): Uses `createMany` with `skipDuplicates: true` for PinyinSyllable. Uses `upsert` for PinyinCharacterMapping on unique `[pinyinSyllableId, characterId]`.
- `seed-measure-words.js` (NEW): Uses `upsert` on `simplified` for MeasureWord. Uses `createMany` with `skipDuplicates: true` for MeasureWordWord.
- `seed-components.js` (MOVED to Story 21.2): Will use `upsert` on `glyph` for Component and `createMany` with `skipDuplicates: true` for CharacterComponent when implemented.
- Content files are overwritten atomically on each run (temp file → rename).

## Architecture Integration

```
[Story 21.1: Data Lifecycle (Redesigned)]
├── Prisma schema changes (4 new models: MeasureWord, MeasureWordWord, Component, CharacterComponent)
├── Seed scripts (Word, Character, PinyinSyllable, MeasureWords, Demo passages; Components → Story 21.2)
├── Import pipelines (Make Me a Hanzi Part A — character enrichment; Part B decomposition → Story 21.2; CC-CEDICT/Unihan for pinyin/definitions)
├── Enrichment scripts (character fields: strokeCount, classification, etymology, frequencyRank, commonWords, phoneticComponentId)
├── Content files (content/characters/characters.json + index.json, content/words/words.json + index.json)
├── Verification scripts (SQL count queries, file size checks, spot-checks)
├── Shared constants (hsk-word-counts.ts)
└── All-in-DB architecture (ADR-006 superseded)

All subsequent stories (21.2–21.21) depend on this data foundation.
```

## Data Tiering

This story establishes the **all-in-DB architecture** (superseding ADR-006 4-tier data tiering). The redesigned scope adds MeasureWord and Component entities to Tier 2 (Master Data):

| Tier | Name              | Entities                                                         | Storage                   | Cache                   |
| ---- | ----------------- | ---------------------------------------------------------------- | ------------------------- | ----------------------- |
| 1    | Static Reference  | Foundations, Radicals                                            | DB (seeded from content/) | In-memory (never evict) |
| 2    | Master Data       | Characters, Words, Components, PinyinSyllables, **MeasureWords** | DB (source of truth)      | Redis, TTL 1h           |
| 3    | Produced Content  | Passages, Phonetic Clusters                                      | DB                        | Redis, TTL 5-30 min     |
| 4    | Transaction/Event | Progress, ReviewLog, Lookups                                     | DB only                   | None or < 1 min         |

## Technical Challenges & Solutions

```
Problem: Old Progress model has free-form wordId (String) — could be a single character
         glyph or a multi-character word. Need to migrate to per-glyph CharacterProgress.
Solution: Detect single vs multi-character. For single: direct mapping. For multi: split
         into individual glyphs, create CharacterProgress per glyph + WordStudyContext
         linking back to the original word context. (Already resolved.)
```

```
Problem: 11,000 individual content/words/w_XXXXX.json files is impractical.
Solution: Adopted 2 aggregate files (index.json + words.json, ~5 MB total) instead of
          per-word files. (Already resolved.)
```

```
Problem: HSK 3.0 CSV contains OCR-derived data — "白（形）" annotations, "爸爸｜爸"
          alternatives, and "7-9" banded level. No pinyin or English definitions.
Solution: Seed uses the clean Hanzi column (col 3) for word glyphs, the HSK_3_0_Level
          column (col 0) with regex parsing for banded levels, and stores usage info
          from col 5. Pinyin/definitions sourced via CC-CEDICT/Unihan import pipeline.
          (CSV parsing already resolved; pinyin/definitions now addressed by CC-CEDICT import.)
```

```
Problem: Make Me a Hanzi dictionary.txt has complex decomposition notation (⿰, ⿱, etc.)
          that needs careful parsing to extract component glyphs and positional info.
Solution: Parse CJK Ideographic Description Sequences (IDS): ⿰=left-right, ⿱=top-bottom,
          ⿲=left-middle-right, ⿳=top-middle-bottom, ⿴=full-surround, ⿵=surround-from-above,
          ⿶=surround-from-below, ⿷=surround-from-left, ⿸=surround-from-upper-left,
          ⿹=surround-from-upper-right, ⿺=surround-from-lower-left, ⿻=overlaid.
          Extract leaf nodes as Component glyphs; use IDS operator for positional info.
```

```
Problem: Character enrichment requires merging data from 3+ sources (Make Me a Hanzi,
          CC-CEDICT, HSK CSV, existing content files) — risk of inconsistent data.
Solution: Use a deterministic priority chain: CC-CEDICT > HSK CSV > content files > Make Me a Hanzi.
          Higher-priority sources overwrite lower-priority. Log conflicts for manual review.
          Run enrichment as a batch script (populate-character-enrichment.ts) for reproducibility.
```

```
Problem: PinyinSyllable table needs ≥1,300 entries but existing content has only ~50
          pinyin→character mappings and no comprehensive syllable list.
Solution: Generate from three sources combined: (1) extract from Word.pinyin field (~11K words
          with multi-syllable pinyin), (2) cross-reference with init/fin JSON files (~400 valid
          base syllables), (3) multiply by 5 tones to get all 1,300+ tone variants.
```

```
Problem: MeasureWord seeding needs to reference Word records by wordId, but the seed
          script only has glyph strings. Need to resolve glyph→wordId dynamically.
Solution: Query Word table by simplified glyph to resolve wordId. For single-character words,
          the glyph maps directly. For multi-character nouns, use an exact match on simplified.
          Cache results in a Map<glyph, wordId> to avoid repeated queries.
```

### Doc Truth-Check (Verify Against Code)
- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
