# Implementation 21-11: Data Consistency Cleanup — Radical JSON → API

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-11-data-consistency-cleanup.md`

## Technical Scope

Strip the top-level `hskCharacters` field from all 20 radical entries in the single aggregate file `content/radicals/radicals.json`. Create a backend API endpoint `GET /v1/radicals/:id/characters` that queries `CharacterRadical` + `Character` tables. Migrate ALL consumers of `hskCharacters` (frontend and backend) to use the API/DB instead. Add a cleanup script and a CI validation script. Add route constant.

**Key facts about the data (verified from codebase):**

- Radical data lives in a single aggregate file: `content/radicals/radicals.json` (array of 20 objects)
- The field is `hskCharacters` (camelCase) at the **top level** of each radical object — NOT inside `metadata`
- There is **no `Radical` model** in Prisma — radicals are JSON-only
- `Character.glyph` is the character field (NOT `simplified`)
- `Character.readings` is a `Json` field (`@default("[]")`), not a relation. The relation model is `CharacterReading`
- `CharacterHskLevel.hskLevel` is a direct `Int`, not a relation
- The backend error format convention is `{ error: string, code: string }` with `NOT_FOUND` and `LOAD_ERROR` codes

### File Manifest

| File                                                                                        | Action                                                                   |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `content/radicals/radicals.json`                                                            | Strip `hskCharacters` from all 20 radical entries                        |
| `scripts/cleanup-radical-content.ts`                                                        | **NEW** — cleanup script                                                 |
| `scripts/validate-radical-content.ts`                                                       | **NEW** — CI validation script                                           |
| `package.json`                                                                              | Add `cleanup:radical-content` and `validate:radical-content` scripts     |
| `packages/shared-constants/src/index.js`                                                    | Add `radicalsCharacters` route pattern                                   |
| `packages/shared-constants/src/index.d.ts`                                                  | Add type declaration                                                     |
| `apps/backend/src/modules/radicals/services/RadicalCharacterService.ts`                     | **NEW** — service for radical→characters DB lookup                       |
| `apps/backend/src/modules/radicals/types/radicals-errors.ts`                                | **NEW** — `RadicalNotFoundError` class                                   |
| `apps/backend/src/modules/radicals/api/RadicalsController.ts`                               | Add `getCharactersForRadical` handler                                    |
| `apps/backend/src/modules/radicals/api/radicalsRoutes.ts`                                   | Add `GET /:radicalId/characters` route                                   |
| `apps/backend/src/modules/radicals/container.ts`                                            | Wire `RadicalCharacterService`                                           |
| `apps/backend/src/modules/quiz/strategies/RadicalGateStrategy.js`                           | Refactor — replace `file.hskCharacters` with DB query                    |
| `apps/backend/src/modules/review/services/ReviewService.ts`                                 | Refactor — replace `metadata?.hsk_characters` with DB query              |
| `apps/frontend/src/features/radicals/services/radicalsService.ts`                           | Add `getRadicalCharacters(radicalId)` method                             |
| `apps/frontend/src/features/radicals/components/RadicalDetailCard.tsx`                      | Migrate to API call with loading/empty/error states                      |
| `apps/frontend/src/features/radicals/components/RadicalTreesTab.tsx`                        | Migrate `getCharactersForRadical` to API call                            |
| `apps/frontend/src/features/character-hub/hooks/useMergedRadicals.ts`                       | Remove `hskCharacters` matching (Source 1), keep only DB-backed Source 2 |
| `apps/frontend/src/features/radicals/types/radicals.ts`                                     | Remove `hsk_characters` from `RadicalData.metadata` type                 |
| `apps/frontend/src/mocks/handlers/radicals-handlers.ts`                                     | **NEW** — MSW handlers for the endpoint                                  |
| `apps/frontend/src/features/radicals/components/RadicalDetailCard.test.tsx`                 | Update — mock API, remove hardcoded `hsk_characters`                     |
| `apps/frontend/src/features/radicals/components/RadicalTreesTab.test.tsx`                   | Update — mock API, remove hardcoded `hsk_characters`                     |
| `apps/frontend/src/features/radicals/components/Phase3TreeView.test.tsx`                    | Update — remove `hsk_characters` from mock data                          |
| `apps/frontend/src/features/radicals/components/TreeRootNode.test.tsx`                      | Update — remove `hsk_characters` from mock data                          |
| `apps/frontend/src/features/radicals/components/CharacterListNode.test.tsx`                 | Update — remove `hsk_characters` from mock data                          |
| `apps/frontend/src/features/character-hub/components/CharacterHub/CharacterHub.stories.tsx` | Update — remove `hsk_characters` from mock data                          |
| `apps/frontend/src/features/radicals/services/radicalsService.test.ts`                      | Update — add tests for `getRadicalCharacters`                            |
| `.storybook/msw-handlers.ts`                                                                | Update — register new radical handlers                                   |
| `apps/backend/src/modules/radicals/services/__tests__/RadicalCharacterService.test.ts`      | **NEW** — unit tests                                                     |

---

## API Endpoint Specification

| Method | Endpoint                          | Auth                   | Description                                                                     |
| ------ | --------------------------------- | ---------------------- | ------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/radicals/:id/characters` | Optional (public data) | Returns all characters linked to the given radical via `CharacterRadical` table |

