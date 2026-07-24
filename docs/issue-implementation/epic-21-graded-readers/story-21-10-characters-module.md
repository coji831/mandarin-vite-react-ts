# Implementation 21-10: Characters Backend Module

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-10-characters-module.md`

## Technical Scope

Create a dedicated `modules/characters/` module following the existing modulith pattern. Deliver 6 read-only REST endpoints exposing character data from tables already populated by Stories 21.1 and 21.2. Register the module in the app container. Add MSW handlers for frontend testing.

**Files:**

- `apps/backend/src/modules/characters/` — **NEW**: module root
- `apps/backend/src/modules/characters/container.ts` — **NEW**: DI registration
- `apps/backend/src/modules/characters/api/CharactersController.ts` — **NEW**: REST controller (6 endpoints)
- `apps/backend/src/modules/characters/api/characters.routes.ts` — **NEW**: route definitions
- `apps/backend/src/modules/characters/services/CharactersService.ts` — **NEW**: business logic layer
- `apps/backend/src/modules/characters/repositories/CharactersRepository.ts` — **NEW**: Prisma query layer
- `apps/backend/src/modules/characters/types/characters.ts` — **NEW**: request/response types
- `apps/backend/src/modules/characters/services/__tests__/CharactersService.test.ts` — **NEW**: unit tests
- `apps/backend/src/app/container.ts` — update: register characters module
- `apps/frontend/src/mocks/handlers/characters-handlers.ts` — **NEW**: MSW handlers for frontend testing
- `apps/backend/src/modules/radicals/` — audit for existing character routes; refactor if found

## API Endpoint Specification

| Method | Endpoint                                       | Auth     | Description                                                                                                                                   |
| ------ | ---------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/characters/:glyph`                    | Optional | Full character details: simplified, pinyin readings (with tones), meaning(s), stroke count, radical info, classification, HSK levels          |
| `GET`  | `/api/v1/characters/:glyph/phonetic`           | Optional | Phonetic component: component glyph, pinyin, meaning, isPhonetic flag, confidence score                                                       |
| `GET`  | `/api/v1/characters/:glyph/homophones`         | Optional | All characters sharing the same pronunciation (matching pinyin ignoring tone, or matching pinyin+tone based on query param `?exactTone=true`) |
| `GET`  | `/api/v1/characters/:glyph/decomposition`      | Optional | Decomposition tree: ordered list of constituent components with their types (sematic/phonetic/remaining) and positions                        |
| `GET`  | `/api/v1/characters/search?q=&tone=&hskLevel=` | Optional | Search characters: `q` searches by pinyin (partial match), `tone` filters by tone number (1-4), `hskLevel` filters by HSK level               |
| `GET`  | `/api/v1/characters/frequency?tier=`           | Optional | Characters ordered by frequency rank. `tier` filters by HSK tier (1-6). Returns paginated results (default 50 per page)                       |

**Response examples:**

`GET /api/v1/characters/好` (200):

```json
{
  "glyph": "好",
  "pinyin": ["hǎo", "hào"],
  "meanings": ["good", "well", "to like"],
  "strokeCount": 6,
  "radical": { "id": "rd_00038", "glyph": "女", "meaning": "woman" },
  "classification": "phono-semantic",
  "phoneticComponent": "子",
  "hskLevels": [1],
  "frequencyRank": 42
}
```

`GET /api/v1/characters/好/homophones?exactTone=true` (200):

```json
{
  "glyph": "好",
  "pinyin": "hǎo",
  "tone": 3,
  "homophones": [{ "glyph": "郝", "pinyin": "hǎo", "meaning": "surname Hao" }]
}
```

`GET /api/v1/characters/河/decomposition` (200):

```json
{
  "glyph": "河",
  "components": [
    { "glyph": "氵", "type": "semantic", "meaning": "water" },
    { "glyph": "可", "type": "phonetic", "meaning": "can/allow", "pinyin": "kě" }
  ]
}
```

`GET /api/v1/characters/nonexistent` (404):

```json
{ "error": "Character not found", "code": "CHARACTER_NOT_FOUND" }
```

## Implementation Details

### Repository Layer (`CharactersRepository`)

All Prisma queries, no business logic. Methods:

```typescript
async findByGlyph(glyph: string): Promise<CharacterFull | null>
async findPhoneticComponent(glyph: string): Promise<PhoneticComponent | null>
async findHomophones(glyph: string, exactTone: boolean): Promise<HomophoneCharacter[]>
async findDecomposition(glyph: string): Promise<DecompositionComponent[]>
async searchCharacters(params: SearchParams): Promise<CharacterSearchResult[]>
async findFrequencyList(tier?: number, page?: number, pageSize?: number): Promise<FrequencyEntry[]>
```

