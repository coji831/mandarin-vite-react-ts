---
purpose: Canonical reference for the 32-step hash-gated delta seed pipeline (all-in-DB content)
status: active
last-verified: 2026-08-08
type: data-doc
---

# Seed Pipeline (All-in-DB)

**Category:** Data & Content  
**Last Updated:** August 8, 2026

> Canonical reference for how static learning content gets into PostgreSQL and
> how it is regenerated. Applies to the **all-in-DB** architecture: production
> reads content exclusively from Prisma tables — never from JSON files at
> request time.

---

## 1. Source of Truth

```
┌──────────────────────────────┐   ┌──────────────────┐   ┌───────────────────┐   ┌──────────────────┐
│ content/seed/phase2/*.json   │──►│ prisma/seed.ts    │──►│ Prisma Models     │──►│ Repositories     │
│ (aggregate JSON, committed)  │   │ (32-step,         │   │ (PostgreSQL)      │   │ (Prisma queries) │
│  = authoring source          │   │ hash-gated delta) │   │  = runtime source │   │  → services/API  │
└──────────────────────────────┘   └──────────────────┘   └───────────────────┘   └──────────────────┘
```

**Principle (all-in-DB):** `content/` (including `content/seed/phase2/`) is an
**authoring source only**. At runtime the backend reads **only** through
Prisma repositories. There is no runtime `.json` file read of characters,
words, radicals, tones, pinyin, or references — GCS is used for **binary TTS
audio only** (see `src/shared/infrastructure/external/GCSClient.ts`).

The legacy runtime readers (`readContentDir`, `readContentFile`,
`readContentFiles`, `readAggregateContent`, `readAggregateContentWhere`,
`findInAggregateContent`, `readStaticReference`) were **removed** from
`src/shared/utils/contentUtils.ts`. Only the pure helpers remain:
`stripToneMarks`, `shuffleArray`, and the `ContentFile` type.

---

## 2. Seed Order (32 Steps) + FK Dependencies

`apps/backend/prisma/seed.ts` runs in strict dependency order. Steps 2–6
(**marked 🆕**) are the reference tables added by the WS1 all-in-DB migration
(`20260731045648_add_reference_tables`).

| #     | Table                     | Records (approx.) | FK deps                                | Sync / Idempotency                   |
| ----- | ------------------------- | ----------------- | -------------------------------------- | ------------------------------------ |
| 1     | `Character`               | 103,006           | none                                   | hash-gate diff (bulk >5K)            |
| 2 🆕  | `Radical`                 | 20                | none                                   | hash-gate diff                       |
| 3 🆕  | `Tone`                    | 5                 | none                                   | hash-gate diff                       |
| 4 🆕  | `PinyinPhoneme`           | 50                | none                                   | hash-gate diff                       |
| 5 🆕  | `TonePair`                | 6                 | none                                   | hash-gate diff                       |
| 6 🆕  | `ToneRule`                | 3                 | none                                   | hash-gate diff                       |
| 7     | `PinyinSyllable`          | 2,045             | none                                   | hash-gate diff                       |
| 8     | `MeasureWord`             | 52                | none                                   | hash-gate diff                       |
| 9     | `Component`               | 1,777             | none                                   | hash-gate diff                       |
| 10    | `Passage`                 | 6                 | none                                   | hash-gate diff                       |
| 11    | `Word`                    | 10,943            | none                                   | hash-gate diff (bulk >5K)            |
| 12    | `StrokeCategory`          | 5                 | none                                   | hash-gate diff                       |
| 13    | `StrokeExtendedType`      | 8                 | → `StrokeCategory`                     | hash-gate diff                       |
| 14    | `StrokeOrderRule`         | 5                 | none                                   | hash-gate diff                       |
| 15    | `StrokeCategoryOrderRule` | 9                 | → `StrokeCategory` + `StrokeOrderRule` | hash-gate diff (composite)           |
| 16    | `CharacterReading`        | 15,582            | → `Character`                          | SeedCheckpoint rebuild               |
| 17    | `CharacterRadical`        | 2,798             | → `Character` + `Radical`              | hash-gate diff (composite)           |
| 18    | `CharacterHskLevel`       | 2,971             | → `Character`                          | SeedCheckpoint rebuild               |
| 19    | `WordHskLevel`            | 10,943            | → `Word`                               | SeedCheckpoint rebuild               |
| 20    | `WordCharacter`           | 21,715            | → `Word` + `Character`                 | SeedCheckpoint rebuild               |
| 21    | `PinyinCharacterMapping`  | 11,798            | → `PinyinSyllable` + `Character`       | SeedCheckpoint rebuild               |
| 22    | `MeasureWordWord`         | 135               | → `MeasureWord` + `Word`               | hash-gate diff (composite)           |
| 23    | `CharacterComponent`      | 15,742            | → `Character` + `Component`            | SeedCheckpoint rebuild               |
| 24    | `PhoneticCluster`         | 12                | → `Component`                          | hash-gate diff                       |
| 25    | `PhoneticClusterMember`   | 254               | → `PhoneticCluster` + `Character`      | SeedCheckpoint rebuild               |
| 26    | Test users                | 2                 | none                                   | dev only (upsert)                    |
| 27 🆕 | `GrammarPattern`          | 21                | none                                   | hash-gate diff (+ `content_version`) |
| 28 🆕 | `GrammarExample`          | 63                | → `GrammarPattern.content_id`          | hash-gate diff (+ `content_version`) |
| 29 🆕 | `GrammarPatternRelation`  | 12                | → `GrammarPattern.content_id` (both)   | hash-gate diff (+ `content_version`) |
| 30 🆕 | `Chengyu`                 | 55                | none                                   | hash-gate diff (+ `content_version`) |
| 31 🆕 | `ChengyuExample`          | 55                | → `Chengyu.content_id`                 | hash-gate diff (+ `content_version`) |
| 32 🆕 | `ChengyuRelation`         | 18                | → `Chengyu.content_id` (both)          | hash-gate diff (+ `content_version`) |