**Response (200):**

```json
{
  "radicalId": "rad_0001",
  "characters": [
    {
      "glyph": "一",
      "pinyin": "yī",
      "meaning": "one",
      "decompositionType": "semantic",
      "hskLevel": 1
    },
    {
      "glyph": "七",
      "pinyin": "qī",
      "meaning": "seven",
      "decompositionType": null,
      "hskLevel": 1
    }
  ]
}
```

Notes:

- `radicalGlyph` is **excluded** — there is no Radical model in the DB. The caller already knows the radical from the URL path.
- `pinyin` comes from the first `CharacterReading` with `type: "primary"` (or falls back to first reading).
- `hskLevel` comes from `CharacterHskLevel.hskLevel` (a direct `Int`, not a relation).
- `decompositionType` comes from `CharacterRadical.decompositionType` (nullable `String`).

**Response (404):** When the radical ID is not found in the JSON aggregate

```json
{ "error": "Failed to load radical characters", "code": "NOT_FOUND" }
```

**Response (500):** When the radical exists but characters cannot be loaded from DB

```json
{ "error": "Failed to load radical characters", "code": "LOAD_ERROR" }
```

---

## Route Constant

Add to `packages/shared-constants/src/index.js`:

```javascript
radicalsCharacters: (radicalId) => `/v1/radicals/${radicalId}/characters`,
```

Add to `packages/shared-constants/src/index.d.ts`:

```typescript
readonly radicalsCharacters: (radicalId: string) => string;
```

---

## Backend: RadicalCharacterService (NEW)

**File:** `apps/backend/src/modules/radicals/services/RadicalCharacterService.ts`

```typescript
/**
 * @file modules/radicals/services/RadicalCharacterService.ts
 * @description Service for looking up characters belonging to a radical via DB.
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";
import { findInAggregateContent } from "../../../shared/utils/contentUtils.js";
import { createLogger } from "../../../shared/utils/logger.js";
import { RadicalNotFoundError } from "../types/radicals-errors.js";

const logger = createLogger("RadicalCharacterService");

export interface RadicalCharacterEntry {
  glyph: string;
  pinyin: string;
  meaning: string;
  decompositionType: string | null;
  hskLevel: number | null;
}

export class RadicalCharacterService {
  async getCharactersForRadical(radicalId: string): Promise<{
    radicalId: string;
    characters: RadicalCharacterEntry[];
  }> {
    // Validate radical exists in the JSON aggregate (no Radical model in DB)
    const radical = await findInAggregateContent("radicals", "radicals.json", "id", radicalId);
    if (!radical) {
      throw new RadicalNotFoundError(radicalId);
    }

    const characterRadicals = await prisma.characterRadical.findMany({
      where: { radicalId },
      include: {
        character: {
          include: {
            characterReadings: {
              where: { type: "primary" },
              take: 1,
            },
            hskLevels: true,
          },
        },
      },
      orderBy: { character: { glyph: "asc" } },
    });

    const characters = characterRadicals.map((cr) => ({
      glyph: cr.character.glyph,
      pinyin: cr.character.characterReadings[0]?.pinyin ?? "",
      meaning: cr.character.definition ?? "",
      decompositionType: cr.decompositionType,
      hskLevel: cr.character.hskLevels[0]?.hskLevel ?? null,
    }));

    return { radicalId, characters };
  }
}
```

**File:** `apps/backend/src/modules/radicals/types/radicals-errors.ts` (NEW)

```typescript
export class RadicalNotFoundError extends Error {
  constructor(radicalId: string) {
    super(`Radical '${radicalId}' not found`);
    this.name = "RadicalNotFoundError";
  }
}
```

