# Epic 22: Grammar Pattern Library

## Epic Summary

**Goal:** Provide a searchable reference library of common Chinese grammar patterns with example sentences, HSK level tagging, and usage notes.

**Key Points:**

- **KB-grounded pattern set.** The library is authored against the platform's authoritative Mandarin reference — §7 "Grammar Essentials" of the Mandarin fundamentals KB (`docs/knowledge-base/mandarin/mandarin-fundamentals.md`) — and staged across Phases 2–4 per the adult-learning roadmap (`docs/knowledge-base/learning-theory/adult-mandarin-learning-roadmap.md`): **Phase 2** basic structures (SVO, topic-comment, time placement, 吗 questions, A-not-A, measure words, serial verbs, pro-drop), **Phase 3** particles & conjunctions (了/着/过/正在, 的/地/得, 因为...所以), **Phase 4** complex syntax (把 bǎ, 被 bèi). Higher-phase patterns appear as **locked/preview cards** to Phase-2 users — discovery, not a hard gate.
- **20+ grammar patterns** (21 in the KB-sourced reference set), each with **3+ example sentences** (Chinese, pinyin, English), an HSK level tag, and **pre-segmented clickable word tokens**.
- **Searchable** by English keyword or pattern name; **filterable** by HSK level and phase.
- **All-in-DB content pipeline**: patterns are authored in `content/seed/phase2/grammar-patterns.json`, seeded into Prisma, and served by a new backend `grammar` module via API — consistent with the platform's canonical all-in-DB architecture and the shared data model's content-entity conventions (stable `gr_XXXX` business keys + `content_version` + `metadata`).
- **Grammar is already scaffolded at every layer** — the `/learn/grammar` route, `LearnLayout` tab (Phase 2), `ContentBrowser` `grammar` content type, and LexicalHub `grammar` entity type all exist as placeholders. This epic replaces the placeholder with real content, API, and UI.
- **Detail view is a new `GrammarHub`** in the LexicalHub; each example word is clickable and opens the Character Detail Hub via the shared `openHub()` entry point.
- **Example-sentence audio** is generated on demand via the shared TTS manager (`useAudioItemPlayback` → `POST /v1/tts`, optionalAuth) — no stored audio fields in the data model.

**Status:** Planned

**Last Update:** August 4, 2026

## Background

Learners can study characters, radicals, pinyin/tones/strokes, words, and graded readers, but there is no reference for **how words combine into sentences** — word order, particles, and structural patterns. A searchable grammar pattern library bridges isolated vocabulary study and connected reading: when a learner meets 了 or 把 in a Reader passage, or wonders why time words appear before the verb, they need a browsable, HSK-tagged reference they can cross-link back into.

**Pedagogical foundation (authoring authority).** The platform's authoritative Mandarin grammar reference is §7 "Grammar Essentials" of the Mandarin fundamentals KB (`docs/knowledge-base/mandarin/mandarin-fundamentals.md`). It defines the core inventory this library authors: SVO word order (我打人), topic-prominent sentences (这本书我看过), the absence of inflection (吃 = eat/eats/ate), aspect particles (了 perfective / 着 ongoing / 过 experiential / 正在 in progress), measure words (个 general classifier), 的/地/得 (possessive / adverb marker / resultative complement), question formation (吗 particle OR A-not-A 你吃不吃?), serial verb constructions (我去买东西), and pro-drop ((我)来了). Its §8 "Typical Learning Order" places **sentence patterns at step 5** — after tones/pinyin, radicals, characters, and words, and before passages and chengyu — which is exactly why the Grammar tab unlocks at **Phase 2** (alongside Radicals) rather than Phase 1.

**Phase staging.** Per the 4-phase learning roadmap (`docs/knowledge-base/learning-theory/adult-mandarin-learning-roadmap.md` — Blueprint → Core 300 → Network → Advanced Fluidity), grammar maps onto the curriculum as:

- **Phase 2 (Core 300):** basic sentence structures — SVO, time placement, 吗 questions, A-not-A.
- **Phase 3 (Network):** particles & conjunctions — 了, 过, 着, 因为...所以.
- **Phase 4 (Advanced Fluidity):** complex syntax — 把 (bǎ) disposal, 被 (bèi) passive.

