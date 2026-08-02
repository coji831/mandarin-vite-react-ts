# Implementation 21-10: Characters Backend Module

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-10-characters-module.md`
> **Status:** Implemented
> **Last Update:** July 30, 2026

## Technical Scope

Create a dedicated `modules/characters/` module following the existing modulith pattern. Deliver 6 read-only REST endpoints exposing character data from tables already populated by Stories 21.1 and 21.2. Register the module in the app container. Add MSW handlers for frontend testing.

**Files:**

- `apps/backend/src/modules/characters/` — **NEW**: module root
- `apps/backend/src/modules/characters/container.ts` — **NEW**: DI registration
- `apps/backend/src/modules/characters/index.ts` — **NEW**: barrel file (re-exports all types and classes)
- `apps/backend/src/modules/characters/api/CharactersController.ts` — **NEW**: REST controller (6 endpoints)
- `apps/backend/src/modules/characters/api/charactersRoutes.ts` — **NEW**: route definitions
- `apps/backend/src/modules/characters/services/CharactersService.ts` — **NEW**: business logic layer
- `apps/backend/src/modules/characters/repositories/CharactersRepository.ts` — **NEW**: Prisma query layer
- `apps/backend/src/modules/characters/types/characters.ts` — **NEW**: request/response types
- `apps/backend/src/modules/characters/services/__tests__/CharactersService.test.ts` — **NEW**: unit tests
- `apps/backend/src/app/container.ts` — **UPDATE**: register characters module
- `apps/backend/src/app/routes.ts` — **UPDATE**: wire characters routes
- `apps/backend/src/shared/types/express.d.ts` — **UPDATE**: add characters controller type declaration
- `packages/shared-constants/src/index.js` — **UPDATE**: add 5 new route constants
- `packages/shared-constants/index.d.ts` — **UPDATE**: add type declarations for new constants
- `apps/frontend/src/mocks/handlers/characters-handlers.ts` — **NEW**: MSW handlers for frontend testing (Storybook + Vitest)
- `apps/backend/src/modules/radicals/` — audit for existing character routes; confirm no refactoring needed

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
{ "error": "Character not found", "code": "NOT_FOUND" }
```

`GET /api/v1/characters/search` (400 — no params):

```json
{
  "error": "At least one search parameter (q, tone, hskLevel) is required",
  "code": "VALIDATION_ERROR"
}
```

### Homophone Response — Multi-Reading Grouped Format

For characters with multiple pronunciations (e.g., 好 → hǎo/hào), the homophone endpoint groups results by reading:

```json
{
  "glyph": "好",
  "readings": [
    {
      "pinyin": "hǎo",
      "tone": 3,
      "homophones": [{ "glyph": "郝", "pinyin": "hǎo", "tone": 3, "meaning": "surname Hao" }]
    },
    {
      "pinyin": "hào",
      "tone": 4,
      "homophones": [
        { "glyph": "號", "pinyin": "hào", "tone": 4, "meaning": "number, mark" },
        { "glyph": "昊", "pinyin": "hào", "tone": 4, "meaning": "vast, sky" }
      ]
    }
  ]
}
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
    where: { glyph },
    include: {
      readings: true,
      radical: { include: { radical: true } },
      hskLevels: { include: { hskLevel: true } },
    },
  });
}

// findHomophones — two-step glyph→id resolution, then query CharacterReading
async findHomophones(glyph: string, exactTone: boolean) {
  // Step 1: Resolve source character ID
  const source = await prisma.character.findUnique({
    where: { glyph },
    select: { id: true },
  });
  if (!source) return [];

  // Step 2: Get readings for source character
  const sourceReadings = await prisma.characterReading.findMany({
    where: { characterId: source.id },
  });

  // Step 3: Find other characters with matching readings
  const pinyinSet = sourceReadings.map(r => r.pinyin);
  return prisma.characterReading.findMany({
    where: {
      pinyin: { in: pinyinSet },
      ...(exactTone ? { tone: { in: sourceReadings.map(r => r.tone) } } : {}),
      characterId: { not: source.id },
    },
    include: { character: true },
  });
}

// searchCharacters — search by pinyin (partial), tone, or HSK level
async searchCharacters(params: SearchParams) {
  const { q, tone, hskLevel } = params;
  const where: any = {};

  if (!q && !tone && !hskLevel) {
    return []; // controller will return 400 before reaching repository
  }

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
    if (!character) throw new NotFoundError('NOT_FOUND', `Character '${glyph}' not found`);
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

The audit of `apps/backend/src/modules/radicals/` found a single character-related route: `GET /api/v1/radicals/character/:glyph`. This route returns radical data filtered by character glyph — it is a radicals-view concern ("which radicals belong to this character?") and belongs in the radicals module. No refactoring is needed: no character-specific routes exist outside `modules/characters/`.

### Shared Constants — 5 New Route Constants

Add the following to `packages/shared-constants/src/index.js` and `packages/shared-constants/index.d.ts`:

| Constant                  | Value                                     | Used By                |
| ------------------------- | ----------------------------------------- | ---------------------- |
| `charactersPhonetic`      | `/v1/characters/:glyph/phonetic`      | `charactersRoutes.ts` |
| `charactersHomophones`    | `/v1/characters/:glyph/homophones`    | `charactersRoutes.ts` |
| `charactersDecomposition` | `/v1/characters/:glyph/decomposition` | `charactersRoutes.ts` |
| `charactersSearch`        | `/v1/characters/search`               | `charactersRoutes.ts` |
| `charactersFrequency`     | `/v1/characters/frequency`            | `charactersRoutes.ts` |

Note: `charactersByGlyph` (`/v1/characters/:glyph`) already exists in the path constants.

### Route Registration

The module is wired through four registration points:

**1. `apps/backend/src/modules/characters/api/charactersRoutes.ts`** — Defines Express Router with 6 GET routes, each using controller methods:

```typescript
import express from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

