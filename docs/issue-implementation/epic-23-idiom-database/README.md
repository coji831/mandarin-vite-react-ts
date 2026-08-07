# Epic 23: Chengyu (Idiom) Narratives — Implementation

**BR Reference:** `../../business-requirements/epic-23-idiom-database/README.md`

**Status:** In Progress (Stories 23.1–23.3 complete; epic closure pending)

**Last Update:** August 8, 2026

## Epic Summary

**Goal:** Ship the narrative chengyu library end-to-end on the all-in-DB pipeline across three stories (Chengyu Data / Chengyu Backend API / Chengyu UI): authoring JSON + Prisma models + seed + manifest declare/count + validation script (23.1), a backend `chengyu` module + two endpoints + manifest verification (23.2), and a Phase-4-gated `/learn/chengyu` page with search/theme/era filters, a `ChengyuHub` detail panel with related-idiom cross-links, TTS audio, and character cross-linking (23.3).

**Key Points:**

- **CC-CEDICT-extracted + curated + enriched content.** The 50+ idiom set is extracted from CC-CEDICT (`content/seed/phase1/cc-cedict-entries.json` — idiom/pinyin/literal+figurative English, CC BY-SA 4.0), curated to a shortlist seeded from KB §6.2 (§6 "Chengyu (Idioms)", `mandarin-fundamentals.md` — the **family-seed authority**), and enriched with `story` authored from the Chinese Wiktionary 詞源 quote verified against zh Wikisource plus authored `era`/`theme`/`example`; attribution via `content/seed/ATTRIBUTION.md`. Staged at Phase 4 per the adult-learning roadmap (`adult-mandarin-learning-roadmap.md`) — 70% story / 30% linguistic application.
- **All-in-DB (not static JSON — adopted Option A, mirrors Epic 22):** authoring source `content/seed/phase2/chengyu.json` → `prisma/seed.ts` → Prisma tables → backend `chengyu` module → API. No runtime JSON reads.
- **New models (Story 23.1):** `Chengyu`, `ChengyuExample` (with pre-segmented clickable tokens), `ChengyuRelation` (explicit junction for related-idiom cross-links, mirrors `GrammarPatternRelation`). Content models follow the pre-adaptation field pattern (full definition in story-23.1 IMP `Architecture Decision (models)`).
- **Shipped endpoints (Story 23.2):** `GET /v1/chengyu/idioms` and `GET /v1/chengyu/idioms/:id` (resolves by `content_id` `cy_XXXX`), added verbatim to `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (+ `index.d.ts`). The `content/manifest.json` `chengyu` block + count (0 → ≥50) are declared/bumped by Story 23.1; 23.2 verifies them (no edit).
- **Frontend is a custom feature (Story 23.3):** `features/chengyu` (service → hooks → components → types) rendered by `pages/learn/chengyu/ChengyuPage.tsx`, replacing the `ContentPlaceholderPage` at `/learn/chengyu` and wrapped in route-level `PhaseGate requiredPhase={4}`. The route, sidebar Learn-group item (`requiredPhase: 4`), and hub `chengyu` entity already exist as placeholders.
- **Detail view is a `ChengyuHub`** registered in `entityHubRegistry` (hub `chengyu` key currently `NotImplemented`); related-idiom cross-links render from `ChengyuRelation`; the idiom's 4 characters and example tokens open the `character`/`word` hubs via `openHub()`.
- **Audio is on-demand** via the shared audio manager (`useAudioItemPlayback` → `POST /v1/tts`, optionalAuth) — no audio fields in the data model.
- **Phase gating reuses numeric Phase 4** + the existing sidebar Chengyu item; the route gains `PhaseGate requiredPhase={4}` (mirrors readers at 3, grammar at 2).

**Status:** In Progress (Stories 23.1–23.3 complete; epic closure pending)

**Last Update:** August 8, 2026

## Technical Overview

This epic implements chengyu reference content across data, backend, and frontend layers, split into three stories that mirror the layered pipeline (content → DB → API → UI) and Epic 22's proven 3-story decomposition (see AD-2).

- **Story 23.1 (Chengyu Data)** — CC-CEDICT extraction + curation + enrichment, authoring source + Prisma models + migration + seed steps + validation script + manifest declare/count + attribution. → `story-23-1-chengyu-data.md`
- **Story 23.2 (Chengyu Backend API)** — `modules/chengyu/` + two endpoints + `ROUTE_PATTERNS` + manifest verification + MSW handlers. → `story-23-2-chengyu-backend-api.md`
- **Story 23.3 (Chengyu UI)** — `features/chengyu` + Phase-4-gated page + `ChengyuHub` + search/theme/era filters + audio + cross-links. → `story-23-3-chengyu-ui.md`

All existing scaffolding (route, sidebar item, hub entity) is reused — only the placeholder is replaced.

## Architecture Decisions

1. **All-in-DB data delivery (supersedes the original "static JSON in `public/data/`" plan — adopted Option A, mirrors Epic 22)** — Chengyu content is authored in `content/seed/phase2/chengyu.json`, seeded into Prisma by `prisma/seed.ts` (hash-gated delta sync via `syncChengyu`, mirroring `syncGrammar`), validated by `scripts/validate-chengyu-content.ts`, and served by a new backend `chengyu` module.
   - Rationale: **Delta over the epic BR "Data source" decision** (which carries the full rationale: canonical `seed-pipeline.md` all-in-DB, `manifest.json` declares `chengyu` count 0, shared-data-model entity, Epic 22 precedent, static-JSON plan rejected). Implementation-specific additions: hash-gated delta sync via `syncChengyu` (see story-23.1 IMP) and an authoring-time validation script guard content quality before seeding.
   - Alternatives considered: Static JSON in `public/data/chengyu/` (original doc plan — rejected); client-side JSON imports from `content/`.
   - Implications: Requires schema migration, seed steps, a validation script, and a backend module + tests; enables server-side search/filter and future relational growth (idiom ↔ character/word links via `content_id`).

2. **Story decomposition — 3 stories (Chengyu Data / Chengyu Backend API / Chengyu UI), mirroring Epic 22** —
   - Story 23.1 (Data): authoring JSON + Prisma models + migration + seed steps + validation script + manifest (declare `chengyu` block + bump `entity_counts.chengyu`).
   - Story 23.2 (Backend API): `modules/chengyu/` + `ROUTE_PATTERNS` + manifest verification + MSW handlers + backend tests.
   - Story 23.3 (UI): `features/chengyu` + `ChengyuPage` + `ChengyuHub` + audio + hub cross-links + Storybook/tests.
   - Rationale: **Delta over the epic BR "Story decomposition" decision**, which carries the canonical rationale for revising the earlier 2-story scope. Implementation-specific: each story is independently testable/reviewable, and 23.2 unblocks any future consumer of chengyu data.
   - Alternatives considered: 2-story split and monolith single story — rejection rationale in the epic BR "Story decomposition" decision.
   - Implications: Strict dependency chain 23.1 → 23.2 → 23.3; 23.3 scaffolds UI against MSW handlers (scaffolded by 23.2) before 23.2 ships; story files `story-23-1-chengyu-data.md`, `story-23-2-chengyu-backend-api.md`, `story-23-3-chengyu-ui.md`.

3. **Phase gating: numeric Phase 4** — the `/learn/chengyu` route is wrapped in `PhaseGate requiredPhase={4}` (mirrors readers at 3, grammar at 2); the sidebar Learn-group Chengyu item is already `requiredPhase: 4` (`learnNav.ts`).
   - Rationale: **Delta over the epic BR "Phase gating" decision** (full rationale there: Phase 4 roadmap item, §8 step 7 after passages, sidebar item `requiredPhase: 4`). IMP-specific: the platform's phase model is numeric — sourced from `usePhaseGate()` → `/v1/progression/phase-gate` (backend `PhaseGate.currentPhase`), never `userStore`.
   - Alternatives considered: Earlier phase (rejected — KB difficulty #4); no gate (rejected — contradicts the roadmap).
   - Implications: No new phase vocabulary; reuses `usePhaseGate` and the existing sidebar item.

**Per-story decisions moved to the owning story IMP (single-residence):** see **Spec residence** under Technical Implementation — Prisma/schema → story-23.1 IMP, API contracts → story-23.2 IMP, frontend/hub → story-23.3 IMP.

## Technical Challenges & Solutions

The primary pre-implementation challenge is **cultural/historical accuracy of idiom origin stories** (Severity: High), mitigated by authoring every `story` from the idiom's classical Chinese source text with a `storySource` citation and gating human review before the UI consumes the narratives. Seed mechanism: **hash-gated delta sync** (see story-23.1 IMP). No other notable technical challenges (pre-implementation).

### Doc Truth-Check

- [x] Endpoints exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`): `chengyuIdioms: "/v1/chengyu/idioms"` and `chengyuIdiomById: (id) => \`/v1/chengyu/idioms/${id}\``(declared in`index.d.ts`) — **shipped in story 23.2** (`apps/backend/src/modules/chengyu/`); naming mirrors the existing `grammarPatterns`/`grammarPatternById` constants.
- [x] Feature/module names verified: `apps/backend/src/modules/` **has** `chengyu/` (shipped in story 23.2); `apps/frontend/src/features/` has **no** `chengyu` feature yet (new, 23.3); `pages/learn/` has `foundations/`, `phonetic-clusters/`, `radicals/`, `readers/`, `grammar/` — no `chengyu/` yet (new, 23.3); `features/lexical-hub` `entityHubRegistry.tsx` `chengyu: NotImplemented`.
- [x] Scaffolding verified: `LearnRoutes.tsx` `/learn/chengyu` → `<ContentPlaceholderPage title="Chengyu" />` (no phase gate yet — story 23.3 adds `PhaseGate requiredPhase={4}`); `learnNav.ts` chengyu item `requiredPhase: 4` (already present); `paths.ts` `learn_chengyu` constant (already present); `apps/frontend/src/shared/types/hub.ts` `EntityType` already includes `"chengyu"` (no change needed); `content/manifest.json` `chengyu` block declared + `entity_counts.chengyu` bumped to 55 by Story 23.1 (content_types + entity_counts).
- [x] Data source claim matches the code: idiom/pinyin/literal+figurative English are **extracted from CC-CEDICT** — `data/CC-CEDICT/cedict_1_0_ts_utf-8_mdbg.txt` → `content/seed/phase1/cc-cedict-entries.json` (existing generator `apps/backend/scripts/generate/cc-cedict-entries.ts`); pinyin conversion via `numberedToToneMark` (`apps/backend/src/shared/utils/pinyinFormatUtils.ts`); `characters.json` glyph→id lookup (釜 = `ch_46225`, not codepoint); `pinyin-syllables.json` exists in `phase2/`. Delivery is all-in-DB per `docs/guides/data/seed-pipeline.md` and `content/manifest.json` (chengyu: 55; "authoring inventory only" note). Seed layout: `content/seed/` has `curated/`, `phase1/`, `phase2/` — `chengyu.json` is added to the **existing canonical seed dir `content/seed/phase2/`** (no new directory; `phase2/` is the aggregate-JSON pipeline stage, not a learning-phase gate). Seed mechanism is **hash-gated delta sync** via `syncChengyu` (see story-23.1 IMP).
- [x] Attribution/license claims verified: `content/seed/ATTRIBUTION.md` (shipped in story 23.1) cites CC-CEDICT + Chinese Wiktionary 詞源 + zh Wikisource (each CC BY-SA 4.0) and records authored `story`/`example` prose as original project work; `chengyu.json` `_comment` points to it; no restricted-source (ctext.org / zdic/漢典 / pwxcoo) text ships.
- [x] Business-key convention is `cy_XXXX` (e.g., `cy_0005`) per `pre-adaptation-static-dynamic-separation.md` Rule 1 — no stale `chengyu_001`/other references.
- [x] Audio naming verified: `useAudioItemPlayback` + `useAudioManager` in `apps/frontend/src/shared/hooks/`; `shared/audio` (AudioManager) in `apps/frontend/src/shared/audio/`; `POST /v1/tts` = `ROUTE_PATTERNS.ttsAudio`, `optionalAuth` in `modules/audio/api/audioRoutes.ts`.
- [x] KB links resolve from this doc: `../../knowledge-base/mandarin/mandarin-fundamentals.md`, `../../knowledge-base/learning-theory/adult-mandarin-learning-roadmap.md`, `../../knowledge-base/backend/pre-adaptation-static-dynamic-separation.md`, `../../knowledge-base/data/shared-data-model.md`, `../../knowledge-base/learning-theory/modeling-chinese-knowledge-graph.md`; guides/conventions/practices links resolve.
- [x] All relative markdown links resolve (BR/IMP/story links; the 3 story files exist in both BR and IMP folders).
- [x] Last Update is current (August 8, 2026, same commit as the edit).

