# Epic 23: Chengyu (Idiom) Narratives

## Epic Summary

**Goal:** Provide a narrative-driven, searchable library of common Chinese idioms (chengyu) where learning happens through storytelling — 70% historical/cultural context, 30% linguistic application — delivered end-to-end on the platform's all-in-DB pipeline.

**Key Points:**

- **CC-CEDICT-extracted + curated idiom set (KB-seeded).** The dataset is extracted from **CC-CEDICT** (idiom string, pinyin, literal + figurative English; CC BY-SA 4.0), curated to a common **50+ shortlist seeded from KB §6.2** of the Mandarin fundamentals KB (`docs/knowledge-base/mandarin/mandarin-fundamentals.md` — the **family-seed authority**, not the data source), and enriched with narrative `story` authored from the Chinese Wiktionary 詞源 quote verified against zh Wikisource, plus authored `era`/`theme`/`example`; staged at **Phase 4** per the adult-learning roadmap (`docs/knowledge-base/learning-theory/adult-mandarin-learning-roadmap.md`), which defines "Chengyu (Idiom) Narratives" as 70% story / 30% linguistic application.
- **50+ common idioms** (target ≥50), each with a 4-character `chengyu`, pinyin, literal + figurative English meanings, a **narrative origin story** (`story`) with a `storySource` citation, `era` + `theme` tags, and ≥1 modern-usage example sentence (Chinese, pinyin, English, pre-segmented clickable tokens) — example cardinality is ≥1/idiom (vs grammar's ≥3) because the idiom itself is the primary learning object, while the pipeline mirrors Epic 22's architecture exactly.
- **Narrative-first detail view** — a new `ChengyuHub` in the LexicalHub presents historical context → literal meaning → figurative meaning → modern usage, with related-idiom cross-links (junction mirrors `GrammarPatternRelation`).
- **Theme and era filters** (e.g., Self-deception, Spring & Autumn period, Love stories) with server-side `search`/`theme`/`era` filtering + pagination.
- **All-in-DB content pipeline (adopted — mirrors Epic 22):** idioms are authored in `content/seed/phase2/chengyu.json` (in the canonical `content/seed/phase2/` seed directory), seeded into Prisma (`Chengyu`/`ChengyuExample`/`ChengyuRelation`), validated by `scripts/validate-chengyu-content.ts`, and served by a new backend `chengyu` module via API — consistent with the platform's canonical all-in-DB architecture and the shared data model's `cy_XXXX` business-key convention.
- **Phase 4 content** — requires the Simplified Chinese foundation from Phases 1–3; the `/learn/chengyu` route is gated with `PhaseGate requiredPhase={4}` and the sidebar Learn-group Chengyu item is already `requiredPhase: 4`.
- **Audio on demand** — full idiom + example sentences via the shared audio manager (`useAudioItemPlayback` → `POST /v1/tts`, optionalAuth); no stored audio fields.
- **No progress tracking** — pure reference and cultural learning; `content_version` + `metadata` pre-adaptation fields are the seam for future progress work.

**Status:** In Progress (Stories 23.1–23.3 complete; epic closure pending)

**Last Update:** August 8, 2026

## Background

Learners can study characters, radicals, pinyin/tones/strokes, words, grammar patterns, and graded readers, but there is no **cultural-historical layer** — the stories behind 4-character idioms that carry classical Chinese (文言文) meaning. Chengyu are both a difficulty point (they "require classical Chinese knowledge" — §8, `mandarin-fundamentals.md`) and a natural Phase 4 capstone: by the time a learner reaches Advanced Fluidity they have the character, word, and grammar foundations to read an idiom's origin story and its modern usage.

**Pedagogical foundation (authoring authority).** The platform's authoritative Mandarin reference for idioms is §6 "Chengyu (Idioms)" of the Mandarin fundamentals KB (`docs/knowledge-base/mandarin/mandarin-fundamentals.md`): chengyu are traditional idiomatic expressions, **typically 4 characters**, derived from classical Chinese literature; ~5,000 in common use; structured as 并列 (parallel), 主谓 (subject-predicate), 动宾 (verb-object), or 偏正 (modifier-head). Its §6.2 example table (破釜沉舟, 画蛇添足, 瓜田李下) seeds the idiom family this epic authors (the KB is the **family-seed authority** for the set), and §6.3 distinguishes the related forms (惯用语 / 歇后语 / 谚语) that are **out of scope**. Its §8 "Typical Learning Order" places **chengyu & classical Chinese at step 7** — after passages — which is exactly why the sidebar Learn-group Chengyu item unlocks at **Phase 4** (Advanced Fluidity) rather than earlier. The idiom strings, pinyin, and literal/figurative English are **extracted from CC-CEDICT** (`content/seed/phase1/cc-cedict-entries.json`, CC BY-SA 4.0), and origin stories are authored from **Chinese Wiktionary 詞源 quotes verified against zh Wikisource** (CC BY-SA 4.0) — attribution is carried in `content/seed/ATTRIBUTION.md`.

**Phase staging.** Per the 4-phase roadmap (`docs/knowledge-base/learning-theory/adult-mandarin-learning-roadmap.md` — Blueprint → Core 300 → Network → Advanced Fluidity), chengyu is a **Phase 4** item ("Chengyu (Idiom) Narratives: 4-character idioms taught through storytelling — 70% historical context story, 30% linguistic application"). The sidebar Learn group already lists Chengyu at `requiredPhase: 4` (`apps/frontend/src/shared/constants/learnNav.ts`), and the `/learn/chengyu` route already exists as a `ContentPlaceholderPage` (`apps/frontend/src/router/LearnRoutes.tsx`) — this epic wires the real page behind a route-level `PhaseGate requiredPhase={4}` (**shipped in Story 23.3**: the route is now `<PhaseGate requiredPhase={4}><ChengyuPage /></PhaseGate>`).

**Data-sourced idiom set (CC-CEDICT + Wikimedia).** The seed dataset authors the following idiom family — **50+ common idioms (target ≥50)** curated from a **shortlist of 60–80** seeded by the KB §6.2 example idioms plus common chengyu, with idiom strings, pinyin, and literal/figurative English **extracted from CC-CEDICT by the phase-1 generator** (`cc-cedict-entries.ts` → `content/seed/phase1/cc-cedict-entries.json`), then **filtered/curated in the phase-2 enrich stage** by `extract-chengyu-candidates.ts` (exactly-4-char filter widening on `lit.`/`fig.` beyond the incomplete `(idiom)` tag). Each idiom carries a **narrative origin story** (`story`) authored from the idiom's Chinese Wiktionary 詞源 quote **verified against zh Wikisource**, with a `storySource` citation in the canonical `《<work>·<juan>·<chapter>》(zh.wikisource.org/wiki/<path>)` form (the authoring agent must verify each narrative against the primary text; no unverifiable origin stories). The story-23.1 authoring agent may expand within this shortlist but must not introduce non-chengyu forms (惯用语 / 歇后语 / 谚语 are explicitly out of scope).

| Example idiom | Pinyin          | Literal meaning          | Figurative meaning    | Theme                 | Era                |
| ------------- | --------------- | ------------------------ | --------------------- | --------------------- | ------------------ |
| 破釜沉舟      | pò fǔ chén zhōu | Break pots, sink ships   | Burning one's bridges | Determination         | Qin–Han transition |
| 画蛇添足      | huà shé tiān zú | Draw a snake, add feet   | Gilding the lily      | Self-defeating excess | Warring States     |
| 瓜田李下      | guā tián lǐ xià | Melon field, under plums | Avoiding suspicion    | Propriety             | Han                |

Themes are tagged per idiom (e.g., Self-deception, Perseverance, Love, Wisdom, Ambition) and eras follow the idiom's source period (e.g., Spring & Autumn, Warring States, Han, Three Kingdoms) — both become filter dimensions. **Authoring note:** the `theme` and `era` tags are **new authoring decisions** for this epic — grounded in each idiom's classical source text and `storySource` — not facts lifted from KB §6.2 (which records only the idiom family, pinyin, and literal/figurative meanings).

**Market context.** Chengyu references (dictionaries, static idiom lists) typically present idioms as flat dictionary entries. This feature differentiates by integrating with existing systems: narrative-first detail, theme/era discovery, Character Hub cross-linking (each of the 4 characters clickable), related-idiom cross-links, and TTS audio — so idioms are discovered in context, not in isolation.

**Data conventions.** Chengyu is a recognized content entity in the shared data model (`docs/knowledge-base/data/shared-data-model.md`) and the knowledge graph (`docs/knowledge-base/learning-theory/modeling-chinese-knowledge-graph.md` — the `(:Chengyu)` node, "4-character idiom with origin story and theme"). Per the pre-adaptation rules (`docs/knowledge-base/backend/pre-adaptation-static-dynamic-separation.md`, Rule 1), idioms use the **`cy_XXXX`** business-key convention (e.g., `cy_0005`) with the pre-adaptation field pattern (canonical in story-23.1 BR Business Rule 2). This epic **adopts the all-in-DB architecture (Option A) exactly as Epic 22 did for grammar** — no static JSON delivery in `public/data/` (the original static-JSON plan is dead, user-confirmed).

**Codebase readiness.** All integration points already exist and only need real content + a real page (both now shipped across Stories 23.1–23.3 — the `ContentPlaceholderPage`/`NotImplemented` states below are the pre-epic baseline):

- `/learn/chengyu` route (currently `ContentPlaceholderPage title="Chengyu"`, no phase gate) — `apps/frontend/src/router/LearnRoutes.tsx`; sidebar Learn-group Chengyu item (`requiredPhase: 4`) — `apps/frontend/src/shared/constants/learnNav.ts`; `learn_chengyu` path constant — `apps/frontend/src/shared/constants/paths.ts`
- LexicalHub `chengyu` entity type (currently `NotImplemented`; `EntityType` already includes `"chengyu"`) — `apps/frontend/src/features/lexical-hub/entityHubRegistry.tsx`, `apps/frontend/src/shared/types/hub.ts` (both shipped in Story 23.3 — route now `<PhaseGate requiredPhase={4}><ChengyuPage /></PhaseGate>` and hub is a lazy `ChengyuHub`.)
- Shared audio (`useAudioItemPlayback` → `POST /v1/tts`, optionalAuth) and hub entry (`openHub`) — `apps/frontend/src/shared/audio/`, `apps/frontend/src/shared/hooks/useAudioItemPlayback.ts`, `apps/frontend/src/shared/hub-entry/`
- All-in-DB template: Epic 22's `grammar` pipeline (`content/seed/phase2/grammar-patterns.json` → `GrammarPattern`/`GrammarExample`/`GrammarPatternRelation` → `modules/grammar/` → `/v1/grammar/*`) is the direct precedent for `chengyu`.

## User Stories

This epic consists of the following user stories:

1. #ISSUE-23.1 / **Chengyu Data** _(story-23-1-chengyu-data.md)_
   - As a **developer**, I want to **author the CC-CEDICT-extracted, curated, and enriched chengyu dataset (CC-CEDICT idiom/pinyin/meanings + Chinese Wiktionary/Wikisource origin stories + authored era/theme/examples) and its Prisma models, migration, validation script, and idempotent seed steps**, so that **idiom content has a complete, architected data foundation family-seeded by the platform's Mandarin fundamentals KB**.

2. #ISSUE-23.2 / **Chengyu Backend API** _(story-23-2-chengyu-backend-api.md)_
   - As a **developer**, I want to **stand up a backend `chengyu` module with list/detail endpoints, register the routes, and verify the content manifest (updated by 23.1)**, so that **any client can consume idiom content through the canonical API layer**.

3. #ISSUE-23.3 / **Chengyu UI** _(story-23-3-chengyu-ui.md)_
   - As a **learner**, I want to **browse idioms by theme/era, read their narrative origin stories, play audio, and follow related-idiom and character cross-links**, so that **I understand cultural context beyond literal translations**.

## Story Breakdown Logic

This epic is divided into stories based on a data-first approach that mirrors the platform's layered pipeline (content → DB → API → UI):

- **Story 23.1 (Chengyu Data)** focuses on the authoring source and data layer — the extraction/curation script + `content/seed/phase2/chengyu.json` (the 50+ CC-CEDICT-extracted, curated idiom family with sourced narrative stories), the Prisma models `Chengyu`/`ChengyuExample`/`ChengyuRelation` (with `cy_XXXX` business keys + pre-adaptation fields), the migration, and the idempotent seed steps.
- **Story 23.2 (Chengyu Backend API)** focuses on the delivery layer — the backend `modules/chengyu/` module (types → repositories → services → api → container → index), the `GET /v1/chengyu/idioms` and `GET /v1/chengyu/idioms/:id` endpoints added verbatim to `ROUTE_PATTERNS`, and verification of the `content/manifest.json` chengyu count/files (updated by 23.1).
- **Story 23.3 (Chengyu UI)** focuses on the frontend experience — the `/learn/chengyu` page with search/theme/era filters, the `ChengyuHub` detail panel with related-idiom cross-links, TTS audio, and character cross-linking.

> **Revision note (2026-08-07):** this 3-way split **revises the epic's earlier 2-story scope** (23.1 "Chengyu Data & Backend API" + 23.2 "Chengyu UI") — full rationale in the **Story decomposition** decision under [Architecture Decisions](#architecture-decisions).

Data and API are completed first so the UI can be developed and tested against real content from the start. Story 23.2 depends on 23.1; Story 23.3 depends on 23.2 (and therefore 23.1). Story 23.3 can scaffold UI components against MSW handlers (scaffolded by 23.2) before 23.2 ships, but cannot call the real endpoints until 23.2 lands.

## Acceptance Criteria

High-level epic acceptance criteria — short, testable outcomes per story. Detailed per-item criteria live in each story BR (`story-23-1-chengyu-data.md`, `story-23-2-chengyu-backend-api.md`, `story-23-3-chengyu-ui.md`).

**Story 23.1 — Chengyu Data**

- [x] 50+ idioms extracted from CC-CEDICT, curated from the KB §6.2 + common-chengyu shortlist, and enriched with sourced origin stories (narrative `story` + `storySource`, era/theme, ≥1 segmented modern-usage example each) authored in `content/seed/phase2/chengyu.json` and seeded into Prisma (`Chengyu`/`ChengyuExample`/`ChengyuRelation`, `cy_XXXX` business keys) via idempotent, hash-gated steps; validation script passes; `content/manifest.json` declares the block and bumps its count to ≥50.
- [x] `content/seed/ATTRIBUTION.md` exists and carries the CC BY-SA 4.0 attribution (CC-CEDICT + Chinese Wiktionary 詞源 + zh Wikisource); authored `story`/`example` prose is original project work, not verbatim copy.
- [x] Post-seed SQL verification shows model counts matching targets (examples and relation rows included).

**Story 23.2 — Chengyu Backend API**

- [x] Backend `modules/chengyu/` module serves `GET /v1/chengyu/idioms` (search/theme/era + pagination) and `GET /v1/chengyu/idioms/:id` (idiom + examples + related idioms); both paths registered verbatim in `ROUTE_PATTERNS`.
- [x] Backend tests pass (repository filters + pagination, service validation, controller route registration, detail-by-`content_id`); `content/manifest.json` chengyu count verified.

**Story 23.3 — Chengyu UI**

- [x] `/learn/chengyu` is a Phase-4-gated real page with search/theme/era filters and a narrative-first `ChengyuHub` detail panel (story, literal/figurative meanings, modern-usage examples, audio).
- [x] Related-idiom and character cross-links work in the hub; UI tests + Storybook stories with MSW pass; BR ↔ IMP ↔ story files linked bidirectionally.

## Architecture Decisions

- Decision: Data source — All-in-DB backend module (chosen; **adopted Option A, mirrors Epic 22 exactly**)
  - Rationale: The platform's canonical architecture reads content exclusively from Prisma tables (`docs/guides/data/seed-pipeline.md`); `content/manifest.json` already declares `chengyu` as a content type (count 0); chengyu is a recognized content entity in `docs/knowledge-base/data/shared-data-model.md` and the knowledge graph (`(:Chengyu)`); Epic 22 established the all-in-DB precedent for grammar, and every existing content feature is API-driven via `apiClient` + `ROUTE_PATTERNS`.
  - Alternatives considered: Static JSON in `public/data/chengyu/` (the original doc plan — rejected: violates all-in-DB, creates a second delivery path the frontend has no infra for, splits the source of truth; the original static-JSON plan is dead, user-confirmed).
  - Implications: Requires a Prisma schema change + seed steps + a backend module; chengyu content is searchable server-side and consistent with every other content type. Content models follow the pre-adaptation field pattern (see story-23.1 BR Business Rule 2; per `docs/knowledge-base/backend/pre-adaptation-static-dynamic-separation.md`).
  - (The **data source** — CC-CEDICT + Wikimedia — is orthogonal to this delivery-architecture decision; see Background "Data-sourced idiom set (CC-CEDICT + Wikimedia)".)

- Decision: Story decomposition — 3 stories (Data / Backend API / UI), mirroring Epic 22 (chosen)
  - Rationale: This **revises the epic's earlier 2-story scope** (23.1 "Chengyu Data & Backend API" + 23.2 "Chengyu UI"), which preserved a scope set under the now-dead static-JSON plan and folded 50+ idiom narrative authoring together with 3 Prisma models, a backend module, and endpoints — coupling content authoring with schema/module/route work. Epic 22 (identical all-in-DB work) shipped as 3 stories and explicitly rejected the 2-way split. The 3-way split keeps each story independently testable/reviewable, gives a clean dependency chain 23.1 → 23.2 → 23.3, and lets 23.2 unblock any consumer of chengyu data.
  - Alternatives considered: 2-story split (Data & Backend API / UI — the earlier doc scope) — rejected: couples schema/module/route work with data authoring, contradicts Epic 22's proven decomposition, preserves a dead plan's scope; 1 story (monolith) — too large.
  - Implications: Strict dependency chain 23.1 → 23.2 → 23.3; 23.3 scaffolds UI against MSW handlers (scaffolded by 23.2) before 23.2 ships; story files `story-23-1-chengyu-data.md`, `story-23-2-chengyu-backend-api.md`, `story-23-3-chengyu-ui.md`.

- Decision: Phase gating — Phase 4 route gate + existing sidebar item (chosen)
  - Rationale: Chengyu is a Phase 4 roadmap item (`adult-mandarin-learning-roadmap.md` — Advanced Fluidity) and §8 of the fundamentals KB places it at step 7 (after passages); the sidebar Learn-group Chengyu item is already `requiredPhase: 4`; the route currently has no gate, so this epic wraps it in `PhaseGate requiredPhase={4}` (mirrors readers at 3, grammar at 2).
  - Alternatives considered: Earlier phase (rejected — requires the classical-Chinese foundation per KB difficulty #4); no gate (rejected — contradicts the roadmap).
  - Implications: `/learn/chengyu` redirects to foundations until the user reaches Phase 4; no new phase vocabulary introduced.

- Decision: Content naming & narrative fields — camelCase fields + `cy_XXXX` keys; `story`/`storySource` (chosen)
  - Rationale: Consistent with the grammar precedent (snake_case `content_id` at the seed/DB layer, camelCase domain fields surfaced by the API and frontend types); the narrative origin story is `story` (not "etymology") with a `storySource` citation, keeping BR and IMP naming identical.
  - Alternatives considered: "etymologies" field name (old BR wording — rejected for consistency); snake_case API fields (rejected — frontend types are camelCase).
  - Implications: Single canonical field vocabulary — the full field list lives in the story-23.2 IMP endpoint contract (`../../issue-implementation/epic-23-idiom-database/story-23-2-chengyu-backend-api.md`); used identically in the BR, all story BRs/IMPs, seed JSON, API contract, and frontend types.

- Decision: Related-idiom cross-links — explicit DB junction `ChengyuRelation` at model level (chosen)
  - Rationale: Mirrors `GrammarPatternRelation` (Epic 22) for relationally-clean related-idiom cross-links with a `relationType`; enables hub cross-navigation between idioms sharing a theme/era/story.
  - Alternatives considered: `relatedIds` JSON array (rejected — not relational, no FK integrity).
  - Implications: New self-referential junction model (two FKs → `Chengyu.content_id`, named relations); seeded in dependency order after `Chengyu` (Prisma spec: story-23.1 IMP); rendered in the hub from `relatedIdioms[]` (UI delivery: story-23.3 IMP).

- **UI delivery pointers** — the detail-view (`ChengyuHub`) and audio decisions moved to the owning story IMP: `story-23-3-chengyu-ui.md` → `../../issue-implementation/epic-23-idiom-database/story-23-3-chengyu-ui.md`

## Where the Specs Live (schema & API) ➕ ADDED

The normative per-story specs moved out of this epic BR into the story IMP docs (single-residence — the epic docs never duplicate them):

- **Prisma models** — `Chengyu`/`ChengyuExample`/`ChengyuRelation` DDL + `segments` token schema + migration → story-23.1 IMP: `../../issue-implementation/epic-23-idiom-database/story-23-1-chengyu-data.md`
- **API endpoint contracts** — `GET /v1/chengyu/idioms` + `GET /v1/chengyu/idioms/:id` (**shipped in story 23.2**, added verbatim to `ROUTE_PATTERNS`; full request/response JSON, error convention) → story-23.2 IMP: `../../issue-implementation/epic-23-idiom-database/story-23-2-chengyu-backend-api.md`
- **Seed / manifest touchpoints** — authoring source `content/seed/phase2/chengyu.json` (canonical seed dir), seed steps (hash-gated delta sync), manifest declare + count bump → story-23.1 IMP
- **Frontend component inventory / hub wiring** → story-23.3 IMP: `../../issue-implementation/epic-23-idiom-database/story-23-3-chengyu-ui.md`

## Out of Scope ➕ ADDED

- **No backend user progress for chengyu** — no `ChengyuProgress` model, no completion/memorized/review tracking in this epic. The `metadata`/`content_version` pre-adaptation fields are the deliberate seam a future progress story plugs into; do not add progress tables now.
- **Audio is on-demand only** — idiom/example audio is generated at playback time via the shared TTS manager; no stored/pre-generated audio fields or assets.
- **No related forms** — 惯用语 / 歇后语 / 谚语 (KB §6.3) are explicitly out of scope; only 4-character chengyu are authored.
- **No chengyu authoring UI / CMS** — content is authored in committed JSON + seed, not through an admin surface.

## Implementation Plan

1. **Story 23.1 — Chengyu Data** → [story-23-1-chengyu-data.md](story-23-1-chengyu-data.md) (BR) · [IMP](../../issue-implementation/epic-23-idiom-database/story-23-1-chengyu-data.md)
2. **Story 23.2 — Chengyu Backend API** → [story-23-2-chengyu-backend-api.md](story-23-2-chengyu-backend-api.md) (BR) · [IMP](../../issue-implementation/epic-23-idiom-database/story-23-2-chengyu-backend-api.md)
3. **Story 23.3 — Chengyu UI** → [story-23-3-chengyu-ui.md](story-23-3-chengyu-ui.md) (BR) · [IMP](../../issue-implementation/epic-23-idiom-database/story-23-3-chengyu-ui.md)

## Risks & mitigations

- Risk: 3-story dependency chain stretches delivery (23.1 → 23.2 → 23.3) — Severity: Medium
  - Mitigation: 23.3 scaffolds UI components against MSW handlers (scaffolded by 23.2) in parallel; each story is independently reviewable and shippable; 23.1 ships data first, 23.2 ships the API for any consumer regardless.
  - Rollback: If 23.1 slips, 23.3 can be demoed against MSW; if 23.2 slips, 23.3 still demos against MSW.

- Risk: Scope creep (cross-links, audio, filters, hub detail) — Severity: Medium
  - Mitigation: Reuses the existing hub, audio hook, and shared components; pre-segmented curated tokens (no runtime segmenter); filters are simple query params on the list endpoint.
  - Rollback: Defer related-idiom cross-links and/or audio to a follow-up without affecting the data story.

**Story-specific risks** live in the owning story docs (one-line pointers):

- Cultural/historical accuracy of origin stories (High) + 50 idioms feels thin for a Phase 4 learner (Medium) → `story-23-1-chengyu-data.md`
- Backend API failure mode vs. static JSON (Low) → `story-23-2-chengyu-backend-api.md`
- Scope creep in the UI story (Medium) → `story-23-3-chengyu-ui.md`

## Implementation notes

- Conventions: follow `docs/guides/conventions/frontend.md`, `docs/guides/conventions/backend.md`, and `docs/knowledge-base/practices/solid-principles.md`.
- Data: follow `docs/guides/data/seed-pipeline.md` (all-in-DB) and `prisma-schema-changes.instructions.md`.
- **KB grounding:** idiom definitions/structure must stay consistent with `docs/knowledge-base/mandarin/mandarin-fundamentals.md` §6 (authoring authority); phase placement must follow `docs/knowledge-base/learning-theory/adult-mandarin-learning-roadmap.md` (Phase 4 — Advanced Fluidity); data-model conventions must follow `docs/knowledge-base/data/shared-data-model.md` and `docs/knowledge-base/backend/pre-adaptation-static-dynamic-separation.md` (business keys `cy_XXXX`); the idiom entity and cross-links follow `docs/knowledge-base/learning-theory/modeling-chinese-knowledge-graph.md` (`(:Chengyu)` node).
- Frontend API: mandatory service layer (`frontend-api-client.instructions.md`) — `apiClient` only in `features/chengyu/services/chengyuService.ts`.
- Hub entry: use `openHub()` from `shared/hub-entry` everywhere; never call `useHubStore` directly from components.
- Audio: reuse `useAudioItemPlayback` (→ `POST /v1/tts`, optionalAuth); do not add audio fields to the data model.
- Component reuse: check `src/shared/components/` and `.github/component-registry.json` (Card, FilterChip, Tabs, SearchInput, ErrorScreen, LoadingScreen, Skeleton) before creating new UI.
- Phase gating: source is `usePhaseGate()` → `/v1/progression/phase-gate` (numeric), not `userStore`.
- Testing: `testing-standards.instructions.md` (Testing Trophy) — unit for pure logic, integration (MSW) for services/pages/hub, Storybook stories for pages.
- Story files scaffolded from templates: `story-23-1-chengyu-data.md`, `story-23-2-chengyu-backend-api.md`, `story-23-3-chengyu-ui.md` (BR + IMP variants), linked bidirectionally (epic BR ↔ epic IMP ↔ story files).
