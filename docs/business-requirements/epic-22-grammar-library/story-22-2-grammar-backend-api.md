# Story 22.2: Grammar Backend API

**Last Update:** August 5, 2026 (Story 22.2 complete — grammar backend API delivered)

## Description

**As a** developer,
**I want to** stand up a backend `grammar` module with list/detail endpoints, register the routes, and verify the content manifest (updated by 22.1),
**So that** any client — the Grammar UI (22.3) or any future consumer — can consume grammar content through the canonical, all-in-DB API layer.

## Business Value

This story delivers grammar through the platform's canonical API layer and unblocks **any** consumer of grammar data, not just the Grammar UI. It follows the proven modulith precedent of epic-21 story 21.10 (dedicated `modules/characters/` backend module): a single-responsibility module with typed repositories/services/controllers, server-side search/filter/pagination, and consistent error codes. Without it, 22.3 would have no typed API to consume and grammar would fall back to non-canonical delivery, violating the all-in-DB decision. It also registers the two PROPOSED endpoints verbatim in `ROUTE_PATTERNS` so the frontend service layer can call them through the shared constants — the contract both sides compile against.

## Acceptance Criteria

- [x] Backend `modules/grammar/` module created following the modulith pattern (`container.ts`, `index.ts`, `api/`, `services/`, `repositories/`, `types/`) and registered in the app container.
- [x] `GET /v1/grammar/patterns` implemented with filters `search`, `hskLevel`, `phase` plus pagination `page`/`pageSize`; returns `{ items, total, page, pageSize }`.
- [x] `GET /v1/grammar/patterns/:id` implemented — returns pattern + `examples[]` (with `segments[]`) + `relatedPatterns[]`; `:id` resolves by `content_id` `gr_XXXX` (internal uuid is never a valid identifier).
- [x] Both paths added verbatim to `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (`grammarPatterns`, `grammarPatternById`) + `.d.ts` declarations.
- [x] Verify `content/manifest.json` `grammar` count ≥21 and the `grammar` section lists `grammar-patterns.json` (updated by 22.1; no edit here).
- [x] Error responses follow `backend-error-messages.instructions.md` (`{ error, code }`; `VALIDATION_ERROR` 400 / `NOT_FOUND` 404 / `INTERNAL_ERROR` 500; `"Failed to load grammar pattern(s)"` messages).
- [x] Backend tests per `testing-standards.instructions.md` (repository filters + pagination, service validation, controller route registration, detail-by-`content_id`).

## Business Rules

1. **Modulith pattern** — `modules/grammar/` mirrors the existing structure: `container.ts` (DI), `api/` (controller + routes), `services/` (business logic + validation + errors), `repositories/` (Prisma queries), `types/` (request/response types), re-exported via `index.ts`.
2. **Prisma-first** — all queries run against the seeded `GrammarPattern`/`GrammarExample`/`GrammarPatternRelation` tables; no JSON file reads (all-in-DB).
3. **Caching optional** — a module-level cache is permitted for the list endpoint (pattern: `radicalsService`); the detail endpoint should reflect current data (no cache or short TTL).
4. **Idempotent GET** — both endpoints are read-only; no POST/PUT/DELETE in this story (mutations belong to seed, Story 22.1).
5. **Error code convention** — `VALIDATION_ERROR` (invalid filters), `NOT_FOUND` (unknown `gr_XXXX`), `INTERNAL_ERROR` (unexpected); no custom codes.
6. **Validation rules** — `phase` ∈ {2, 3, 4}; `hskLevel` ∈ 1–6; `page` ≥ 1; `pageSize` ∈ 1–100 (bounds mirror shared-constants `PAGINATION`); invalid values → 400.
7. **Route constants verbatim** — `grammarPatterns` and `grammarPatternById` are added to `ROUTE_PATTERNS` exactly as specified in the epic IMP before any frontend call (22.3 depends on them).
8. **Detail resolution** — `:id` looks up by the unique `content_id` (`gr_XXXX`); never expose or resolve by the internal uuid.

## Related Issues

- Epic 22: Grammar Pattern Library — BR (`../README.md`) (epic parent)
- **Story 22.1: Grammar Data** ([BR](story-22-1-grammar-data.md)) (dependency — models + seeded content)
- **Story 22.3: Grammar UI** ([BR](story-22-3-grammar-ui.md)) (consumer — frontend service calls these endpoints)

## Implementation Status

- **Status**: Complete
- **PR**: N/A (direct commit — no PR)
- **Merge Date**: N/A
- **Key Commit**: TBD
