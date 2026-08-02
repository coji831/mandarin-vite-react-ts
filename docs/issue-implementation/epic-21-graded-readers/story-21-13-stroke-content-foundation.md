# Implementation 21-13: Stroke Content Foundation

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-13-stroke-content-foundation.md`

## Technical Scope

Migrate stroke reference data from the file-read pipeline (`FoundationsService` reading `content/references/strokes.json`) to the DB-backed pipeline: add 4 Prisma models, create a `content/strokes/strokes.json` extract file, write an enrichment script, integrate seed steps, and refactor `FoundationsService.getStrokesReference()` to query the database. The API response shape stays backward-compatible — zero frontend changes.

### Files

**New (6):**

- `content/strokes/strokes.json` — Extract file: 5 PRC categories, 8 extended types, 5 order rules
- `content/seed/phase2/strokes-categories.json` — Enriched category seed data
- `content/seed/phase2/strokes-extended-types.json` — Enriched extended-type seed data
- `content/seed/phase2/strokes-order-rules.json` — Enriched order-rule seed data
- `content/seed/phase2/strokes-category-rules.json` — Enriched category-rule join seed data
- `scripts/enrich/build-stroke-entries.ts` — Enrichment script producing Phase 2 files

**Modified (6):**

- `content/manifest.json` — Add `"strokes"` to `content_types` and corresponding entry
- `prisma/schema.prisma` — Add 4 models (StrokeCategory, StrokeExtendedType, StrokeOrderRule, StrokeCategoryOrderRule)
- `prisma/seed.ts` — Add 4 new seed steps (after Word, before FK-dependent models)
- `apps/backend/src/modules/foundations/services/FoundationsService.ts` — Refactor `getStrokesReference()` to use Prisma queries
- `apps/backend/src/modules/foundations/types/foundations.ts` — Harden `StrokesReference` from `unknown[]` to strict types
- `content/references/strokes.json` — **Deleted** after migration confirmed working

## Content Schema: `content/strokes/strokes.json`

The extract file follows the same schema as the IMP's original proposal but with `glyph` added to categories and extended types so the frontend can render the stroke character directly.

```json
{
  "version": "1.0",
  "categories": [
    {
      "id": "dian",
      "name": "点",
      "pinyin": "diǎn",
      "meaning": "dot",
      "glyph": "丶",
      "order": 1,
      "strokeCount": 1,
      "exampleChars": ["主", "州", "为", "头"],
      "orderRules": ["top-first", "center-first"]
    },
    {
      "id": "heng",
      "name": "横",
      "pinyin": "héng",
      "meaning": "horizontal",
      "glyph": "一",
      "order": 2,
      "strokeCount": 1,
      "exampleChars": ["一", "二", "三", "王"],
      "orderRules": ["top-to-bottom", "horizontal-before-vertical"]
    },
    {
      "id": "shu",
      "name": "竖",
      "pinyin": "shù",
      "meaning": "vertical",
      "glyph": "丨",
      "order": 3,
      "strokeCount": 1,
      "exampleChars": ["十", "中", "丰", "川"],
      "orderRules": ["left-to-right", "horizontal-before-vertical"]
    },
    {
      "id": "pie",
      "name": "撇",
      "pinyin": "piě",
      "meaning": "left-falling",
      "glyph": "丿",
      "order": 4,
      "strokeCount": 1,
      "exampleChars": ["人", "八", "大", "禾"],
      "orderRules": ["top-to-bottom", "left-to-right"]
    },
    {
      "id": "zhe",
      "name": "折",
      "pinyin": "zhé",
      "meaning": "bend",
      "glyph": "㇍",
      "order": 5,
      "strokeCount": 1,
      "exampleChars": ["口", "日", "田", "目"],
      "orderRules": ["outside-to-inside"]
    }
  ],
  "extendedTypes": [
    {
      "id": "na",
      "name": "捺",
      "pinyin": "nà",
      "meaning": "right-falling",
      "glyph": "㇏",
      "order": 1,
      "baseCategory": "pie"
    },
    {
      "id": "ti",
      "name": "提",
      "pinyin": "tí",
      "meaning": "rising",
      "glyph": "㇀",
      "order": 2,
      "baseCategory": "heng"
    },
    {
      "id": "wan",
      "name": "弯",
      "pinyin": "wān",
      "meaning": "curve",
      "glyph": "㇁",
      "order": 3,
      "baseCategory": "zhe"
    },
    {
      "id": "gou",
      "name": "钩",
      "pinyin": "gōu",
      "meaning": "hook",
      "glyph": "亅",
      "order": 4,
      "baseCategory": "zhe"
    },
    {
      "id": "xie",
      "name": "斜",
      "pinyin": "xié",
      "meaning": "slant",
      "glyph": "㇃",
      "order": 5,
      "baseCategory": "pie"
    },
    {
      "id": "tiao",
      "name": "挑",
      "pinyin": "tiǎo",
      "meaning": "upward-flick",
      "glyph": "㇒",
      "order": 6,
      "baseCategory": "heng"
    },
    {
      "id": "zhe-gou",
      "name": "折钩",
      "pinyin": "zhé gōu",
      "meaning": "bend-hook",
      "glyph": "㇆",
      "order": 7,
      "baseCategory": "zhe"
    },
    {
      "id": "wan-gou",
      "name": "弯钩",
      "pinyin": "wān gōu",
      "meaning": "curve-hook",
      "glyph": "㇉",
      "order": 8,
      "baseCategory": "zhe"
    }
  ],
  "orderRules": [
    {
      "id": "rule-1",
      "number": 1,
      "name": "Top to Bottom",
      "description": "Write strokes from top to bottom",
      "examples": ["三", "王", "立", "章"]
    },
    {
      "id": "rule-2",
      "number": 2,
      "name": "Left to Right",
      "description": "Write strokes from left to right",
      "examples": ["川", "州", "林", "好"]
    },
    {
      "id": "rule-3",
      "number": 3,
      "name": "Horizontal Before Vertical",
      "description": "Write horizontal strokes before vertical ones that cross them",
      "examples": ["十", "丰", "井", "用"]
    },
    {
      "id": "rule-4",
      "number": 4,
      "name": "Outside Before Inside",
      "description": "Write enclosing strokes before content inside",
      "examples": ["口", "日", "田", "国"]
    },
    {
      "id": "rule-5",
      "number": 5,
      "name": "Middle Before Sides",
      "description": "Write the center stroke before the side strokes",
      "examples": ["小", "水", "山", "承"]
    }
  ]
}
```

## Prisma Schema

Add 4 new models to `prisma/schema.prisma`:

```prisma
model StrokeCategory {
  id              String                      @id // "dian" | "heng" | "shu" | "pie" | "zhe"
  name            String                      // "点"
  pinyin          String                      // "diǎn"
  meaning         String                      // "dot"
  glyph           String?                     // Stroke glyph character (丶, 一, 丨, 丿, ㇍)
  order           Int                         // Display order (1-5)
  strokeCount     Int                         @default(1)
  exampleChars    String[]                    // ["主", "州", "为", "头"]
  createdAt       DateTime                    @default(now())
  updatedAt       DateTime                    @updatedAt
  extendedTypes   StrokeExtendedType[]
  categoryRules   StrokeCategoryOrderRule[]
}

