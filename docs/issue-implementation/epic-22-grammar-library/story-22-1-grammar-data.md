# Implementation 22-1: Grammar Data

> **BR Reference:** `docs/business-requirements/epic-22-grammar-library/story-22-1-grammar-data.md`
> **Status:** ✅ Complete
> **Last Update:** August 5, 2026

## Technical Scope

Author the KB-sourced grammar dataset, add the three Prisma models with pre-adaptation fields and `gr_XXXX` business keys, generate the migration, wire grammar into the **hash-gated delta sync** (`syncGrammar` in `apps/backend/prisma/sync-helpers.ts`), add authoring-time content validation, and own the full `content/manifest.json` edit (declare the `grammar` block + bump `entity_counts.grammar` after the seed populates). This story does **not** touch the backend module, routes, or any frontend code (those are 22.2 / 22.3).

**Files:**

- `content/seed/phase2/grammar-patterns.json` — **NEW**: authoring source (21 KB-sourced patterns, ≥3 examples each, `segments`, phase/HSK tags).
- `apps/backend/prisma/schema.prisma` — **UPDATE**: add `GrammarPattern`, `GrammarExample`, `GrammarPatternRelation` (pre-adaptation fields) + `content_hash`/`content_version` on the grammar models (see "Complete Prisma Model Definitions" in the epic IMP).
- `apps/backend/prisma/migrations/20260804154553_add_grammar_models/` + 5 hash-gate migrations — **NEW** (generated via `npx prisma migrate dev`; additive only — `content_hash CHAR(64)` on 21 tables + `SeedCheckpoint`).
- `apps/backend/prisma/sync-helpers.ts` — **NEW**: `syncGrammar` (Patterns → Examples → Relations in ONE interactive transaction) + the generic hash-gated `syncTable`/`syncDerived` delta-sync shared with the rest of the seed pipeline.
- `apps/backend/prisma/seed.ts` — **UPDATE**: steps 27–29 route through `syncGrammar` (hash-gated, all-or-nothing) + post-seed SQL verification.
- `content/manifest.json` — **UPDATE**: declare `grammar.files: ["grammar-patterns.json"]` + `served_via: "db"` **and** bump `entity_counts.grammar` to ≥21 after the seed populates (full manifest edit owned by 22.1; 22.2 only verifies). `served_via: "db"` is non-normative (was only stamped on the WS1 reference tables).
- `scripts/validate-grammar-content.ts` — **NEW**: authoring-time validation (mirrors `scripts/validate-radical-content.ts`).
- `apps/backend/scripts/__tests__/validate-grammar-content.test.ts` — **NEW**: unit tests for the pure validators in `scripts/validate-grammar-content.ts`.
- `apps/backend/tests/integration/grammar-seed.test.ts` — **NEW**: seed idempotency + schema-shape integration tests.
- `apps/backend/tests/integration/grammar-delta.test.ts` — **NEW**: hash-gated delta integration tests (the Story 22.1 edit-propagates regression, `content_version` bump, NULL-hash reconcile, log-only removal).
- `apps/backend/tests/integration/character-bulk-delta.test.ts` + `word-delta.test.ts` + `derived-delta.test.ts` — **NEW**: bulk/per-row/derived delta-sync integration tests (shared hash-gate machinery).
- `apps/backend/prisma/__tests__/sync-helpers.test.ts` — **NEW**: unit tests for the hash/diff/classify/bulk-SQL logic.

## Implementation Details

### The 21-pattern authoring checklist

Author `grammar-patterns.json` against the **epic BR Background table** (`../README.md`) — the authoritative inventory. The table below is the compact authoring checklist (phase, family, pattern); exact example sentences and pinyin are authored from the KB §7 examples during the story. HSK levels are **authoritative** — resolve all 21 patterns' levels against the official HSK 3.0 grammar-point standard, cross-referenced with the platform's `content/seed/phase1/hsk-words.json`; record the source per pattern in `metadata.hskSource`. The schema stays `hskLevel Int?` nullable per the `Word`/`Character` precedent, but 22.1 populates all 21 (the AC requires a non-null tag at authoring time).