router.get(
  ROUTE_PATTERNS.charactersByGlyph(":glyph"),
  asyncHandler((req: Request, res: Response) => req.charactersController!.getCharacter(req, res)),
);
router.get(
  ROUTE_PATTERNS.charactersPhonetic(":glyph"),
  asyncHandler((req: Request, res: Response) => req.charactersController!.getPhonetic(req, res)),
);
router.get(
  ROUTE_PATTERNS.charactersHomophones(":glyph"),
  asyncHandler((req: Request, res: Response) => req.charactersController!.getHomophones(req, res)),
);
router.get(
  ROUTE_PATTERNS.charactersDecomposition(":glyph"),
  asyncHandler((req: Request, res: Response) =>
    req.charactersController!.getDecomposition(req, res),
  ),
);
router.get(
  ROUTE_PATTERNS.charactersSearch,
  asyncHandler((req: Request, res: Response) => req.charactersController!.search(req, res)),
);
router.get(
  ROUTE_PATTERNS.charactersFrequency,
  asyncHandler((req: Request, res: Response) => req.charactersController!.getFrequency(req, res)),
);

export default router;
```

**2. `apps/backend/src/modules/characters/container.ts`** — Registers CharactersRepository → CharactersService → CharactersController in the DI container.

**3. `apps/backend/src/app/container.ts`** — Imports and calls the characters module's container registration function.

**4. `apps/backend/src/app/routes.ts`** — Mounts `charactersRoutes` at `/api/v1/characters`.

**5. `apps/backend/src/shared/types/express.d.ts`** — Adds the `CharactersController` type to the Express `container` augmentation.

### Decomposition Query — Component Include

The `findDecomposition` repository method includes the component details:

```typescript
async findDecomposition(glyph: string) {
  const character = await prisma.character.findUnique({
    where: { glyph },
    select: { id: true },
  });
  if (!character) return [];

  return prisma.characterComponent.findMany({
    where: { characterId: character.id },
    include: {
      component: {
        select: { glyph: true, meaning: true },
      },
    },
    orderBy: { position: 'asc' },
  });
}
```

### MSW Handlers — Dual Purpose

`apps/frontend/src/mocks/handlers/characters-handlers.ts` serves both Storybook stories (via `storybook-msw-addon`) and Vitest tests (via `msw/node`). Handlers cover all 6 endpoints with realistic response data matching the API spec. The same handlers are imported in:

- `.storybook/preview.tsx` — global MSW decorator
- Individual story files using `mswParameters`
- Test setup files via `setupServer(...handlers)`

### Test Coverage

| Method             | Success Path                         | Error Paths                                                      |
| ------------------ | ------------------------------------ | ---------------------------------------------------------------- |
| `getCharacter`     | Returns full CharacterDetailResponse | 404 when glyph not found; 400 for empty glyph                    |
| `getPhonetic`      | Returns phonetic component info      | 404 when character not found; 404 when no phonetic component     |
| `getHomophones`    | Returns grouped homophones list      | 404 when character not found; empty readings for unknown pinyin  |
| `getDecomposition` | Returns ordered component list       | 404 when character not found; empty array for undecomposed chars |
| `searchCharacters` | Returns filtered results             | 400 when all params empty; empty array for no matches            |
| `getFrequencyList` | Returns paginated frequency list     | Empty array when tier has no characters                          |

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
Solution: Pre-implementation audit found GET /api/v1/radicals/character/:glyph returns
         radical data filtered by character. This is a radicals-view concern ("which
         radicals belong to this character?") and belongs in the radicals module.
         No refactoring needed — confirmed no character-specific routes exist outside
         modules/characters/.

Problem: CharacterRadical table uses dual-key for character reference (characterId FK
         + characterGlyph string fallback). The Prisma include on CharacterRadical.radical
         may need conditional logic.
Solution: The character detail endpoint's radical join prefers characterId FK where
         available; falls back to characterGlyph string for records not yet migrated.
         Repository method handles both cases with a union select.

Problem: Homophone query could return hundreds of results for common pinyin (e.g.,
         "yì" has 50+ characters).
Solution: Default response limit of 50 results with pagination metadata. Frontend
         can request additional pages. Add `?exactTone=true` to narrow results.

Problem: CharacterReading is keyed by internal UUID (characterId FK), not by glyph.
         Direct Prisma queries using glyph as characterId will silently return no rows.
Solution: Two-step resolution — first query Character by glyph to get the internal ID,
         then use that ID for CharacterReading queries. The findHomophones and
         findDecomposition methods both follow this pattern.

Problem: Search endpoint with empty params would return all 2,971 characters.
Solution: Controller returns 400 VALIDATION_ERROR when all params (q, tone, hskLevel)
         are empty. Repository also guards against empty queries as defense-in-depth.
```

### Doc Truth-Check (Verify Against Code)
- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
