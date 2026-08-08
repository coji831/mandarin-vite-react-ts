# Epic 22: Grammar Pattern Library — Implementation

**BR Reference:** `../../business-requirements/epic-22-grammar-library/README.md`

**Status:** Completed

**Last Update:** August 7, 2026

## Epic Summary

**Goal:** Ship the grammar pattern reference library end-to-end on the all-in-DB pipeline across three stories: Prisma models + seed + manifest declare/count (22.1), a backend `grammar` module + API + manifest verification (22.2), and a Phase-2-gated `/learn/grammar` page with search/filter, LexicalHub detail, TTS audio, and character cross-linking (22.3).

**Key Points:**

- **KB-grounded content.** The 21-pattern set is authored from the platform's Mandarin fundamentals KB (§7 "Grammar Essentials", `mandarin-fundamentals.md`) and staged Phase 2 (basic structures) / 3 (particles & conjunctions) / 4 (complex syntax) per the adult-learning roadmap (`adult-mandarin-learning-roadmap.md`).
- **All-in-DB (not static JSON):** authoring source `content/seed/phase2/grammar-patterns.json` → `prisma/seed.ts` → Prisma tables → backend `grammar` module → API. No runtime JSON reads.
- **New models (Story 22.1):** `GrammarPattern`, `GrammarExample` (with pre-segmented clickable tokens), `GrammarPatternRelation` (explicit junction, matches `WordCharacter`/`CharacterRadical` convention). Content models follow the pre-adaptation field pattern: internal `id` + unique `content_id` (`gr_XXXX`) + `content_version` + `metadata Json?`.
- **Proposed endpoints (Story 22.2):** `GET /v1/grammar/patterns` and `GET /v1/grammar/patterns/:id` (resolves by `content_id` `gr_XXXX`), added verbatim to `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js`. The `content/manifest.json` `grammar` block + count (0 → ≥21) are declared/bumped by Story 22.1; 22.2 verifies them (no edit).
- **Frontend is a custom feature (Story 22.3):** `features/grammar` (service → hooks → components → types) rendered by `pages/learn/grammar/GrammarPage.tsx`, replacing the `ContentPlaceholderPage` at `/learn/grammar`. The route, sidebar Learn-group item, `ContentBrowser` content type, and hub `grammar` entity already exist as placeholders.
- **Detail view is a `GrammarHub`** registered in `entityHubRegistry` (hub `grammar` key currently `NotImplemented`); example words open the `character` hub via `openHub()`.
- **Audio is on-demand** via the shared audio manager (`useAudioItemPlayback` → `POST /v1/tts`, optionalAuth) — no audio fields in the data model.
- **Phase gating reuses numeric Phase 2/3/4** + the existing Phase-2 grammar unlock in the sidebar Learn-group item (`learnNav.ts` `requiredPhase: 2`) / `ContentBrowser`/`TabBar`; Phase 3/4 patterns show as locked/preview cards.

**Status:** Completed

**Last Update:** August 7, 2026

## Technical Overview

This epic implements grammar reference content across data, backend, and frontend layers, split into three stories that mirror the layered pipeline.

**Story 22.1 (Data)** adds three Prisma models and three seed steps (idempotent, business-key `content_id` unique), driven by a new authoring source `content/seed/phase2/grammar-patterns.json` holding the 21-pattern KB-sourced family, and owns the `content/manifest.json` edit (declare the `grammar` block + bump `entity_counts.grammar` after the seed populates).

**Story 22.2 (Backend API)** adds a `grammar` module exposing a filtered list endpoint and a detail endpoint (by `gr_XXXX`), registers both paths in `ROUTE_PATTERNS`, and verifies `content/manifest.json` (updated by 22.1).

**Story 22.3 (UI)** adds a `features/grammar` feature (service → hooks → components), a page at `/learn/grammar` gated at Phase 2, a `GrammarHub` detail panel in the LexicalHub, TTS example-sentence audio, and clickable example words that open the Character Hub.

All existing scaffolding (route, sidebar Learn-group item, content type, hub entity) is reused — only the placeholder is replaced.

## Complete Prisma Model Definitions ➕ ADDED (normative spec for Story 22.1)

These are the **normative** definitions the 22.1 backend engineer must implement in `apps/backend/prisma/schema.prisma` (the "Intended shape" sketch inside Decision 2 below is retained for the rationale; this section is the exact contract). They follow the pre-adaptation rules (`docs/knowledge-base/backend/pre-adaptation-static-dynamic-separation.md`, Rules 1–3): **internal uuid `id` PK + unique `content_id` (`gr_XXXX`) + `content_version Int @default(1)` + `metadata Json?`**. Example and junction rows reference `content_id`, never internal auto IDs.

