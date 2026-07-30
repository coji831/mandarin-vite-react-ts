# Implementation 21-12: Pinyin Search API

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-12-pinyin-search-homophones.md`

## Technical Scope

Add a pinyin search read-only endpoint to `modules/characters/` using a dedicated sub-module (PinyinController, PinyinSearchService, PinyinSearchRepository). The endpoint queries `PinyinSyllable` → `PinyinCharacterMapping` → `Character` tables (all populated by Story 21.2) to return characters matching a pinyin prefix.

**Note:** The homophone endpoint (`GET /v1/characters/:glyph/homophones`) was delivered in Story 21.10 and is NOT part of this story's scope.

### Key Facts (Verified from Codebase)

- `PinyinCharacterMapping` has NO `pinyin` or `tone` field — these are on the related `PinyinSyllable` model
- `PinyinSyllable.syllable` stores pinyin with tone NUMBER (e.g., "ma1") — not tone marks
- `PinyinSyllable.syllablePretty` stores the accented form (e.g., "mā")
- `Character.glyph` is the character field (NOT `simplified`)
- `Character.definition` is the meaning field (NOT `meaning` on the model)
- The existing `charactersSearch` endpoint at `GET /v1/characters/search` uses `contains` on `CharacterReading.pinyin` — this is different from the structured pinyin search
- Error convention: `{ error: string, code: string }` with codes `VALIDATION_ERROR`, `NOT_FOUND`, `INTERNAL_ERROR`
- Repository pattern: Prisma queries go in repositories, not services

### File Manifest

| File                                                                                 | Action                                                                          |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `apps/backend/src/modules/characters/api/PinyinController.ts`                        | **NEW** — validates query params, delegates to service                          |
| `apps/backend/src/modules/characters/services/PinyinSearchService.ts`                | **NEW** — orchestrates pinyin search business logic                             |
| `apps/backend/src/modules/characters/repositories/PinyinSearchRepository.ts`         | **NEW** — Prisma queries on PinyinSyllable → PinyinCharacterMapping → Character |
| `apps/backend/src/modules/characters/types/pinyin.ts`                                | **NEW** — request/response types                                                |
| `apps/backend/src/modules/characters/api/pinyinRoutes.ts`                            | **NEW** — mounts `GET /search`                                                  |
| `apps/backend/src/modules/characters/services/__tests__/PinyinSearchService.test.ts` | **NEW** — unit tests                                                            |
| `packages/shared-constants/src/index.js`                                             | Add `pinyinSearch` route constant                                               |
| `packages/shared-constants/src/index.d.ts`                                           | Add type declaration for `pinyinSearch`                                         |
| `apps/backend/src/app/container.ts`                                                  | Wire pinyin module components                                                   |
| `apps/backend/src/app/routes.ts`                                                     | Mount pinyin sub-router with controller injection                               |
| `apps/backend/src/shared/types/express.d.ts`                                         | Add `pinyinController?: PinyinController`                                       |
| `apps/frontend/src/mocks/handlers/characters-handlers.ts`                            | Add pinyin search MSW handlers (4 states)                                       |

## API Endpoint Specification

| Method | Endpoint                | Auth                   | Description                                                     |
| ------ | ----------------------- | ---------------------- | --------------------------------------------------------------- |
| `GET`  | `/api/v1/pinyin/search` | Optional (public data) | Search characters by pinyin prefix, optionally filtered by tone |

### Query Parameters

| Param      | Type   | Required | Default | Description                                                    |
| ---------- | ------ | -------- | ------- | -------------------------------------------------------------- |
| `q`        | string | ✅ Yes   | —       | Pinyin query (lowercased, tone marks stripped before matching) |
| `tone`     | number | ❌ No    | —       | Filter by tone (1-4, or 5 for neutral)                         |
| `page`     | number | ❌ No    | 1       | Page number (1-based)                                          |
| `pageSize` | number | ❌ No    | 50      | Items per page (max: 100)                                      |

### Response Examples

**Success (200):**

```json
{
  "query": "ma",
  "totalResults": 42,
  "page": 1,
  "pageSize": 50,
  "results": [
    { "glyph": "妈", "pinyin": "mā", "tone": 1, "meaning": "mother" },
    { "glyph": "麻", "pinyin": "má", "tone": 2, "meaning": "hemp" },
    { "glyph": "马", "pinyin": "mǎ", "tone": 3, "meaning": "horse" },
    { "glyph": "骂", "pinyin": "mà", "tone": 4, "meaning": "to scold" }
  ]
}
```

**Missing required param (400):**

```json
{ "error": "Query parameter 'q' is required", "code": "VALIDATION_ERROR" }
```

**No matches (200):**

```json
{ "query": "zzzz", "totalResults": 0, "page": 1, "pageSize": 50, "results": [] }
```

## Route Constant

Add to `packages/shared-constants/src/index.js`:

```javascript
pinyinSearch: "/v1/pinyin/search",
```

Add to `packages/shared-constants/src/index.d.ts`:

```typescript
readonly pinyinSearch: string;
```

## Repository: PinyinSearchRepository (NEW)

```typescript
import { prisma } from "../../../shared/infrastructure/database/client.js";