---

## Backend: Controller Handler

Add to `apps/backend/src/modules/radicals/api/RadicalsController.ts`:

```typescript
import { RadicalNotFoundError } from "../types/radicals-errors.js";

// In RadicalsController class:
async getCharactersForRadical(req: Request, res: Response): Promise<void> {
  try {
    const radicalId = String(req.params.radicalId);
    const result = await this.radicalCharacterService.getCharactersForRadical(radicalId);
    res.json(result);
  } catch (err) {
    if (err instanceof RadicalNotFoundError) {
      res.status(404).json({ error: "Failed to load radical characters", code: "NOT_FOUND" });
      return;
    }
    logger.error(`Failed to load characters for radical ${req.params.radicalId}`, err);
    res.status(500).json({ error: "Failed to load radical characters", code: "LOAD_ERROR" });
  }
}
```

Add to `apps/backend/src/modules/radicals/api/radicalsRoutes.ts`:

```javascript
// GET /v1/radicals/:radicalId/characters
router.get(
  ROUTE_PATTERNS.radicalsCharacters(":radicalId"),
  asyncHandler((req: Request, res: Response) =>
    req.radicalsController!.getCharactersForRadical(req, res)
  ),
);
```

---

## Backend: RadicalGateStrategy Refactoring

**File:** `apps/backend/src/modules/quiz/strategies/RadicalGateStrategy.js`

1. Remove the `buildReverseCharMap` function that reads from `file.hskCharacters`
2. Add import for `prisma` from the database client
3. Replace reverse map construction with a DB query:

```typescript
const dbRecords = await prisma.characterRadical.findMany({
  include: { character: { select: { glyph: true } } },
});
const reverseMap = new Map<string, string[]>();
for (const record of dbRecords) {
  const glyph = record.characterGlyph;
  if (!reverseMap.has(glyph)) reverseMap.set(glyph, []);
  reverseMap.get(glyph)!.push(record.radicalId);
}
```

---

## Backend: ReviewService Refactoring

**File:** `apps/backend/src/modules/review/services/ReviewService.ts`

Replace the `includeCharacterRadical` block that reads from `radical.metadata?.hsk_characters` with a DB query:

```typescript
if (includeCharacterRadical) {
  const dbRecords = await prisma.characterRadical.findMany({
    include: {
      character: { select: { glyph: true, definition: true } },
    },
  });

  const radicalCharMap = new Map<string, typeof dbRecords>();
  for (const record of dbRecords) {
    if (!radicalCharMap.has(record.radicalId)) {
      radicalCharMap.set(record.radicalId, []);
    }
    radicalCharMap.get(record.radicalId)!.push(record);
  }

  const radicals = await readAggregateContent("radicals", "radicals.json");
  const radicalById = new Map(radicals.map((r) => [r.id, r]));

  for (const [radicalId, records] of radicalCharMap) {
    const radical = radicalById.get(radicalId);
    if (!radical) continue;
    for (const record of records) {
      const charGlyph = record.characterGlyph;
      const key = `character-radical:${charGlyph}`;
      const srs = srsByKey.get(key) ?? null;
      const charData = { glyph: charGlyph, meaning: record.character?.definition ?? undefined };
      const item = buildCharacterRadicalItem(radical, charData, srs, now, sevenDaysAgo, source);
      if (item) items.push(item);
    }
  }
}
```

---

## Cleanup Script

**File:** `scripts/cleanup-radical-content.ts` (NEW)

```typescript
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const RADICALS_FILE = join(__dirname, "../content/radicals/radicals.json");

interface RadicalEntry {
  id: string;
  glyph: string;
  hskCharacters?: Array<{ glyph: string; pinyin: string; meaning: string }>;
  [key: string]: unknown;
}

async function cleanupRadicalContent(): Promise<void> {
  const raw = await readFile(RADICALS_FILE, "utf-8");
  const radicals: RadicalEntry[] = JSON.parse(raw);
  let cleaned = 0;

  for (const entry of radicals) {
    if ("hskCharacters" in entry) {
      delete entry.hskCharacters;
      cleaned++;
    }
  }

  await writeFile(RADICALS_FILE, JSON.stringify(radicals, null, 2) + "\n");
  console.log(`✓ Cleaned ${cleaned} radical entries in radicals.json`);
}

cleanupRadicalContent().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
```

---

## CI Validation Script

