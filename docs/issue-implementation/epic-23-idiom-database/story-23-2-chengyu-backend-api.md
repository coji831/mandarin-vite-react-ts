# Implementation 23-2: Chengyu Backend API

> **BR Reference:** `docs/business-requirements/epic-23-idiom-database/story-23-2-chengyu-backend-api.md`
> **Epic IMP:** `docs/issue-implementation/epic-23-idiom-database/README.md`
> **Status:** Planned
> **Last Update:** August 7, 2026

## Technical Scope

Create the `modules/chengyu/` backend module following the modulith pattern, implement the two PROPOSED read-only endpoints against the tables seeded by Story 23.1, register both paths verbatim in `ROUTE_PATTERNS`, register the module in the app container, and verify `content/manifest.json` (the `chengyu` block + count are declared/bumped by 23.1 — no manifest edit here). No frontend feature code in this story (23.3); MSW handlers are scaffolded here for 23.3's Storybook/Vitest use and registered in `apps/frontend/src/mocks/server.ts`.

**Files:**

- `apps/backend/src/modules/chengyu/container.ts` — **NEW**: DI registration (Repository → Service → Controller).
- `apps/backend/src/modules/chengyu/index.ts` — **NEW**: barrel (re-exports types + classes).
- `apps/backend/src/modules/chengyu/api/ChengyuController.ts` — **NEW**: 2 GET endpoints, manual query coercion + service-side range validation, error mapping.
- `apps/backend/src/modules/chengyu/api/chengyuRoutes.ts` — **NEW**: route definitions using `ROUTE_PATTERNS`.
- `apps/backend/src/modules/chengyu/services/ChengyuService.ts` — **NEW**: orchestration, validation, errors, optional module-level cache.
- `apps/backend/src/modules/chengyu/repositories/ChengyuRepository.ts` — **NEW**: Prisma queries (filters + pagination + detail includes).
- `apps/backend/src/modules/chengyu/types/chengyu.ts` — **NEW**: request/response types.
- `apps/backend/src/modules/chengyu/**/__tests__/*.test.ts` — **NEW**: repository/service/controller unit tests.
- `apps/backend/src/app/container.ts` — **UPDATE**: register the chengyu module.
- `apps/backend/src/app/routes.ts` — **UPDATE**: mount `chengyuRoutes`.
- `apps/backend/src/shared/types/express.d.ts` — **UPDATE**: add `ChengyuController` augmentation.
- `packages/shared-constants/src/index.js` — **UPDATE**: add `chengyuIdioms`, `chengyuIdiomById`.
- `packages/shared-constants/src/index.d.ts` — **UPDATE**: type declarations for both constants.
- `content/manifest.json` — **VERIFY** (no edit): confirm `entity_counts.chengyu` ≥50 and `chengyu.files` lists `chengyu.json` (declared + bumped by 23.1).
- `apps/frontend/src/mocks/handlers/chengyu-handlers.ts` — **NEW**: MSW handlers for 23.3 (Storybook + Vitest); export `chengyuHandlers` with a `default()` factory — handler contract in Technical Challenges.
- `apps/frontend/src/mocks/server.ts` — **UPDATE**: import + register `chengyuHandlers` (flatten `chengyuHandlers.default()` alongside the existing handler modules).

## API Endpoint Specification (single normative source)

**Error convention** (all endpoints): `backend-error-messages.instructions.md` shape `{ error, code }` where `error` = `"Failed to {action} {resource}"` and `code` ∈ `VALIDATION_ERROR` (400) | `NOT_FOUND` (404) | `INTERNAL_ERROR` (500). No extra fields. **This section is the single residence for endpoint contracts** — the epic IMP and story 23.3 reference it and never duplicate the contracts.

| Method | Endpoint                 | Auth         | Description                                                                                                                                                                                                                                                                     |
| ------ | ------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/v1/chengyu/idioms`     | optionalAuth | List idioms. Query: `search` (matches idiom/pinyin/literal/figurative meanings/story + example english/pinyin), `theme`, `era`, `page`, `pageSize`. Response: `{ items: ChengyuSummary[], total, page, pageSize }` (mirrors the grammar list contract).                         |
| `GET`  | `/v1/chengyu/idioms/:id` | optionalAuth | Idiom detail — `:id` resolves by `content_id` `cy_XXXX`. Response: `{ id: "cy_0005", chengyu, pinyin, literalMeaning, figurativeMeaning, story, storySource, era, theme, examples: [{ chinese, pinyin, english, segments }], relatedIdioms: [{ id, chengyu, relationType }] }`. |

### API Contract Details

#### `GET /v1/chengyu/idioms` (optionalAuth) — list

Request — all query params optional and additive (AND); an empty query returns the full library paginated (the chengyu landing page must browse unfiltered, like grammar):

| Param      | Type   | Rules                                                                                                                                                                      | Default |
| ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `search`   | string | case-insensitive substring against `chengyu` / `pinyin` / `literalMeaning` / `figurativeMeaning` / `story`, and against example `english` / `pinyin` (via `examples.some`) | —       |
| `theme`    | string | exact match against `theme`                                                                                                                                                | —       |
| `era`      | string | exact match against `era`                                                                                                                                                  | —       |
| `page`     | int    | ≥1                                                                                                                                                                         | 1       |
| `pageSize` | int    | 1–100 (bounds mirror shared-constants `PAGINATION`)                                                                                                                        | 20      |

Response `200`:

```json
{
  "items": [
    {
      "id": "cy_0005",
      "chengyu": "破釜沉舟",
      "pinyin": "pò fǔ chén zhōu",
      "literalMeaning": "Break pots, sink ships",
      "figurativeMeaning": "Burning one's bridges",
      "era": "Qin–Han transition",
      "theme": "determination",
      "sortOrder": 5,
      "exampleCount": 2,
      "previewExample": "这次我们只能破釜沉舟了。"
    }
  ],
  "total": 50,
  "page": 1,
  "pageSize": 20
}
```

Errors:

```json
// 400 — invalid filter (e.g. page=0, pageSize=500)
{ "error": "Failed to load chengyu idioms", "code": "VALIDATION_ERROR" }