> **New reference tables (steps 2–6)** back the refactored read sites:
>
> - `Radical` → radicals module, `CharactersService.resolveRadical`,
>   `ReviewService` (radical items), `ImeSimulatorStrategy` / `RadicalGateStrategy`
>   (via `CharacterRadical` for HSK-character derivation).
> - `Tone` → `ReviewService` (tone items), `FoundationsService.getPinyinTonesPool`.
> - `PinyinPhoneme` (+ `TonePair`, `ToneRule`) → `FoundationsService.getPinyinTonesPool`.

> **Grammar steps (27–29, Story 22.1):** `grammar-patterns.json` is a single
> object `{ patterns, relations }` whose patterns **nest their own examples**.
> `syncGrammar` flattens it and syncs Patterns → Examples → Relations inside
> ONE interactive transaction (all-or-nothing, FK-safe). Real edits propagate
> and bump `content_version`; unchanged rows write 0. Post-seed verification
> asserts `patterns ≥ 21`, `examples ≥ 63`, `relations ≥ 0` and **0 FK-orphan
> examples**.

> **Chengyu steps (30–32, Story 23.1):** `chengyu.json` is a single object
> `{ idioms, relations }` whose idioms **nest their own examples**.
> `syncChengyu` flattens it and syncs Idioms → Examples → Relations inside
> ONE interactive transaction (all-or-nothing, FK-safe), mirroring
> `syncGrammar`. Real edits propagate and bump `content_version`; unchanged
> rows write 0. Post-seed verification asserts `idioms ≥ 50`, `examples ≥ 50`,
> `relations ≥ 0` and **0 FK-orphan examples**. Current authored counts:
> **55 / 55 / 18**.

> **Hash-gate (Story 22.1):** since this change the whole pipeline is a
> deterministic content diff — see §3. Steady-state re-runs make **0 writes**
> to every content table (~8s total).

> **Post-seed FK validation (post-seed verification, after step 32):** Step 17
> (`CharacterRadical`) is the only step whose foreign key was created `NOT VALID`
> (migration `20260731045648_add_reference_tables`) — `Radical` is empty at
> migration time, so a validated FK would fail on the 2,798 pre-existing rows.
> Once the seed has populated `Radical` + `CharacterRadical`, `prisma/seed.ts`
> runs `ALTER TABLE "CharacterRadical" VALIDATE CONSTRAINT
"CharacterRadical_radicalId_fkey"` as a post-seed step, guarded by the
> `pg_constraint.convalidated` flag so re-running the seed is safe (PostgreSQL
> errors on VALIDATE of an already-valid constraint). Future inserts are always
> enforced; VALIDATE back-fills enforcement on the pre-existing rows.

---

