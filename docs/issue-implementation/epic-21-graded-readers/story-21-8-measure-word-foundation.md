# Implementation 21-8: Measure Word Foundation

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-8-measure-word-foundation.md`

## Technical Scope

Extend the existing words module to expose measure word (量词) data via REST API. The Prisma models (`MeasureWord` and `MeasureWordWord`) and seed data already existed from Phase 2 — this story added `category` and `usageNote` population to the seed, created a service layer, and added the API endpoint.

**Files Created:**

- `apps/backend/src/modules/words/services/MeasureWordService.ts` — service for measure word lookup
- `apps/backend/src/modules/words/__tests__/MeasureWordService.test.ts` — 4 unit tests for the service

**Files Modified:**

- `content/seed/phase2/measure-words.json` — added `category` and `usageNote` fields to all 52 entries
- `apps/backend/prisma/seed.ts` — updated MeasureWord mapping to include `category` and `usageNote` from Phase 2 data
- `apps/backend/src/modules/words/api/WordsController.ts` — added `getMeasureWords` handler
- `apps/backend/src/modules/words/api/WordsRoutes.ts` — added `GET /:id/measure-words` route with `optionalAuth`
- `apps/backend/src/modules/words/container.ts` — wired `MeasureWordService` into `WordsController`
- `apps/backend/src/modules/words/index.ts` — barrel export (no new exports needed)
- `packages/shared-constants/src/index.js` — added `wordsMeasureWords` route constant
- `packages/shared-constants/src/index.d.ts` — type declaration for the new route constant

**Files NOT Changed (pre-existing):**

- `apps/backend/prisma/schema.prisma` — models already existed; no schema changes
- `content/seed/phase2/measure-word-words.json` — already had 135 MWW records; no changes needed

## Prisma Models

✅ Prisma models already existed — migration `20260724171952_add_measure_word_and_component_models` was already applied. No schema changes were needed.

```prisma
// Pre-existing — shown for reference
model MeasureWord {
  id          String   @id                // "mw_001" — permanent content ID
  simplified  String   @unique            // "个"
  pinyin      String                      // "gè"
  meaning     String                      // "generic individual unit"
  category    String?                     // "general" | "measure" | "time" | "abstract" | "verb" | "formal" | "container"
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
  measureWord     MeasureWord @relation(fields: [measureWordId], references: [id], onDelete: Restrict)
  word            Word       @relation(fields: [wordId], references: [id], onDelete: Restrict)

  @@unique([measureWordId, wordId])
  @@index([wordId])
  @@index([measureWordId])
}
```

**Note on cascade/restrict:** The current migration uses `onDelete: Restrict` (not Cascade). This was kept as-is — no schema change was needed for this story.

## Seed Script Details

Seed data lives in `content/seed/phase2/measure-words.json` and `content/seed/phase2/measure-word-words.json`.

### MeasureWord Seed Data (52 entries)

Updated all 52 entries with `category` and `usageNote` fields. Categories distributed across:

- **General**: 个 (gè) — general MW fallback
- **People/animals**: 只 (zhǐ), 条 (tiáo), 匹 (pǐ), 头 (tóu)
- **Flat/long objects**: 张 (zhāng) — flat, 条 (tiáo) — long, 根 (gēn) — thin
- **Books/paper**: 本 (běn), 页 (yè), 封 (fēng)
- **Vehicles**: 辆 (liàng), 架 (jià)
- **Buildings/rooms**: 间 (jiān), 座 (zuò), 所 (suǒ)
- **Sets/groups**: 双 (shuāng) — pair, 套 (tào) — set, 对 (duì) — couple
- **Abstract**: 种 (zhǒng) — kind/type, 些 (xiē) — some, 件 (jiàn) — item, 门 (mén) — subject
- **Verb measures**: 次 (cì) — times, 遍 (biàn) — thorough, 下 (xià) — brief
- **Container**: 杯 (bēi) — cup of, 碗 (wǎn) — bowl of, 瓶 (píng) — bottle of, 盒 (hé) — box of
- **Measure**: 斤 (jīn) — catty, 块 (kuài) — piece, 把 (bǎ) — handful
- **Formal**: 位 (wèi) — polite people, 座 (zuò) — large structures, 所 (suǒ) — institutions

### Seed Script Changes

In `apps/backend/prisma/seed.ts`, the MeasureWord seeding step (Step 3 of 17) was updated to map `category` and `usageNote` from the Phase 2 JSON data instead of setting them to `null`:

```typescript
// Updated mapping
const measureWordData = phase2.measureWords.map((mw: any) => ({
  id: mw.id,
  simplified: mw.glyph,
  pinyin: mw.pinyin,
  meaning: mw.meaning,
  category: mw.category ?? null, // ← Was: null
  usageNote: mw.usageNote ?? null, // ← Was: null
}));
```

### Idempotency

```typescript
// Prisma createMany with skipDuplicates
await prisma.measureWord.createMany({
  data: measureWordData,
  skipDuplicates: true, // Safe to re-run
});
```

The MeasureWordWord seed (Step 13) was unchanged — 135 records were already being seeded correctly.

## API Endpoint Specification

| Method | Endpoint                          | Auth     | Description                                                                              |
| ------ | --------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/words/:id/measure-words` | Optional | Return compatible measure words for a given word (noun). Auth optional for guest lookup. |