```prisma
// ── GrammarPattern: grammar reference pattern (21 KB-sourced rows) ──
// content_id = "gr_XXXX" (pre-adaptation Rule 1 business key, e.g. "gr_0001").
// ⚠️ DIFFERS FROM Radical / Character (which store the business key as the PK,
//    e.g. "rad_0001" / "ch_1001") — see reconciliation note in Decision 2.
model GrammarPattern {
  id              String  @id @default(uuid()) // internal PK — never exposed in the API
  content_id      String  @unique              // stable business key: "gr_0001"
  name            String                       // e.g. "把 (bǎ) disposal construction"
  structure       String                       // e.g. "Subj + 把 + Obj + Verb + Complement"
  explanation     String                       // plain-language rule + usage note (KB §7-grounded)
  phase           Int                          // 2 | 3 | 4 — roadmap placement (Core 300 / Network / Advanced Fluidity)
  hskLevel        Int?                         // 1–6 — nullable in schema (house convention); 22.1 populates all 21
  // (deferred: if HSK-version filtering ever lands, add a GrammarPatternHskLevel junction mirroring WordHskLevel)
  sortOrder       Int                          // stable library ordering within the phase
  content_version Int     @default(1)
  metadata        Json?                        // e.g. {"family": "complex-syntax", "deprecated": false}
  examples        GrammarExample[]
  relatedFrom     GrammarPatternRelation[] @relation("PatternFrom")
  relatedTo       GrammarPatternRelation[] @relation("PatternTo")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([phase])
  @@index([hskLevel])
  @@index([sortOrder])
}

model GrammarExample {
  id               String  @id @default(uuid())
  content_id       String  @unique              // e.g. "gr_0001_ex1"
  patternContentId String                         // FK → GrammarPattern.content_id ("gr_0001")
  chinese          String                       // "我把书放在桌子上"
  pinyin           String                       // "wǒ bǎ shū fàng zài zhuōzi shàng"
  english          String                       // "I put the book on the table"
  segments         Json                         // [{ text, pinyin, gloss, entityType, entityId }] — entityId = target content_id
  sortOrder        Int     @default(0)          // deterministic example ordering within the pattern
  content_version  Int     @default(1)
  metadata         Json?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  pattern          GrammarPattern @relation(fields: [patternContentId], references: [content_id], onDelete: Cascade)

  @@index([patternContentId])
}

// First self-referential junction in the schema (two FKs → GrammarPattern) — Prisma requires named relations (PatternFrom/PatternTo).
model GrammarPatternRelation {
  id                   String @id @default(uuid())
  fromPatternContentId String   // references GrammarPattern.content_id
  toPatternContentId   String   // references GrammarPattern.content_id
  relationType         String  @default("RELATED") // RELATED | CONTRASTS_WITH | PREREQUISITE
  content_version      Int     @default(1)
  metadata             Json?
  fromPattern          GrammarPattern @relation("PatternFrom", fields: [fromPatternContentId], references: [content_id], onDelete: Cascade)
  toPattern            GrammarPattern @relation("PatternTo", fields: [toPatternContentId], references: [content_id], onDelete: Cascade)
  createdAt            DateTime @default(now())

  @@unique([fromPatternContentId, toPatternContentId])
  @@index([toPatternContentId])
}
```

**Authoring-time `segments` token schema** (validated by `scripts/validate-grammar-content.ts`):

```json
{
  "text": "把",
  "pinyin": "bǎ",
  "gloss": "BA (disposal marker)",
  "entityType": "character",
  "entityId": "ch_XXXX"
}
```

- `entityType` ∈ `"character" | "word" | "radical"` (practically `character` / `word`); `entityId` = the target entity's `content_id` (`ch_XXXX` / `w_XXXXX`), matching the `USED_IN_PATTERN` Word→GrammarPattern edge in `docs/knowledge-base/learning-theory/modeling-chinese-knowledge-graph.md`.
- Tokens with no linked entity (e.g. punctuation, non-lexical particles) carry `"entityType": null, "entityId": null` — the UI renders them as plain, non-clickable text.
- Migration: `npm run db:migrate` (never `db push`) per `prisma-schema-changes.instructions.md`.

## Architecture Decisions

1. **All-in-DB data delivery (supersedes the original "static JSON in `public/data/`" plan)** — Grammar content is authored in `content/seed/phase2/grammar-patterns.json`, seeded into Prisma by `prisma/seed.ts`, and served by a new backend `grammar` module.
   - Rationale: The canonical architecture (`docs/guides/data/seed-pipeline.md`) reads content exclusively from Prisma at runtime; `content/manifest.json` already declares `grammar` as a content type (count 0); grammar is a recognized content entity in `docs/knowledge-base/data/shared-data-model.md`; epic-21 story 21.11 explicitly removed JSON→frontend delivery ("Radical JSON → API"). Static `public/data/` JSON would create a parallel delivery path with no existing frontend infrastructure (`frontend-api-client.instructions.md` mandates `apiClient` service calls).
   - Alternatives considered: Static JSON in `public/data/grammar/` (original doc plan); client-side JSON imports from `content/`.
   - Implications: Requires schema migration, seed steps, and a backend module + tests; enables server-side search/filter and future relational growth (e.g., pattern ↔ word links via `content_id`).

2. **New Prisma models `GrammarPattern`, `GrammarExample`, `GrammarPatternRelation` (Story 22.1)** — content models follow the pre-adaptation field pattern (`docs/knowledge-base/backend/pre-adaptation-static-dynamic-separation.md`, Rules 1–3): internal `id` (uuid, never exposed) + unique `content_id` business key (`gr_XXXX`) + `content_version Int @default(1)` + `metadata Json?`. Example and junction rows reference `content_id`, not internal auto IDs. 🛠 UPGRADED: the complete normative definitions live in the **"Complete Prisma Model Definitions"** section above (decision 2 here retains the rationale + reconciliation note).
   - Rationale: Stable `gr_XXXX` business keys keep progress/junction references intact across content edits (pre-adaptation Rule 1); explicit junction tables seed cleanly through the hash-gated delta sync (`syncGrammar`; see seed-pipeline idempotency rules); pre-segmented tokens avoid a runtime segmenter for a small curated dataset. A word token's `entityId` references the target Character/Word `content_id`, matching the `USED_IN_PATTERN` Word→GrammarPattern edge in `docs/knowledge-base/learning-theory/modeling-chinese-knowledge-graph.md`.
   - Alternatives considered: `relatedIds` JSON array (rejected — not relational); runtime segmentation via the readers `Segmenter` (rejected — overkill for reference examples).
   - Implications: Migration follows `prisma-schema-changes.instructions.md` (`npm run db:migrate`); seed steps must be added in dependency order. ⚠️ **Reconciliation note:** the current `Radical` model in `schema.prisma` stores its business key directly as `id` (`"rad_0001"`), and `Character` does the same (`"ch_1001"`), whereas the pre-adaptation target (and this spec) uses a uuid `id` + unique `content_id`. **Grammar models follow the pre-adaptation spec (user-confirmed).** The 22.1 backend engineer must (a) NOT mirror the Radical business-key-PK pattern for grammar, (b) FK grammar relations by `content_id` (not `id`), and (c) flag the Radical/Character drift to the platform's data-architecture owner — do **not** refactor Radical/Character within this story.