## 3. Idempotency Rules (Hash-Gated Delta Sync)

`prisma/seed.ts` is safe to re-run (`npx prisma db seed`). Since the hash-gate
(Story 22.1, August 2026) it no longer blind-inserts with
`createMany({ skipDuplicates })`. Instead every run is a **hash-gated delta
sync** — it computes a per-row SHA-256 `content_hash` over the DB-bound payload
and writes only what actually changed. Tables fall into three buckets:

1. **Bucket A — hash-gated diff (`syncTable`).** Every content table carries a
   `content_hash CHAR(64)` column (24 tables: `Character`, `Word`, the small
   reference tables, composites, grammar, and chengyu). Each run:
   - reads only the stored `content_hash` (narrow 2-column scan),
   - computes `computeContentHash` over the key-sorted canonical payload,
   - **unchanged** (hash equal) → 0 writes · **new** → insert · **changed**
     (non-NULL hash differs) → update · **NULL hash** (post-migration first
     run / backfill) → reconcile write + stamp hash with **no**
     `content_version` bump,
   - `Character` / `Word` (write-sets >5,000) route through a chunked raw
     `INSERT … ON CONFLICT (key) DO UPDATE … WHERE "T"."content_hash" IS
DISTINCT FROM EXCLUDED."content_hash"` bulk path (2,000/statement,
     autocommit per chunk — never one long transaction, Neon-pooled safe).
2. **Bucket B — SeedCheckpoint-gated rebuild (`syncDerived`).** Derived
   projection tables (`CharacterReading`, `CharacterHskLevel`, `WordHskLevel`,
   `WordCharacter`, `PinyinCharacterMapping`, `CharacterComponent`,
   `PhoneticClusterMember`) carry **no** per-row hash. A `SeedCheckpoint` row
   stores the canonical payload hash + row count; when both match the table is
   skipped (0 writes). On any change the table is deleted + rebuilt, then the
   checkpoint is updated **only after success** (a mid-way crash leaves no
   checkpoint, so the next run re-rebuilds).
3. **Bucket C — test users.** Dev-only `upsert` on email (unchanged).
4. **Grammar (steps 27–29) and Chengyu (steps 30–32)** each run in ONE
   interactive transaction (`syncGrammar` / `syncChengyu`) — Patterns/Idioms →
   Examples → Relations all-or-nothing, FK-safe. Real edits propagate **and
   bump `content_version`** (grammar + chengyu models carry the column);
   unchanged rows write 0.
5. **`Character.phoneticComponentId`** is excluded from the content hash (it is
   the deferred 2-pass FK) and linked separately on an (id → value) diff that
   never touches `content_hash`.
6. **Prune is log-only by default.** Rows in the DB but absent from JSON are
   reported (`⚠️ in DB but not in JSON (kept)`), never deleted. Prune is opt-in
   (`prune: true`) and requires an explicit `confirm: true` gate — `dryRun:
true` only previews (rows kept) and never deletes — and **`Character` /
   `Word` never auto-prune** (non-cascading FK risk). The >5% abort threshold
   is not yet wired, and `seed.ts` exposes no prune CLI flag — prune is
   currently log-only in practice.
7. **Post-seed FK VALIDATE is guarded.** The `CharacterRadical_radicalId_fkey`
   constraint is validated only when `pg_constraint.convalidated` is `false`, so
   re-running the seed is safe.

---

## 4. Regeneration Flow

Content is regenerated bottom-up: **raw extracts → enrichments → phase2 seeds**.