**Response (200):**

```json
{
  "wordId": "w_00284",
  "simplified": "朋友",
  "measureWords": [
    {
      "id": "mw_001",
      "simplified": "个",
      "pinyin": "gè",
      "meaning": "generic individual unit",
      "category": "general",
      "usageNote": "The most common and versatile measure word. Can be used as a polite fallback when unsure which measure word to use.",
      "isDefault": true,
      "exampleSentence": "一个朋友"
    },
    {
      "id": "mw_044",
      "simplified": "位",
      "pinyin": "wèi",
      "meaning": "polite person counter",
      "category": "formal",
      "usageNote": "Polite measure word for people.",
      "isDefault": false,
      "exampleSentence": "一位朋友"
    }
  ]
}
```

**Note on response shape:** The existing `WordsController` wraps `getWordDetail` responses as `{ data: result }`, but `getMeasureWords` returns the result directly (not wrapped in `data`). This is consistent with how the response shape was designed in the BR (no extra wrapping layer).

**Response (400 — unknown wordId):**

```json
{ "error": "Failed to load measure words", "code": "NOT_FOUND" }
```

The error format conforms to project conventions: `"Failed to {action} {resource}"` with an uppercase `"code"` field.

**Response (200, empty — non-noun word):**

```json
{ "wordId": "w_99999", "simplified": "因为", "measureWords": [] }
```

Non-noun words or words with no associated measure words return an empty array (not an error).

## Implementation Details

### Service Layer

`MeasureWordService` provides:

```
getMeasureWordsForWord(wordId: string): Promise<MeasureWordsForWordResult>
```

- Verifies the word exists via `prisma.word.findUnique` — throws `WordIdNotFoundError` if not found
- Queries `MeasureWordWord` joined with `MeasureWord` where `wordId` matches
- Returns ordered by `isDefault` DESC (defaults first), then `simplified` ASC
- Uses `WordIdNotFoundError` (defined in the same file) — not the shared `WordNotFoundError` from `words-errors.ts`
- Returns empty array for words with no associated measure words (no error)

### Error Types

| Error                 | Thrown When                  | HTTP Status | Error Code       |
| --------------------- | ---------------------------- | ----------- | ---------------- |
| `WordIdNotFoundError` | Word ID does not exist in DB | 400         | `NOT_FOUND`      |
| Generic `Error`       | Unexpected service failure   | 500         | `INTERNAL_ERROR` |

The 400 status for unknown wordId (rather than 404) was chosen for consistency with the existing pattern in this project — unknown lookup targets return 400.

### Route Registration

Located in `apps/backend/src/modules/words/api/WordsRoutes.ts`:

```typescript
router.get(
  ROUTE_PATTERNS.wordsMeasureWords(":id"),
  optionalAuth,
  rateLimitByAuth,
  asyncHandler((req: Request, res: Response) => req.wordsController!.getMeasureWords(req, res)),
);
```