3. **Backend `grammar` module** (Story 22.2 — `apps/backend/src/modules/grammar/`: `api/`, `container.ts`, `index.ts`, `repositories/`, `services/`, `types/`) with `GET /v1/grammar/patterns` (query: `search`, `hskLevel`, `phase`, `page`, `pageSize`) and `GET /v1/grammar/patterns/:id` (pattern + examples + related; `:id` resolves by `content_id` `gr_XXXX`).
   - Rationale: Matches the modulith pattern used by `radicals`/`readers`/`characters`; keeps search/filter server-side and consistent.
   - Alternatives considered: Extending an existing module (rejected — grammar is a distinct content domain); folding the module into Story 22.1 (rejected — see decision 4).
   - Implications: Story 22.2 must add both paths verbatim to `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` and register the module in the app container.

4. **Story decomposition — 3 stories (Data / Backend API / UI)** —
   - Story 22.1 (Data): authoring JSON + Prisma models + migration + seed steps + manifest (declare `grammar` block + bump `entity_counts.grammar`).
   - Story 22.2 (Backend API): `modules/grammar/` + `ROUTE_PATTERNS` + manifest verification + backend tests.
   - Story 22.3 (UI): `features/grammar` + `GrammarPage` + `GrammarHub` + audio + hub linking + Storybook/tests.
   - Rationale: Isolates schema/module/route work from data authoring and from UI; each story is independently testable and reviewable; 22.2 unblocks any future consumer of grammar data (not just the UI); precedent: epic-21's dedicated `modules/characters/` story (21.10).
   - Alternatives considered: 2-story split (data+backend, UI — the original doc) — couples schema/module/route work with data authoring; monolith single story — too large.
   - Implications: Strict dependency chain 22.1 → 22.2 → 22.3; 22.3 can scaffold UI against MSW handlers before 22.2 ships; story files `story-22-1-grammar-data.md`, `story-22-2-grammar-backend-api.md`, `story-22-3-grammar-ui.md` scaffolded from templates at story kickoff.

5. **Frontend: custom `features/grammar` feature page** (not the shared `ContentBrowser`) — `GrammarPage` composes feature-specific components (`GrammarFilterBar`, `GrammarList`, `GrammarCard`, `GrammarHub`).
   - Rationale: `ContentBrowser` is used only at `/library` with a mock source and has **no detail-view wiring** (`ContentCard.onClick` is a no-op in `ContentBrowser`); its `ContentItem` shape (title/subtitle/translation/hskLevel/phase) cannot carry structure/examples/segments. The established pattern for real learn pages is a custom feature (see `pages/learn/radicals/RadicalsPage.tsx`, `features/readers/ReaderLibrary.tsx`).
   - Alternatives considered: Implementing a real `ContentSource` for `ContentBrowser` (rejected — would require extending `ContentItem`/`ContentCard`/detail flow; `ContentBrowser` stays the freeroam `/library` surface).
   - Implications: New feature folder `apps/frontend/src/features/grammar/`; page at `apps/frontend/src/pages/learn/grammar/GrammarPage.tsx`; route in `LearnRoutes.tsx` swaps `ContentPlaceholderPage` for `GrammarPage` wrapped in `PhaseGate requiredPhase={2}`.

6. **Detail view via LexicalHub `GrammarHub`** — register `grammar` in `entityHubRegistry` (lazy `import("features/grammar")`) so `openHub({ entityType: "grammar", entityId, label })` opens the pattern detail; example-word tokens call `openHub({ entityType: "character", entityId: <glyph>, label: <pinyin> })` — `segmentToEntityRef` translates the seed's content_id (`ch_20070`) → `segment.text` (the glyph 书) for `character`/`word`; other entity types stay content_id-keyed.
   - Rationale: The hub already owns entity detail with modal + navigation stack; `grammar` is already a valid `EntityType` with a `NotImplemented` placeholder.
   - Alternatives considered: Local expandable detail panel (rejected — duplicates hub; breaks word→character cross-linking).
   - Implications: All hub opens go through `openHub()` from `shared/hub-entry` — never direct `useHubStore` calls.

7. **Audio on-demand via shared audio manager** — each example sentence gets a play button backed by `useAudioItemPlayback().play(chinese, { textIsChinese: true })` → shared AudioManager → `POST /v1/tts` (optionalAuth, GCS-backed).
   - Rationale: Same mechanism as word audio and readers per-sentence audio; `POST /v1/tts` is `optionalAuth` so guests and users both work.
   - Alternatives considered: Stored/pre-generated audio fields in the data model (rejected — asset lifecycle complexity for a small reference dataset).
   - Implications: No data-model audio fields; audio is a pure UI concern in story 22.3.

