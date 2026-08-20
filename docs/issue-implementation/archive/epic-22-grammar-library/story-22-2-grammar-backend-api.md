# Implementation 22-2: Grammar Backend API

> **BR Reference:** `docs/business-requirements/archive/epic-22-grammar-library/story-22-2-grammar-backend-api.md`
> **Status:** ✅ Complete
> **Last Update:** August 5, 2026

## Technical Scope

Create the `modules/grammar/` backend module following the modulith pattern, implement the two PROPOSED read-only endpoints against the tables seeded by Story 22.1, register both paths verbatim in `ROUTE_PATTERNS`, register the module in the app container, and verify `content/manifest.json` (the `grammar` block + count are declared/bumped by 22.1 — no manifest edit here). No frontend feature code in this story (22.3); MSW handlers are scaffolded here for 22.3's Storybook/Vitest use and registered in `apps/frontend/src/mocks/server.ts`.

**Files:**

- `apps/backend/src/modules/grammar/container.ts` — **NEW**: DI registration (Repository → Service → Controller).
- `apps/backend/src/modules/grammar/index.ts` — **NEW**: barrel (re-exports types + classes).
- `apps/backend/src/modules/grammar/api/GrammarController.ts` — **NEW**: 2 GET endpoints, manual query coercion + service-side range validation, error mapping.
- `apps/backend/src/modules/grammar/api/grammarRoutes.ts` — **NEW**: route definitions using `ROUTE_PATTERNS`.
- `apps/backend/src/modules/grammar/services/GrammarService.ts` — **NEW**: orchestration, validation, errors, optional module-level cache.
- `apps/backend/src/modules/grammar/repositories/GrammarRepository.ts` — **NEW**: Prisma queries (filters + pagination + detail includes).
- `apps/backend/src/modules/grammar/types/grammar.ts` — **NEW**: request/response types.
- `apps/backend/src/modules/grammar/services/__tests__/GrammarService.test.ts` — **NEW**: unit tests.
- `apps/backend/src/modules/grammar/repositories/__tests__/GrammarRepository.test.ts` — **NEW**: unit tests.
- `apps/backend/src/modules/grammar/api/__tests__/GrammarController.test.ts` — **NEW**: unit tests (validation + error mapping).
- `apps/backend/src/app/container.ts` — **UPDATE**: register the grammar module.
- `apps/backend/src/app/routes.ts` — **UPDATE**: mount `grammarRoutes` at `/v1/grammar`.
- `apps/backend/src/shared/types/express.d.ts` — **UPDATE**: add `GrammarController` augmentation.
- `packages/shared-constants/src/index.js` — **UPDATE**: add `grammarPatterns`, `grammarPatternById`.
- `packages/shared-constants/src/index.d.ts` — **UPDATE**: type declarations for both constants.
- `content/manifest.json` — **VERIFY** (no edit): confirm `entity_counts.grammar` ≥21 and `grammar.files` lists `grammar-patterns.json` (declared + bumped by 22.1).
- `apps/frontend/src/mocks/handlers/grammar-handlers.ts` — **NEW**: MSW handlers for 22.3 (Storybook + Vitest); export as `grammarHandlers` with a `default()` factory (matching `phoneticClustersHandlers`) so `server.ts` can flatten it and 22.3 stories can call `grammarHandlers.default()`.
- `apps/frontend/src/mocks/server.ts` — **UPDATE**: import + register `grammarHandlers` (flatten `grammarHandlers.default()` alongside the existing handler modules).

## API Endpoint Specification

