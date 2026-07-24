# Implementation 21-8: Measure Word Foundation

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-8-measure-word-foundation.md`

## Technical Scope

Create the MeasureWord + MeasureWordWord data models, seed ~50 HSK 1-3 common measure words, and expose a REST endpoint for measure word lookup by noun.

**Files:**

- `apps/backend/prisma/schema.prisma` — add MeasureWord and MeasureWordWord models
- `apps/backend/prisma/migrations/` — new migration for measure word tables
- `apps/backend/prisma/seeds/seed-measure-words.ts` — seed script for measure words
- `apps/backend/prisma/seeds/data/measure-words.json` — curated measure word data (50+ entries)
- `apps/backend/src/modules/words/` — extend WordsController or create MeasureWordController
- `apps/backend/src/modules/words/services/MeasureWordService.ts` — business logic for measure word lookup
- `apps/frontend/src/features/lexical-hub/` — integration point: display measure words in WordHubContent (sub-AC of 21.4)

## New Prisma Models

```prisma
model MeasureWord {
  id          String   @id                // "mw_00001" — permanent content ID
  simplified  String   @unique            // "个"
  pinyin      String                      // "gè"
  meaning     String                      // "general measure word"
  category    String                      // "measure" | "time" | "abstract" | "verb" | "formal" | "container"
  usageNote   String?                     // Learner-facing usage explanation
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  words       MeasureWordWord[]

  @@index([category])
}

model MeasureWordWord {
  id              String   @id @default(uuid())
  measureWordId   String
  wordId          String                   // References Word.id (w_XXXXX)
  exampleSentence String?                  // "一个人" — usage example
  isDefault       Boolean  @default(false) // Is this the default/canonical MW for this noun?
  measureWord     MeasureWord @relation(fields: [measureWordId], references: [id], onDelete: Cascade)
  word            Word       @relation(fields: [wordId], references: [id], onDelete: Cascade)

  @@unique([measureWordId, wordId])
  @@index([wordId])
  @@index([measureWordId])
}
```

## Seed Script Details

### MeasureWord Seed Data (≥50 entries)

Curated for HSK 1-3 frequency. Categories distributed across:

- **General**: 个 (gè) — general MW, 位 (wèi) — formal people
- **People**: 个, 位, 名 (míng)
- **Animals**: 只 (zhǐ), 条 (tiáo), 匹 (pǐ)
- **Long/flat objects**: 条 (tiáo) — long, 张 (zhāng) — flat, 根 (gēn) — thin
- **Books/paper**: 本 (běn), 张 (zhāng), 页 (yè)
- **Vehicles**: 辆 (liàng), 架 (jià)
- **Buildings/rooms**: 间 (jiān), 座 (zuò), 栋 (dòng)
- **Sets/groups**: 双 (shuāng) — pair, 套 (tào) — set, 群 (qún) — group
- **Time**: 年 (nián), 月 (yuè), 天 (tiān), 小时 (xiǎoshí), 分钟 (fēnzhōng)
- **Abstract**: 种 (zhǒng) — kind/type, 些 (xiē) — some
- **Verb measures**: 次 (cì) — times, 遍 (biàn) — thorough, 下 (xià) — brief
- **Container**: 杯 (bēi) — cup of, 碗 (wǎn) — bowl of, 瓶 (píng) — bottle of
- **Measure**: 斤 (jīn) — catty, 尺 (chǐ) — foot, 米 (mǐ) — meter

### MeasureWordWord Pairs (≥100 records)

Each measure word linked to 2-5 common noun Word records. Examples:

- 个 → 人(w_00001), 问题(w_00085), 东西(w_00032), 朋友(w_00142)
- 本 → 书(w_00003), 词典(w_00231), 杂志(w_00567)
- 张 → 桌子(w_00189), 纸(w_00345), 票(w_00456)
- 条 → 鱼(w_00678), 路(w_00789), 河(w_00321)

### Idempotency

```typescript
// Upsert pattern for measure word seed
await prisma.measureWord.createMany({
  data: measureWords,
  skipDuplicates: true, // ON CONFLICT DO NOTHING
});

await prisma.measureWordWord.createMany({
  data: measureWordWordPairs,
  skipDuplicates: true,
});
```

## API Endpoint Specification

| Method | Endpoint                          | Auth     | Description                                                                              |
| ------ | --------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/words/:id/measure-words` | Optional | Return compatible measure words for a given word (noun). Auth optional for guest lookup. |

**Response (200):**

```json
{
  "wordId": "w_00001",
  "simplified": "人",
  "measureWords": [
    {
      "id": "mw_00001",
      "simplified": "个",
      "pinyin": "gè",
      "meaning": "general measure word",
      "category": "general",
      "usageNote": "Most common measure word. Can be used as a fallback for most nouns.",
      "isDefault": true,
      "exampleSentence": "一个人"
    },
    {
      "id": "mw_00002",
      "simplified": "位",
      "pinyin": "wèi",
      "meaning": "polite measure word for people",
      "category": "formal",
      "usageNote": "Used for respectful reference (e.g., 这位老师 'this teacher').",
      "isDefault": false,
      "exampleSentence": "三位客人"
    }
  ]
}
```

**Response (400):**

```json
{ "error": "Word not found", "code": "WORD_NOT_FOUND" }
```

**Response (200, empty):**

```json
{ "wordId": "w_99999", "simplified": "因为", "measureWords": [] }
```

(Non-noun words return empty array.)

## Implementation Details

### Service Layer

`MeasureWordService` provides:

```
getMeasureWordsForWord(wordId: string): Promise<MeasureWordWithPairs[]>
```

- Queries MeasureWordWord joined with MeasureWord where wordId matches
- Returns ordered by `isDefault` DESC (defaults first), then alphabetical
- Caches result per wordId (Redis, TTL 1 hour) — measure words change rarely
- Returns empty array for non-noun words (no error)

### LexicalHub Integration Point

In `WordHubContent` (sub-AC of Story 21.4), add a "Measure Words" section when available:

```
WordHubContent
├── Header (glyph, pinyin, meaning)
├── HSK Badge
├── Constituent Characters (as clickable chips)
├── **▼ Measure Words Section (NEW — conditionally rendered)**
│   └── MeasureWordChip: simplified / pinyin / category badge
│   └── Expandable: usage note + example sentence
└── Related Words
```

The frontend integration is a sub-AC of Story 21.4, not 21.8. This story creates the data and API — the LexicalHub team picks up the display.

## Architecture Integration

```
[Story 21.8: Measure Word Foundation]
├── Prisma Models → MeasureWord + MeasureWordWord (Phase B4)
├── Seed Script → seed-measure-words.ts (≥50 MW, ≥100 pairs, idempotent)
├── API → GET /api/v1/words/:id/measure-words
├── Service → MeasureWordService (lookup, caching)
└── Consumed by → Story 21.4 LexicalHub WordHubContent (measure word display)

Dependencies:
├── 21.1 → Word table (wordId references exist)
└── 21.2 → Character enrichment (for measure word character glyphs in LexicalHub)
```

## Technical Challenges & Solutions

```
Problem: Determining which Word records are "nouns" (measure words pair with nouns, not verbs/adjectives).
Solution: Use wordClass field on Word model. Filter MeasureWordWord pairs to words with
         wordClass = "noun". Non-noun words return empty array, not an error.
```