| #   | content_id | Phase | Family (KB source)                          | Pattern                                        | HSK level |
| --- | ---------- | ----- | ------------------------------------------- | ---------------------------------------------- | --------- |
| 1   | `gr_0001`  | 2     | Word order & tense (§7)                     | SVO basic word order                           | 1         |
| 2   | `gr_0002`  | 2     | Word order & tense (§7)                     | No inflection — context/time words carry tense | 1         |
| 3   | `gr_0003`  | 2     | Word order & tense (§7)                     | Topic-comment                                  | 2         |
| 4   | `gr_0004`  | 2     | Word order & tense (§7)                     | Time placement                                 | 1         |
| 5   | `gr_0005`  | 2     | Questions (§7 + roadmap)                    | 吗 yes/no questions                            | 1         |
| 6   | `gr_0006`  | 2     | Questions (§7 + roadmap)                    | A-not-A (V不V)                                 | 1         |
| 7   | `gr_0007`  | 2     | Measure words (§7)                          | 个 general + noun-specific (本/张…)            | 1         |
| 8   | `gr_0008`  | 2     | Serial verb constructions (§7)              |                                                | 2         |
| 9   | `gr_0009`  | 2     | Pro-drop (§7)                               |                                                | 2         |
| 10  | `gr_0010`  | 3     | Aspect particles (§7 + roadmap)             | 了 perfective                                  | 1         |
| 11  | `gr_0011`  | 3     | Aspect particles (§7 + roadmap)             | 着 durative                                    | 3         |
| 12  | `gr_0012`  | 3     | Aspect particles (§7 + roadmap)             | 过 experiential                                | 2         |
| 13  | `gr_0013`  | 3     | Aspect particles (§7 + roadmap)             | 正在 progressive                               | 2         |
| 14  | `gr_0014`  | 3     | 的/地/得 (§7)                               | 的 possessive/modifier                         | 1         |
| 15  | `gr_0015`  | 3     | 的/地/得 (§7)                               | 地 adverb marker                               | 2         |
| 16  | `gr_0016`  | 3     | 的/地/得 (§7)                               | 得 resultative complement                      | 2         |
| 17  | `gr_0017`  | 3     | Conjunctions (roadmap Phase 3)              | 因为...所以 cause-consequence                  | 2         |
| 18  | `gr_0018`  | 4     | Disposal & passive (roadmap Phase 4)        | 把 (bǎ) disposal                               | 4         |
| 19  | `gr_0019`  | 4     | Disposal & passive (roadmap Phase 4)        | 被 (bèi) passive                               | 4         |
| 20  | `gr_0020`  | 4     | Supplementary HSK-tier (same advanced tier) | 比 (bǐ) comparison                             | 3         |
| 21  | `gr_0021`  | 4     | Supplementary HSK-tier (same advanced tier) | 是...的 emphasis                               | 4         |

> 19 patterns directly sourced from §7 / the roadmap + 2 supplementary HSK-tier advanced patterns (比, 是...的) = 21. Authoring agents may expand _within_ these families (e.g. per-HSK sub-splits) but must **not** introduce families outside §7 / the roadmap.

### Segment token schema

Each example stores pre-segmented clickable tokens:

```json
{
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
```

- `entityType` ∈ `"character" | "word" | "radical"`; `entityId` = the target entity's `content_id` (`ch_XXXX` / `w_XXXXX`), matching the `USED_IN_PATTERN` Word→GrammarPattern edge in `docs/knowledge-base/learning-theory/modeling-chinese-knowledge-graph.md`.
- Tokens with no linked entity → `"entityType": null, "entityId": null` (rendered as plain text).
- **No stored audio** — audio is generated on demand in 22.3 via `POST /v1/tts`; there are no audio fields in this schema.

### Prisma models + migration

Copy the three models from the epic IMP "Complete Prisma Model Definitions" into `apps/backend/prisma/schema.prisma` verbatim, then:

```bash
cd apps/backend
npx prisma generate
npx prisma migrate dev --name add_grammar_models
# verify the migration file exists under apps/backend/prisma/migrations/
```

Never `prisma db push` (per `prisma-schema-changes.instructions.md`).

### Seed steps (hash-gated delta sync, dependency order)