8. **Phase gating: numeric Phase 2/3/4 + sidebar Learn-group unlock at Phase 2** — patterns carry `phase`; the `/learn/grammar` route is wrapped in `PhaseGate requiredPhase={2}` (mirrors readers at 3); the sidebar Learn-group item (`learnNav.ts` `requiredPhase: 2`) and `ContentBrowser`/`TabBar` phase maps already gate grammar at 2. Higher-phase patterns render as locked/preview cards (`isLocked` when `pattern.phase > currentPhase`) — the platform's "discovery, not gate" stance.
   - Rationale: The platform's phase model is numeric (backend `PhaseGate.currentPhase` via `usePhaseGate()`); "Basics/Advanced/Mastery" is not a codebase concept. Pattern placement follows the 4-phase progression in `docs/knowledge-base/learning-theory/adult-mandarin-learning-roadmap.md` (Core 300 → Network → Advanced Fluidity): Phase 2 = basic structures, Phase 3 = particles & conjunctions, Phase 4 = complex syntax (把/被); no grammar in Phase 1 (Blueprint).
   - Alternatives considered: "Basics/Advanced/Mastery" sub-tab switcher (rejected); strict server-side hiding of higher-phase patterns (rejected — platform favors discovery with lock states over hard gates).
   - Implications: No new phase vocabulary; reuses `usePhaseGate` and the existing sidebar Learn-group gating.

## Technical Challenges & Solutions

The primary pre-implementation risk is **linguistic accuracy of grammar explanations and example sentences** (Severity: High). The mitigation is architectural: author every pattern from the platform's authoritative grammar reference — §7 "Grammar Essentials", `docs/knowledge-base/mandarin/mandarin-fundamentals.md` — and place each pattern's phase per `docs/knowledge-base/learning-theory/adult-mandarin-learning-roadmap.md`. The story 22.1 authoring agent must not introduce pattern families outside §7 / the roadmap (see the BR Background pattern-set table). Human review of the seeded content is a hard gate before story 22.2 consumes it.

No other notable technical challenges (pre-implementation).

### Doc Truth-Check

- [x] Endpoints are **proposed** (do not exist yet) — `GET /v1/grammar/patterns` + `GET /v1/grammar/patterns/:id` must be added verbatim to `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` during story 22.2 before any frontend call.
- [x] Feature/module names verified: `apps/frontend/src/features/` has **no** `grammar` feature yet (new); `modules/grammar/` does not exist (new); `pages/learn/` has `foundations/`, `phonetic-clusters/`, `radicals/`, `readers/` — no `grammar/` yet; `features/lexical-hub`, `features/character-hub`, `features/readers`, `features/radicals` confirmed.
- [x] Scaffolding verified: `LearnRoutes.tsx` L49 `/learn/grammar` → `ContentPlaceholderPage`; `entityHubRegistry.tsx` L44 `grammar: NotImplemented`; `content/manifest.json` `grammar: 0` (content_types L9, entity_counts L19).
- [x] Data source claim (all-in-DB) matches `docs/guides/data/seed-pipeline.md` and `content/manifest.json` (grammar: 0; "authoring inventory only" note).
- [x] Business-key convention is `gr_XXXX` (e.g., `gr_0001`) per `pre-adaptation-static-dynamic-separation.md` Rule 1 — **no stale `gram_001` references remain**.
- [x] KB links resolve from this doc: `../../knowledge-base/mandarin/mandarin-fundamentals.md`, `../../knowledge-base/learning-theory/adult-mandarin-learning-roadmap.md`, `../../knowledge-base/backend/pre-adaptation-static-dynamic-separation.md`, `../../knowledge-base/data/shared-data-model.md`, `../../knowledge-base/learning-theory/modeling-chinese-knowledge-graph.md`; guides/conventions/practices links resolve.
- [x] All relative markdown links resolve (BR/IMP/story links; story files to be scaffolded at kickoff).
- [x] Last Update is current (August 7, 2026, same commit as the edit).

## Technical Implementation

### Architecture

```
content/seed/phase2/grammar-patterns.json   (authoring source — committed; Story 22.1)
        │ prisma/seed.ts (steps: GrammarPattern → GrammarExample → GrammarPatternRelation)
        ▼
Prisma: GrammarPattern (id + content_id gr_XXXX + content_version + metadata Json?)
        └─1─n─ GrammarExample (segments Json; references pattern content_id)
        └─n─m─ GrammarPatternRelation (explicit junction; references content_ids)
        │
        ▼
Backend modules/grammar/  repositories → services → controllers   (Story 22.2)
        │ GET /v1/grammar/patterns (?search&hskLevel&phase&page&pageSize)
        │ GET /v1/grammar/patterns/:id   (:id = content_id "gr_XXXX")
        ▼
Frontend features/grammar/                                          (Story 22.3)
  grammarService.ts (apiClient only here) → useGrammar() hook → GrammarPage
        │                                                       └─ GrammarFilterBar / GrammarList / GrammarCard
        ▼
LexicalHub (AppLayout modal)
  openHub({entityType:"grammar"}) → LexicalHubRouter → entityHubRegistry.grammar → GrammarHub
  openHub({entityType:"character"}) → entityHubRegistry.character → CharacterHub
        ▼
Audio: useAudioItemPlayback().play(chinese,{textIsChinese:true}) → POST /v1/tts (optionalAuth) → GCS
```

### API Endpoints (proposed — add to `ROUTE_PATTERNS` in story 22.2)

