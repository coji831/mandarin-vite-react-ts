# Implementation 23-1: Chengyu Data

> **BR Reference:** `docs/business-requirements/archive/epic-23-idiom-database/story-23-1-chengyu-data.md`
> **Epic IMP:** `docs/issue-implementation/archive/epic-23-idiom-database/README.md`
> **Status:** Complete
> **Last Update:** August 7, 2026

## Technical Scope

Author the **CC-CEDICT-extracted, curated, and enriched** chengyu dataset (enrich-phase (phase-2) generation script + shortlist-curation, KB §6.2 family seed, CC-CEDICT idiom/pinyin/literal+figurative English, Chinese Wiktionary 詞源 → zh Wikisource origin stories, authored era/theme/examples, CC BY-SA attribution), add the three Prisma models with pre-adaptation fields and `cy_XXXX` business keys, generate the migration, wire chengyu into the **hash-gated delta sync** (`syncChengyu` in `apps/backend/prisma/sync-helpers.ts`, mirroring Epic 22's `syncGrammar`), add authoring-time content validation, and own the full `content/manifest.json` edit (declare the `chengyu` block + bump `entity_counts.chengyu` after the seed populates). This story does **not** touch the backend module, routes, or any frontend code (those are 23.2 / 23.3).

**Files:**

- `apps/backend/scripts/enrich/extract-chengyu-candidates.ts` — **NEW**: **enrich-phase (phase-2) generation script** — consumes the phase-1 extract and scaffolds the authoring draft (a JSON→JSON enrich transform alongside the `build-*` scripts in `scripts/enrich/`); **not a phase-1 extractor and not a new pipeline stage** (root alias `npm run extract:chengyu-candidates`); reads `content/seed/phase1/cc-cedict-entries.json` (read-only), applies the 4-char + lit./fig.-or-idiom filter, intersects the curated shortlist (`CURATED_SHORTLIST` constant inside the script — no separate JSON), converts pinyin via `numberedToToneMark()`, and writes the working draft (see "Enrichment — draft generation").
- `apps/backend/scripts/__tests__/extract-chengyu-candidates.test.ts` — **NEW**: unit tests for the extractor's pure helpers (see Testing Implementation).
- `content/seed/phase2/chengyu-draft.json` — **NEW** (generated): working draft — one row per shortlisted idiom with CC-CEDICT fields pre-filled and authoring fields empty; **inert** (never declared in the manifest, never read by `seed.ts`); renamed → `chengyu.json` on completion, then deleted to keep `phase2/` clean. **In-phase (enrich) working artifact — not a pipeline stage.** The pipeline remains exactly 3 phases: extract (phase1) → enrich (phase2) → seed.
- `content/seed/phase2/chengyu.json` — **NEW**: authoring source (final curated dataset — 50+ CC-CEDICT-extracted + curated + enriched idioms, ≥1 example each [cardinality ≥1/idiom vs grammar's ≥3 — the idiom itself is the primary learning object; pipeline still mirrors Epic 22], `segments`, era/theme tags, narrative `story`/`storySource`; added to the existing `content/seed/phase2/` seed dir — no new directory).
- `content/seed/ATTRIBUTION.md` — **NEW**: canonical CC BY-SA 4.0 attribution (CC-CEDICT + Chinese Wiktionary 詞源 + zh Wikisource; authored `story`/`example` prose recorded as original project work; no restricted-source text shipped).
- `apps/backend/prisma/schema.prisma` — **UPDATE**: add `Chengyu`, `ChengyuExample`, `ChengyuRelation` (pre-adaptation fields + `content_hash` + `cy_XXXX` keys; see "Complete Prisma Model Definitions").
- `apps/backend/prisma/migrations/<timestamp>_add_chengyu_models/` — **NEW** (generated via `npx prisma migrate dev --name add_chengyu_models`; additive only).
- `apps/backend/prisma/sync-helpers.ts` — **UPDATE**: add `syncChengyu` (Chengyu → ChengyuExample → ChengyuRelation in ONE interactive transaction) using the existing hash-gated `syncTable` machinery.
- `apps/backend/prisma/seed.ts` — **UPDATE**: route the chengyu seed steps through `syncChengyu` + post-seed SQL verification.
- `scripts/validate-chengyu-content.ts` — **NEW**: authoring-time validation (mirrors `scripts/validate-grammar-content.ts`).
- `apps/backend/scripts/__tests__/validate-chengyu-content.test.ts` — **NEW**: unit tests for the pure validators in `scripts/validate-chengyu-content.ts`.
- `apps/backend/tests/integration/chengyu-seed.test.ts` — **NEW**: seed idempotency + schema-shape integration tests.
- `apps/backend/tests/integration/chengyu-delta.test.ts` — **NEW**: hash-gated delta integration tests (edit-propagates regression, `content_version` bump, NULL-hash reconcile, log-only removal).
- `apps/backend/prisma/__tests__/sync-helpers.test.ts` — **UPDATE**: add `syncChengyu` unit tests (hash/diff/classify logic).
- `package.json` (root) — **UPDATE**: add `"validate:chengyu-content": "npx tsx scripts/validate-chengyu-content.ts"`.
- `content/manifest.json` — **UPDATE**: declare `chengyu.files: ["chengyu.json"]` + `served_via: "db"` **and** bump `entity_counts.chengyu` to ≥50 after the seed populates (full manifest edit owned by 23.1; 23.2 only verifies).

## Implementation Details

### Complete Prisma Model Definitions (single normative source)

These are the **normative** definitions the 23.1 backend engineer must implement in `apps/backend/prisma/schema.prisma`. They follow the pre-adaptation rules (`../../../knowledge-base/backend/pre-adaptation-static-dynamic-separation.md`, Rules 1–3): **internal uuid `id` PK + unique `content_id` (`cy_XXXX`) + `content_version Int @default(1)` + `metadata Json?`**, and mirror Epic 22's `GrammarPattern`/`GrammarExample`/`GrammarPatternRelation` exactly (chengyu module naming mirrors the grammar module). Example and junction rows reference `content_id`, never internal auto IDs. Each model also carries the `content_hash CHAR(64)` delta-sync diff key used by the hash-gated seed (see Seed spec below). **This section is the single residence for the Prisma spec** — the epic IMP and stories 23.2/23.3 reference it and never duplicate model definitions.

```prisma
// ── Chengyu: 4-character idiom with narrative origin story (50+ CC-CEDICT-extracted + curated rows) ──
// content_id = "cy_XXXX" (pre-adaptation Rule 1 business key, e.g. "cy_0005").
// Mirrors GrammarPattern (Epic 22): uuid id PK + unique content_id + content_version + content_hash + metadata Json?.
model Chengyu {
  id                String  @id @default(uuid()) // internal PK — never exposed in the API
  content_id        String  @unique              // stable business key: "cy_0005"
  chengyu           String                       // the 4-char idiom, e.g. "破釜沉舟"
  pinyin            String                       // "pò fǔ chén zhōu"
  literalMeaning    String                       // "Break pots, sink ships"
  figurativeMeaning String                       // "Burning one's bridges"
  story             String                       // narrative origin story (historical/cultural context)
  storySource       String                       // citation for the narrative's source
  era               String                       // e.g. "Warring States", "Han"
  theme             String                       // e.g. "self-deception", "perseverance"
  sortOrder         Int                          // stable library ordering
  content_version   Int     @default(1)
  content_hash      String? @db.Char(64)         // SHA-256 hex of canonical payload (delta-sync diff key; NULL until first sync)
  metadata          Json?                        // e.g. {"family": "determination", "deprecated": false}
  examples          ChengyuExample[]
  relatedFrom       ChengyuRelation[] @relation("ChengyuFrom")
  relatedTo         ChengyuRelation[] @relation("ChengyuTo")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([theme])
  @@index([era])
  @@index([sortOrder])
}

model ChengyuExample {
  id               String  @id @default(uuid())
  content_id       String  @unique              // e.g. "cy_0005_ex1"
  chengyuContentId String                        // FK → Chengyu.content_id ("cy_0005")
  chinese          String                       // modern-usage sentence
  pinyin           String
  english          String
  segments         Json                         // [{ text, pinyin, gloss, entityType, entityId }] — entityId = target content_id
  sortOrder        Int     @default(0)
  content_version  Int     @default(1)
  content_hash     String? @db.Char(64)         // SHA-256 hex of canonical payload (delta-sync diff key; NULL until first sync)
  metadata         Json?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  chengyu          Chengyu @relation(fields: [chengyuContentId], references: [content_id], onDelete: Cascade)

  @@index([chengyuContentId])
}

// Related-idiom cross-links — mirrors GrammarPatternRelation (Epic 22).
model ChengyuRelation {
  id                  String @id @default(uuid())
  fromChengyuContentId String   // references Chengyu.content_id
  toChengyuContentId   String   // references Chengyu.content_id
  relationType         String  @default("RELATED") // RELATED | CONTRASTS_WITH | PREREQUISITE
  content_version      Int     @default(1)
  content_hash         String? @db.Char(64) // SHA-256 hex of canonical payload (delta-sync diff key; NULL until first sync)
  metadata             Json?
  fromChengyu          Chengyu @relation("ChengyuFrom", fields: [fromChengyuContentId], references: [content_id], onDelete: Cascade)
  toChengyu            Chengyu @relation("ChengyuTo", fields: [toChengyuContentId], references: [content_id], onDelete: Cascade)
  createdAt            DateTime @default(now())

  @@unique([fromChengyuContentId, toChengyuContentId])
  @@index([toChengyuContentId])
}
```

**Authoring-time `segments` token schema** (validated by `scripts/validate-chengyu-content.ts`):

```json
{
  "text": "舟",
  "pinyin": "zhōu",
  "gloss": "boat",
  "entityType": "character",
  "entityId": "ch_XXXXX"
}
```

- `entityType` ∈ `"character" | "word" | null`; `entityId` = the target entity's `content_id` (`ch_XXXXX` / `w_XXXXX`), matching the knowledge-graph cross-linking used by grammar (`../../../knowledge-base/learning-theory/modeling-chinese-knowledge-graph.md`).
- Tokens with no linked entity (e.g. punctuation, non-lexical particles) carry `"entityType": null, "entityId": null` — rendered as plain, non-clickable text.
- The idiom's 4 characters resolve to `ch_XXXXX` content_ids (from `content/seed/phase2/characters.json`) so the hub can cross-link each glyph → Character Hub.
- Migration: `npm run db:migrate` (never `db push`) per `prisma-schema-changes.instructions.md`.

### Architecture Decision (models)

**New Prisma models `Chengyu`, `ChengyuExample`, `ChengyuRelation`** — content models follow the pre-adaptation field pattern (`../../../knowledge-base/backend/pre-adaptation-static-dynamic-separation.md`, Rules 1–3): internal `id` (uuid, never exposed) + unique `content_id` business key (`cy_XXXX`) + `content_version Int @default(1)` + `metadata Json?`. Example and junction rows reference `content_id`, not internal auto IDs.

- Rationale: Stable `cy_XXXX` business keys keep progress/junction references intact across content edits (pre-adaptation Rule 1); explicit junction tables seed cleanly through the hash-gated delta sync (see seed-pipeline idempotency rules); pre-segmented tokens avoid a runtime segmenter for a small curated dataset. `ChengyuRelation` mirrors `GrammarPatternRelation` for related-idiom cross-links.
- Alternatives considered: `relatedIds` JSON array (rejected — not relational); runtime segmentation via a segmenter service (rejected — overkill for reference examples).
- Implications: Migration follows `prisma-schema-changes.instructions.md` (`npm run db:migrate`); seed steps must be added in dependency order (Chengyu → ChengyuExample → ChengyuRelation). ⚠️ **Reconciliation note:** the current `Radical` model in `schema.prisma` stores its business key directly as `id` (`"rad_0001"`), and `Character` does the same (`"ch_1001"`), whereas the pre-adaptation target (and this spec) uses a uuid `id` + unique `content_id`. **Chengyu models follow the pre-adaptation spec (user-confirmed).** The 23.1 backend engineer must (a) NOT mirror the Radical business-key-PK pattern for chengyu, (b) FK chengyu relations by `content_id` (not `id`), and (c) flag the Radical/Character drift to the platform's data-architecture owner — do **not** refactor Radical/Character within this story.

### Seed spec (hash-gated delta sync — dependency order)

Story 23.1 adds `syncChengyu` to `apps/backend/prisma/sync-helpers.ts` (mirroring the grammar `syncGrammar` used by Epic 22) — the hash-gated delta sync mechanism, and the correction from the stale plain-`skipDuplicates` wording, are detailed in Technical Challenges below. Chengyu steps run in strict dependency order inside ONE interactive transaction (a crash can't leave examples pointing at a missing idiom):

```typescript
// Chengyu            ← no FK deps; unique content_id "cy_0005"
await syncTable(tx, chengyuCfg, idioms, { ...opts, log });
// ChengyuExample     ← FK → Chengyu.content_id ("cy_0005_ex1")
await syncTable(tx, chengyuExampleCfg, examples, { ...opts, log });
// ChengyuRelation    ← FK → Chengyu.content_id (both ends)
await syncTable(tx, chengyuRelationCfg, relations, { ...opts, log });
```

Idempotency: `syncChengyu` computes a per-row SHA-256 `content_hash` over the DB-bound payload and writes only the delta. **Unchanged rows → 0 writes**; edited rows propagate **and bump `content_version`**; NULL-hash rows (post-migration first run) reconcile without a version bump. A re-run of `npm run db:seed` is safe and idempotent, and re-seeding after a content edit updates exactly the changed rows.

**Post-seed verification (SQL):**

```sql
SELECT COUNT(*) FROM "Chengyu";            -- expect >= 50
SELECT COUNT(*) FROM "ChengyuExample";     -- expect >= 50 (>=1 per idiom)
SELECT COUNT(*) FROM "ChengyuRelation";    -- expect >= 0 (curated set)

-- FK integrity — expect 0 orphans
SELECT COUNT(*) FROM "ChengyuExample" e
LEFT JOIN "Chengyu" c ON e."chengyuContentId" = c."content_id"
WHERE c."content_id" IS NULL;
```

### Enrichment — draft generation (`extract-chengyu-candidates.ts`)

`apps/backend/scripts/enrich/extract-chengyu-candidates.ts` (NEW; root alias `npm run extract:chengyu-candidates`) scaffolds the 50+ authoring rows from the existing CC-CEDICT pipeline — **phase-2 (enrich) stage: phase-1 extraction is already done by `cc-cedict-entries.ts` → `content/seed/phase1/cc-cedict-entries.json`; this script consumes that output and scaffolds the phase-2 draft (no new pipeline phase)** — no manual curation from the 124k-entry file:

- **I/O** — reads `content/seed/phase1/cc-cedict-entries.json` **read-only** (the phase-1 generator `cc-cedict-entries.ts` owns the raw `data/CC-CEDICT/*.txt`); writes `content/seed/phase2/chengyu-draft.json` (working draft: CC-CEDICT fields pre-filled, authoring fields empty).
- **Filter (exact)** — a candidate must be **exactly 4 CJK characters** and carry an idiom marker:
  ```
  is4Han(s)  = /^[\u3400-\u9FFF]{4}$/.test(simplified)           // exactly 4 CJK chars
  candidate  = is4Han(simplified)
            && definitions.join(" ").match(/\bidio[m]?\b|lit\.|fig\./)
  ```
  The filter widens on `lit.`/`fig.` **or** the `(idiom)` tag — **never the tag alone** (CC-CEDICT tagging is incomplete: 光明正大, 自相矛盾, 卧薪尝胆 [variant], 瓜田李下 [abbr.] are untagged). Research yield: 4,960 four-char `(idiom)`-tagged rows → **~5,000–6,000 raw candidates**.
- **Curated shortlist (60–80)** — a typed `CURATED_SHORTLIST` constant inside the script (no third JSON artifact): the mandatory KB §6.2 family seed (破釜沉舟, 画蛇添足, 瓜田李下) + a common-chengyu starter list (守株待兔, 叶公好龙, 亡羊补牢, 塞翁失马, 三顾茅庐, 井底之蛙, 自相矛盾, 掩耳盗铃, 滥竽充数, 画龙点睛, 刻舟求剑, 对牛弹琴, 狐假虎威, 胸有成竹, 卧薪尝胆, 望梅止渴, 纸上谈兵, 东施效颦, 邯郸学步, …). Sized 60–80 so curation dropping lands safely at **≥50**. The script intersects candidates with the shortlist and reports per-member found/not-found coverage (regression guard). **Reject:** CC-CEDICT "variant of …" rows and pure "abbr. for …" stubs (a row with no `lit.`/`fig.` gloss), rare/archaic idioms with no Chinese Wiktionary 詞源, any 惯用语/歇后语/谚语 (KB §6.3).
- **Per-row pre-fill** — `chengyu` = simplified; `pinyin` = `pinyinStringToToneMarks(pinyinNumbered)` (from `apps/backend/src/shared/utils/pinyinFormatUtils.ts` — the space-split wrapper that internally calls `numberedToToneMark`, which handles `u:`→`ü`, tone digits→marks, neutral = unmarked); `literalMeaning` = `lit.` gloss (strip the `(idiom)` suffix); `figurativeMeaning` = `fig.` gloss (fallback: second def line); `metadata.source = "CC-CEDICT"`. `content_id` assigned sequentially `cy_0001…`; `sortOrder` = list order.
- **Console** — candidate-pool count + shortlist coverage report.
- ⚠️ **`ch_` id gotcha** — `characters.json` `ch_` ids are **not reliably codepoints** (釜 = `ch_46225`, not U+91DC/`ch_37340`; 好 = `ch_1001`). Segments' `entityId` must be **copied from `characters.json` by glyph→id lookup, never computed** from a codepoint.

### Enrichment workflow (repeatable per-idiom checklist — 50+ iterations)

For each shortlisted idiom in `chengyu-draft.json`:

1. **Confirm pre-fill** — verify the CC-CEDICT row is pre-filled in the draft; if the idiom lacks `lit.`/`fig.`, flag and drop it.
2. **Pull 詞源** — open `zh.wiktionary.org/wiki/<idiom>`; copy the classical quote from the 詞源 section + its Wikisource link.
3. **Verify against Wikisource** — open the cited `zh.wikisource.org/wiki/<work>/<juan>`; confirm the quote/event appears in the primary text (no unverifiable stories — BR Rule 7).
4. **Author `story`** — rewrite the classical event as learner-friendly English prose **in our own words** (avoids copyleft); 2–4 sentences; keep the historical context.
5. **Set `storySource`** — canonical form `《<work>·<juan>·<chapter>》(zh.wikisource.org/wiki/<path>)`; use the **simplified** work title (repo content is simplified) — e.g. `《史记·卷七·项羽本纪》(zh.wikisource.org/wiki/史記/卷007)`.
6. **Derive `era`** — look up the work in the era table below as the default; if the passage's story-setting period differs (e.g. 项羽本纪 → "Qin–Han transition"), use the story-setting era and set `metadata.eraBasis: "passage"`.
7. **Assign `theme`** — from the authored taxonomy (match an existing tag where possible for filter density).
8. **Author ≥1 example** — modern-usage Chinese sentence containing the idiom (contextual, learner-grade), tone-marked pinyin (each syllable verified against `pinyin-syllables.json`; the idiom's own syllables against CC-CEDICT), English translation, `segments` pre-segmented; the idiom's 4 chars get `character` entityType + their real `ch_` ids (glyph→id lookup); unlinked tokens → `null`.
9. **Record provenance** — fill `metadata.source` / `wiktionaryUrl` / `storySourceUrl`.
10. **Re-run the validator** — must pass before the row is considered done.

### Era lookup table (classical work → default era)

`era` = the **story-setting period** (consistent with the epic BR Theme/Era table, e.g. 破釜沉舟 = "Qin–Han transition" for the 207 BCE Battle of Julu, even though the 史记 was compiled in the Han). This table provides the authoring **default**; per-passage overrides set `metadata.eraBasis: "passage"`. The table's `KNOWN_WORKS` keys also anchor the validator's `storySource` prefix check (below). Starter set — 16 rows:

| Classical work (key, simplified) | Default era     | Notes                                                |
| -------------------------------- | --------------- | ---------------------------------------------------- |
| 《周易》 (Zhouyi)                | Zhou            | Western Zhou divination classic                      |
| 《诗经》 (Shijing)               | Zhou            | compiled Western–Eastern Zhou                        |
| 《论语》 (Lunyu)                 | Spring & Autumn | Confucius, 5th c. BCE                                |
| 《左传》 (Zuozhuan)              | Spring & Autumn | chronicle 722–468 BCE                                |
| 《楚辞》 (Chuci)                 | Warring States  | Chu tradition, Qu Yuan                               |
| 《孟子》 (Mengzi)                | Warring States  |                                                      |
| 《庄子》 (Zhuangzi)              | Warring States  |                                                      |
| 《列子》 (Liezi)                 | Warring States  |                                                      |
| 《韩非子》 (Han Feizi)           | Warring States  |                                                      |
| 《吕氏春秋》 (Lüshi Chunqiu)     | Warring States  | late ~239 BCE                                        |
| 《战国策》 (Zhanguoce)           | Warring States  |                                                      |
| 《史记》 (Shiji)                 | Han             | per-passage override (项羽本纪 → Qin–Han transition) |
| 《淮南子》 (Huainanzi)           | Han             |                                                      |
| 《汉书》 (Hanshu)                | Han             |                                                      |
| 《三国志》 (Sanguozhi)           | Three Kingdoms  |                                                      |
| 《世说新语》 (Shishuo Xinyu)     | Wei–Jin         | Six Dynasties                                        |

Era value set (consistent with the epic BR): Spring & Autumn · Warring States · Qin · Qin–Han transition · Han · Three Kingdoms · Wei–Jin.

### Attribution (CC BY-SA)

The dataset combines **CC BY-SA 4.0** sources — CC-CEDICT (idiom strings, pinyin, literal/figurative English; source `data/CC-CEDICT/cedict_1_0_ts_utf-8_mdbg.txt`, mdbg.net) and Wikimedia (Chinese Wiktionary 詞源 classical quotes + zh Wikisource text used to ground `story`/`storySource`). Copyleft exposure is mitigated by:

- **`content/seed/ATTRIBUTION.md` (NEW, canonical)** — cites CC-CEDICT and Wikimedia, each CC BY-SA 4.0, with the source paths; and records an explicit note that authored `story`/`example` prose (plus the `era`/`theme` taxonomy) is **original work of this project, not copyleft** — so the derived `chengyu.json` stays CC BY-SA 4.0 (share-alike inherited from the sources) but our narrative text is not a verbatim copy.
- No text from restricted sources (ctext.org, zdic/漢典, pwxcoo) is ever shipped verbatim.
- `chengyu.json`'s `_comment` carries a one-line source/license note pointing to `content/seed/ATTRIBUTION.md`.

### Content validation script

`scripts/validate-chengyu-content.ts` (mirrors `scripts/validate-grammar-content.ts` — pure validators + CLI guard, unit-tested in `apps/backend/scripts/__tests__/`) validates the authoring JSON before seeding:

- **Schema/required** — idiom count ≥ 50; `content_id` = `/^cy_\d{4}$/`; `chengyu` = **exactly 4 CJK chars** (`/^[\u3400-\u9FFF]{4}$/`); non-empty `pinyin` / `literalMeaning` / `figurativeMeaning` / `story` / `storySource`; `era` + `theme` present; `sortOrder` numeric; ≥1 example per idiom (each with non-empty `chinese` / `pinyin` / `english` and a `segments` array conforming to the token schema).
- **Source-aware — `storySource`** — must start with `《` + one of `KNOWN_WORKS` (the era table keys), e.g. `《史记`, anchoring the citation to a known classical work (`KNOWN_WORKS.some((w) => storySource.startsWith("《" + w))`).
- **Source-aware — idiom chars** — each of the idiom's 4 glyphs must exist in `content/seed/phase2/characters.json`, **resolved by `glyph` → `id` lookup** (never assuming `ch_` = codepoint — 釜 = `ch_46225`); a missing char blocks Character-Hub cross-linking and the segment `entityId`.
- **Source-aware — pinyin syllables** — every space-separated token of the idiom `pinyin` **and** each `example.pinyin` must normalize to a known syllable in `pinyin-syllables.json` (normalize via tone-mark stripping; compare against the `syllable`-without-digit set / `syllablePretty` set).
- **Existing grammar-pattern checks kept** — `segments` token schema (`text`/`pinyin`/`gloss`/`entityType`/`entityId`), `ch_`/`w_` prefixes, dead-entity cross-check (`entityId` resolves to a `characters.json`/`words.json` id), duplicate `content_id` guard, `relations` validity (`RELATED | CONTRASTS_WITH | PREREQUISITE`, no self-loops, both ends known).
- **Metadata** — `metadata.source` present per idiom (provenance traceability).

Registered as `"validate:chengyu-content": "npx tsx scripts/validate-chengyu-content.ts"` in the root `package.json` (mirroring lines 23–24); must pass before seeding.

### Manifest declare + count bump (owned by 23.1)

`content/manifest.json` already declares `chengyu` as a content type with `entity_counts.chengyu: 0` (verified). Story 23.1 adds the `chengyu` block:

```json
"chengyu": {
  "files": ["chengyu.json"],
  "served_via": "db"
}
```

…and bumps `entity_counts.chengyu` from `0` to `≥50` after the seed populates. ⚠️ **Verified (Q3):** `served_via` is **non-normative** — a doc stamp only present on some blocks (`radicals`, `grammar`, `pinyin`, `tones`; absent from `characters`/`words`). Matching the grammar block is fine, but the field carries no runtime meaning.

## Architecture Integration

```
[Story 23.1: Chengyu Data]
├── Authoring source → content/seed/phase2/chengyu.json (committed; added to existing phase2/ seed dir)
├── Schema → Chengyu / ChengyuExample / ChengyuRelation
│   └── pre-adaptation: uuid id + unique content_id (cy_XXXX) + content_version + content_hash + metadata
├── Migration → apps/backend/prisma/migrations/<ts>_add_chengyu_models/
├── Seed → prisma/sync-helpers.ts syncChengyu → prisma/seed.ts (hash-gated delta sync,
│         one interactive transaction — unchanged rows write 0, edits bump content_version)
├── Validation → scripts/validate-chengyu-content.ts (authoring-time)
└── Manifest → content/manifest.json chengyu block declared + entity_counts.chengyu bumped to ≥50 (full edit owned by 23.1; 23.2 verifies)

Dependencies:
└── KB grounding: mandarin-fundamentals.md §6 + adult-mandarin-learning-roadmap.md
    (Phase 4 placement) + shared-data-model.md (content entity) + modeling-chinese-knowledge-graph.md
    ((:Chengyu) node; cross-link tokens by content_id) + pre-adaptation-static-dynamic-separation.md (business keys)

Consumers (future stories):
├── 23.2 → modules/chengyu reads these tables
└── 23.3 → ChengyuPage / ChengyuHub render this content via the API
```

## Technical Challenges & Solutions

```
Problem: Reconciliation of the business-key convention. Radical/Character use the
         business key as the PK ("rad_0001"/"ch_1001"), but the pre-adaptation target
         (and this epic) use uuid PK + unique content_id.
Solution: Chengyu models follow the pre-adaptation spec exactly (uuid id + unique
         content_id + content_version + content_hash + metadata). Relations FK by content_id.
         Radical/Character are NOT refactored here; the drift is flagged to the
         platform's data-architecture owner.

Problem: Seed idempotency — the epic-23 docs originally specified the blind
         createMany({ skipDuplicates }) path, but Epic 22 shipped hash-gated delta
         sync (syncTable/syncDerived/syncGrammar) and the plain path silently kept
         stale edits (the Story 22.1 regression).
Solution: Chengyu seeds via a new syncChengyu (hash-gated delta sync, mirroring
         syncGrammar): per-row SHA-256 content_hash over the DB-bound payload, write
         only the delta (unchanged → 0 writes, edited → update + content_version bump,
         NULL-hash → reconcile without bump). One interactive transaction keeps
         Chengyu → ChengyuExample → ChengyuRelation all-or-nothing.

Problem: Cultural/historical accuracy of idiom origin stories (Severity: High).
Solution: Author every story from the idiom's classical Chinese source text, consistent
         with the KB §6 idiom family; every story carries a storySource citation; human
         review of the seeded narratives is a hard gate before 23.2 consumes them.
         No non-chengyu forms (惯用语 / 歇后语 / 谚语, KB §6.3).

Problem: Segment entityId integrity — a token pointing at a non-existent content_id
         would render a dead hub link.
Solution: scripts/validate-chengyu-content.ts cross-checks every non-null entityId
         against the characters/words authoring sources at authoring time.

Problem: `ch_` id integrity — `characters.json` mixes codepoint and non-codepoint ids
         (釜 = ch_46225, not U+91DC; 好 = ch_1001), so a validator that assumes
         ch_ = Unicode codepoint would emit dead entityIds.
Solution: Resolve glyph → id by lookup from characters.json (never compute from a
         codepoint). The data inconsistency is FLAGGED to the platform's
         data-architecture owner (mirroring the Radical business-key drift note
         above); not fixed in-scope.

Problem: Copyleft exposure — CC-CEDICT and Wikimedia are both CC BY-SA 4.0; the
         derived chengyu.json inherits share-alike, and verbatim classical quotes
         would drag the story text into the copyleft.
Solution: Attribution via content/seed/ATTRIBUTION.md (CC-CEDICT + Wikimedia cited,
         CC BY-SA 4.0); authored story/example prose written in our own words (not
         verbatim), explicitly recorded as original project work in ATTRIBUTION.md;
         no restricted-source (ctext.org / zdic / pwxcoo) text shipped.

Problem: KNOWN_WORKS expansion (post-planning deviation) — the mandatory KB §6.2
         family and the shortlist include idioms whose canonical classical sources
         are outside the IMP's 16-row era table (瓜田李下→乐府诗集, 叶公好龙→新序,
         画龙点睛→历代名画记, 对牛弹琴→牟子理惑论), so a strict 16-row prefix
         check would fail to truthfully cite them.
Solution: The validator's KNOWN_WORKS list is expanded by 4 works — 新序, 乐府诗集,
         牟子理惑论, 历代名画记 (20 total) — keeping storySource citations truthful;
         the expansion is commented in scripts/validate-chengyu-content.ts and covered
         by a unit test ("accepts an expanded KNOWN_WORKS work").

Problem: Data-quality exclusions (post-planning deviation) — 塞翁失马 is excluded
         because its `weng` syllable is missing from content/seed/phase2/
         pinyin-syllables.json, and 胸有成竹 is excluded because its Song-era setting
         is outside the era value set (Spring & Autumn … Wei–Jin).
Solution: Both are dropped from the authored set so the era/syllable validation stays
         strict (no per-idiom exception carving). The authored set lands at 55 idioms
         (≥ 50 target) — 55 idioms / 55 examples / 18 relations / 0 orphans.

Problem: Extractor shortlist coverage shortfall (post-planning deviation — regression
         guard, not a blocker) — 3 of the 69 CURATED_SHORTLIST members are absent from
         CC-CEDICT (庖丁解牛, 七步成诗, 五十步笑百步) → 66 draft rows.
Solution: The extractor reports per-member found/not-found coverage on every run; the
         3 absent members are surfaced in the console report as a regression guard for
         the next curation pass. The curated 55-idiom authored set is unaffected by
         the shortfall.
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim) — N/A this story (no endpoints; 23.2 owns `chengyuIdioms`/`chengyuIdiomById`)
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` — N/A this story (data layer only); `content/seed/` has `curated/`, `phase1/`, `phase2/` — `chengyu.json` is added to the existing `phase2/` (no new directory)
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — chengyu is all-in-DB via Prisma (seed source only; no runtime JSON reads); hash-gated delta sync confirmed in `apps/backend/prisma/sync-helpers.ts` (`syncTable`/`syncGrammar`) + `docs/guides/data/seed-pipeline.md`
- [x] Source/license claims verified: `data/CC-CEDICT/cedict_1_0_ts_utf-8_mdbg.txt` + `content/seed/phase1/cc-cedict-entries.json` (CC-CEDICT, CC BY-SA 4.0) exist; `numberedToToneMark` exists in `apps/backend/src/shared/utils/pinyinFormatUtils.ts` (line 30); `content/seed/phase2/` has `characters.json` + `pinyin-syllables.json` (glyph→id lookup; 釜 = `ch_46225` — verified); validator precedent `scripts/validate-grammar-content.ts` + `apps/backend/scripts/__tests__/validate-grammar-content.test.ts` exist; `content/seed/ATTRIBUTION.md` (created — CC BY-SA 4.0 sources + original-prose note, no restricted sources) + `apps/backend/scripts/enrich/extract-chengyu-candidates.ts` (created — `CURATED_SHORTLIST` 69 members, reads `content/seed/phase1/cc-cedict-entries.json` read-only) verified in place
- [x] No restricted-source text (ctext.org / zdic/漢典 / pwxcoo) is specified to ship — only CC-CEDICT + Wikimedia are named; original `story`/`example` prose is authored (not verbatim)
- [x] All relative markdown links resolve (this story → `../README.md`, `story-23-2-chengyu-backend-api.md`, `story-23-3-chengyu-ui.md`, IMP twin, KB links)
- [x] Last Updated / Last Update date is current (August 7, 2026 — same commit as the edit)
- [x] **Shipped-state actuals (post-implementation):** `content/seed/phase2/chengyu.json` = **55 idioms** (`cy_0001`–`cy_0055`) / **55 examples** (≥1 per idiom) / **18 relations**, **0 orphan examples**; `scripts/validate-chengyu-content.ts` passes with **0 violations**; re-seed 2nd run = **0 writes** (idempotent); migration = `20260807164512_add_chengyu_models/`; `content/manifest.json` `entity_counts.chengyu` = **55**; root aliases `validate:chengyu-content` + `extract:chengyu-candidates` registered; tests = extractor 21 + validator 35 + sync-helpers 25 (**81 unit**) + **14 integration** — all pass.

> **Note:** PR / Merge Date / Key Commit stay literal `TBD` until commit, filled same-commit; never merge with TBD.

## Testing Implementation

Per `testing-standards.instructions.md` (Testing Trophy):

- **Unit** — extraction/curation helpers in `apps/backend/scripts/__tests__/extract-chengyu-candidates.test.ts`: 4-char filter (`is4Han`), lit./fig.-or-idiom detection (untagged idioms still pass via `lit.`/`fig.`), variant/abbr rejection, shortlist coverage (every `CURATED_SHORTLIST` member found/not-found reported), numbered→tone-mark conversion (`numberedToToneMark`: `u:`→`ü`, tone digits→marks, neutral unmarked); plus validation-helper functions in `scripts/validate-chengyu-content.ts` (tests in `apps/backend/scripts/__tests__/validate-chengyu-content.test.ts`): idiom-count check (≥50), `cy_XXXX` regex, exactly-4-char `chengyu` check, required-field check (incl. `story`/`storySource` mandatory), era/theme presence, `storySource` `KNOWN_WORKS` prefix check, glyph→id character resolution (釜 = `ch_46225`), pinyin-syllable normalization vs `pinyin-syllables.json`, `metadata.source` presence, segments-schema validator (happy path + 1 edge each); `syncChengyu` hash/diff/classify logic in `apps/backend/prisma/__tests__/sync-helpers.test.ts`.
- **Integration (DB)** — `apps/backend/tests/integration/chengyu-seed.test.ts` (schema shape + DB-level idempotency) and `apps/backend/tests/integration/chengyu-delta.test.ts` (the hash-gated path via `syncChengyu`):
  - edit-propagates regression: an edited idiom/example reaches the DB + `content_version` bumps to 2; unchanged rows untouched;
  - seed idempotency: re-syncing an identical payload writes 0 rows and leaves `content_version`/`updatedAt` stable;
  - schema shape: seeded `Chengyu` rows expose uuid `id` + unique `content_id` (`cy_XXXX`) + `content_version = 1` + `metadata` nullable; examples carry `segments` and reference `chengyuContentId`;
  - post-seed counts ≥ 50 / ≥ 50 / ≥ 0 and zero orphan examples (FK integrity query);
  - cascade: deleting an idiom removes its examples and relation rows.
- **Static** — `npm run build` (type-check incl. test graph), `npm run lint`, backend type-check (`npm run typecheck --workspace=@mandarin/backend`).
- **Manual** — run `scripts/validate-chengyu-content.ts`, re-seed via `npm run db:seed`, and confirm the SQL verification queries above.