// 500 — unexpected server error
{ "error": "Failed to load chengyu idioms", "code": "INTERNAL_ERROR" }
```

#### `GET /v1/chengyu/idioms/:id` (optionalAuth) — detail

`:id` resolves by **`content_id`** (`cy_XXXX`); the internal uuid is never a valid identifier.

Response `200`:

```json
{
  "id": "cy_0005",
  "chengyu": "破釜沉舟",
  "pinyin": "pò fǔ chén zhōu",
  "literalMeaning": "Break pots, sink ships",
  "figurativeMeaning": "Burning one's bridges",
  "story": "During the Qin–Han transition, Xiang Yu … crossing the river, he ordered the boats sunk and the cooking pots smashed …",
  "storySource": "《史记·卷七·项羽本纪》(zh.wikisource.org/wiki/史記/卷007)",
  "era": "Qin–Han transition",
  "theme": "determination",
  "sortOrder": 5,
  "examples": [
    {
      "id": "cy_0005_ex1",
      "chinese": "这次我们只能破釜沉舟了。",
      "pinyin": "zhè cì wǒmen zhǐ néng pò fǔ chén zhōu le",
      "english": "This time we have no choice but to burn our bridges.",
      "segments": [
        {
          "text": "这次",
          "pinyin": "zhè cì",
          "gloss": "this time",
          "entityType": "word",
          "entityId": "w_XXXXX"
        },
        {
          "text": "破釜沉舟",
          "pinyin": "pò fǔ chén zhōu",
          "gloss": "burn one's bridges",
          "entityType": null,
          "entityId": null
        }
      ]
    }
  ],
  "relatedIdioms": [{ "id": "cy_0012", "chengyu": "背水一战", "relationType": "RELATED" }]
}
```

Errors:

```json
// 404 — unknown cy_XXXX
{ "error": "Failed to load chengyu idiom", "code": "NOT_FOUND" }

// 500 — unexpected server error
{ "error": "Failed to load chengyu idiom", "code": "INTERNAL_ERROR" }
```

## Implementation Details

### Architecture Decision (module)

**Backend `chengyu` module** — `apps/backend/src/modules/chengyu/`: `api/`, `container.ts`, `index.ts`, `repositories/`, `services/`, `types/` with `GET /v1/chengyu/idioms` (query: `search`, `theme`, `era`, `page`, `pageSize`) and `GET /v1/chengyu/idioms/:id` (idiom + examples + related; `:id` resolves by `content_id` `cy_XXXX`).

- Rationale: Mirrors the `modules/grammar/` modulith pattern; keeps search/filter server-side and consistent with every other content type.
- Alternatives considered: Extending an existing module (rejected — chengyu is a distinct content domain); folding into the UI story (rejected — data-first pipeline).
- Implications: 23.2 must add both paths verbatim to `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` + `index.d.ts` and register the module in the app container.

### Route registration (four wiring points, mirroring `modules/grammar/`)

1. `apps/backend/src/modules/chengyu/api/chengyuRoutes.ts` — Express Router:

```typescript
router.get(
  ROUTE_PATTERNS.chengyuIdioms,
  asyncHandler((req, res) => req.chengyuController!.list(req, res)),
);
router.get(
  ROUTE_PATTERNS.chengyuIdiomById(":id"),
  asyncHandler((req, res) => req.chengyuController!.getById(req, res)),
);
```

2. `apps/backend/src/modules/chengyu/container.ts` — registers `ChengyuRepository → ChengyuService → ChengyuController`.
3. `apps/backend/src/app/container.ts` — imports and invokes the chengyu module's registration.
4. `apps/backend/src/app/routes.ts` — mounts `chengyuRoutes`; `apps/backend/src/shared/types/express.d.ts` adds the `ChengyuController` augmentation.

### Shared constants — 2 new route constants (proposed)

Add verbatim to `packages/shared-constants/src/index.js` **and** `packages/shared-constants/src/index.d.ts` (naming mirrors the existing `grammarPatterns` / `grammarPatternById` constants):

| Constant           | Value                                  | Used By                                 |
| ------------------ | -------------------------------------- | --------------------------------------- |
| `chengyuIdioms`    | `/v1/chengyu/idioms`                   | `chengyuRoutes.ts`, `chengyuService.ts` |
| `chengyuIdiomById` | `(id) => \`/v1/chengyu/idioms/${id}\`` | `chengyuRoutes.ts`, `chengyuService.ts` |

