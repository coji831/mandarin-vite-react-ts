# Story 23.1: Chengyu Data

**Last Update:** August 7, 2026

## Description

**As a** developer,
**I want to** author the **CC-CEDICT-extracted, curated, and enriched** chengyu dataset (CC-CEDICT idiom/pinyin/meanings + Chinese Wiktionary/Wikisource origin stories + authored era/theme/examples) and its Prisma models, migration, validation script, and idempotent seed steps,
**So that** idiom content has a complete, architected data foundation — family-seeded by the platform's Mandarin fundamentals KB — that the backend API (23.2) and UI (23.3) can consume from the start.

## Business Value

This is the data-first story of the epic. It converts the platform's curated idiom inventory (50+ idioms seeded from KB §6.2, extracted from CC-CEDICT, and enriched with sourced origin stories) into a first-class, all-in-DB content entity. Because the dataset combines CC BY-SA 4.0 sources (CC-CEDICT idiom strings/pinyin/literal+figurative meanings; Chinese Wiktionary 詞源 + zh Wikisource origin-story grounding), this story also owns the attribution obligation (`content/seed/ATTRIBUTION.md`) so the derived content ships license-compliant. By following the pre-adaptation field pattern (Business Rule 2, per `../../knowledge-base/backend/pre-adaptation-static-dynamic-separation.md`), the story future-proofs chengyu for progress tracking and content edits without ever orphaning learner references. A hash-gated idempotent seed means content edits are a one-line re-run, not a migration chore. Everything downstream — the API in 23.2 and the learner UI in 23.3 — depends on this foundation, so getting the schema, business keys, and seed discipline right here is the highest-leverage work in the epic.

## Acceptance Criteria