**Key queries:**

```typescript
// findByGlyph — joins across Character, CharacterReading, CharacterRadical, CharacterHskLevel
async findByGlyph(glyph: string) {
  return prisma.character.findUnique({
    where: { simplified: glyph },
    include: {
      readings: true,
      radical: { include: { radical: true } },
      hskLevels: { include: { hskLevel: true } },
    },
  });
}

// findHomophones — query CharacterReading for matching pinyin
async findHomophones(glyph: string, exactTone: boolean) {
  // 1. Get readings for source character
  const sourceReadings = await prisma.characterReading.findMany({
    where: { characterId: glyph },
  });

  // 2. Find other characters with matching readings
  const pinyinSet = sourceReadings.map(r => r.pinyin);
  return prisma.characterReading.findMany({
    where: {
      pinyin: { in: pinyinSet },
      ...(exactTone ? { tone: { in: sourceReadings.map(r => r.tone) } } : {}),
      characterId: { not: glyph },
    },
    include: { character: true },
  });
}

// searchCharacters — search by pinyin (partial), tone, or HSK level
async searchCharacters(params: SearchParams) {
  const { q, tone, hskLevel } = params;
  const where: any = {};

  if (q) {
    where.readings = { some: { pinyin: { contains: q } } };
  }
  if (tone) {
    where.readings = { some: { ...where.readings?.some, tone: parseInt(tone) } };
  }
  if (hskLevel) {
    where.hskLevels = { some: { hskLevel: { level: parseInt(hskLevel) } } };
  }

  return prisma.character.findMany({
    where,
    include: { readings: true, hskLevels: true },
    take: 50,
  });
}
```

### Service Layer (`CharactersService`)

Thin orchestration layer:

```typescript
class CharactersService {
  constructor(private repo: CharactersRepository) {}

  async getCharacter(glyph: string): Promise<CharacterDetailResponse> {
    const character = await this.repo.findByGlyph(glyph);
    if (!character) throw new NotFoundError('CHARACTER_NOT_FOUND', `Character '${glyph}' not found`);
    return CharacterDetailMapper.toResponse(character);
  }

  async getHomophones(glyph: string, exactTone = false): Promise<HomophoneResponse> { ... }
  async getDecomposition(glyph: string): Promise<DecompositionResponse> { ... }
  // ... etc
}
```

### Controller Layer (`CharactersController`)

Express request handlers with Zod validation for query params.

### Route Audit

Before finalizing routes, scan `apps/backend/src/modules/radicals/` for any existing character-related routes (e.g., `GET /api/v1/radicals/:id/characters` is legitimate; `GET /api/v1/radicals/characters/:glyph` is not). If character routes exist outside `modules/characters/`, refactor them:

- Move controller logic to `CharactersController`
- Keep a thin proxy route in the original module that forwards to the new endpoint
- Add a deprecation notice log

## Architecture Integration

```
[Story 21.10: Characters Backend Module]
├── Container → registered in app/container.ts
├── API Layer → CharactersController (6 GET endpoints, Zod validation)
├── Service Layer → CharactersService (orchestration, caching, error handling)
├── Repository Layer → CharactersRepository (Prisma queries against existing tables)
│   ├── Character (2,971 rows — populated by 21.2)
│   ├── CharacterReading (pinyin+tone entries — populated by 21.2)
│   ├── CharacterComponent (decomposition data — populated by 21.2)
│   ├── CharacterRadical (radical mapping — populated by 21.1)
│   └── CharacterHskLevel (HSK level mapping — populated by 21.1)
└── Consumers:
    ├── 21.4 LexicalHub → character detail, decomposition, homophone display
    ├── 21.6 Phonetic Clusters → phonetic component data
    ├── 21.12 Pinyin Search → search + homophone endpoints (adds to this module)
    └── Epic 19 IME Simulator → character search for autocomplete

Dependencies:
├── 21.1 → Character, CharacterRadical, CharacterHskLevel tables exist and seeded
└── 21.2 → CharacterComponent, CharacterReading, classification data populated
```

## Technical Challenges & Solutions

```
Problem: Route collision risk — modules/radicals/ may already expose character-related
         endpoints (e.g., radical-character lookup).
Solution: Pre-implementation audit of all existing route files. Any character-specific
         endpoints found outside modules/characters/ are refactored into the new module
         with thin proxy routes for backward compatibility. Log deprecation warnings on
         proxy routes.

Problem: Homophone query could return hundreds of results for common pinyin (e.g.,
         "yì" has 50+ characters).
Solution: Default response limit of 50 results with pagination metadata. Frontend
         can request additional pages. Add `?exactTone=true` to narrow results.
```