### Manifest verification (no edit)

`content/manifest.json` is owned by Story 23.1 (declare the `chengyu` block + bump `entity_counts.chengyu` after the seed populates). Story 23.2 only **verifies**: confirm `entity_counts.chengyu` ≥50 and the `chengyu` section lists `files: ["chengyu.json"]`, `served_via: "db"` — no change is made here.

## Architecture Integration

```
[Story 23.2: Chengyu Backend API]
├── modules/chengyu/ → container.ts registered in app/container.ts
├── api/ → ChengyuController + chengyuRoutes (2 GET, manual query coercion + service-side validation)
├── services/ → ChengyuService (validation, errors, optional cache)
├── repositories/ → ChengyuRepository (Prisma queries against 23.1 tables)
│   ├── Chengyu / ChengyuExample / ChengyuRelation (seeded by 23.1)
├── shared-constants → chengyuIdioms + chengyuIdiomById in ROUTE_PATTERNS
├── content/manifest.json → verify entity_counts.chengyu ≥ 50 (edited by 23.1; no change here)
└── Consumers:
    ├── 23.3 Chengyu UI → chengyuService (apiClient → these endpoints; MSW handlers consumed by Storybook/Vitest)
    └── future chengyu consumers (any client of idiom content)

Dependencies:
└── 23.1 → models + seeded content exist (data story must land first)
```

## Technical Challenges & Solutions

```
Problem: The detail endpoint must resolve by the business key (content_id "cy_XXXX"),
         not the internal uuid — the two identifiers must never be conflated.
Solution: Repository uses findUnique({ where: { content_id } }); the internal uuid is
         never accepted as a path param and never returned in responses.

Problem: Route constants must exist verbatim before any frontend call (23.3 compiles
         against ROUTE_PATTERNS.chengyuIdioms / chengyuIdiomById).
Solution: Add both constants to shared-constants (index.js + .d.ts) in the same commit
         as the module; 23.3's MSW handlers (chengyu-handlers.ts) are scaffolded here
         (exporting a chengyuHandlers.default() factory) and registered in
         apps/frontend/src/mocks/server.ts so 23.3 can develop in parallel.

Problem: Unfiltered list query would return the whole library — unlike characters/search,
         the chengyu landing page must browse unfiltered (pagination only).
Solution: All filters are optional and additive; no "at least one filter" 400. Empty
         query returns the full library paginated (page/pageSize bounded).

Implementation note for 23.3 (Epic 22 hardening pattern): the grammar module (22.2→22.3)
         hardened its detail mapper with (a) a null-`segments` guard — segments is always
         an array (Postgres JSON null would crash the hub's segments.map) — and (b) a
         null-`toPattern` filter — related rows can never contain a null-id entry. Apply
         the same guards to chengyu's `examples[].segments` and `relatedIdioms[]` mapping.
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` — chengyu paths are **proposed** (do not exist yet; verified `grammarPatterns`/`grammarPatternById` present, no chengyu paths); `chengyuIdioms`/`chengyuIdiomById` added verbatim during 23.2 before any frontend call
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` — `modules/chengyu/` new (no `chengyu` module exists today); no `features/chengyu` yet (23.3)
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — Prisma-only, all-in-DB (tables seeded by 23.1)
- [x] All relative markdown links resolve (this story → `../README.md`, `story-23-1-chengyu-data.md`, `story-23-3-chengyu-ui.md`, IMP twin)
- [x] Last Updated / Last Update date is current (August 7, 2026 — same commit as the edit)

> **Note:** PR / Merge Date / Key Commit stay literal `TBD` until commit, filled same-commit; never merge with TBD.

## Testing Implementation

Per `testing-standards.instructions.md` (Testing Trophy):

- **Unit** — `ChengyuRepository` filter-building (search across idiom/pinyin/meanings/story + example english/pinyin; theme; era; pagination math); `ChengyuService` validation (theme/era invalid → 400, page/pageSize bounds, missing idiom → `NOT_FOUND`); `ChengyuController` route wiring + error mapping.
- **Integration (DB)** — repository + service against a test DB: list filters + pagination, detail-by-`content_id`, empty-result 404, seed re-run idempotency.
- **Route registration** — assert `chengyuIdioms` / `chengyuIdiomById` exist verbatim in `ROUTE_PATTERNS` and the module is registered in the app container.
- **MSW** — `apps/frontend/src/mocks/handlers/chengyu-handlers.ts` covers both endpoints with realistic payloads (absolute URLs `http://localhost:3001/api/v1/...`); registration + `default()` factory contract in Technical Challenges.
- **Static** — `npm run build`, `npm run lint`, backend type-check (`npm run typecheck --workspace=@mandarin/backend`).