| Method | Endpoint                   | Auth         | Description                                                                                                                                                                                                                                       |
| ------ | -------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/v1/grammar/patterns`     | optionalAuth | List patterns. Query: `search` (matches name/structure/explanation/English examples), `hskLevel` (1–6), `phase` (2–4), `page`, `pageSize`. Response: `{ items: GrammarPatternSummary[], total }` (mirrors the `ContentSource.getItems` contract). |
| `GET`  | `/v1/grammar/patterns/:id` | optionalAuth | Pattern detail — `:id` resolves by `content_id` `gr_XXXX`. Response: `{ id: "gr_0001", name, structure, explanation, phase, hskLevel, examples: [{ chinese, pinyin, english, segments }], relatedPatterns: [{ id, name }] }`.                     |

### API Contract Details ➕ ADDED

**Error convention** (all endpoints): `backend-error-messages.instructions.md` shape `{ error, code }` where `error` = `"Failed to {action} {resource}"` and `code` ∈ `VALIDATION_ERROR` (400) | `NOT_FOUND` (404) | `INTERNAL_ERROR` (500). No extra fields.

#### `GET /v1/grammar/patterns` (optionalAuth) — list

Request — all query params optional and additive (AND); an empty query returns the full library paginated (the grammar landing page must browse unfiltered, unlike `characters/search` which requires a filter):

| Param      | Type   | Rules                                                                                                                                   | Default |
| ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `search`   | string | case-insensitive substring against `name` / `structure` / `explanation`, and against example `english` / `pinyin` (via `examples.some`) | —       |
| `hskLevel` | int    | 1–6; outside range → 400 `VALIDATION_ERROR`                                                                                             | —       |
| `phase`    | int    | 2\|3\|4; outside set → 400 `VALIDATION_ERROR`                                                                                           | —       |
| `page`     | int    | ≥1                                                                                                                                      | 1       |
| `pageSize` | int    | 1–100 (bounds mirror shared-constants `PAGINATION`)                                                                                     | 20      |

Response `200`:

```json
{
  "items": [
    {
      "id": "gr_0018",
      "name": "把 (bǎ) disposal construction",
      "structure": "Subj + 把 + Obj + Verb + Complement",
      "phase": 4,
      "hskLevel": 4,
      "sortOrder": 18,
      "exampleCount": 3,
      "previewExample": "我把书放在桌子上"
    }
  ],
  "total": 21,
  "page": 1,
  "pageSize": 20
}
```

Errors:

```json
// 400 — invalid filter (e.g. phase=5, hskLevel=0, page=0, pageSize=500)
{ "error": "Failed to load grammar patterns", "code": "VALIDATION_ERROR" }

// 500 — unexpected server error
{ "error": "Failed to load grammar patterns", "code": "INTERNAL_ERROR" }
```

#### `GET /v1/grammar/patterns/:id` (optionalAuth) — detail

`:id` resolves by **`content_id`** (`gr_XXXX`); the internal uuid is never a valid identifier.

Response `200`:

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
          "entityId": "ch_XXXX"
        }
      ]
    }
  ],
  "relatedPatterns": [
    { "id": "gr_0019", "name": "被 (bèi) passive construction", "relationType": "CONTRASTS_WITH" }
  ]
}
```

Errors:

```json
// 404 — unknown gr_XXXX
{ "error": "Failed to load grammar pattern", "code": "NOT_FOUND" }

// 500 — unexpected server error
{ "error": "Failed to load grammar pattern", "code": "INTERNAL_ERROR" }
```

### Component Relationships

**Frontend — Story 22.3 (`apps/frontend/src/features/grammar/`):**

- `services/grammarService.ts` — **NEW**: all `apiClient` calls (`ROUTE_PATTERNS.grammarPatterns`, `ROUTE_PATTERNS.grammarPatternById`); module-level cache (pattern: `radicalsService`).
- `hooks/useGrammar.ts` — **NEW**: load list/detail, loading/error/refetch, filter state (search/hsk/phase).
- `pages/learn/grammar/GrammarPage.tsx` — **NEW** page container: phase-aware (`usePhaseGate`), renders filter bar + list; opens detail via `openHub`.
- `components/GrammarFilterBar.tsx` — **NEW**: `SearchInput` + `FilterChip`/`Dropdown` for HSK + Phase; reuses shared components.
- `components/GrammarList.tsx` / `components/GrammarCard.tsx` — **NEW**: pattern cards (name, pinyin, structure, HSK badge, phase lock badge); loading skeleton / empty / error+retry states.
- `components/GrammarHub.tsx` — **NEW**: hub detail panel (structure, explanation, examples with Chinese/pinyin/English + play + clickable word tokens).
- `router/LearnRoutes.tsx` — **UPDATE**: replace `<ContentPlaceholderPage title="Grammar" />` with `<PhaseGate requiredPhase={2}><GrammarPage /></PhaseGate>`.

**LexicalHub (`apps/frontend/src/features/lexical-hub/entityHubRegistry.tsx`):**

- **UPDATE (22.3)**: `grammar: lazy(() => import("features/grammar").then(m => ({ default: m.GrammarHub })))` (replaces `NotImplemented`). `character`/`word`/`radical` entries unchanged.

**Backend — Story 22.2 (`apps/backend/src/modules/grammar/`):** `types/`, `repositories/` (Prisma queries with `search`/`hskLevel`/`phase` filters + pagination), `services/`, `api/` (controller + routes), `container.ts`, `index.ts` — registered in the app container.

**Data — Story 22.1 / 22.2:** `apps/backend/prisma/schema.prisma` (**UPDATE — 22.1**: 3 models with pre-adaptation fields + `gr_XXXX` keys), `apps/backend/prisma/seed.ts` (**UPDATE — 22.1**: 3 seed steps in dependency order), `content/seed/phase2/grammar-patterns.json` (**NEW — 22.1**: 21-pattern KB-sourced family), `content/manifest.json` (**UPDATE — 22.1**: declare `grammar` block + bump `entity_counts.grammar` ≥21; **VERIFY — 22.2**: confirm count/files, no edit).

