# Implementation 21-11: Data Consistency Cleanup — Radical JSON → API

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-11-data-consistency-cleanup.md`

## Technical Scope

Strip `metadata.hsk_characters` from all 20 radical JSON files, add a backend API endpoint that queries `CharacterRadical` + `Character` tables, update the frontend Radical Detail Card to consume the API, and add a CI validation script to prevent future violations.

**Files:**

- `content/characters/*.json` — 20 radical JSON files: strip `metadata.hsk_characters`
- `content/manifest.json` — update if references to hsk_characters exist
- `apps/backend/src/modules/radicals/services/RadicalCharacterService.ts` — **NEW**: service for radical-character lookup
- `apps/backend/src/modules/radicals/api/RadicalsController.ts` — add `GET /:id/characters` handler
- `apps/backend/src/modules/radicals/api/radicals.routes.ts` — add new route
- `apps/backend/src/modules/radicals/services/__tests__/RadicalCharacterService.test.ts` — **NEW**: unit tests
- `apps/frontend/src/mocks/handlers/radicals-handlers.ts` — add MSW handler for new endpoint
- `apps/frontend/src/features/radicals/components/RadicalDetailCard.tsx` — update to fetch characters from API
- `scripts/validate-radical-content.ts` — **NEW**: CI validation script
- `package.json` — add `validate:radical-content` script

## API Endpoint Specification

| Method | Endpoint                          | Auth     | Description                                                                   |
| ------ | --------------------------------- | -------- | ----------------------------------------------------------------------------- |
| `GET`  | `/api/v1/radicals/:id/characters` | Optional | Returns all characters linked to the given radical via CharacterRadical table |

**Response (200):**

```json
{
  "radicalId": "rd_00001",
  "radicalGlyph": "氵",
  "characters": [
    {
      "glyph": "河",
      "pinyin": "hé",
      "meaning": "river",
      "decompositionType": "semantic",
      "hskLevel": 2
    },
    {
      "glyph": "海",
      "pinyin": "hǎi",
      "meaning": "sea",
      "decompositionType": "semantic",
      "hskLevel": 1
    },
    {
      "glyph": "湖",
      "pinyin": "hú",
      "meaning": "lake",
      "decompositionType": "semantic",
      "hskLevel": 3
    }
  ]
}
```

**Response (404):**

```json
{ "error": "Radical not found", "code": "RADICAL_NOT_FOUND" }
```

## Implementation Details

### JSON Cleanup Script

Create a script at `scripts/cleanup-radical-content.ts`:

```typescript
import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const RADICALS_DIR = join(__dirname, "../content/characters");

async function cleanupRadicalContent() {
  const files = await readdir(RADICALS_DIR);
  let cleaned = 0;

  for (const file of files) {
    if (!file.endsWith(".json") || file === "characters.json" || file === "manifest.json") continue;

    const filePath = join(RADICALS_DIR, file);
    const content = JSON.parse(await readFile(filePath, "utf-8"));

    if (content.metadata?.hsk_characters) {
      delete content.metadata.hsk_characters;
      await writeFile(filePath, JSON.stringify(content, null, 2) + "\n");
      console.log(`✓ Cleaned: ${file}`);
      cleaned++;
    }
  }

  console.log(`\nCleaned ${cleaned} radical files.`);
}
```

### CI Validation Script (`scripts/validate-radical-content.ts`)

```typescript
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const RADICALS_DIR = join(__dirname, "../content/characters");

async function validateRadicalContent(): Promise<void> {
  const files = await readdir(RADICALS_DIR);
  let violations = 0;

  for (const file of files) {
    if (!file.endsWith(".json") || file === "characters.json") continue;
    const content = JSON.parse(await readFile(join(RADICALS_DIR, file), "utf-8"));

    if (content.metadata?.hsk_characters) {
      console.error(`❌ Violation: ${file} contains hsk_characters`);
      violations++;
    }
  }

  if (violations > 0) {
    process.exit(1);
  }
  console.log("✅ All radical JSON files clean — no hsk_characters found.");
}
```

### Backend Endpoint

Add to existing `modules/radicals/`:

```typescript
// RadicalCharacterService
async getCharactersForRadical(radicalId: string): Promise<RadicalCharacterEntry[]> {
  const radical = await prisma.radical.findUnique({ where: { id: radicalId } });
  if (!radical) throw new NotFoundError('RADICAL_NOT_FOUND', `Radical '${radicalId}' not found`);

  const characterRadicals = await prisma.characterRadical.findMany({
    where: { radicalId },
    include: {
      character: {
        include: {
          readings: true,
          hskLevels: { include: { hskLevel: true } },
        },
      },
    },
    orderBy: { character: { simplified: 'asc' } },
  });

  return characterRadicals.map(cr => ({
    glyph: cr.character.simplified,
    pinyin: cr.character.readings[0]?.pinyin ?? '',
    meaning: cr.character.meaning,
    decompositionType: cr.decompositionType,
    hskLevel: cr.character.hskLevels[0]?.hskLevel.level ?? null,
  }));
}
```

### Frontend Update (RadicalDetailCard)

Current: reads `hsk_characters` from JSON prop.
After: calls `GET /api/v1/radicals/:id/characters` using the existing `radicalService` (or a new method on `radicalService`).

```typescript
// In radicalService.ts — add method
async getRadicalCharacters(radicalId: string): Promise<RadicalCharacterEntry[]> {
  const response = await apiClient.get(`/api/v1/radicals/${radicalId}/characters`);
  return response.data.characters;
}
```

RadicalDetailCard renders a loading state while fetching, empty state if no characters, and an error state with retry button on failure — following the existing patterns for data-fetching components.

## Architecture Integration

```
[Story 21.11: Data Consistency Cleanup]
├── Content Cleanup → scripts/cleanup-radical-content.ts (strip hsk_characters from 20 JSONs)
├── CI Validation → scripts/validate-radical-content.ts (fail if hsk_characters detected)
├── Backend API → GET /api/v1/radicals/:id/characters (in existing radicals module)
│   ├── Queries CharacterRadical + Character (populated by 21.1, 21.2)
│   └── Returns typed character entries with decomposition type, pinyin, HSK level
├── Frontend → RadicalDetailCard (Epic 19 surface — swap data source from JSON to API)
└── Dependencies:
    ├── 21.1 → CharacterRadical table exists and populated
    └── 21.2 → Character table populated for response data
```

## Technical Challenges & Solutions

```
Problem: Radical Detail Card is owned by Epic 19 (Radicals & Character Details).
         If Epic 19 has a planned redesign, we should not duplicate effort.
Solution: Coordinate with Epic 19's story plan. If a redesign is in progress,
         the frontend change is limited to swapping the data source (JSON → API)
         with no visual changes. Any UI redesign is deferred to Epic 19's stories.
         If no redesign is planned, implement the API call with proper loading/
         empty/error states following existing patterns.

Problem: The CI validation script needs to run in CI pipelines but the workspace
         may not have access to the full toolchain.
Solution: The script is a lightweight Node.js script with no dependencies beyond
         Node.js built-ins (fs/promises, path). It runs as a standalone script
         via `npx tsx scripts/validate-radical-content.ts`.
```