No grammar content belongs to Phase 1 (Blueprint = pinyin/strokes only). Within the tab, each pattern carries a Phase 2/3/4 field so advanced syntax (把/被) is progressively surfaced; Phase 3/4 patterns are visible as locked/preview cards to Phase-2 users (the platform's "discovery, not gate" stance).

**KB-sourced pattern set.** The seed dataset authorizes the following pattern family — **19 patterns directly sourced from §7 / the roadmap + 2 supplementary HSK-tier advanced patterns (比, 是...的) = 21 across the three grammar phases**. The story 22.1 authoring agent may expand within these families (e.g., per-HSK sub-splits) but must not introduce families outside §7 / the roadmap:

| Phase                                  | Family (KB source)                          | Pattern                                             | Example                                          |
| -------------------------------------- | ------------------------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| 2 — Core 300 (basic structures)        | Word order & tense (§7)                     | SVO basic word order                                | 我打人                                           |
|                                        |                                             | No inflection — context/time words carry tense (§7) | 我昨天吃饭了 (吃 = eat/eats/ate; 了 = completed) |
|                                        |                                             | Topic-comment (§7)                                  | 这本书我看过                                     |
|                                        |                                             | Time placement (roadmap Phase 2)                    | 我今天去学校                                     |
|                                        | Questions (§7 + roadmap)                    | 吗 yes/no questions                                 | 你好吗?                                          |
|                                        |                                             | A-not-A (V不V)                                      | 你吃不吃?                                        |
|                                        | Measure words (§7)                          | 个 general + noun-specific (本/张...)               | 一个人 / 一本书                                  |
|                                        | Serial verb constructions (§7)              |                                                     | 我去买东西                                       |
|                                        | Pro-drop (§7)                               |                                                     | (我)来了                                         |
| 3 — Network (particles & conjunctions) | Aspect particles (§7 + roadmap)             | 了 perfective                                       | 我吃了                                           |
|                                        |                                             | 着 durative                                         | 他吃着饭                                         |
|                                        |                                             | 过 experiential                                     | 我看过                                           |
|                                        |                                             | 正在 progressive                                    | 我正在学习                                       |
|                                        | 的/地/得 (§7)                               | 的 possessive/modifier                              | 我的书                                           |
|                                        |                                             | 地 adverb marker                                    | 慢慢地走                                         |
|                                        |                                             | 得 resultative complement                           | 做得很好                                         |
|                                        | Conjunctions (roadmap Phase 3)              | 因为...所以 cause-consequence                       | 因为我累，所以不去                               |
| 4 — Advanced Fluidity (complex syntax) | Disposal & passive (roadmap Phase 4)        | 把 (bǎ) disposal                                    | 我把书放在桌子上                                 |
|                                        |                                             | 被 (bèi) passive                                    | 他被打了                                         |
|                                        | Supplementary HSK-tier (same advanced tier) | 比 (bǐ) comparison                                  | 我比他高                                         |
|                                        |                                             | 是...的 emphasis                                    | 我是昨天来的                                     |

**Market context.** Grammar references (e.g., Chinese Grammar Wiki, HSK grammar lists) are typically static tables. This feature differentiates by integrating with existing systems: HSK/phase tagging, Character Detail Hub cross-linking, and TTS audio — so grammar is discovered in context, not in isolation.

**Data conventions.** Grammar is a recognized content entity in the shared data model (`docs/knowledge-base/data/shared-data-model.md`); relations between patterns are stored as DB junction tables (matching the `USED_IN_PATTERN` Word→GrammarPattern edge in `docs/knowledge-base/learning-theory/modeling-chinese-knowledge-graph.md`). Per the pre-adaptation rules (`docs/knowledge-base/backend/pre-adaptation-static-dynamic-separation.md`, Rule 1), grammar patterns use the **`gr_XXXX`** business-key convention (e.g., `gr_0001`) with internal `id` + unique `content_id` + `content_version` + `metadata Json?` — so future progress tracking and content edits never orphan learner references.

**Codebase readiness.** All integration points already exist and only need real content + a real page:

- `/learn/grammar` route + `LearnLayout` Grammar tab (phase 2) — `apps/frontend/src/router/LearnRoutes.tsx` (L49, currently `ContentPlaceholderPage`), `apps/frontend/src/shared/layouts/LearnLayout.tsx`
- `ContentBrowser` `grammar` content type + tab + phase gate — `apps/frontend/src/shared/components/ContentBrowser/`
- LexicalHub `grammar` entity type (currently `NotImplemented`) — `apps/frontend/src/features/lexical-hub/entityHubRegistry.tsx` (L44)
- Shared audio (`useAudioItemPlayback` → `POST /v1/tts`, optionalAuth) and hub entry (`openHub`) — `apps/frontend/src/shared/hooks/useAudioItemPlayback.ts`, `apps/frontend/src/shared/hub-entry/hubEntryPoint.ts`

## User Stories

This epic consists of the following user stories:

1. #ISSUE-22.1 / **Grammar Data** _(story-22-1-grammar-data.md)_
   - As a **developer**, I want to **author the grammar patterns dataset and its Prisma models, migration, and seed steps**, so that **grammar content has a complete, architected data foundation grounded in the platform's Mandarin fundamentals KB**.

2. #ISSUE-22.2 / **Grammar Backend API** _(story-22-2-grammar-backend-api.md)_
   - As a **developer**, I want to **stand up a backend `grammar` module with list/detail endpoints, register the routes, and verify the content manifest (updated by 22.1)**, so that **any client can consume grammar content through the canonical API layer**.

3. #ISSUE-22.3 / **Grammar UI** _(story-22-3-grammar-ui.md)_
   - As a **learner**, I want to **browse and search grammar patterns with detail views, audio, and character cross-linking**, so that **I can reference sentence structures while studying**.

## Story Breakdown Logic

This epic is divided into stories based on a data-first approach that mirrors the platform's layered pipeline (content → DB → API → UI):

- **Story 22.1 (Grammar Data)** focuses on the authoring source and data layer — `content/seed/phase2/grammar-patterns.json` (the 21-pattern KB-sourced family, examples, pinyin, English, HSK tags, phase, pre-segmented clickable tokens), the Prisma models `GrammarPattern`/`GrammarExample`/`GrammarPatternRelation` (with `gr_XXXX` business keys + pre-adaptation fields), the migration, and the idempotent seed steps.
- **Story 22.2 (Grammar Backend API)** focuses on the delivery layer — the backend `modules/grammar/` module (types → repositories → services → api → container → index), the `GET /v1/grammar/patterns` and `GET /v1/grammar/patterns/:id` endpoints added verbatim to `ROUTE_PATTERNS`, and verification of the `content/manifest.json` grammar count/files (updated by 22.1).
- **Story 22.3 (Grammar UI)** focuses on the frontend experience — the `/learn/grammar` page with list/search/filter, the `GrammarHub` detail panel, example-sentence audio, and clickable-word → Character Hub integration.

Data and API are completed first so the UI can be developed and tested against real content from the start. Story 22.2 depends on 22.1; Story 22.3 depends on 22.2 (and therefore 22.1). Story 22.3 can scaffold UI components against MSW handlers before 22.2 ships, but cannot call the real endpoints until 22.2 lands.

## Acceptance Criteria

**Story 22.1 — Grammar Data**

- [ ] Prisma models `GrammarPattern`, `GrammarExample`, `GrammarPatternRelation` added via migration (follow `prisma-schema-changes.instructions.md`; use `npm run db:migrate`, never `db push`).
- [ ] ≥21 grammar patterns authored in `content/seed/phase2/grammar-patterns.json`, matching the KB-sourced family in the Background table (Phases 2/3/4 per `adult-mandarin-learning-roadmap.md`); each pattern has ≥3 example sentences (Chinese, pinyin, English) and an HSK level tag.
- [ ] Business keys follow the `gr_XXXX` convention (e.g., `gr_0001`) per `pre-adaptation-static-dynamic-separation.md` Rule 1; `GrammarPattern`/`GrammarExample` carry internal `id` + unique `content_id` + `content_version Int @default(1)` + `metadata Json?`; example/junction rows reference `content_id`, not internal auto IDs.
- [ ] Each example sentence carries pre-segmented clickable tokens (`segments`: text, pinyin, gloss, entityType, entityId) where `entityId` references the target entity's `content_id` (e.g., `ch_XXXX` / `w_XXXXX`) per `modeling-chinese-knowledge-graph.md` (`USED_IN_PATTERN` Word→GrammarPattern edge).
- [ ] Grammar data seeded idempotently per `docs/guides/data/seed-pipeline.md` (business-key PK + `skipDuplicates`/pre-clear rules); seed verification passes (SQL counts match targets).

**Story 22.2 — Grammar Backend API**

- [ ] Backend `modules/grammar/` module created (types → repositories → services → api → container → index) following the modulith pattern; registered in the app container.
- [ ] `GET /v1/grammar/patterns` (filters: `search`, `hskLevel`, `phase`, plus `page`/`pageSize`) and `GET /v1/grammar/patterns/:id` (pattern + examples + related patterns; `:id` resolves by `content_id` `gr_XXXX`) implemented.
- [ ] Both paths added verbatim to `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (`grammarPatterns`, `grammarPatternById`).
- [ ] Verify `content/manifest.json` `grammar` count ≥21 and the `grammar` section lists `grammar-patterns.json` (updated by 22.1; no edit here).
- [ ] Backend tests per `testing-standards.instructions.md` (repository, service, controller) + seed verification.

**Story 22.3 — Grammar UI**

- [ ] `features/grammar` feature created (service → hooks → components → types); `apiClient` used only in `grammarService.ts` (per `frontend-api-client.instructions.md`).
- [ ] `/learn/grammar` renders the real Grammar page (replaces `ContentPlaceholderPage`), wrapped in route-level `PhaseGate requiredPhase={2}` (mirrors the readers route at Phase 3); LearnLayout tab gating already present.
- [ ] Search by English keyword or pattern name; HSK level filter; phase filter with locked/preview states for higher-phase patterns (Phase 3/4 visible as locked/preview to Phase-2 users).
- [ ] Pattern card list → detail view showing `structure`, `explanation`, and examples (Chinese, pinyin, English).
- [ ] `grammar` registered in `entityHubRegistry` → lazy-loaded `GrammarHub` detail panel (replaces the `NotImplemented` placeholder).
- [ ] Example words clickable → Character Detail Hub via `openHub({ entityType: "character", entityId, label })`.
- [ ] Example sentences playable via the shared audio manager (`useAudioItemPlayback` → `/v1/tts`, optionalAuth); no stored audio fields in the data model.
- [ ] Tests + Storybook stories with MSW per `testing-standards.instructions.md`; static gates pass (`npm run build`, `npm run lint`, design lint, `frontend-pre-delivery-checklist.instructions.md`).
- [ ] BR ↔ IMP ↔ story files linked bidirectionally; all relative links resolve; Last Update current in the same commit.

## Architecture Decisions

- Decision: Data source — All-in-DB backend module (chosen)
  - Rationale: The platform's canonical architecture reads content exclusively from Prisma tables (`docs/guides/data/seed-pipeline.md`); `content/manifest.json` already declares `grammar` as a content type (count 0); grammar is a recognized content entity in `docs/knowledge-base/data/shared-data-model.md`; every existing content feature (radicals, foundations, readers) is API-driven via `apiClient` + `ROUTE_PATTERNS`.
  - Alternatives considered: Static JSON in `public/data/grammar/` (original doc plan — rejected: violates all-in-DB, creates a second delivery path the frontend has no infra for, splits the source of truth).
  - Implications: Requires a Prisma schema change + seed steps + a backend module; grammar content is searchable server-side and consistent with every other content type. Content models follow the pre-adaptation field pattern (internal `id` + unique `content_id` `gr_XXXX` + `content_version` + `metadata Json?`) per `docs/knowledge-base/backend/pre-adaptation-static-dynamic-separation.md`.

- Decision: Story decomposition — 3 stories (Data / Backend API / UI) (chosen)
  - Rationale: Isolates the backend module work (schema, module, route registration, manifest verification, backend tests) from data authoring and from the UI; matches the layered pipeline and the epic-21 precedent of a dedicated backend-module story (21.10 Characters Backend Module); each story is independently testable and reviewable.
  - Alternatives considered: 2 stories (22.1 data+backend combined, 22.2 UI — the original doc split) — rejected because it couples schema/module/route work with data authoring and makes review large; 1 story (monolith) — too large.
  - Implications: Strict dependency chain 22.1 → 22.2 → 22.3; one extra story file; 22.2 unblocks any future consumer of grammar data, not just the grammar UI.

- Decision: Phase gating — Numeric Phase 2/3/4 + tab unlock at Phase 2, locked/preview cards for higher phases (chosen)
  - Rationale: The platform uses numeric phases sourced from the backend `PhaseGate` (`usePhaseGate()` → `/v1/progression/phase-gate`); Grammar is already gated at Phase 2 in `LearnLayout`, `ContentBrowser`, and `TabBar`; the platform's "discovery, not gate" stance (cf. HSK discovery) favors showing higher-phase content as locked/preview rather than hiding it. Pattern placement (Phase 2 basic structures → Phase 3 particles/conjunctions → Phase 4 complex syntax) follows the 4-phase progression in `docs/knowledge-base/learning-theory/adult-mandarin-learning-roadmap.md` (Core 300 → Network → Advanced Fluidity; no grammar in Phase 1 Blueprint).
  - Alternatives considered: "Basics / Advanced / Mastery" sub-tabs (rejected — no such convention exists in the codebase); strict server-side hiding of Phase 3/4 patterns (rejected — contradicts the discovery stance).
  - Implications: Patterns carry `phase` (2|3|4) for filtering and locked/preview states (`isLocked` when `pattern.phase > currentPhase`); no new phase vocabulary introduced.

- Decision: Detail view — LexicalHub `GrammarHub` panel (chosen)
  - Rationale: The hub already owns entity detail (character/word/radical) with a `grammar` placeholder; reuses the modal, navigation stack, and cross-entity navigation instead of a bespoke modal.
  - Alternatives considered: Local expandable detail panel on the page (rejected — duplicates the hub and breaks cross-linking).
  - Implications: New `GrammarHub` component registered in `entityHubRegistry` under the existing `grammar` key; grammar pattern itself becomes a hub entity.

- Decision: Audio — On-demand TTS via the shared audio manager (chosen)
  - Rationale: `useAudioItemPlayback().play(chinese, { textIsChinese: true })` → `POST /v1/tts` (optionalAuth) already provides sentence audio with fallback; readers use the same mechanism.
  - Alternatives considered: Pre-generated audio fields in the data (rejected — adds GCS/asset complexity for a small reference dataset; audio would go stale with content edits).
  - Implications: Audio is generated at playback time; no data-model changes.

- Decision: Example segmentation — Pre-segmented clickable tokens in the seed data (chosen)
  - Rationale: A small hand-curated dataset (21 patterns × 3+ examples) benefits from deterministic token boundaries the author controls; a word token maps to a Character/Word entity via its `content_id`, matching the `USED_IN_PATTERN` Word→GrammarPattern edge in `docs/knowledge-base/learning-theory/modeling-chinese-knowledge-graph.md`.
  - Alternatives considered: Runtime segmentation against the word index (readers' approach — rejected: overkill for reference examples, adds a backend segmenter dependency to a UI story).
  - Implications: Each example stores `segments` (text, pinyin, gloss, entityType, entityId) so UI can render clickable words directly.

### Schema & API Contract (summary) ➕ ADDED

The normative, complete Prisma definitions live in the IMP doc (`docs/issue-implementation/epic-22-grammar-library/README.md` → "Complete Prisma Model Definitions"). This is the field-level contract summary for planning and cross-story alignment.

**Prisma model shape (Story 22.1):**

| Model                    | Key fields (name: type)                                                                                                                                                                                                                                                                                                            | Notes                                                                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GrammarPattern`         | `id: String @id @default(uuid())` (internal, never exposed), `content_id: String @unique` (`gr_XXXX`), `name: String`, `structure: String`, `explanation: String`, `phase: Int` (2\|3\|4), `hskLevel: Int?` (1–6), `sortOrder: Int`, `content_version: Int @default(1)`, `metadata: Json?`                                         | `@@index([phase])`, `@@index([hskLevel])`, `@@index([sortOrder])`; relations: `examples: GrammarExample[]`, `relatedFrom`/`relatedTo: GrammarPatternRelation[]` |
| `GrammarExample`         | `id: String @id @default(uuid())`, `content_id: String @unique` (`gr_XXXX_exN`), `patternContentId: String` (FK → `GrammarPattern.content_id`, `onDelete: Cascade`), `chinese: String`, `pinyin: String`, `english: String`, `segments: Json`, `sortOrder: Int @default(0)`, `content_version: Int @default(1)`, `metadata: Json?` | `@@index([patternContentId])`; `segments` = `[{ text, pinyin, gloss, entityType, entityId }]`                                                                   |
| `GrammarPatternRelation` | `id: String @id @default(uuid())`, `fromPatternContentId: String`, `toPatternContentId: String` (both FK → `GrammarPattern.content_id`, `onDelete: Cascade`), `relationType: String @default("RELATED")` (`RELATED`\|`CONTRASTS_WITH`\|`PREREQUISITE`), `content_version: Int @default(1)`, `metadata: Json?`                      | `@@unique([fromPatternContentId, toPatternContentId])`, `@@index([toPatternContentId])`                                                                         |

**Endpoint signatures (proposed — Story 22.2, added verbatim to `ROUTE_PATTERNS` as `grammarPatterns` / `grammarPatternById`):**

- `GET /v1/grammar/patterns` — list. Query (all optional, additive AND): `search` (substring against name/structure/explanation + example english/pinyin), `hskLevel` (1–6), `phase` (2\|3\|4), `page` (≥1), `pageSize` (1–100, default 20). Response `{ items: GrammarPatternSummary[], total, page, pageSize }`. Auth: `optionalAuth`.
- `GET /v1/grammar/patterns/:id` — detail. `:id` resolves by `content_id` (`gr_XXXX`); internal uuid is never a valid identifier. Response includes `examples[]` (with `segments[]`) and `relatedPatterns[]`. Auth: `optionalAuth`.

**Seed / manifest touchpoints:**

- Authoring source: `content/seed/phase2/grammar-patterns.json` (NEW — Story 22.1).
- Seed steps: `GrammarPattern` → `GrammarExample` → `GrammarPatternRelation` (dependency order; `skipDuplicates` keyed on the unique `content_id`).
- `content/manifest.json`: `grammar` content type already declared (count 0); Story 22.1 declares the `grammar` block (`files: ["grammar-patterns.json"]`, `served_via: "db"`) **and** bumps `entity_counts.grammar` to ≥21 after the seed populates; Story 22.2 verifies the count/files (no edit).

## Out of Scope ➕ ADDED

- **No backend user progress for grammar** — no `GrammarProgress` model, no completion/memorized/review tracking in this epic. The `metadata`/`content_version` pre-adaptation fields are the deliberate seam a future progress story plugs into; do not add progress tables now.
- **Audio is on-demand only** — example-sentence audio is generated at playback time via the shared TTS manager; no stored/pre-generated audio fields or assets.
- **No runtime segmentation** — example tokens are pre-segmented in the authoring JSON; no backend segmenter service is added.
- **No grammar authoring UI / CMS** — content is authored in committed JSON + seed, not through an admin surface.

## Implementation Plan

1. Story 22.1: Prisma models `GrammarPattern`/`GrammarExample`/`GrammarPatternRelation` (pre-adaptation fields, `gr_XXXX` keys) + migration.
2. Story 22.1: Author `content/seed/phase2/grammar-patterns.json` — the 21-pattern KB-sourced family from the Background table (phases 2–4, HSK tags, segmented tokens).
3. Story 22.1: Add seed steps in dependency order + re-seed + post-seed verification + declare the `grammar` block and bump `entity_counts.grammar` in `content/manifest.json`.
4. Story 22.2: Backend `modules/grammar/` (types → repositories → services → api → container → index) + `GET /v1/grammar/patterns` + `GET /v1/grammar/patterns/:id` (by `content_id`).
5. Story 22.2: Add `grammarPatterns`/`grammarPatternById` verbatim to `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` + verify `content/manifest.json` (updated by 22.1) + backend tests.
6. Story 22.3: `features/grammar` service → hooks → components → types; `pages/learn/grammar/GrammarPage.tsx`; wire route + `PhaseGate requiredPhase={2}`.
7. Story 22.3: LexicalHub integration — `GrammarHub` + `entityHubRegistry` registration; clickable example words → Character Hub.
8. Story 22.3: Search/filter/lock states + example-sentence audio via shared audio manager.
9. Story 22.3: Tests, Storybook stories (MSW), visual verification, quality gates.

## Risks & mitigations

- Risk: Grammar explanations or example sentences may be linguistically inaccurate — Severity: High
  - Mitigation: Author from the platform's own authoritative grammar reference (§7 "Grammar Essentials", `docs/knowledge-base/mandarin/mandarin-fundamentals.md`) and standard HSK progression; human review before release.
  - Rollback: Edit seed JSON and re-run `npm run db:seed` (idempotent).

- Risk: 21 patterns feels thin as a "library" — Severity: Medium
  - Mitigation: Quality over quantity; schema designed for future expansion (relation table, phase/HSK indexes, `metadata Json?`).
  - Rollback: None — purely additive.

- Risk: Backend API dependency (all-in-DB) adds a failure mode vs. static JSON — Severity: Low
  - Mitigation: Service-layer with loading/error/retry states and a module-level cache (pattern: `radicalsService`).
  - Rollback: Error UI with retry; no data loss.

- Risk: 3-story dependency chain stretches delivery (22.1 → 22.2 → 22.3) — Severity: Medium
  - Mitigation: 22.2 unblocks 22.3 scaffolding against MSW handlers in parallel; each story is independently reviewable and shippable.
  - Rollback: If 22.2 slips, 22.3 can be demoed against MSW; 22.1 ships data first regardless.

- Risk: Scope creep (segmentation, audio, detail panel) — Severity: Medium
  - Mitigation: Pre-segmented curated tokens (no runtime segmenter); audio reuses the existing hook; detail via the existing hub.
  - Rollback: Defer audio and/or advanced filtering to a follow-up without affecting the data story.

## Implementation notes

- Conventions: follow `docs/guides/conventions/frontend.md`, `docs/guides/conventions/backend.md`, and `docs/knowledge-base/practices/solid-principles.md`.
- Data: follow `docs/guides/data/seed-pipeline.md` (all-in-DB) and `prisma-schema-changes.instructions.md`.
- **KB grounding:** pattern content, structure strings, and explanations must stay consistent with `docs/knowledge-base/mandarin/mandarin-fundamentals.md` §7 (authoring authority); phase placement must follow `docs/knowledge-base/learning-theory/adult-mandarin-learning-roadmap.md` (Core 300 → Network → Advanced Fluidity); data-model conventions must follow `docs/knowledge-base/data/shared-data-model.md` and `docs/knowledge-base/backend/pre-adaptation-static-dynamic-separation.md` (business keys `gr_XXXX`); token-to-entity mapping follows `docs/knowledge-base/learning-theory/modeling-chinese-knowledge-graph.md`.
- Frontend API: mandatory service layer (`frontend-api-client.instructions.md`) — `apiClient` only in `features/grammar/services/grammarService.ts`.
- Hub entry: use `openHub()` from `shared/hub-entry` everywhere; never call `useHubStore` directly from components.
- Audio: reuse `useAudioItemPlayback`; do not add audio fields to the data model.
- Component reuse: check `src/shared/components/` and `.github/component-registry.json` (Card, FilterChip, Tabs, SearchInput, ErrorScreen, LoadingScreen, Skeleton) before creating new UI.
- Phase gating: source is `usePhaseGate()` → `/v1/progression/phase-gate` (numeric), not `userStore`.
- Testing: `testing-standards.instructions.md` (Testing Trophy) — unit for pure logic, integration (MSW) for services/pages/hub, Storybook stories for pages.
- Story files to scaffold from templates: `story-22-1-grammar-data.md`, `story-22-2-grammar-backend-api.md`, `story-22-3-grammar-ui.md` (both BR + IMP variants), linked bidirectionally.