model StrokeExtendedType {
  id              String                      @id // "na" | "ti" | "wan" | "gou" | ...
  name            String                      // "捺"
  pinyin          String                      // "nà"
  meaning         String                      // "right-falling"
  glyph           String?                     // Stroke glyph character (㇏, ㇀, 亅, etc.)
  baseCategoryId  String                      // FK → StrokeCategory.id
  order           Int
  createdAt       DateTime                    @default(now())
  updatedAt       DateTime                    @updatedAt
  baseCategory    StrokeCategory              @relation(fields: [baseCategoryId], references: [id])
  @@index([baseCategoryId])
}

model StrokeOrderRule {
  id              String                      @id // "rule-1" | "rule-2" | ...
  number          Int                         @unique // 1-5
  name            String                      // "Top to Bottom"
  description     String                      // "Write strokes from top to bottom"
  examples        String[]                    // ["三", "王", "立", "章"]
  createdAt       DateTime                    @default(now())
  updatedAt       DateTime                    @updatedAt
  categoryRules   StrokeCategoryOrderRule[]
}

model StrokeCategoryOrderRule {
  id              String                      @id @default(uuid())
  categoryId      String                      // FK → StrokeCategory.id
  ruleId          String                      // FK → StrokeOrderRule.id
  priority        Int                         @default(0)
  createdAt       DateTime                    @default(now())
  category        StrokeCategory              @relation(fields: [categoryId], references: [id])
  rule            StrokeOrderRule             @relation(fields: [ruleId], references: [id])
  @@unique([categoryId, ruleId])
  @@index([categoryId])
  @@index([ruleId])
}
```

## Seed Pipeline

The seed pipeline follows the existing 3-phase pattern used by other content types:

```
Phase 1 (Extract)        Phase 2 (Enrich)           Phase 3 (Seed)
─────────────────────    ─────────────────────      ────────────────────
content/strokes/     →   scripts/enrich/         →  prisma/seed.ts
strokes.json              build-stroke-entries.ts    reads phase2 files
                          ↓
                     content/seed/phase2/
                     strokes-categories.json
                     strokes-extended-types.json
                     strokes-order-rules.json
                     strokes-category-rules.json