Steps 27–29 route through `syncGrammar` in `apps/backend/prisma/sync-helpers.ts`
— a **hash-gated delta sync** that replaces the old blind
`createMany({ skipDuplicates })` write path (which silently kept stale edits —
the Story 22.1 regression). It runs in strict dependency order inside ONE
interactive transaction (a crash can't leave examples pointing at a missing
pattern):

```typescript
// GrammarPattern            ← no FK deps; unique content_id "gr_0001"
await syncTable(tx, grammarPatternCfg, patterns, { ...opts, log });
// GrammarExample            ← FK → GrammarPattern.content_id ("gr_0001_ex1")
await syncTable(tx, grammarExampleCfg, examples, { ...opts, log });
// GrammarPatternRelation    ← FK → GrammarPattern.content_id (both ends)
await syncTable(tx, grammarRelationCfg, relations, { ...opts, log });
```

Idempotency: `syncGrammar` computes a per-row SHA-256 `content_hash` over the
DB-bound payload and writes only the delta. **Unchanged rows → 0 writes**;
edited rows propagate **and bump `content_version`**; NULL-hash rows
(post-migration first run) reconcile without a version bump. A re-run of
`npm run db:seed` is safe and idempotent, and re-seeding after a content edit
updates exactly the changed rows.

**Post-seed verification (SQL):**

```sql
SELECT COUNT(*) FROM "GrammarPattern";         -- expect >= 21
SELECT COUNT(*) FROM "GrammarExample";         -- expect >= 63 (21 × ≥3)
SELECT COUNT(*) FROM "GrammarPatternRelation"; -- expect >= 0 (curated set)

-- FK integrity — expect 0 orphans
SELECT COUNT(*) FROM "GrammarExample" e
LEFT JOIN "GrammarPattern" p ON e."patternContentId" = p."content_id"
WHERE p."content_id" IS NULL;
```

### Content validation script

`scripts/validate-grammar-content.ts` (mirrors `scripts/validate-radical-content.ts`) validates the authoring JSON before seeding:

- pattern count ≥ 21; each pattern has `name`, `structure`, `explanation`, `phase ∈ {2,3,4}`, `hskLevel ∈ 1–6 | null`, `content_id` matching `/^gr_\d{4}$/`;
- each pattern ≥ 3 examples; each example has non-empty `chinese` / `pinyin` / `english` and a `segments` array conforming to the token schema;
- every non-null `segments[].entityId` resolves to an existing `content_id` in the characters/words authoring sources (authoring-time cross-check).

### Pre-adaptation field pattern + reconciliation note (implementer — read first)

```prisma
id              String  @id @default(uuid()) // internal PK — never exposed
content_id      String  @unique              // stable business key: "gr_0001"
content_version Int     @default(1)
metadata        Json?
```

⚠️ **Reconciliation flag (22.1):** the current `Radical` model stores its business key directly as the PK (`id "rad_0001"`), and `Character` does the same (`id "ch_1001"`). The pre-adaptation target (`pre-adaptation-static-dynamic-separation.md` Rule 1) — and this spec — use a **uuid PK + unique `content_id`**. **Grammar follows the pre-adaptation spec (user-confirmed).** The backend engineer must (a) NOT mirror the Radical business-key-PK pattern for grammar, (b) FK grammar relations by `content_id` (not `id`), and (c) flag the Radical/Character drift to the platform's data-architecture owner — do **not** refactor Radical/Character within this story.

## Architecture Integration

```
[Story 22.1: Grammar Data]
├── Authoring source → content/seed/phase2/grammar-patterns.json (committed)
├── Schema → GrammarPattern / GrammarExample / GrammarPatternRelation
│   └── pre-adaptation: uuid id + unique content_id (gr_XXXX) + content_version + metadata
├── Migration → apps/backend/prisma/migrations/<ts>_add_grammar_models/
├── Seed → prisma/seed.ts steps 27–29 via syncGrammar (hash-gated delta sync,
│         one interactive transaction — unchanged rows write 0, edits bump content_version)
├── Validation → scripts/validate-grammar-content.ts (authoring-time)
└── Manifest → content/manifest.json grammar block declared + entity_counts.grammar bumped to ≥21 (full edit owned by 22.1; 22.2 verifies)

Dependencies:
└── KB grounding: mandarin-fundamentals.md §7 + adult-mandarin-learning-roadmap.md
    (phase placement) + shared-data-model.md (content entity) + modeling-chinese-knowledge-graph.md
    (USED_IN_PATTERN edge) + pre-adaptation-static-dynamic-separation.md (business keys)

Consumers (future stories):
├── 22.2 → modules/grammar reads these tables
└── 22.3 → GrammarPage / GrammarHub render this content via the API
```