## Technical Implementation

### Architecture

```
content/seed/phase2/chengyu.json   (authoring source — committed; Story 23.1; added to existing `phase2/` seed dir)
        │ scripts/validate-chengyu-content.ts (authoring-time validation; Story 23.1)
        │ prisma/sync-helpers.ts syncChengyu → prisma/seed.ts (hash-gated delta sync; Story 23.1)
        ▼
Prisma: Chengyu (content_id cy_XXXX) ─1─n─ ChengyuExample (segments Json)
        └─n─m─ ChengyuRelation (explicit junction)             (Story 23.1)
        ▼
Backend modules/chengyu/  repositories → services → controllers   (Story 23.2)
        │ GET /v1/chengyu/idioms (?search&theme&era&page&pageSize)
        │ GET /v1/chengyu/idioms/:id   (:id = content_id "cy_XXXX")
        ▼
Frontend features/chengyu/                                          (Story 23.3)
  chengyuService.ts (apiClient only here) → useChengyu() hook → ChengyuPage
        │      ← MSW handlers (chengyu-handlers.ts, scaffolded by 23.2)
        ▼
LexicalHub (AppLayout modal)
  openHub({entityType:"chengyu"}) → LexicalHubRouter → entityHubRegistry.chengyu → ChengyuHub
  openHub({entityType:"character"|"word"}) → CharacterHub/WordHub
        ▼
Audio: useAudioItemPlayback().play(chinese,{textIsChinese:true}) → POST /v1/tts (optionalAuth) → GCS
```