```

### Enrichment Script: `scripts/enrich/build-stroke-entries.ts`

Reads `content/strokes/strokes.json`, validates the schema, and writes 4 Phase 2 seed files:

```typescript
interface Phase2Category {
  id: string;
  name: string;
  pinyin: string;
  meaning: string;
  glyph: string;
  order: number;
  strokeCount: number;
  exampleChars: string[];
}

interface Phase2ExtendedType {
  id: string;
  name: string;
  pinyin: string;
  meaning: string;
  glyph: string;
  order: number;
  baseCategoryId: string; // resolved from baseCategory string
}

interface Phase2OrderRule {
  id: string;
  number: number;
  name: string;
  description: string;
  examples: string[];
}

interface Phase2CategoryRule {
  categoryId: string;
  ruleId: string;
  priority: number;
}
```

### Seed Steps in `prisma/seed.ts`

Add 4 new steps in dependency order (after Word, before any FK-dependent models):

1. **Step N: StrokeCategory** — `createMany()` with Phase 2 category data. No FK dependencies.
2. **Step N+1: StrokeExtendedType** — `createMany()` with Phase 2 extended type data. FK → StrokeCategory.
3. **Step N+2: StrokeOrderRule** — `createMany()` with Phase 2 order rule data. No FK dependencies.
4. **Step N+3: StrokeCategoryOrderRule** — `createMany()` with Phase 2 category-rule join data. FK → StrokeCategory + StrokeOrderRule.

## Backend Service Refactor

### Before (file-read)

```typescript
// apps/backend/src/modules/foundations/services/FoundationsService.ts
async getStrokesReference(): Promise<StrokesReference> {
  try {
    const data = await readContentFile("references", "strokes.json");
    return data as StrokesReference;
  } catch (err) {
    logger.error("[FoundationsService] Failed to load strokes reference", err);
    throw err;
  }
}
```

### After (DB query)

```typescript
// apps/backend/src/modules/foundations/services/FoundationsService.ts
async getStrokesReference(): Promise<StrokesReference> {
  try {
    const categories = await this.prisma.strokeCategory.findMany({
      orderBy: { order: "asc" },
      include: { extendedTypes: { orderBy: { order: "asc" } } },
    });
    const orderRules = await this.prisma.strokeOrderRule.findMany({
      orderBy: { number: "asc" },
    });
    // Map DB models to the existing StrokesReference shape
    return {
      strokes: categories.map((c) => ({
        id: c.id,
        glyph: c.glyph ?? "",
        pinyin: c.pinyin,
        meaning: c.meaning,
        order: c.order,
        strokeCount: c.strokeCount,
        exampleChars: c.exampleChars,
        extendedTypes: c.extendedTypes.map((e) => ({
          id: e.id,
          glyph: e.glyph ?? "",
          pinyin: e.pinyin,
          meaning: e.meaning,
          order: e.order,
        })),
      })),
      strokeOrderRules: orderRules.map((r) => ({
        id: r.id,
        number: r.number,
        name: r.name,
        description: r.description,
        examples: r.examples,
      })),
      suggestedCharacters: [], // Populated by future stories linking strokes to characters
    };
  } catch (err) {
    logger.error("[FoundationsService] Failed to load strokes reference", err);
    throw err;
  }
}
```

### Type Hardening

```typescript
// apps/backend/src/modules/foundations/types/foundations.ts
/** A single stroke category with its extended types. */
export interface StrokeEntry {
  id: string;
  glyph: string;
  pinyin: string;
  meaning: string;
  order: number;
  strokeCount: number;
  exampleChars: string[];
  extendedTypes: StrokeExtendedTypeEntry[];
}