### File Inventory ➕ ADDED

#### Story 22.1 — Grammar Data

- `content/seed/phase2/grammar-patterns.json` — **NEW**: authoring source (21 KB-sourced patterns, ≥3 examples each, `segments`, phase/HSK tags).
- `apps/backend/prisma/schema.prisma` — **UPDATE**: add `GrammarPattern`, `GrammarExample`, `GrammarPatternRelation` (pre-adaptation fields, `gr_XXXX` keys; see "Complete Prisma Model Definitions").
- `apps/backend/prisma/migrations/<timestamp>_add_grammar_models/` — **NEW** (generated via `npx prisma migrate dev --name add_grammar_models`).
- `apps/backend/prisma/seed.ts` — **UPDATE**: 3 seed steps in dependency order (Pattern → Example → Relation) + post-seed SQL verification.
- `scripts/validate-grammar-content.ts` — **NEW**: authoring-time content validation (mirrors `scripts/validate-radical-content.ts`).
- `content/manifest.json` — **UPDATE**: declare `grammar.files: ["grammar-patterns.json"]` + `served_via: "db"` **and** bump `entity_counts.grammar` to ≥21 after the seed populates (full manifest edit owned by 22.1; 22.2 only verifies). `served_via: "db"` is non-normative (was only stamped on the WS1 reference tables).

#### Story 22.2 — Grammar Backend API

- `apps/backend/src/modules/grammar/container.ts` — **NEW**: DI registration.
- `apps/backend/src/modules/grammar/index.ts` — **NEW**: barrel (re-exports types + classes).
- `apps/backend/src/modules/grammar/api/GrammarController.ts` — **NEW**: 2 GET endpoints, Zod validation, error mapping.
- `apps/backend/src/modules/grammar/api/grammarRoutes.ts` — **NEW**: route definitions (`ROUTE_PATTERNS.grammarPatterns`, `ROUTE_PATTERNS.grammarPatternById(":id")`).
- `apps/backend/src/modules/grammar/services/GrammarService.ts` — **NEW**: orchestration, validation, errors, optional module-level cache.
- `apps/backend/src/modules/grammar/repositories/GrammarRepository.ts` — **NEW**: Prisma queries (filters + pagination + detail includes).
- `apps/backend/src/modules/grammar/types/grammar.ts` — **NEW**: request/response types.
- `apps/backend/src/modules/grammar/**/__tests__/*.test.ts` — **NEW**: repo/service/controller unit tests.
- `apps/backend/src/app/container.ts` — **UPDATE**: register the grammar module.
- `apps/backend/src/app/routes.ts` — **UPDATE**: mount `grammarRoutes`.
- `apps/backend/src/shared/types/express.d.ts` — **UPDATE**: add `GrammarController` augmentation.
- `packages/shared-constants/src/index.js` — **UPDATE**: add `grammarPatterns: "/v1/grammar/patterns"`, `grammarPatternById: (id) => \`/v1/grammar/patterns/${id}\``.
- `packages/shared-constants/src/index.d.ts` — **UPDATE**: type declarations for both constants.
- `content/manifest.json` — **VERIFY** (no edit): confirm `entity_counts.grammar` ≥21 and `grammar.files` lists `grammar-patterns.json` (updated by 22.1).
- `apps/frontend/src/mocks/handlers/grammar-handlers.ts` — **NEW**: MSW handlers (Storybook + Vitest) for 22.3 (export `grammarHandlers` with a `default()` factory, matching `phoneticClustersHandlers`).
- `apps/frontend/src/mocks/server.ts` — **UPDATE**: import + register `grammarHandlers` (flatten `grammarHandlers.default()` alongside the existing handler modules).

#### Story 22.3 — Grammar UI

- `apps/frontend/src/features/grammar/index.ts` — **NEW**: barrel.
- `apps/frontend/src/features/grammar/types/grammar.ts` — **NEW**: frontend data types (`GrammarPattern`, `GrammarPatternSummary`, `GrammarExample`, `GrammarSegment`).
- `apps/frontend/src/features/grammar/services/grammarService.ts` — **NEW**: the ONLY file importing `apiClient`; module-level cache (pattern: `radicalsService`).
- `apps/frontend/src/features/grammar/hooks/useGrammar.ts` — **NEW**: list/detail load, loading/error/refetch, filter state.
- `apps/frontend/src/features/grammar/components/GrammarFilterBar.tsx` — **NEW**: `SearchInput` + `FilterChip` (HSK + Phase).
- `apps/frontend/src/features/grammar/components/GrammarList.tsx` — **NEW**: card list + loading/empty/error+retry.
- `apps/frontend/src/features/grammar/components/GrammarCard.tsx` — **NEW**: pattern card (name, structure, HSK badge, phase lock badge).
- `apps/frontend/src/features/grammar/components/GrammarHub.tsx` — **NEW**: hub detail panel (re-exported via the feature barrel).
- `apps/frontend/src/features/grammar/components/GrammarHub.stories.tsx` — **NEW**: hub Storybook story (MSW).
- `apps/frontend/src/pages/learn/grammar/GrammarPage.tsx` — **NEW**: page container.
- `apps/frontend/src/pages/learn/grammar/GrammarPageFull.stories.tsx` — **NEW**: page Storybook story (MSW; mirrors `pages/learn/readers/ReadersPageFull.stories.tsx`).
- `apps/frontend/src/pages/learn/foundations/index.ts` — **UPDATE**: re-export `GrammarPage`.
- `apps/frontend/src/router/LearnRoutes.tsx` — **UPDATE**: `PhaseGate requiredPhase={2}` + `GrammarPage` (replaces `ContentPlaceholderPage`).
- `apps/frontend/src/features/lexical-hub/entityHubRegistry.tsx` — **UPDATE**: `grammar` → lazy `GrammarHub`.
- `apps/frontend/src/mocks/handlers/grammar-handlers.ts` — **USED**: imported by Storybook + Vitest (created in 22.2).
- `apps/frontend/src/features/grammar/**/__tests__/*.test.ts(x)` — **NEW**: unit + integration tests.

