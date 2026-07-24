# Implementation 21-1: Data Lifecycle

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-1-data-lifecycle.md`

## Technical Scope

Create the entire data foundation for Epic 21: new Prisma models, seed scripts, migration of old Progress data, normalization of character IDs, and cleanup of deprecated entities.

**Files:**

- `apps/backend/prisma/schema.prisma` — add new models, remove deprecated models
- `apps/backend/prisma/migrations/` — new migration chain (Phase A → B → C)
- `apps/backend/prisma/seeds/seed-word.js` — Seed Word, WordHskLevel, Character (new glyphs), WordCharacter, CharacterHskLevel from CSV + generate aggregate content files
- `apps/backend/prisma/seeds/seed-character.ts` — Seed expanded Character + CharacterHskLevel
- `apps/backend/prisma/seeds/seed-demo-passages.ts` — 6 demo passages (1 per HSK 1-6)
- `apps/backend/scripts/database/generate-word-content.ts` — Regenerate content files from DB (fallback)
- `apps/backend/scripts/database/migrate-progress.ts` — Progress → CharacterProgress + WordStudyContext
- `apps/backend/scripts/database/normalize-character-ids.ts` — Rename ch_hsk_* → ch_XXXX
- `apps/backend/scripts/database/cleanup-deprecated.ts` — Clean up old tables + files
- `content/words/` — Generated aggregate files (index.json + words.json)
- `content/words/words.json` — Per-word attributes (simplified, hskLevel, characters, sequenceOrder)
- `content/words/index.json` — Lookup maps (simplified→wordId, wordId→hskLevel)
- `packages/shared-constants/src/hsk-word-counts.ts` — New constants module

## Implementation Details

### New Prisma Models

```prisma
model Word {
  id              String   @id              // "w_00001" — stable content ID
  // ⚠️ Pure ID-only. All attributes (simplified, pinyin, definitions, examples, POS)
  //    stored in content/words/*.json static files — loaded via in-memory cache
  characters      WordCharacter[]
  studyContexts   WordStudyContext[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model WordHskLevel {
  wordId     String
  hskLevel   Int
  hskVersion String?  // "3.0" — future-proof
  word       Word @relation(fields: [wordId], references: [id])

  @@id([wordId])
  @@index([hskLevel])
}

model CharacterHskLevel {
  characterId String
  hskLevel    Int

  @@id([characterId])
  @@index([hskLevel])
}

model WordCharacter {
  id            String @id @default(uuid())
  wordId        String
  characterId   String
  sequenceOrder Int    // Position in compound: 爱好 → 爱=1, 好=2
  word          Word   @relation(fields: [wordId], references: [id])
  character     Character @relation(fields: [characterId], references: [id])

  @@unique([wordId, characterId])
  @@index([characterId])
}

model CharacterReading {
  id          String @id @default(uuid())
  characterId String
  pinyin      String  // 了 → "le", "liǎo"
  tone        Int
  type        String? // "primary", "secondary"
  commonality Int?    // Usage frequency rank
  character   Character @relation(fields: [characterId], references: [id])

  @@index([characterId])
}

model Character {
  id              String   @id              // "ch_1001"
  glyph           String   @unique
  strokeCount     Int                       // Queryable filter (e.g., "≤8 strokes")
  // ⚠️ Extended attributes in content/characters/*.json
  readings        CharacterReading[]
  radicals        CharacterRadical[]
  progress        CharacterProgress[]
  wordLinks       WordCharacter[]
  mnemonicStories Mnemonic[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([glyph])
  @@index([strokeCount])
}

model CharacterProgress {
  id              String    @id @default(uuid())
  userId          String
  characterId     String
  content_version Int       @default(1)
  studyCount      Int       @default(0)
  correctCount    Int       @default(0)
  confidence      Float     @default(0)
  nextReview      DateTime?
  currentDelay    Int?
  lapseCount      Int       @default(0)
  user            User      @relation(fields: [userId], references: [id])
  character       Character @relation(fields: [characterId], references: [id])

  @@unique([userId, characterId])
  @@index([userId])
  @@index([characterId])
}

model WordStudyContext {
  id          String   @id @default(uuid())
  userId      String
  characterId String
  wordId      String
  studiedAt   DateTime @default(now())
  user        User      @relation(fields: [userId], references: [id])
  character   Character @relation(fields: [characterId], references: [id])
  word        Word      @relation(fields: [wordId], references: [id])

  @@index([userId, characterId])
}

model ReviewLog {
  id              String   @id @default(uuid())
  userId          String
  itemType        String   // "character" | "chengyu" | "radical" | "word"
  itemId          String   // Stable content ID: "ch_1001" or "w_00001"
  content_version Int      @default(1)
  rating          String   // "again" | "good" | "easy"
  source          String?  // "quiz_failure" | "review" | "viewed"
  timestamp       DateTime @default(now())

  @@index([userId, itemType, timestamp])
}

model WordLookupEvent {
  id        String   @id @default(uuid())
  userId    String?                  // null for guests
  sessionId String                   // browser-generated UUID per session
  wordId    String                   // "w_00001"
  passageId String?
  timestamp DateTime @default(now())

  @@index([userId])
  @@index([sessionId])
  @@index([wordId])
  @@index([timestamp])
}
```

Also add Passage, ReadingSession, Bookmark models (these are needed for later stories but the schema must exist):

```prisma
model Passage {
  id              String   @id @default(uuid())
  hskLevel        Int
  passageIndex    Int
  title           String
  content         Json         // Structured: { sentences: [...], metadata: {...} }
  wordCount       Int
  knownWordRatio  Float        // Actual known % (0-1)
  targetHskLevel  Int
  generatedById   String?      // null for seed passages
  generatedAt     DateTime     @default(now())
  accessCount     Int          @default(0)
  lastAccessedAt  DateTime?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@unique([hskLevel, passageIndex])
  @@index([hskLevel])
  @@index([lastAccessedAt])
}

model ReadingSession {
  id              String   @id @default(uuid())
  userId          String
  passageId       String
  currentSentence Int      @default(0)
  completed       Boolean  @default(false)
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  lastAccessedAt  DateTime @updatedAt

  passage Passage @relation(fields: [passageId], references: [id], onDelete: Cascade)
  @@unique([userId, passageId])
  @@index([userId])
}

model Bookmark {
  id        String   @id @default(uuid())
  userId    String
  passageId String
  note      String?
  createdAt DateTime @default(now())

  passage Passage @relation(fields: [passageId], references: [id], onDelete: Cascade)
  @@unique([userId, passageId])
  @@index([userId])
}
```

### Models to Remove (Deprecated)

- `VocabularyWord` — replaced by Word + WordDefinition
- `VocabularyList` — replaced by hskLevel on Word
- `WordList` — junction no longer needed
- `Progress.wordId` (free-form String field) — replaced by CharacterProgress

### Migration of Existing Progress Data

1. Read all existing `Progress` records
2. For each record, determine if `wordId` is a single character (glyph) or multi-character
3. For single-char: create `CharacterProgress` record + create `WordStudyContext` if applicable
4. For multi-char: split into individual characters, create `CharacterProgress` per glyph + `WordStudyContext` for each
5. Verify data integrity: count of old Progress records matches new CharacterProgress records
6. Drop old Progress table (or rename for safety period)

### Data Flow

```
data/HSK-3.0-Word-List CSV (~11000 words, 6 columns, no pinyin/definitions)
│
▼
seed-word.js parsing:
├── Word record (id only: w_00001)                    → Word table
├── WordHskLevel (wordId → hskLevel)                  → WordHskLevel table
├── Character glyphs → deduplicate by glyph           → Character table (upsert)
├── WordCharacter (wordId ↔ characterId + order)       → WordCharacter table
├── CharacterHskLevel (min HSK per glyph)              → CharacterHskLevel table
│
▼
Content files (aggregate, not per-word):
├── content/words/index.json
│   ├── Map<simplified → wordId>  — for segmentation/lookup
│   └── Map<wordId → hskLevel>    — for HSK queries
└── content/words/words.json
    └── Map<wordId → { simplified, hskLevel, hskNo, hskUsage, characters[], sequenceOrder[] }>
```

### Seed Script Idempotency

The seed script `seed-word.js` is idempotent:

- Checks `Word.count() >= 10000` and skips entirely if already seeded
- Uses `createMany` with `skipDuplicates: true` for Word and WordHskLevel bulk inserts
- Uses `upsert` on `glyph` for Character records (handles re-runs safely)
- Uses `createMany` with `skipDuplicates: true` for WordCharacter junctions
- Uses `upsert` for CharacterHskLevel records
- Content files are overwritten atomically on each run (temp file → rename)

## Architecture Integration

```
[Story 21.1: Data Lifecycle]
├── Prisma schema changes (new models, removed deprecated)
├── Seed scripts (Word, Character, Demo passages)
├── Migration scripts (Progress → CharacterProgress, ch_hsk_* → ch_XXXX)
├── Content files (content/words/index.json + content/words/words.json)
├── Shared constants (hsk-word-counts.ts)
└── ADR-006: Data tiering architecture (docs/guides/adr/data-tiering-architecture.md)

All subsequent stories (21.1–21.5) depend on this data foundation.
```

## Data Tiering

This story establishes the **4-tier data architecture** defined in [ADR-006](../../guides/adr/data-tiering-architecture.md):

| Tier | Name              | Entities                           | Storage                                                        | Cache                     |
| ---- | ----------------- | ---------------------------------- | -------------------------------------------------------------- | ------------------------- |
| 1    | Static Reference  | Foundations, Radicals              | content/*.json + DB                                            | In-memory (never evict)   |
| 2    | Master Data       | Characters, Readings, HskLevel     | DB (crucial) + content/characters/characters.json (enrichment) | In-memory + Redis, TTL 1h |
| 3    | Produced Content  | Words, Passages, Phonetic Clusters | DB (structure) + content/words/ aggregate files (attributes)   | Redis, TTL 5-30 min       |
| 4    | Transaction/Event | Progress, ReviewLog, Lookups       | DB only                                                        | None or < 1 min           |

The 11K word storage was the trigger for this ADR. Instead of 11K individual files, words use **2 aggregate files** (~5 MB total). Characters follow a **DB-for-crucial/JSON-for-enrichment** split: Character table stores id, glyph, strokeCount (indexed); CharacterReading table stores pinyin/tone/type; enrichment data (traditional, definition, etymology, frequencyRank, commonWords) lives in a single `content/characters/characters.json` aggregate file.

## Technical Challenges & Solutions

```
Problem: Old Progress model has free-form wordId (String) — could be a single character
         glyph or a multi-character word. Need to migrate to per-glyph CharacterProgress.
Solution: Detect single vs multi-character. For single: direct mapping. For multi: split
         into individual glyphs, create CharacterProgress per glyph + WordStudyContext
         linking back to the original word context.
```

```
Problem: 11,000 individual content/words/w_XXXXX.json files is impractical.
Solution: Adopted 2 aggregate files (index.json + words.json, ~5 MB total) instead of
          per-word files. This follows the "aggregate content files" pattern from the
          4-tier data architecture (ADR-006). Source of truth is the DB; content files
          are regeneration caches.
```

```
Problem: HSK 3.0 CSV contains OCR-derived data — "白（形）" annotations, "爸爸｜爸"
          alternatives, and "7-9" banded level. No pinyin or English definitions.
Solution: Seed uses the clean Hanzi column (col 3) for word glyphs, the HSK_3_0_Level
          column (col 0) with regex parsing for banded levels, and stores usage info
          from col 5. Pinyin/definitions are deferred to a future enrichment story.
```