export interface StrokeExtendedTypeEntry {
  id: string;
  glyph: string;
  pinyin: string;
  meaning: string;
  order: number;
}

export interface StrokeOrderRuleEntry {
  id: string;
  number: number;
  name: string;
  description: string;
  examples: string[];
}

/** Strokes reference shape — backward-compatible with frontend StrokeData. */
export interface StrokesReference {
  strokes: StrokeEntry[];
  strokeOrderRules: StrokeOrderRuleEntry[];
  suggestedCharacters: string[];
}
```

## Manifest Update

Add stroke entry to `content/manifest.json`:

```json
// Add "strokes" to content_types array
"content_types": ["characters", "radicals", "words", "grammar", "chengyu", "pinyin", "tones", "strokes"],

// Add entry
"strokes": {
  "path": "strokes/strokes.json",
  "entityCount": 21,
  "description": "Stroke categories (5 PRC), extended types (8), and order rules (5)"
}
```

## Architecture Integration

```
[Story 21.13: Stroke Content Foundation — DB-Backed Pipeline]
├── Content Extraction (Phase 1)
│   └── content/strokes/strokes.json — extract file with glyph-enriched schema
├── Enrichment (Phase 2)
│   └── scripts/enrich/build-stroke-entries.ts → content/seed/phase2/strokes-*.json
├── Database (Phase 3)
│   ├── prisma/schema.prisma — 4 new models with FKs and indexes
│   └── prisma/seed.ts — 4 new seed steps (createMany)
├── Backend API
│   ├── FoundationsService.getStrokesReference() — now DB-backed via Prisma
│   └── GET /v1/foundations/data/strokes — endpoint unchanged, response shape unchanged
└── Frontend (zero changes)
    └── Existing components continue to consume unchanged API response shape
```

## Implementation Status

- **Status**: Implemented
- **Date**: July 30, 2026
- **Key Changes**: content/strokes/strokes.json (new), 4 Prisma models + migration, enrichment script (build-stroke-entries.ts), seed steps, backend refactor (FoundationsService → DB-backed), type hardening, manifest update
- **Frontend Impact**: None — API response shape backward-compatible

## Technical Challenges & Solutions

```
Problem #1: DB migration safety — Existing content/references/strokes.json must
            continue working until migration is confirmed.
Solution:    Keep old file during migration. Remove only after confirming the
            DB-backed endpoint returns identical data. Use a feature flag or
            parallel test to validate equivalence.

Problem #2: Enrichment script must maintain data integrity across 4 seed files
            with foreign key relationships.
Solution:    The script validates that every baseCategoryId in extended types
            matches an existing category id, and every categoryId/ruleId pair
            in category rules matches the parent tables. Script exits with
            code 1 if validation fails.

Problem #3: Backward compatibility — Frontend already consumes a specific API
            response shape (strokes[], strokeOrderRules[], suggestedCharacters[]).
Solution:    The DB mapping function in FoundationsService transforms Prisma
            models into the exact StrokesReference shape. The API boundary
            (controller + route) is untouched — only the data source changes.
            Existing frontend types, services, loaders, hooks, and components
            work without modification.

Problem #4: `StrokesReference` types use `unknown[]` — must harden to concrete
            types without breaking consumers.
Solution:    Backend types are hardened to strict StrokeEntry, StrokeExtendedTypeEntry,
            and StrokeOrderRuleEntry interfaces. The top-level StrokesReference
            keeps the same shape keys so no downstream import breaks.
```

### Doc Truth-Check (Verify Against Code)

- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