export interface PinyinSearchParams {
  q: string;
  tone?: number;
  page: number;
  pageSize: number;
}

export interface PinyinSearchResult {
  glyph: string;
  pinyin: string;
  tone: number;
  meaning: string | null;
}

export interface PinyinSearchResponse {
  query: string;
  totalResults: number;
  page: number;
  pageSize: number;
  results: PinyinSearchResult[];
}

export class PinyinSearchRepository {
  async searchByPinyin(params: PinyinSearchParams): Promise<PinyinSearchResponse> {
    const { q, tone, page, pageSize } = params;
    const normalizedQuery = q.toLowerCase().replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/g, (c) => {
      // Strip tone marks for normalized matching
      const toneMap: Record<string, string> = {
        ā: "a",
        á: "a",
        ǎ: "a",
        à: "a",
        ē: "e",
        é: "e",
        ě: "e",
        è: "e",
        ī: "i",
        í: "i",
        ǐ: "i",
        ì: "i",
        ō: "o",
        ó: "o",
        ǒ: "o",
        ò: "o",
        ū: "u",
        ú: "u",
        ǔ: "u",
        ù: "u",
        ǖ: "ü",
        ǘ: "ü",
        ǚ: "ü",
        ǜ: "ü",
        ü: "ü",
      };
      return toneMap[c] || c;
    });

    // Build where clause filtering through PinyinSyllable relation
    const where: Record<string, unknown> = {
      pinyinSyllable: {
        syllable: { startsWith: normalizedQuery },
      },
    };

    if (tone !== undefined) {
      (where.pinyinSyllable as Record<string, unknown>).tone = tone;
    }

    const [mappings, total] = await Promise.all([
      prisma.pinyinCharacterMapping.findMany({
        where,
        include: {
          character: {
            select: { glyph: true, definition: true },
          },
          pinyinSyllable: {
            select: { syllablePretty: true, tone: true },
          },
        },
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: [{ pinyinSyllable: { syllable: "asc" } }, { pinyinSyllable: { tone: "asc" } }],
      }),
      prisma.pinyinCharacterMapping.count({ where }),
    ]);

    const results: PinyinSearchResult[] = mappings.map((m) => ({
      glyph: m.character.glyph,
      pinyin: m.pinyinSyllable.syllablePretty,
      tone: m.pinyinSyllable.tone,
      meaning: m.character.definition,
    }));

    return {
      query: q,
      totalResults: total,
      page,
      pageSize,
      results,
    };
  }
}
```

## Service: PinyinSearchService (NEW)

```typescript
import {
  PinyinSearchRepository,
  PinyinSearchParams,
  PinyinSearchResponse,
} from "../repositories/PinyinSearchRepository.js";

export class PinyinSearchService {
  private repository: PinyinSearchRepository;