## Technical Challenges & Solutions

```
Problem: Reconciliation of the business-key convention. Radical/Character use the
         business key as the PK ("rad_0001"/"ch_1001"), but the pre-adaptation target
         (and this epic) use uuid PK + unique content_id.
Solution: Grammar models follow the pre-adaptation spec exactly (uuid id + unique
         content_id + content_version + metadata). Relations FK by content_id.
         Radical/Character are NOT refactored here; the drift is flagged to the
         platform's data-architecture owner.

Problem: Seed idempotency without a business-key PK — the old createMany({ skipDuplicates })
         path silently kept stale edits (the Story 22.1 regression: an edited example never
         reached the DB).
Solution: Hash-gated delta sync — syncGrammar computes a per-row SHA-256 content_hash over
         the DB-bound payload and writes only the delta (unchanged → 0 writes, edited →
         update + content_version bump, NULL-hash → reconcile without bump). One interactive
         transaction keeps Patterns → Examples → Relations all-or-nothing.

Problem: Linguistic accuracy of explanations/examples (Severity: High).
Solution: Author exclusively from KB §7 "Grammar Essentials" and the roadmap's phase
         placement; no families outside the BR Background table; human review of the
         seeded content is a hard gate before 22.2 consumes it.

Problem: Segment entityId integrity — a token pointing at a non-existent content_id
         would render a dead hub link.
Solution: scripts/validate-grammar-content.ts cross-checks every non-null entityId
         against the characters/words authoring sources at authoring time.
```

### Doc Truth-Check

- [ ] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim) — N/A this story (no endpoints; 22.2 owns `grammarPatterns`/`grammarPatternById`)
- [ ] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` — N/A this story (data layer only)
- [ ] Data source (static JSON vs Postgres/API) matches the backing service/repository code — grammar is all-in-DB via Prisma (seed source only; no runtime JSON reads)
- [ ] All relative markdown links resolve (this story → `../README.md`, `story-22-2-grammar-backend-api.md`, `story-22-3-grammar-ui.md`, IMP twin)
- [ ] Last Updated / Last Update date is current (August 4, 2026 — same commit as the edit)

> **Note:** PR / Merge Date / Key Commit are filled in the BR's Implementation Status (same commit as this refresh — direct commit, no PR).

## Testing Implementation

Per `testing-standards.instructions.md` (Testing Trophy):

- **Unit** — validation-helper functions in `scripts/validate-grammar-content.ts`: phase-domain check, hskLevel bounds, `gr_XXXX` regex, segments-schema validator (happy path + 1 edge each).
- **Integration (DB)** — `apps/backend/tests/integration/grammar-seed.test.ts` (schema shape + DB-level idempotency via the legacy createMany mechanism) and `apps/backend/tests/integration/grammar-delta.test.ts` (the real hash-gated path via `syncGrammar`):
  - edit-propagates regression (Story 22.1): an edited example reaches the DB + `content_version` bumps to 2; unchanged rows untouched;
  - seed idempotency: re-syncing an identical payload writes 0 rows and leaves `content_version`/`updatedAt` stable;
  - schema shape: seeded `GrammarPattern` rows expose uuid `id` + unique `content_id` (`gr_XXXX`) + `content_version = 1` + `metadata` nullable; examples carry `segments` and reference `patternContentId`;
  - post-seed counts ≥ 21 / ≥ 63 / ≥ 0 and zero orphan examples (FK integrity query);
  - cascade: deleting a pattern removes its examples and relation rows.
- **Static** — `npm run build` (type-check incl. test graph), `npm run lint`.
- **Manual** — run `scripts/validate-grammar-content.ts`, re-seed via `npm run db:seed`, and confirm the SQL verification queries above.
