# Story 22.1: Grammar Data

**Last Update:** August 5, 2026 (Story 22.1 complete — grammar data authored + hash-gated seed delta-sync delivered)

## Description

**As a** developer,
**I want to** author the KB-sourced grammar pattern dataset and build its Prisma models, migration, and idempotent seed steps,
**So that** grammar content has a complete, architected data foundation — grounded in the platform's Mandarin fundamentals KB — that the backend API (22.2) and UI (22.3) can consume from the start.

## Business Value

This is the data-first story of the epic. It converts the platform's authoritative grammar inventory (21 KB-sourced patterns across Phases 2/3/4) into a first-class, all-in-DB content entity. By following the pre-adaptation field pattern (internal `id` + unique `content_id` `gr_XXXX` + `content_version` + `metadata Json?`), the story future-proofs grammar for progress tracking and content edits without ever orphaning learner references. An idempotent seed means content edits are a one-line re-run, not a migration chore. Everything downstream — the API in 22.2 and the learner UI in 22.3 — depends on this foundation, so getting the schema, business keys, and seed discipline right here is the highest-leverage work in the epic.

## Acceptance Criteria

- [x] ≥21 grammar patterns authored in `content/seed/phase2/grammar-patterns.json`, matching the KB-sourced family in the epic BR Background table (Phases 2/3/4 per `adult-mandarin-learning-roadmap.md`, HSK tags).
- [x] Each pattern has ≥3 example sentences with Chinese, pinyin, and English; each example carries a `segments` array of clickable tokens (`text`, `pinyin`, `gloss`, `entityType`, `entityId`) where `entityId` references the target entity's `content_id` (e.g., `ch_XXXX` / `w_XXXXX`).
- [x] Prisma models `GrammarPattern`, `GrammarExample`, `GrammarPatternRelation` added via migration (`npm run db:migrate`, never `db push`) per `prisma-schema-changes.instructions.md`.
- [x] Pre-adaptation fields present on all three models: internal `id` (uuid) + unique `content_id` (`gr_XXXX`) + `content_version Int @default(1)` + `metadata Json?`; example/junction rows reference `content_id`, not internal auto IDs.
- [x] Seed steps added in dependency order (GrammarPattern → GrammarExample → GrammarPatternRelation) and idempotent via the **hash-gated delta sync** (`syncGrammar` — unchanged rows write 0, edits propagate and bump `content_version`); post-seed verification passes (SQL counts ≥ 21 / ≥ 63 / ≥ 0 and zero orphan examples).
- [x] `content/manifest.json` updated in full by 22.1: declare the `grammar` block (`files: ["grammar-patterns.json"]`, `served_via: "db"`) and bump `entity_counts.grammar` to ≥21 after the seed populates (Story 22.2 only verifies the count/files — no edit there).

## Business Rules

1. **Business-key stability** — every pattern and example carries a stable `gr_XXXX` business key (`gr_0001`, `gr_0001_ex1`, …) that never changes across content edits; UI/API references the `content_id`, never the internal uuid.
2. **Pre-adaptation field pattern** — all three models use internal uuid `id` + unique `content_id` + `content_version Int @default(1)` + `metadata Json?` per `pre-adaptation-static-dynamic-separation.md` Rule 1 (not the Radical business-key-as-PK pattern — see IMP reconciliation note).
3. **FK by `content_id`** — `GrammarExample.patternContentId` and `GrammarPatternRelation.{from,to}PatternContentId` reference `GrammarPattern.content_id` (unique), with `onDelete: Cascade` for examples and relation rows.
4. **Cascade delete examples** — deleting a pattern removes its examples (and relation rows) via FK cascade; no orphan rows survive.
5. **Relation junction uniqueness** — `GrammarPatternRelation` is `@@unique([fromPatternContentId, toPatternContentId])`; duplicate directed pairs are rejected.
6. **KB grounding (authoring authority)** — pattern families, structure strings, and explanations must stay within §7 "Grammar Essentials" of `docs/knowledge-base/mandarin/mandarin-fundamentals.md` and the roadmap's phase placement (`adult-mandarin-learning-roadmap.md`); no pattern families outside the epic BR Background table.
7. **Phase domain** — `phase` ∈ {2, 3, 4} only (no grammar in Phase 1); `hskLevel` ∈ 1–6 or null.
8. **Migration discipline** — schema changes via `npm run db:migrate` only; never `prisma db push`; never hand-edit generated migration files.

## Related Issues

- Epic 22: Grammar Pattern Library — BR (`../README.md`) (epic parent)
- **Story 22.2: Grammar Backend API** ([BR](story-22-2-grammar-backend-api.md)) (dependent — consumes the seeded models/content via the API)
- **Story 22.3: Grammar UI** ([BR](story-22-3-grammar-ui.md)) (dependent — ultimately consumes this data via the API)

## Implementation Status

- **Status**: Complete
- **PR**: TBD (pending)
- **Merge Date**: N/A
- **Key Commit**: `ddf9236f`
