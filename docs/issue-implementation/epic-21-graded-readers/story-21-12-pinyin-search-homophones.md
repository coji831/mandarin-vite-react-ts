# Implementation 21-12: Pinyin Search & Homophone API

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-12-pinyin-search-homophones.md`

## Technical Scope

Add two read-only endpoints to the `modules/characters/` module (Story 21.10): a pinyin search endpoint returning characters grouped by tone, and a homophone discovery endpoint returning characters sharing the same pronunciation. Both leverage already-populated tables (PinyinSyllable, PinyinCharacterMapping, CharacterReading) with straightforward Prisma queries.

**Files:**

- `apps/backend/src/modules/characters/api/CharactersController.ts` — add homophone endpoint handler
- `apps/backend/src/modules/characters/api/characters.routes.ts` — add homophone route
- `apps/backend/src/modules/characters/api/PinyinController.ts` — **NEW**: pinyin search controller
- `apps/backend/src/modules/characters/api/pinyin.routes.ts` — **NEW**: pinyin search routes
- `apps/backend/src/modules/characters/services/PinyinSearchService.ts` — **NEW**: pinyin search business logic
- `apps/backend/src/modules/characters/types/pinyin.ts` — **NEW**: pinyin search request/response types
- `apps/backend/src/modules/characters/services/__tests__/PinyinSearchService.test.ts` — **NEW**: unit tests
- `apps/backend/src/modules/characters/services/__tests__/HomophoneService.test.ts` — **NEW**: unit tests for homophone logic
- `apps/frontend/src/mocks/handlers/characters-handlers.ts` — add MSW handlers for both endpoints
- `apps/backend/src/modules/characters/container.ts` — register PinyinSearchService and PinyinController

## API Endpoint Specification

| Method | Endpoint                               | Auth     | Description                                                                                                             |
| ------ | -------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/characters/:glyph/homophones` | Optional | Find all characters sharing the same pinyin+tone(s) as the given character. Supports `?exactTone=true`                  |
| `GET`  | `/api/v1/pinyin/search`                | Optional | Search characters by pinyin query. Params: `q` (required, partial pinyin), `tone` (optional, 1-4/5), `page`, `pageSize` |

**Request examples:**

`GET /api/v1/pinyin/search?q=ma&tone=3`:

- Searches `PinyinCharacterMapping` for entries where pinyin starts with "ma" and tone = 3
- Returns: characters with pinyin "mǎ"

`GET /api/v1/pinyin/search?q=ma`:

- Searches all tone variants of "ma"
- Returns: characters grouped by tone (1: mā, 2: má, 3: mǎ, 4: mà, 5: ma)

`GET /api/v1/characters/妈/homophones`:

- Finds all readings for 妈 → "mā" (tone 1)
- Returns: other characters read as "mā" (e.g., 妈, 抹, 摩) and optionally other tones of "ma"

`GET /api/v1/characters/妈/homophones?exactTone=true`:

- Returns only characters read as "mā" (tone 1)

**Response examples:**

`GET /api/v1/pinyin/search?q=ma` (200):

```json
{
  "query": "ma",
  "totalResults": 42,
  "page": 1,
  "pageSize": 50,
  "results": [
    {
      "glyph": "妈",
      "pinyin": "mā",
      "tone": 1,
      "meaning": "mother"
    },
    {
      "glyph": "麻",
      "pinyin": "má",
      "tone": 2,
      "meaning": "hemp/numbs"
    },
    {
      "glyph": "马",
      "pinyin": "mǎ",
      "tone": 3,
      "meaning": "horse"
    },
    {
      "glyph": "骂",
      "pinyin": "mà",
      "tone": 4,
      "meaning": "to scold"
    }
  ]
}
```

`GET /api/v1/characters/妈/homophones` (200):

```json
{
  "glyph": "妈",
  "sourcePinyin": "mā",
  "sourceTone": 1,
  "homophones": [
    { "glyph": "抹", "pinyin": "mā", "tone": 1, "meaning": "to wipe" },
    { "glyph": "摩", "pinyin": "mā", "tone": 1, "meaning": "to rub" }
  ]
}
```

`GET /api/v1/pinyin/search?q=zzzz` (200, empty):

```json
{
  "query": "zzzz",
  "totalResults": 0,
  "page": 1,
  "pageSize": 50,
  "results": []
}
```

`GET /api/v1/pinyin/search` (400):

```json
{ "error": "Query parameter 'q' is required", "code": "MISSING_QUERY_PARAM" }
```

## Implementation Details

### Pinyin Search Service