**Spec residence (single-residence per consistency rules):**

- Prisma models (`Chengyu`/`ChengyuExample`/`ChengyuRelation` DDL + `segments` token schema + migration) → `story-23-1-chengyu-data.md` IMP
- API endpoint contracts (full request/response JSON + error convention) → `story-23-2-chengyu-backend-api.md` IMP
- Frontend component inventory + hub/audio wiring → `story-23-3-chengyu-ui.md` IMP

## Implementation notes

- Conventions: follow `docs/guides/conventions/frontend.md`, `docs/guides/conventions/backend.md`, and `docs/knowledge-base/practices/solid-principles.md`.
- Data: follow `docs/guides/data/seed-pipeline.md` (all-in-DB) and `prisma-schema-changes.instructions.md`.
- **Data sourcing & KB grounding (apply in every story):**
  - **Data source:** CC-CEDICT (`content/seed/phase1/cc-cedict-entries.json`, CC BY-SA 4.0) for idiom/pinyin/literal+figurative English; Chinese Wiktionary 詞源 + zh Wikisource for `story`/`storySource` grounding; attribution in `content/seed/ATTRIBUTION.md` (see story-23.1 IMP "Enrichment — draft generation" / "Attribution").
  - `docs/knowledge-base/mandarin/mandarin-fundamentals.md` §6 — authoritative chengyu **family seed** (definition, structural patterns 并列/主谓/动宾/偏正, example family, related forms out of scope); §8 — "chengyu & classical Chinese" is step 7 of the learning order (why the sidebar Learn-group Chengyu item unlocks at Phase 4).
  - `docs/knowledge-base/learning-theory/adult-mandarin-learning-roadmap.md` — Phase 4 (Advanced Fluidity) placement; 70% story / 30% linguistic application.
  - `docs/knowledge-base/backend/pre-adaptation-static-dynamic-separation.md` — Rule 1 business keys `cy_XXXX`; the pre-adaptation field pattern (full definition in story-23.1 IMP).
  - `docs/knowledge-base/data/shared-data-model.md` — Chengyu as a recognized content entity.
  - `docs/knowledge-base/learning-theory/modeling-chinese-knowledge-graph.md` — `(:Chengyu)` node ("4-character idiom with origin story and theme"); cross-link tokens by `content_id`.
- Frontend API: mandatory service layer (`frontend-api-client.instructions.md`) — `apiClient` only in `features/chengyu/services/chengyuService.ts`.
- Hub entry: use `openHub()` from `shared/hub-entry` everywhere; never call `useHubStore` directly from components.
- Audio: reuse `useAudioItemPlayback` (→ `POST /v1/tts`, optionalAuth); do not add audio fields to the data model.
- Component reuse: check `src/shared/components/` and `.github/component-registry.json` (Card, FilterChip, Tabs, SearchInput, ErrorScreen, LoadingScreen, Skeleton) before creating new UI.
- Phase gating: source is `usePhaseGate()` → `/v1/progression/phase-gate` (numeric), not `userStore`.
- Testing: `testing-standards.instructions.md` (Testing Trophy) — unit for pure logic, integration (MSW) for services/pages/hub, Storybook stories for pages.
- Story files scaffolded from templates: `story-23-1-chengyu-data.md`, `story-23-2-chengyu-backend-api.md`, `story-23-3-chengyu-ui.md` (BR + IMP variants), linked bidirectionally (epic BR ↔ epic IMP ↔ story files).