### Implementation Plan

1. **Story 22.1 — Grammar Data**: Prisma models `GrammarPattern`/`GrammarExample`/`GrammarPatternRelation` (internal `id` + unique `content_id` `gr_XXXX` + `content_version` + `metadata Json?`) + migration; author `grammar-patterns.json` (21 KB-sourced patterns from the BR Background table, ≥3 examples each, phases 2–4, HSK tags, segmented tokens); add seed steps + re-seed + post-seed verification (SQL counts); declare the `grammar` block + bump `entity_counts.grammar` in `content/manifest.json`. Tests: seed idempotency + schema shape.
2. **Story 22.2 — Grammar Backend API**: `modules/grammar/` (types → repositories → services → api → container → index) + `GET /v1/grammar/patterns` + `GET /v1/grammar/patterns/:id` (by `content_id`); add `grammarPatterns`/`grammarPatternById` verbatim to `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js`; verify `content/manifest.json` (updated by 22.1); create `grammar-handlers.ts` and register it in `apps/frontend/src/mocks/server.ts`; register module in app container. Tests: repository/service/controller + route registration + seed re-run.
3. **Story 22.3 — Grammar UI**: `features/grammar` service + hooks + components; `GrammarPage` + route `PhaseGate(2)`; `GrammarHub` + `entityHubRegistry`; search/filter/lock states; audio via `useAudioItemPlayback`; clickable words → Character Hub; page/hub Storybook stories (MSW) + tests; pre-delivery checklist.

> **Ordering note:** Story 22.2 depends on 22.1 (seed + models); Story 22.3 depends on 22.2 (real endpoints). The `entityHubRegistry` `grammar` key and the `/learn/grammar` route already exist, so 22.3 can scaffold UI components against MSW handlers in parallel with 22.2 backend work, then switch to live endpoints once 22.2 lands.

### Testing

Per `testing-standards.instructions.md` (Testing Trophy):

- **Unit**: pure logic — grammar data mapping (`mapGrammarApiToData`), phase/lock derivation, token → `openHub` ref mapping.
- **Integration (MSW)**: `grammarService` (list filters, detail, error/retry, cache), `useGrammar` hook, `GrammarPage` (search/HSK/phase filtering, locked cards, loading/error/empty), `GrammarHub` (detail render, audio play, word-token → CharacterHub open), `LearnRoutes` phase-gate redirect.
- **Backend (Story 22.2)**: repository filters + pagination, service validation, controller route registration (incl. resolution by `content_id`); idempotent seed re-run.
- **Static**: `npm run build` (type-check incl. test graph), `npm run lint`, design lint, `frontend-pre-delivery-checklist.instructions.md`.
- **Storybook**: `GrammarPageFull` + `GrammarHub` stories with MSW handlers (mirror `ReadersPageFull.stories.tsx`); `npm run test-storybook`.

#### Testing Matrix (per story) ➕ ADDED

| Tier                | 22.1 Grammar Data                                                                                                                         | 22.2 Grammar Backend API                                                                                                                              | 22.3 Grammar UI                                                                                                                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unit**            | content-shape validation helpers (phase ∈ {2,3,4}, hskLevel 1–6, `gr_XXXX` regex, segments schema); `scripts/validate-grammar-content.ts` | repository filter-building logic; service validation (phase/hskLevel/page/pageSize bounds); response mappers                                          | `mapGrammarApiToData`; phase/lock derivation (`isLocked`); segment → `openHub` ref mapping                                                                                                                                                                            |
| **Integration**     | seed idempotency re-run (seed twice → identical counts); post-seed SQL count + FK-integrity verification                                  | repository + service + controller against test DB; route registration (`ROUTE_PATTERNS` verbatim); detail resolves by `content_id`; 404/400/500 paths | `grammarService` (list filters, detail, error/retry, cache); `useGrammar` hook; `GrammarPage` (search/HSK/phase, locked cards, loading/empty/error); `GrammarHub` (detail render, audio play, word-token → CharacterHub); `LearnRoutes` phase-gate redirect — all MSW |
| **Storybook (MSW)** | —                                                                                                                                         | `grammar-handlers.ts` scaffolded + registered in `src/mocks/server.ts` (consumed by 22.3)                                                             | `GrammarPageFull` + `GrammarHub` stories (mirror `ReadersPageFull.stories.tsx`); `npm run test-storybook`                                                                                                                                                             |
| **Static**          | `npm run build` (type-check incl. test graph), `npm run lint`                                                                             | `npm run build`, `npm run lint`, backend type-check                                                                                                   | `npm run build`, `npm run lint`, `npx @google/design.md lint DESIGN.md`, `npm run design-audit`, `frontend-pre-delivery-checklist.instructions.md`                                                                                                                    |

## Stories 22.4 & 22.5 (frontend follow-ups)

> These two frontend-only stories land after 22.1–22.3 and each have their own implementation doc.