Uses `optionalAuth` middleware — guests can look up measure words too. The route constant `wordsMeasureWords` is defined in `packages/shared-constants/`.

### Caching

Caching was not implemented for this endpoint. Measure word data changes rarely, but caching can be added in a future iteration if performance profiling shows it's needed.

### LexicalHub Integration Point

> **Note:** Frontend integration (displaying measure words in LexicalHub's WordHubContent) is a sub-AC of Story 21.4 — not part of 21.8.

This story creates the data and API. When Story 21.4 integrates it, the WordHubContent component can add a "Measure Words" section:

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

## Architecture Integration

```
[Story 21.8: Measure Word Foundation]
├── Seed Data → content/seed/phase2/measure-words.json (52 entries w/ category + usageNote)
├── Prisma Models → MeasureWord + MeasureWordWord (pre-existing, no schema change)
├── API → GET /api/v1/words/:id/measure-words (via WordsController)
├── Service → MeasureWordService (lookup, error handling)
└── Consumed by → Story 21.4 LexicalHub WordHubContent (measure word display)

Dependencies:
├── 21.1 → Word table (wordId references exist)
└── 21.2 → Character enrichment (for measure word character glyphs in LexicalHub)
```

## Technical Challenges & Solutions

```
Problem: The Prisma models already existed with onDelete: Restrict (not Cascade).
         The BR originally specified Cascade, but changing the migration would be
         risky at this stage.
Solution: Kept RESTRICT behavior as-is from the existing migration. No schema
         change was needed for this story, so no migration risk was introduced.

Problem: Determining which Word records are "nouns" (measure words pair with nouns,
         not verbs/adjectives).
Solution: The MeasureWordWord seed data only contains pairs for nouns — the 135
         pre-existing MWW records are already curated. The API returns whatever
         pairs exist for a given wordId; if a word has no pairs (e.g., a verb),
         an empty array is returned. No wordClass filtering is applied at query time.

Problem: Error format consistency — the BR specified 400 with "WORD_NOT_FOUND"
         but the project convention uses "Failed to {action} {resource}" format.
Solution: Used project-conforming format: { "error": "Failed to load measure words",
         "code": "NOT_FOUND" }. Uses "NOT_FOUND" (not "WORD_NOT_FOUND") for
         consistency with other endpoints in the codebase.
```

## Testing

4 unit tests in `apps/backend/src/modules/words/__tests__/MeasureWordService.test.ts`:

| Test                                                  | What It Verifies                                      |
| ----------------------------------------------------- | ----------------------------------------------------- |
| Returns measure words for known noun word             | Full response shape, correct Prisma query params      |
| Returns empty array for word with no associated MWs   | Non-noun words return `{ ... measureWords: [] }`      |
| Throws `WordIdNotFoundError` for non-existent word ID | Error type + error message match, no DB query leakage |
| Correct Prisma orderBy                                | `isDefault` DESC first, then `simplified` ASC         |

All tests pass via `npx vitest run --reporter verbose src/modules/words/`.

## Files

### Created

- `apps/backend/src/modules/words/services/MeasureWordService.ts` — service class with `getMeasureWordsForWord` method
- `apps/backend/src/modules/words/__tests__/MeasureWordService.test.ts` — 4 unit tests

### Modified

- `content/seed/phase2/measure-words.json` — added `category` and `usageNote` to 52 entries
- `apps/backend/prisma/seed.ts` — updated MeasureWord mapping to include `category` and `usageNote`
- `apps/backend/src/modules/words/api/WordsController.ts` — added `getMeasureWords` handler, `MeasureWordService` injection
- `apps/backend/src/modules/words/api/WordsRoutes.ts` — added `GET /:id/measure-words` route
- `apps/backend/src/modules/words/container.ts` — wired `MeasureWordService` into `createWordsModule`
- `packages/shared-constants/src/index.js` — added `wordsMeasureWords` route pattern
- `packages/shared-constants/src/index.d.ts` — type declaration for `wordsMeasureWords`

### Doc Truth-Check (Verify Against Code)
- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
