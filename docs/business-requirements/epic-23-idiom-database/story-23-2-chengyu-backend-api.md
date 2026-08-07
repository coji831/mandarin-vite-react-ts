# Story 23.2: Chengyu Backend API

**Last Update:** August 8, 2026

## Description

**As a** developer,
**I want to** stand up a backend `chengyu` module with list/detail endpoints, register the routes, and verify the content manifest (updated by 23.1),
**So that** any client — the Chengyu UI (23.3) or any future consumer — can consume idiom content through the canonical, all-in-DB API layer.

## Business Value

This story delivers chengyu through the platform's canonical API layer and unblocks **any** consumer of idiom data, not just the Chengyu UI. It follows the proven modulith precedent of `modules/grammar/` (Epic 22): a single-responsibility module with typed repositories/services/controllers, server-side search/filter/pagination, and consistent error codes. Without it, 23.3 would have no typed API to consume and chengyu would fall back to non-canonical delivery, violating the all-in-DB decision. It also registers the two endpoints verbatim in `ROUTE_PATTERNS` so the frontend service layer can call them through the shared constants — the contract both sides compile against.

## Acceptance Criteria

- [x] Backend `modules/chengyu/` module created (types → repositories → services → api → container → index) following the modulith pattern (mirrors `modules/grammar/`); registered in the app container.
- [x] `GET /v1/chengyu/idioms` implemented with filters `search`, `theme`, `era` plus pagination `page`/`pageSize`; returns `{ items, total, page, pageSize }`.
- [x] `GET /v1/chengyu/idioms/:id` implemented — returns idiom + `examples[]` (with `segments[]`) + `relatedIdioms[]`; `:id` resolves by `content_id` `cy_XXXX` (internal uuid is never a valid identifier).
- [x] Both paths added verbatim to `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (`chengyuIdioms`, `chengyuIdiomById`) + `.d.ts` declarations.
- [x] Verify `content/manifest.json` `chengyu` count ≥50 and the `chengyu` section lists `chengyu.json` (declare + bump owned by 23.1; no edit here).
- [x] Error responses follow `backend-error-messages.instructions.md` (`{ error, code }`; `VALIDATION_ERROR` 400 / `NOT_FOUND` 404 / `INTERNAL_ERROR` 500; `"Failed to load chengyu idiom(s)"` messages).
- [x] Backend tests per `testing-standards.instructions.md` (repository filters + pagination, service validation, controller route registration, detail-by-`content_id`).

## Business Rules

1. **Modulith pattern** — `modules/chengyu/` mirrors the existing structure: `container.ts` (DI), `api/` (controller + routes), `services/` (business logic + validation + errors), `repositories/` (Prisma queries), `types/` (request/response types), re-exported via `index.ts`.
2. **Prisma-first** — all queries run against the seeded `Chengyu`/`ChengyuExample`/`ChengyuRelation` tables; no JSON file reads (all-in-DB).
3. **Caching optional** — a module-level cache is permitted for the list endpoint (pattern: `radicalsService`); the detail endpoint should reflect current data (no cache or short TTL).
4. **Idempotent GET** — both endpoints are read-only; no POST/PUT/DELETE in this story (mutations belong to the seed, Story 23.1).
5. **Error code convention** — `VALIDATION_ERROR` (invalid filters), `NOT_FOUND` (unknown `cy_XXXX`), `INTERNAL_ERROR` (unexpected); no custom codes.
6. **Validation rules** — `theme`/`era` exact match; `page` ≥ 1; `pageSize` ∈ 1–100 (bounds mirror shared-constants `PAGINATION`); invalid values → 400.
7. **Route constants verbatim** — `chengyuIdioms` and `chengyuIdiomById` are added to `ROUTE_PATTERNS` exactly as specified in the story-23.2 IMP before any frontend call (23.3 depends on them).
8. **Detail resolution** — `:id` looks up by the unique `content_id` (`cy_XXXX`); never expose or resolve by the internal uuid.

## Related Issues

- Epic 23: Chengyu (Idiom) Narratives — BR (`README.md`) (epic parent)
- **Story 23.1: Chengyu Data** ([BR](story-23-1-chengyu-data.md)) (dependency — models + seeded content)
- **Story 23.3: Chengyu UI** ([BR](story-23-3-chengyu-ui.md)) (consumer — frontend service calls these endpoints)
- **Implementation (IMP twin):** `story-23-2-chengyu-backend-api.md` → `../../issue-implementation/epic-23-idiom-database/story-23-2-chengyu-backend-api.md`

## Implementation Status

- **Status**: Complete
- **PR**: TBD (pending)
- **Merge Date**: N/A
- **Key Commit**: TBD (final story-commit hash filled same-commit)

## Risks

- **Backend API failure mode vs. static JSON (Severity: Low)** + **the `segments`/`related` null-guard hardening** — full write-up in the story-23.2 IMP Technical Challenges & Solutions: `../../issue-implementation/epic-23-idiom-database/story-23-2-chengyu-backend-api.md`