- [x] Prisma models `Chengyu`, `ChengyuExample`, `ChengyuRelation` added via migration (follow `prisma-schema-changes.instructions.md`; use `npm run db:migrate`, never `db push`).
- [x] ≥50 idioms authored in `content/seed/phase2/chengyu.json` (in the canonical `content/seed/phase2/` seed directory), matching the curated shortlist in the epic BR Background table (KB §6.2 family seed + common chengyu, extracted from CC-CEDICT and enriched); each idiom has a 4-character `chengyu`, pinyin, `literalMeaning`, `figurativeMeaning`, narrative `story`, `storySource`, `era`, `theme`, and ≥1 modern-usage example (Chinese, pinyin, English, `segments`) — example cardinality is ≥1/idiom (vs grammar's ≥3) because the idiom itself is the primary learning object, while the pipeline mirrors Epic 22's architecture exactly.
- [x] Business keys follow the `cy_XXXX` convention (e.g., `cy_0005`) per `pre-adaptation-static-dynamic-separation.md` Rule 1; `Chengyu`/`ChengyuExample` follow the pre-adaptation field pattern (Business Rule 2); example/junction rows reference `content_id`, not internal auto IDs.
- [x] Modern-usage example `segments` tokens carry pre-segmented clickable tokens (`text`, `pinyin`, `gloss`, `entityType`, `entityId`) where `entityId` references the target entity's `content_id` (`ch_XXXXX` / `w_XXXXX`); the idiom's 4 characters resolve to `ch_XXXXX` for Character Hub cross-linking.
- [x] `scripts/validate-chengyu-content.ts` created (mirrors `scripts/validate-grammar-content.ts`): count ≥50, `cy_XXXX` regex, required fields, era/theme present, `segments` schema, dead-entity cross-check; registered as `npm run validate:chengyu-content`; passes before seed.
- [x] Seed steps added in dependency order (Chengyu → ChengyuExample → ChengyuRelation) + re-seed + post-seed SQL verification (counts match targets); idempotent per `../../guides/data/seed-pipeline.md` (hash-gated delta sync).
- [x] `content/manifest.json` declares the `chengyu` block (`files: ["chengyu.json"]`, `served_via: "db"`) **and** bumps `entity_counts.chengyu` from 0 to ≥50 after the seed populates.

## Business Rules

1. **Business-key stability** — every idiom, example, and relation row carries a stable `cy_XXXX` business key (`cy_0005`, `cy_0005_ex1`, …) that never changes across content edits; UI/API references the `content_id`, never the internal uuid.
2. **Pre-adaptation field pattern** — all three models use internal uuid `id` + unique `content_id` + `content_version Int @default(1)` + `metadata Json?` per `../../knowledge-base/backend/pre-adaptation-static-dynamic-separation.md` Rule 1 (not the Radical business-key-as-PK pattern — see IMP reconciliation note).
3. **FK by `content_id`** — `ChengyuExample.chengyuContentId` and `ChengyuRelation.{from,to}ChengyuContentId` reference `Chengyu.content_id` (unique), with `onDelete: Cascade` for examples and relation rows.
4. **Cascade delete examples** — deleting an idiom removes its examples (and relation rows) via FK cascade; no orphan rows survive.
5. **Relation junction uniqueness** — `ChengyuRelation` is `@@unique([fromChengyuContentId, toChengyuContentId])`; duplicate directed pairs are rejected.
6. **Data sourcing (authority & provenance)** — family selection is **seeded from KB §6.2** (§6 "Chengyu (Idioms)" of `../../knowledge-base/mandarin/mandarin-fundamentals.md`) plus common-chengyu lists, with the Phase 4 placement per `../../knowledge-base/learning-theory/adult-mandarin-learning-roadmap.md`; the idiom string, pinyin, and literal/figurative English meanings are **extracted from CC-CEDICT** (`content/seed/phase1/cc-cedict-entries.json`, CC BY-SA 4.0); each narrative `story` is authored from the idiom's Chinese Wiktionary 詞源 classical quote **verified against zh Wikisource**; `storySource` cites the classical work (known-work keys per the era table in the story-23.1 IMP); no non-chengyu forms (惯用语 / 歇后语 / 谚语, KB §6.3).
7. **`story` + `storySource` mandatory** — every idiom carries a narrative origin `story` consistent with its classical Chinese source text, authored from the idiom's Chinese Wiktionary 詞源 quote verified against zh Wikisource; `storySource` uses the canonical `《<work>·<juan>·<chapter>》(zh.wikisource.org/wiki/<path>)` form (e.g., `《史记·卷七·项羽本纪》(zh.wikisource.org/wiki/史記/卷007)`); no unverifiable origin stories.
8. **`segments` token schema** — example tokens follow the normative `segments` token schema defined in the story-23.1 IMP (`../../issue-implementation/epic-23-idiom-database/story-23-1-chengyu-data.md`); **no runtime segmenter** (pre-segmented at authoring time).
9. **No progress tables** — no `ChengyuProgress` model in this epic; `metadata`/`content_version` are the deliberate seam for future progress work.
10. **Migration discipline** — schema changes via `npm run db:migrate` only; never `prisma db push`; never hand-edit generated migration files.
11. **Attribution (CC BY-SA)** — the dataset combines CC BY-SA 4.0 sources: CC-CEDICT (idiom strings, pinyin, literal/figurative English; source `data/CC-CEDICT/cedict_1_0_ts_utf-8_mdbg.txt`, mdbg.net) and Wikimedia (Chinese Wiktionary 詞源 quotes + zh Wikisource text used to ground `story`/`storySource`). Attribution lives in `content/seed/ATTRIBUTION.md`; authored `story`/`example` prose (and the `era`/`theme` taxonomy) is original work of this project — not a verbatim copy — so the derived `chengyu.json` stays CC BY-SA 4.0 (share-alike inherited from the sources) while our narrative text is not copyleft. No text from restricted sources (ctext.org, zdic/漢典, pwxcoo) is shipped verbatim.

## Related Issues

- Epic 23: Chengyu (Idiom) Narratives — BR (`README.md`) (epic parent)
- **Story 23.2: Chengyu Backend API** ([BR](story-23-2-chengyu-backend-api.md)) (dependent — consumes the seeded models/content via the API)
- **Story 23.3: Chengyu UI** ([BR](story-23-3-chengyu-ui.md)) (dependent — ultimately consumes this data via the API)
- **Implementation (IMP twin):** `story-23-1-chengyu-data.md` → `../../issue-implementation/epic-23-idiom-database/story-23-1-chengyu-data.md`

## Implementation Status

- **Status**: Complete
- **PR**: TBD (pending)
- **Merge Date**: N/A
- **Key Commit**: 5770c1ea

## Risks

- **Cultural/historical accuracy of the idiom origin stories (Severity: High)** + **a ≥50-idiom set feeling thin for a Phase 4 learner** (the authored set lands at exactly 55) — full write-up in the story-23.1 IMP Technical Challenges & Solutions: `../../issue-implementation/epic-23-idiom-database/story-23-1-chengyu-data.md`
