# Implementation 21-1: Data Lifecycle

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-1-data-lifecycle.md`

## Technical Scope

Create the entire data foundation for Epic 21: new Prisma models, seed scripts, migration of old Progress data, normalization of character IDs, and cleanup of deprecated entities.

**Files:**

- `apps/backend/prisma/schema.prisma` — add new models, remove deprecated models
- `apps/backend/prisma/migrations/` — new migration chain (Phase A → B → C)
- `apps/backend/prisma/seeds/seed-word.ts` — Seed Word + WordHskLevel from CSV
- `apps/backend/prisma/seeds/seed-character.ts` — Seed expanded Character + CharacterHskLevel
- `apps/backend/prisma/seeds/seed-demo-passages.ts` — 6 demo passages (1 per HSK 1-6)
- `apps/backend/scripts/migrate-progress.ts` — Progress → CharacterProgress + WordStudyContext
- `apps/backend/scripts/normalize-character-ids.ts` — Rename ch_hsk_* → ch_XXXX
- `apps/backend/scripts/cleanup-deprecated.ts` — Clean up old tables + files
- `content/words/` — Generated word files (index.json + w_XXXXX.json)
- `packages/shared-constants/src/hsk-word-counts.ts` — New constants module
- `tools/download-hsk-word-list.sh` or README instructions — how to get the data

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
andycburke/HSK-3.0-Word-List CSV (~11000 words)
│
▼
parseCSV() extract:
├── Word record (id only: w_00001)
├── WordHskLevel (wordId → hskLevel)
├── Content file: content/words/w_00001.json
│   └── simplified, pinyin, traditional, definitions, POS, examples
└── Character glyphs → deduplicate → seed Character table + CharacterHskLevel
│
▼
cross-reference with dictionary.txt for decomposition
│
▼
Word index: content/words/index.json
├── Map<simplified → wordId>  — for segmentation
└── Map<wordId → hskLevel>    — for HSK queries
```

### Seed Script Idempotency

The seed script `seed-word.ts` must be idempotent:

- Use `upsert` on `simplified` field for Word
- Use `upsert` on `glyph` field for Character
- Use `deleteMany` + `createMany` for WordCharacter and WordDefinition junctions (rebuilt each run)
- Detect already-seeded data and skip if complete
- Allow partial re-seeding (e.g., add more HSK bands later without redoing existing)

## Architecture Integration

```
[Story 21.1: Data Lifecycle]
├── Prisma schema changes (new models, removed deprecated)
├── Seed scripts (Word, Character, Demo passages)
├── Migration scripts (Progress → CharacterProgress, ch_hsk_* → ch_XXXX)
├── Content files (content/words/index.json + w_XXXXX.json)
└── Shared constants (hsk-word-counts.ts)

All subsequent stories (21.1–21.5) depend on this data foundation.
```

## Technical Challenges & Solutions

```
Problem: Old Progress model has free-form wordId (String) — could be a single character
         glyph or a multi-character word. Need to migrate to per-glyph CharacterProgress.
Solution: Detect single vs multi-character. For single: direct mapping. For multi: split
         into individual glyphs, create CharacterProgress per glyph + WordStudyContext
         linking back to the original word context.
```