```typescript
class PinyinSearchService {
  constructor(private repo: CharactersRepository) {}

  async searchPinyin(params: PinyinSearchParams): Promise<PinyinSearchResponse> {
    const { q, tone, page = 1, pageSize = 50 } = params;

    if (!q || q.trim().length === 0) {
      throw new ValidationError("MISSING_QUERY_PARAM", "Query parameter 'q' is required");
    }

    // Query PinyinCharacterMapping with prefix match on pinyin
    const where: any = {
      pinyin: { startsWith: q.toLowerCase() },
    };

    if (tone) {
      where.tone = parseInt(tone);
    }

    const [mappings, total] = await Promise.all([
      prisma.pinyinCharacterMapping.findMany({
        where,
        include: { character: { select: { simplified: true, meaning: true } } },
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: [{ pinyin: "asc" }, { tone: "asc" }],
      }),
      prisma.pinyinCharacterMapping.count({ where }),
    ]);

    return {
      query: q,
      totalResults: total,
      page,
      pageSize,
      results: mappings.map((m) => ({
        glyph: m.character.simplified,
        pinyin: m.pinyin,
        tone: m.tone,
        meaning: m.character.meaning,
      })),
    };
  }
}
```

### Homophone Logic

Implemented as a new method on `CharactersService` (already created in Story 21.10):

```typescript
async getHomophones(glyph: string, exactTone = false): Promise<HomophoneResponse> {
  // 1. Verify character exists
  const character = await this.repo.findByGlyph(glyph);
  if (!character) throw new NotFoundError('CHARACTER_NOT_FOUND', `Character '${glyph}' not found`);

  // 2. Get readings for source character
  const sourceReadings = await prisma.characterReading.findMany({
    where: { characterId: glyph },
  });

  if (sourceReadings.length === 0) {
    return {
      glyph,
      sourcePinyin: null,
      sourceTone: null,
      homophones: [],
    };
  }

  // 3. Find matching readings on other characters
  const wherePinyin: any[] = sourceReadings.map(r => ({
    pinyin: r.pinyin,
    ...(exactTone ? { tone: r.tone } : {}),
  }));

  const homophoneReadings = await prisma.characterReading.findMany({
    where: {
      OR: wherePinyin,
      characterId: { not: glyph },
    },
    include: {
      character: { select: { simplified: true, meaning: true } },
    },
    distinct: ['characterId', 'pinyin', 'tone'],
    take: 50,
  });

  return {
    glyph,
    sourcePinyin: sourceReadings[0].pinyin,
    sourceTone: sourceReadings[0].tone,
    homophones: homophoneReadings.map(r => ({
      glyph: r.character.simplified,
      pinyin: r.pinyin,
      tone: r.tone,
      meaning: r.character.meaning,
    })),
  };
}
```

### Route Registration

The pinyin search route is separate from characters routes to follow REST conventions:

```typescript
// pinyin.routes.ts
router.get("/search", pinyinController.search);

// Registered in container.ts as a sub-router under /api/v1/pinyin
```

The homophone endpoint is nested under the characters resource:

```typescript
// characters.routes.ts
router.get("/:glyph/homophones", charactersController.getHomophones);
```

## Architecture Integration

```
[Story 21.12: Pinyin Search & Homophone API]
├── Pinyin Search → GET /api/v1/pinyin/search
│   ├── Service → PinyinSearchService
│   ├── Query → PinyinSyllable + PinyinCharacterMapping (≥1,300 entries from 21.2)
│   └── Response → Characters grouped by tone, paginated
├── Homophone API → GET /api/v1/characters/:glyph/homophones
│   ├── Service → CharactersService.getHomophones() (extension of 21.10)
│   ├── Query → CharacterReading (populated by 21.2)
│   └── Response → Same-pinyin characters with tone filtering
└── Consumers:
    ├── 21.4 LexicalHub → homophone display in WordHubContent
    ├── Epic 19 IME Simulator → pinyin search for autocomplete
    └── 21.6 Phonetic Clusters → tone-based character comparison

Dependencies:
└── 21.10 → Characters module provides the service infrastructure, container registration, and route mounting
```

## Technical Challenges & Solutions

```
Problem: Pinyin search needs to support partial matching (e.g., "ma" matching
         "ma", "mā", "má", "mǎ", "mà") without requiring tone mark input.
Solution: Store pinyin in two forms in PinyinSyllable: a normalized ASCII form
         ("ma" without tone marks) and the full accented form ("mǎ"). The search
         query is lowercased and matched against the normalized form using
         Prisma's `startsWith`. This is already populated by 21.2's seed.

Problem: Homophone query must exclude the source character from results but
         the source character may have multiple readings (e.g., 好 has hǎo and hào).
Solution: Use `characterId: { not: glyph }` in the WHERE clause. Group results
         by pinyin+tone combination using distinct to avoid duplicates from
         multiple readings on the same target character.
```