```
scripts/generate/*   (raw extracts from source data)
  hsk-words.ts            → data/HSK-3.0-Word-List.csv → content/seed/phase1/hsk-words.json
  cc-cedict-entries.ts    → data/CC-CEDICT → content/seed/phase1/cc-cedict-entries.json
  mmah-entries.ts         → data/make-me-a-hanzi → content/seed/phase1/mmah-entries.json
  unihan-strokes.ts       → data/unihan-cache → content/seed/phase1/unihan-strokes.json
  pinyin-syllables.ts     → content/seed/phase1/pinyin-syllables.json
  static-seed-data.ts     → static passthroughs
        │
        ▼
scripts/enrich/*     (JSON→JSON transforms — pure, no DB, idempotent)
  build-character-entries.ts      → phase2/characters.json
  build-character-readings.ts     → phase2/character-readings.json
  build-pinyin-mappings.ts        → phase2/pinyin-character-mappings.json (plain)
  build-word-entries.ts           → phase2/words.json, word-hsk-levels.json
  build-word-character-junction.ts→ phase2/word-characters.json, character-hsk-levels.json
  build-pinyin-representatives.ts 🆕→ stamps representativeRank (0=rep, 1..n order) on
                                     phase2/pinyin-character-mappings.json — curated authoring
                                     input from content/seed/curated/pinyin-representatives.json
                                     + deterministic tiebreak (hsk asc → freq asc → primary → charId)
  build-character-radicals.ts     → phase2/character-radicals.json
  build-measure-word-words.ts     → phase2/measure-word-words.json
  build-component-entries.ts      → phase2/component-entries.json
  build-character-components.ts   → phase2/character-components.json
  build-stroke-entries.ts         → phase2/strokes-*.json
  build-phonetic-clusters.ts      → phase2/phonetic-clusters.json, phonetic-cluster-members.json
  build-reference-tables.ts  🆕  → phase2/radicals.json, tones.json,
                                   pinyin-phonemes.json, tone-pairs.json, tone-rules.json
  extract-chengyu-candidates.ts 🆕→ phase2/chengyu.json — chengyu enrich stage (JSON→JSON):
                                     reads phase1/cc-cedict-entries.json read-only, scaffolds the
                                     chengyu authoring draft (chengyu-draft.json → chengyu.json on
                                     completion) — enrich-phase only, no new pipeline stage
  pass-through.ts                 → pinyin-syllables.json, demo-passages.json
        │
        ▼
content/seed/phase2/*.json  (committed seed sources)
        │
        ▼
prisma/seed.ts  (32-step hash-gated delta — see §2)
```

**`build-reference-tables.ts` (WS1):** converts the legacy authoring files
(`content/radicals/radicals.json`, `content/tones/tones.json`,
`content/pinyin/pinyin.json`, `content/references/tone-reference.json`) into
the five phase2 reference files. After this conversion **nothing under those
legacy paths is read at runtime**.

> **Legacy siblings (not part of the JSON→JSON phase2 pipeline):**
> `scripts/generate/generate-character-enrichment.ts` and
> `scripts/generate/generate-word-content.ts` emit the older authoring
> aggregates `content/characters/characters.json` / `content/words/words.json`
> — retained as regeneration fallbacks, never consumed by `prisma/seed.ts`.
> The older **direct-DB** enrich path (`npm run db:enrich`: `import-cc-cedict.ts`,
> `populate-character-enrichment.ts`, `populate-character-readings.ts`, plus
> `import-make-me-a-hanzi.ts`, `seed-character-classification.ts`) mutates the
> database in place instead of emitting phase2 JSON — superseded by the
> transform scripts above. **`import-cc-cedict.ts` no longer writes
> `PinyinCharacterMapping`** (removed — `prisma/seed.ts` step 21 is the single
> deterministic writer of that table, populated via
> `build-pinyin-representatives.ts`).

Run an enrich script individually (e.g.):

```bash
cd apps/backend
npx tsx scripts/enrich/build-reference-tables.ts   # reference tables only
npx tsx scripts/enrich/build-character-radicals.ts # character-radicals only
```

---

## 5. Runbook

All commands run from `apps/backend/`. `DATABASE_URL` must be set — locally it
lives in `apps/backend/.env` (copied from the root `.env.local`); Prisma's
`prisma.config.ts` loads the root `.env.local` for `prisma` CLI commands.

| Command                                | Script                      | Purpose                                                                                        |
| -------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------- |
| `npx prisma migrate dev --name <desc>` | `npm run db:migrate`        | Apply schema changes + create a migration (dev). **Always use this, never `db push`.**         |
| `npx prisma migrate deploy`            | `npm run db:migrate:deploy` | Apply pending migrations in order (CI/production).                                             |
| `npx prisma db seed`                   | `npm run db:seed`           | Run the 32-step seed (uses `"seed"` config in `package.json` → `tsx prisma/seed.ts`).          |
| `npx prisma migrate reset`             | `npm run db:reset`          | Drop + recreate DB, re-apply migrations, re-run seed (⚠️ destructive — dev/test only).         |
| `npx prisma generate`                  | —                           | Regenerate the Prisma client after a schema change (required before type-checking new models). |

Typical full refresh of a fresh database:

```bash
cd apps/backend
npx prisma generate
npx prisma migrate dev --name <desc>   # or migrate deploy on CI
npx prisma db seed
```

> **Type-check gate for the Prisma seed code:** `prisma/seed.ts` and
> `prisma/sync-helpers.ts` sit outside the `src/**` graph that the root
> `npm run typecheck` covers — run `npm run typecheck:prisma` to type-check
> them (parallel to the pre-existing `typecheck:scripts` for the enrich/verify
> scripts). Wiring `typecheck:prisma` into an aggregate/CI gate is a documented
> follow-up.

---

## 6. Verification

After seeding (or on demand), verify the DB matches the expected Phase 2 counts:

```bash
cd apps/backend
npm run db:verify                # verify-data-lifecycle.ts — data lifecycle sanity
npm run db:verify:deep           # verify-data-lifecycle.ts --deep — deep integrity checks
npm run db:verify:pipeline       # verify-pipeline.ts — checksum + pipeline integrity
npx tsx scripts/verify/verify-seed-counts.ts   # exact per-table counts (see below)
npx tsx scripts/verify/health-check.ts         # env, migrations, schema, counts, content
```

`verify-seed-counts.ts` expects (matching `content/seed/phase2/`):

| Table                    | Count   |
| ------------------------ | ------- |
| `Character`              | 103,006 |
| `Radical` 🆕             | 20      |
| `Tone` 🆕                | 5       |
| `PinyinPhoneme` 🆕       | 50      |
| `TonePair` 🆕            | 6       |
| `ToneRule` 🆕            | 3       |
| `PinyinSyllable`         | 2,045   |
| `MeasureWord`            | 52      |
| `Component`              | 1,777   |
| `Passage`                | 6       |
| `Word`                   | 10,943  |
| `CharacterReading`       | 15,582  |
| `CharacterRadical`       | 2,798   |
| `CharacterHskLevel`      | 2,971   |
| `WordHskLevel`           | 10,943  |
| `WordCharacter`          | 21,715  |
| `PinyinCharacterMapping` | 11,798  |
| `MeasureWordWord`        | 135     |
| `CharacterComponent`     | 15,742  |
| `User`                   | 2       |

**Grammar (Story 22.1):** the post-seed verification in `seed.ts` asserts
`GrammarPattern ≥ 21`, `GrammarExample ≥ 63`, `GrammarPatternRelation ≥ 0`, and
**0 FK-orphan examples** (an example whose `patternContentId` has no matching
`GrammarPattern`). Current authored counts: **21 / 63 / 12**.

**Chengyu (Story 23.1):** the post-seed verification in `seed.ts` asserts
`Chengyu ≥ 50`, `ChengyuExample ≥ 50`, `ChengyuRelation ≥ 0`, and **0
FK-orphan examples** (an example whose `chengyuContentId` has no matching
`Chengyu`). Current authored counts: **55 / 55 / 18**.

**Hash-gate spot-check:** after a full seed every Bucket-A row has a non-NULL
`content_hash` (e.g. `SELECT COUNT(*) FROM "Character" WHERE "content_hash" IS
NOT NULL` → 103,006), and a `SeedCheckpoint` row exists for every Bucket-B
table. A steady-state re-run writes 0 rows to every content table.

---

## 7. Integration Tests (DB-backed)

DB-backed service integration tests live in `apps/backend/tests/integration/`
and run via `npm run test:integration` (`vitest.integration.config.ts`). They
require a reachable, **seeded test database** — never point them at dev/prod
(see `tests/integration/helpers/db.ts`). When no DB is reachable they skip
gracefully. Coverage: `RadicalsService`, `FoundationsService.getPinyinTonesPool`,
`ReviewService` (tone/radical building), `ImeSimulatorStrategy` smoke, the
`chengyu-api` suite, plus the hash-gated delta-sync suites: `grammar-seed`,
`grammar-delta`, `chengyu-seed`, `chengyu-delta`, `word-delta`,
`derived-delta`, `character-bulk-delta` (backed by the `sync-helpers.test.ts`
unit tests for the diff/classify/bulk-SQL logic).

---

## 8. Related

- Prisma schema: `apps/backend/prisma/schema.prisma`
- Content inventory: `content/manifest.json` (authoring metadata only)
- Architecture overview: `docs/architecture.md` → _Content Data Flow_
- Migration safety: `.github/instructions/prisma-schema-changes.instructions.md`