**Story 22.4 — Sidebar Navigation and Account** — **Status: ✅ Complete** (Aug 5, 2026). See `story-22-4-sidebar-navigation-and-account.md`. Moved Learn tabs from the `LearnLayout` TopNav into a phase-gated "Learn" group in `SideNav`; introduced `UserMenu` + `AppTopBar` as the single account surface; added `/profile`, `/settings`; auth return-to-origin/redirect affordances.

**Story 22.5 — Search-Param Nav Sync** — **Status: ✅ Complete** (Aug 6, 2026). See `story-22-5-search-param-nav-sync.md`.

- **Problem:** tabs and side-menu navigation were out of sync — sidebar Learn links were path-only, so navigating from a sub-state (`?tab=tones`) dropped it, and cross-route sub-state leaked.
- **Persistence rule (canonical, in `searchParams.ts` header):** params are route-scoped (no cross-route persistence); sub-state writes (`tab`/`view`/`mode`/`page`/`q`/`hsk`/`phase`) use `replace: true` (Back exits the page); session starts `push`; same-page sidebar clicks are a no-op that preserves sub-state.
- **Key changes:** `searchParams.ts` — `SearchParamInput` + `buildSearchParams` (pure, omit logic extracted); `useSearchParamState.ts` — `useSearchParamsBatch()` (`replaceParams`/`pushParams`, atomic multi-param write); `learnNav.ts` — optional `defaultParams` (bare-canonical landing, no values today); `SideNav.tsx` — `location` prop + same-path guard (`guardSamePath`), Learn child `to = withSearchParams(path, defaultParams)`, Learn group header label → `/learn/foundations` (chevron stays the toggle); `AppLayout.tsx` passes full `location`.
- **Custom history rejected** (Architect): RR `replace: true` already coalesces param changes into one entry — "Back exits page" is the correct built-in semantic.
- **Gates:** all 6 pass (build / lint / design-audit / check:registry-stories / `npm test` / test-storybook) — see `verification-artifacts/story-22-5-gate-results.md`. **Browser check:** 5/5 pass — `verification-artifacts/story-22-5-browser-check.md` (+ screenshots).

## Deferred

Deferred work recorded at close — none blocks the epic; each is appropriate follow-up work:

1. **ContentBrowser / TabBar migration** — refactor `ContentBrowser` + `TabBar` onto the search-param convention (`useSearchParamState` / `useSearchParamsBatch`) so they stop bypassing it.
2. **Grammar `?q` / `?hsk` / `?phase` seeding** — seed Grammar filter state from the URL (`q`/`hsk`/`phase` search params).
3. **Readers `?mode`** — migrate the Readers mode to the search-param convention.
4. **TopNav removal** — the orphaned `TopNav` (kept in barrel/registry after the `LearnLayout` change) removed from the codebase.
5. **Rail sub-state title** — the collapsed `SideNav` rail does not yet surface the current Learn sub-state title.
6. **Mobile drawer** — the mobile navigation drawer (≤768px icon rail) is future-proofed in the shell but not implemented; the `AppTopBar`/`UserMenu` shell is desktop-first.

## Implementation notes

- Conventions: follow `docs/guides/conventions/frontend.md`, `docs/guides/conventions/backend.md`, and `docs/knowledge-base/practices/solid-principles.md`.
- Data: follow `docs/guides/data/seed-pipeline.md` (all-in-DB) and `prisma-schema-changes.instructions.md`.
- **KB grounding (apply in every story):**
  - `docs/knowledge-base/mandarin/mandarin-fundamentals.md` §7 — authoritative grammar inventory (SVO, topic-comment, no inflection, aspect particles 了/着/过/正在, measure words, 的/地/得, question formation, serial verbs, pro-drop); §8 — "sentence patterns" is step 5 of the learning order (why the tab unlocks at Phase 2).
  - `docs/knowledge-base/learning-theory/adult-mandarin-learning-roadmap.md` — phase placement: 2 = basic structures, 3 = particles & conjunctions, 4 = complex syntax (把/被); no grammar in Phase 1.
  - `docs/knowledge-base/backend/pre-adaptation-static-dynamic-separation.md` — Rule 1 business keys `gr_XXXX`; internal `id` + unique `content_id` + `content_version` + `metadata Json?`.
  - `docs/knowledge-base/data/shared-data-model.md` — Grammar as a recognized content entity; relations in DB junction tables.
  - `docs/knowledge-base/learning-theory/modeling-chinese-knowledge-graph.md` — `(:GrammarPattern)` node; `USED_IN_PATTERN` Word→GrammarPattern edge (token `entityId` = target `content_id`).
- Frontend API: mandatory service layer (`frontend-api-client.instructions.md`) — `apiClient` only in `features/grammar/services/grammarService.ts`.
- Hub entry: use `openHub()` from `shared/hub-entry` everywhere; never call `useHubStore` directly from components.
- Audio: reuse `useAudioItemPlayback`; do not add audio fields to the data model.
- Component reuse: check `src/shared/components/` and `.github/component-registry.json` (Card, FilterChip, Tabs, SearchInput, ErrorScreen, LoadingScreen, Skeleton) before creating new UI.
- Phase gating: source is `usePhaseGate()` → `/v1/progression/phase-gate` (numeric), not `userStore`.
- Testing: `testing-standards.instructions.md` (Testing Trophy) — unit for pure logic, integration (MSW) for services/pages/hub, Storybook stories for pages.
- Story files to scaffold from templates: `story-22-1-grammar-data.md`, `story-22-2-grammar-backend-api.md`, `story-22-3-grammar-ui.md` (both BR + IMP variants), linked bidirectionally.