  constructor(repository: PinyinSearchRepository) {
    this.repository = repository;
  }

  async search(params: PinyinSearchParams): Promise<PinyinSearchResponse> {
    const { q, page = 1, pageSize = 50 } = params;

    if (!q || q.trim().length === 0) {
      throw new ValidationError("VALIDATION_ERROR", "Query parameter 'q' is required");
    }

    const validatedPageSize = Math.min(pageSize, 100);

    return this.repository.searchByPinyin({
      q: q.trim(),
      tone: params.tone,
      page,
      pageSize: validatedPageSize,
    });
  }
}
```

## Controller: PinyinController (NEW)

**File:** `apps/backend/src/modules/characters/api/PinyinController.ts`

```typescript
import { createLogger } from "../../../shared/utils/logger.js";
import type { Request, Response } from "express";
import type { PinyinSearchService } from "../services/PinyinSearchService.js";

const logger = createLogger("PinyinController");

export class PinyinController {
  private service: PinyinSearchService;

  constructor(service: PinyinSearchService) {
    this.service = service;
  }

  async search(req: Request, res: Response): Promise<void> {
    try {
      const q = req.query.q as string | undefined;
      const tone = req.query.tone ? parseInt(req.query.tone as string, 10) : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 50;

      const result = await this.service.search({ q, tone, page, pageSize });
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(400).json({ error: err.message, code: "VALIDATION_ERROR" });
        return;
      }
      logger.error("Failed to search pinyin", err);
      res.status(500).json({ error: "Failed to search pinyin", code: "INTERNAL_ERROR" });
    }
  }
}
```

**IMPLEMENTATION NOTE:** For the ValidationError, check how other modules define it. In Story 21.10, the characters module has `CharacterValidationError` in `types/characters-errors.ts`. Create a similar error class for pinyin or import the characters one. A simple approach: create a `PinyinValidationError` or import a shared error type.

## Routes: pinyinRoutes.ts (NEW)

**File:** `apps/backend/src/modules/characters/api/pinyinRoutes.ts`

```typescript
import express from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

/**
 * GET /v1/pinyin/search
 * Search characters by pinyin query.
 * Params: q (required), tone (optional), page, pageSize.
 * Public data — no authentication required.
 */
router.get(
  ROUTE_PATTERNS.pinyinSearch,
  asyncHandler((req: Request, res: Response) => req.pinyinController!.search(req, res)),
);

export default router;
```

## Container + App Wiring

Update `apps/backend/src/modules/characters/container.ts` to also export pinyin components:

```typescript
import { PinyinController } from "./api/PinyinController.js";
import { PinyinSearchService } from "./services/PinyinSearchService.js";
import { PinyinSearchRepository } from "./repositories/PinyinSearchRepository.js";

export function createCharactersModule() {
  const repository = new CharactersRepository();
  const service = new CharactersService(repository);
  const controller = new CharactersController(service);
  return { controller };
}

export function createPinyinModule() {
  const repository = new PinyinSearchRepository();
  const service = new PinyinSearchService(repository);
  const controller = new PinyinController(service);
  return { controller };
}
```

Update `apps/backend/src/app/container.ts` — add pinyin module import and export.

Update `apps/backend/src/app/routes.ts` — mount pinyin routes with controller injection.

Update `apps/backend/src/shared/types/express.d.ts` — add `pinyinController?: PinyinController`.

## MSW Handlers

Add to `apps/frontend/src/mocks/handlers/characters-handlers.ts` — 4 states (default, loading, empty, error) for the pinyin search endpoint.

## Unit Tests

**File:** `apps/backend/src/modules/characters/services/__tests__/PinyinSearchService.test.ts` (NEW)

Test scenarios:

1. Search with valid `q` returns results
2. Search with `q` + `tone` filters correctly
3. Search with missing `q` throws ValidationError
4. Search with no matches returns empty results
5. Search with page/pageSize paginates correctly

## Implementation Status

- **Status**: Implemented
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