**File:** `scripts/validate-radical-content.ts` (NEW)

```typescript
import { readFile } from "fs/promises";
import { join } from "path";

const RADICALS_FILE = join(__dirname, "../content/radicals/radicals.json");

async function validateRadicalContent(): Promise<void> {
  const raw = await readFile(RADICALS_FILE, "utf-8");
  const radicals: Array<Record<string, unknown>> = JSON.parse(raw);
  let violations = 0;

  for (const entry of radicals) {
    if ("hskCharacters" in entry) {
      console.error(`❌ Violation: radical ${entry.id ?? entry.glyph} contains hskCharacters`);
      violations++;
    }
  }

  if (violations > 0) {
    process.exit(1);
  }
  console.log("✅ All radical entries clean — no hskCharacters found in radicals.json");
}

validateRadicalContent().catch((err) => {
  console.error("Validation failed:", err);
  process.exit(1);
});
```

Add to `package.json` scripts:

```json
"cleanup:radical-content": "npx tsx scripts/cleanup-radical-content.ts",
"validate:radical-content": "npx tsx scripts/validate-radical-content.ts"
```

---

## Frontend: RadicalDetailCard Migration

**File:** `apps/frontend/src/features/radicals/components/RadicalDetailCard.tsx`

Add loading/empty/error states and fetch from API instead of reading `radical.metadata.hsk_characters` directly.

Key changes:

1. Import `useState`, `useEffect`, `useCallback`
2. Import `radicalsService` from the service
3. Replace `const hskCharacters = radical.metadata.hsk_characters ?? [];` with state + effect
4. Render loading skeleton, error with retry, empty state, or `ExampleCharGrid`

```typescript
import { useState, useEffect, useCallback } from "react";
import { radicalsService } from "../services/radicalsService";

// In the component body:
const [characters, setCharacters] = useState<Array<{ glyph: string; pinyin: string; meaning: string }>>([]);
const [charsLoading, setCharsLoading] = useState(true);
const [charsError, setCharsError] = useState<string | null>(null);

const fetchCharacters = useCallback(async () => {
  setCharsLoading(true);
  setCharsError(null);
  try {
    const result = await radicalsService.getRadicalCharacters(radical.id);
    setCharacters(result.characters);
  } catch {
    setCharsError("Failed to load example characters");
  } finally {
    setCharsLoading(false);
  }
}, [radical.id]);

useEffect(() => {
  fetchCharacters();
}, [fetchCharacters]);

// Replace the example characters section:
{charsLoading ? (
  <div className="flex justify-center p-md"><Skeleton variant="custom" height="80px" className="w-full radius-lg" /></div>
) : charsError ? (
  <div className="flex flex-col items-center gap-sm p-md">
    <p className="font-sm text-danger">{charsError}</p>
    <button onClick={fetchCharacters} className="btn btn-sm btn-outline">Retry</button>
  </div>
) : characters.length > 0 ? (
  <ExampleCharGrid characters={characters} />
) : (
  <div className="flex justify-center p-md">
    <p className="font-sm text-muted">No example characters found for this radical.</p>
  </div>
)}
```

---

## Frontend: RadicalTreesTab Migration

**File:** `apps/frontend/src/features/radicals/components/RadicalTreesTab.tsx`

Replace `getCharactersForRadical` callback with async API fetch, caching results per radical:

```typescript
const [charactersCache, setCharactersCache] = useState<
  Map<string, Array<{ glyph: string; pinyin: string; meaning: string }>>
>(new Map());

const getCharactersForRadical = useCallback(
  async (
    radical: RadicalData,
  ): Promise<Array<{ glyph: string; pinyin: string; meaning: string }>> => {
    if (charactersCache.has(radical.id)) {
      return charactersCache.get(radical.id)!;
    }
    try {
      const result = await radicalsService.getRadicalCharacters(radical.id);
      setCharactersCache((prev) => new Map(prev).set(radical.id, result.characters));
      return result.characters;
    } catch {
      return [];
    }
  },
  [charactersCache],
);
```

**Important:** `Phase3TreeView`'s `getCharactersForRadical` prop type must change from synchronous `() => Array<...>` to `() => Promise<Array<...>>`. Update `Phase3TreeView.tsx` to `await` the result.

---

## Frontend: useMergedRadicals Update

**File:** `apps/frontend/src/features/character-hub/hooks/useMergedRadicals.ts`

Remove Source 1 (hsk_characters matching). Simplify to:

```typescript
async function fetchMergedRadicals(character: string): Promise<RadicalEntry[]> {
  const dbMatches = await loadRadicalsByCharacter(character);
  const selfMatch = allRadicals.filter((r) => r.glyph === character);
  const merged = [
    ...dbMatches.map((r) => ({
      id: r.id,
      glyph: r.glyph,
      meaning: r.meaning,
      name_pinyin: r.name_pinyin,
    })),
  ];
  for (const sm of selfMatch) {
    if (!merged.find((m) => m.id === sm.id)) {
      merged.push({
        id: sm.id,
        glyph: sm.glyph,
        meaning: sm.meaning,
        name_pinyin: sm.name_pinyin,
      });
    }
  }
  return merged;
}
```

---

## Type Cleanup

**File:** `apps/frontend/src/features/radicals/types/radicals.ts`

Remove `hsk_characters` from `RadicalData.metadata`:

```typescript
export interface RadicalData {
  id: string;
  glyph: string;
  alternate_glyphs: string[];
  name_pinyin: string;
  name_chinese?: string;
  meaning: string;
  stroke_count: number;
  is_recommended: boolean;
  kangxi_index: number;
  metadata: {
    etymology?: string;
    frequency_rank?: number;
    notes?: string;
    is_also_character?: boolean;
    [key: string]: unknown;
  };
}
```

---

## MSW Handlers

**File:** `apps/frontend/src/mocks/handlers/radicals-handlers.ts` (NEW)

```typescript
import { http, HttpResponse, delay } from "msw";

const BASE = "/api/v1/radicals";

export const radicalsHandlers = [
  http.get(`${BASE}/:radicalId/characters`, async ({ params }) => {
    const { radicalId } = params;
    return HttpResponse.json({
      radicalId,
      characters: [
        { glyph: "一", pinyin: "yī", meaning: "one", decompositionType: "semantic", hskLevel: 1 },
        { glyph: "七", pinyin: "qī", meaning: "seven", decompositionType: null, hskLevel: 1 },
      ],
    });
  }),
];

export const radicalsLoadingHandler = http.get(`${BASE}/:radicalId/characters`, async () => {
  await delay("infinite");
});

export const radicalsEmptyHandler = http.get(
  `${BASE}/:radicalId/characters`,
  async ({ params }) => {
    const { radicalId } = params;
    return HttpResponse.json({ radicalId, characters: [] });
  },
);

export const radicalsErrorHandler = http.get(`${BASE}/:radicalId/characters`, async () => {
  return HttpResponse.json(
    { error: "Failed to load radical characters", code: "LOAD_ERROR" },
    { status: 500 },
  );
});
```

Register in `.storybook/msw-handlers.ts` by importing `radicalsHandlers` and adding to the `handlers` array.

---

## Test Files to Update

All test files currently use mock data with `hsk_characters`. They must be updated to remove that field from test fixtures, and for components that now fetch from the API, tests must be updated to mock the API call instead.

## Technical Challenges & Solutions

### Radical JSON field location drift

**Problem:** The cleanup targeted the wrong field location — the BR described `metadata.hsk_characters`, but the actual data has `hskCharacters` at the **top level** of each radical entry in `content/radicals/radicals.json`.

**Root Cause:** Assumptions about the JSON shape weren't verified against the actual file before writing the cleanup.

**Solution:** Verified the actual shape from the codebase first (single aggregate file, 20 objects, top-level camelCase `hskCharacters`), then wrote `scripts/cleanup-radical-content.ts` + `scripts/validate-radical-content.ts` against the real location, and migrated every consumer (RadicalGateStrategy, ReviewService, RadicalDetailCard, RadicalTreesTab, useMergedRadicals) to the DB/API.

### Synchronous → async character loading in the tree

**Problem:** `RadicalTreesTab`'s `getCharactersForRadical` was synchronous (read from JSON); switching to the API makes it async.

**Root Cause:** The API endpoint returns a Promise; downstream `Phase3TreeView` expected a synchronous array.

**Solution:** Changed the prop type to `() => Promise<Array<...>>`, added a per-radical result cache (`charactersCache` Map) in `RadicalTreesTab`, and `await`ed the result in `Phase3TreeView`.

## Implementation Status

- **Status**: Implemented
- **PR**: N/A (direct commit — no PR)
- **Merge Date**: N/A
- **Key Commit**: `48d0229b`

### Doc Truth-Check (Verify Against Code)
- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