| Method | Endpoint                   | Auth         | Description                                                                                                                                                                                                        |
| ------ | -------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET`  | `/v1/grammar/patterns`     | optionalAuth | List patterns with optional `search` (name/structure/explanation/example english/pinyin substring), `hskLevel` (1–6), `phase` (2–4), `page` (≥1), `pageSize` (1–100). Response `{ items, total, page, pageSize }`. |
| `GET`  | `/v1/grammar/patterns/:id` | optionalAuth | Pattern detail by `content_id` (`gr_XXXX`): `name`, `structure`, `explanation`, `phase`, `hskLevel`, `examples[]` (with `segments[]`), `relatedPatterns[]`.                                                        |

**Response examples:**

`GET /v1/grammar/patterns?phase=2&page=1&pageSize=20` (200):

```json
{
  "items": [
    {
      "id": "gr_0005",
      "name": "吗 yes/no questions",
      "structure": "Statement + 吗？",
      "phase": 2,
      "hskLevel": 1,
      "sortOrder": 5,
      "exampleCount": 3,
      "previewExample": "你好吗？"
    }
  ],
  "total": 9,
  "page": 1,
  "pageSize": 20
}
```

`GET /v1/grammar/patterns/gr_0018` (200):

```json
{
  "id": "gr_0018",
  "name": "把 (bǎ) disposal construction",
  "structure": "Subj + 把 + Obj + Verb + Complement",
  "explanation": "把 (bǎ) moves the object before the verb and marks it as the topic of disposal…",
  "phase": 4,
  "hskLevel": 4,
  "sortOrder": 18,
  "examples": [
    {
      "id": "gr_0018_ex1",
      "chinese": "我把书放在桌子上",
      "pinyin": "wǒ bǎ shū fàng zài zhuōzi shàng",
      "english": "I put the book on the table",
      "segments": [
        {
          "text": "我",
          "pinyin": "wǒ",
          "gloss": "I",
          "entityType": "character",
          "entityId": "ch_25105"
        },
        {
          "text": "把",
          "pinyin": "bǎ",
          "gloss": "BA (disposal marker)",
          "entityType": "character",
          "entityId": null
        }
      ]
    }
  ],
  "relatedPatterns": [
    { "id": "gr_0019", "name": "被 (bèi) passive construction", "relationType": "CONTRASTS_WITH" }
  ]
}
```

`GET /v1/grammar/patterns/gr_9999` (404):

```json
{ "error": "Failed to load grammar pattern", "code": "NOT_FOUND" }
```

`GET /v1/grammar/patterns?phase=5` (400):

```json
{ "error": "Failed to load grammar patterns", "code": "VALIDATION_ERROR" }
```

## Implementation Details

### Repository layer (`GrammarRepository`)

All Prisma queries, no business logic. The list endpoint builds a `where` clause additively; the detail endpoint resolves by the unique `content_id`.

```typescript
async findPatterns(params: GrammarListParams): Promise<{ items: GrammarPatternSummary[]; total: number }> {
  const where: Prisma.GrammarPatternWhereInput = {};
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { structure: { contains: params.search, mode: "insensitive" } },
      { explanation: { contains: params.search, mode: "insensitive" } },
      { examples: { some: { OR: [
        { english: { contains: params.search, mode: "insensitive" } },
        { pinyin: { contains: params.search, mode: "insensitive" } },
      ] } } },
    ];
  }
  if (params.hskLevel) where.hskLevel = params.hskLevel;
  if (params.phase) where.phase = params.phase;

  const [rows, total] = await Promise.all([
    prisma.grammarPattern.findMany({
      where,
      include: {
        _count: { select: { examples: true } },
        // First example only — powers the summary `previewExample`.
        examples: { orderBy: { sortOrder: "asc" }, take: 1, select: { chinese: true } },
      },
      orderBy: [{ phase: "asc" }, { sortOrder: "asc" }],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.grammarPattern.count({ where }),
  ]);
  return { items: rows.map(toSummary), total };
}

async findByContentId(contentId: string): Promise<GrammarPatternDetail | null> {
  return prisma.grammarPattern.findUnique({
    where: { content_id: contentId },
    include: {
      examples: { orderBy: { sortOrder: "asc" } },
      relatedFrom: { include: { toPattern: { select: { content_id: true, name: true } } } },
    },
  });
}
```

### Service layer (`GrammarService`)

Thin orchestration + validation + errors. All error messages follow `backend-error-messages.instructions.md` (`Failed to {action} {resource}`). The detail mapper is hardened for the 22.3 Grammar Hub (see the two guards below).

```typescript
class GrammarService {
  constructor(private repo: GrammarRepository) {}

  async listPatterns(query: GrammarListQuery): Promise<GrammarListResponse> {
    const { search, hskLevel, phase, page = 1, pageSize = 20 } = validateListQuery(query); // throws VALIDATION_ERROR
    const { items, total } = await this.repo.findPatterns({
      search,
      hskLevel,
      phase,
      page,
      pageSize,
    });
    return { items, total, page, pageSize };
  }

  async getPattern(id: string): Promise<GrammarPatternDetail> {
    const pattern = await this.repo.findByContentId(id); // id = content_id "gr_XXXX"
    if (!pattern) throw new NotFoundError("Failed to load grammar pattern", "NOT_FOUND");
    return mapDetail(pattern);
  }
}

// Detail mapping — 22.3 hardening (consumed by GrammarHub):
// - `relatedFrom.filter((r) => r.toPattern !== null)` → relatedPatterns can never
//   contain a null-id entry (a dead hub nav would throw on `toPattern!.content_id`).
// - `Array.isArray(example.segments) ? ... : []` → segments is always an array
//   (Postgres JSON null would crash the hub's `example.segments.map(...)`).
function mapDetail(row: GrammarPatternDetailRow): GrammarPatternDetail {
  return {
    id: row.content_id,
    name: row.name,
    structure: row.structure,
    explanation: row.explanation,
    phase: row.phase,
    hskLevel: row.hskLevel,
    sortOrder: row.sortOrder,
    examples: row.examples.map(mapExample),
    relatedPatterns: row.relatedFrom
      .filter((r) => r.toPattern !== null)
      .map((r) => ({
        id: r.toPattern!.content_id,
        name: r.toPattern!.name,
        relationType: r.relationType,
      })),
  };
}

function mapExample(example: GrammarPatternDetailRow["examples"][number]): GrammarExample {
  return {
    id: example.content_id,
    chinese: example.chinese,
    pinyin: example.pinyin,
    english: example.english,
    segments: Array.isArray(example.segments) ? (example.segments as GrammarSegment[]) : [],
  };
}
```

### Controller layer (`GrammarController`)

Express handlers with manual query coercion (`Number()`) + service-side range validation (mirrors characters/phonetic-clusters/words). `phase` ∈ {2,3,4}; `hskLevel` ∈ 1–6; `page` ≥ 1; `pageSize` ∈ 1–100 (bounds from shared-constants `PAGINATION`). Invalid → 400 `VALIDATION_ERROR`. Unexpected → 500 `INTERNAL_ERROR`.

### Route registration (four wiring points, mirroring story 21.10)

1. `apps/backend/src/modules/grammar/api/grammarRoutes.ts` — Express Router:

```typescript
router.get(
  ROUTE_PATTERNS.grammarPatterns,
  asyncHandler((req, res) => req.grammarController!.list(req, res)),
);
router.get(
  ROUTE_PATTERNS.grammarPatternById(":id"),
  asyncHandler((req, res) => req.grammarController!.getById(req, res)),
);
```

2. `apps/backend/src/modules/grammar/container.ts` — registers `GrammarRepository → GrammarService → GrammarController`.
3. `apps/backend/src/app/container.ts` — imports and invokes the grammar module's registration.
4. `apps/backend/src/app/routes.ts` — mounts `grammarRoutes` at `/v1/grammar`; `apps/backend/src/shared/types/express.d.ts` adds the `GrammarController` augmentation.

### Shared constants — 2 new route constants

Add verbatim to `packages/shared-constants/src/index.js` **and** `packages/shared-constants/src/index.d.ts`:

| Constant             | Value                                    | Used By                                 |
| -------------------- | ---------------------------------------- | --------------------------------------- |
| `grammarPatterns`    | `/v1/grammar/patterns`                   | `grammarRoutes.ts`, `grammarService.ts` |
| `grammarPatternById` | `(id) => \`/v1/grammar/patterns/${id}\`` | `grammarRoutes.ts`, `grammarService.ts` |

### Manifest verification (no edit)

`content/manifest.json` is owned by Story 22.1 (declare the `grammar` block + bump `entity_counts.grammar` after the seed populates). Story 22.2 only **verifies**: confirm `entity_counts.grammar` ≥21 and the `grammar` section lists `files: ["grammar-patterns.json"]`, `served_via: "db"` — no change is made here.

## Architecture Integration

```
[Story 22.2: Grammar Backend API]
├── modules/grammar/ → container.ts registered in app/container.ts
├── api/ → GrammarController + grammarRoutes (2 GET, manual query coercion + service-side validation)
├── services/ → GrammarService (validation, errors, optional cache)
├── repositories/ → GrammarRepository (Prisma queries against 22.1 tables)
│   ├── GrammarPattern / GrammarExample / GrammarPatternRelation (seeded by 22.1)
├── shared-constants → grammarPatterns + grammarPatternById in ROUTE_PATTERNS
├── content/manifest.json → verify entity_counts.grammar ≥ 21 (edited by 22.1; no change here)
└── Consumers:
    ├── 22.3 Grammar UI → grammarService (apiClient → these endpoints)
    └── future grammar consumers (e.g. readers cross-linking, chengyu)

Dependencies:
└── 22.1 → models + seeded content exist (data story must land first)
```

## Technical Challenges & Solutions

```
Problem: The detail endpoint must resolve by the business key (content_id "gr_XXXX"),
         not the internal uuid — the two identifiers must never be conflated.
Solution: Repository uses findUnique({ where: { content_id } }); the internal uuid is
         never accepted as a path param and never returned in responses.

Problem: Route constants must exist verbatim before any frontend call (22.3 compiles
         against ROUTE_PATTERNS.grammarPatterns / grammarPatternById).
Solution: Add both constants to shared-constants (index.js + .d.ts) in the same commit
         as the module; 22.3's MSW handlers (grammar-handlers.ts) are scaffolded here
         (exporting a grammarHandlers.default() factory) and registered in
         apps/frontend/src/mocks/server.ts so 22.3 can develop in parallel.

Problem: Unfiltered list query would return the whole library — unlike characters/search,
         the grammar landing page must browse unfiltered (pagination only).
Solution: All filters are optional and additive; no "at least one filter" 400. Empty
         query returns the full library paginated (page/pageSize bounded).
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (`grammarPatterns` = `/v1/grammar/patterns`, `grammarPatternById(id)` = `/v1/grammar/patterns/:id`; verbs GET, copied verbatim)
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` (`modules/grammar/` new; no `features/grammar` yet)
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — Prisma-only, all-in-DB
- [x] All relative markdown links resolve (this story → `../README.md`, `story-22-1-grammar-data.md`, `story-22-3-grammar-ui.md`, IMP twin)
- [x] Last Updated / Last Update date is current (August 5, 2026 — same commit as the edit)

> **Note:** PR / Merge Date / Key Commit are filled in the BR's Implementation Status (same commit as this refresh — PR `TBD (pending)` until the branch is pushed).

## Testing Implementation

Per `testing-standards.instructions.md` (Testing Trophy):

- **Unit** — `GrammarRepository` filter-building (search across name/structure/explanation/example english/pinyin; hskLevel; phase; pagination math); `GrammarService` validation (phase ∉ {2,3,4} → 400, hskLevel ∉ 1–6 → 400, page/pageSize bounds, missing pattern → `NOT_FOUND`); `GrammarController` route wiring + error mapping.
- **Integration (DB)** — repository + service against a test DB: list filters + pagination, detail-by-`content_id`, empty-result 404, seed re-run idempotency.
- **Route registration** — assert `grammarPatterns` / `grammarPatternById` exist verbatim in `ROUTE_PATTERNS` and the module is registered in the app container.
- **MSW** — `apps/frontend/src/mocks/handlers/grammar-handlers.ts` covers both endpoints with realistic payloads (for 22.3 Storybook + Vitest); absolute URLs (`http://localhost:3001/api/v1/...`). Register it in `apps/frontend/src/mocks/server.ts` (import + flatten `grammarHandlers.default()`, matching `phoneticClustersHandlers`).
- **Static** — `npm run build`, `npm run lint`, backend type-check (`npm run typecheck --workspace=@mandarin/backend`).
