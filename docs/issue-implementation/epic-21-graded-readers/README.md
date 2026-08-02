# Epic 21: Foundation Complete — Graded Readers & Character Practice — Implementation

**BR Reference:** `docs/business-requirements/epic-21-graded-readers/README.md`

**Status:** Complete

**Last Update:** 2026-08-01

## Epic Summary

**Goal:** Complete the remaining gaps from Epics 18–21: ship AI-generated graded reading passages with inline word lookup, sentence-level audio, and progress tracking, while simultaneously delivering the full set of character practice enhancements identified in the Epics 18–20 audits — including pictograph warmup, classification-aware mnemonics, sandhi practice, IME phonetic hints, phonetic tree browsing, and structured stroke content.

**Key Points:**

- Gemini API generates passages from 5 beginner topics as structured JSON sentences
- Backend segmenter parses plain-text passages against in-memory word index at read time
- Word model stores commonly-queried fields in DB (simplified, pinyin, meaning, hskLevel, frequencyRank, wordClass); enrichment in metadata JSON. Content/ directory is seed source only.
- LexicalHub generalizes CharacterHub for unified word→character→radical navigation
- On-demand TTS with Tier-3 fallback (Tier-2 on-demand → browser SpeechSynthesis); Tier-1 GCS batch pre-generation NOT implemented
- pgvector + ContentEmbedding for RAG readiness (hybrid tssearch + ANN search)
- Clean-slate migration: Phase A (additive schema), Phase B (transformation/widening), Phase C (drop deprecated tables)
- Zustand + debounced backend sync (2s) for reading progress auto-save
- Event-sourced ReviewLog → CharacterProgress SRS engine pipeline
- Phase 3 gating; guest users get 6 demo passages with read-only access
- Measure word foundation: MeasureWord + MeasureWordWord models, seed ~50 HSK 1-3 entries, GET /api/v1/words/:id/measure-words endpoint
- Phase gate calibration: IME threshold 70%→80%, comprehension gate (≥60% + ≥90% known words), character count ≥500 gate check
- Characters backend module: 6 REST endpoints in dedicated `modules/characters/` (detail, phonetic, homophones, decomposition, search, frequency)
- Data consistency cleanup: strip hsk_characters from radical JSON → API-driven radical-character lookup + CI validation
- Pinyin search & homophone API: GET /api/v1/pinyin/search and GET /api/v1/characters/:glyph/homophones endpoints
- Stroke content pipeline: structured JSON with PRC categories, types, order rules served via `FoundationsService.getStrokesReference()` (DB-backed)
- Mnemonic prompt enhanced with classification + phonetic component data; pictographs skip AI
- Classification badges on character grids with golden border for pictographs
- Neutral tone + sandhi extension to Audio-to-Type quiz
- SandhiDrill micro-quiz with rule cards and tone sandhi practice
- IME Simulator phonetic hints with radical hint toggle and score penalty
- Phonetic tree toggle in Radical Trees (dual-tree: Radical↔Phonetic)
- Classification-aware MnemonicCard with 4 distinct layouts
- Pictograph warmup gallery with oracle bone evolution and matching mini-game
- 5-phase delivery model: Foundation Data → Core Backend → Graded Readers MVP → Character Practice UI/UX → Quality & Polish
- Phase D organized as 3 parallel tracks: Mnemonic, Sandhi Quiz, IME+Phonetic
- Phase C (Graded Readers MVP) documented as MVP cutoff — Phase D items deferrable to follow-up

## Technical Overview

This epic implements the full graded readers feature across frontend, backend, and data layers. The backend provides Gemini-powered passage generation, word segmentation, HSK profile computation, and TTS audio generation. The frontend delivers a library view with HSK-level filtering, a reading view with sentence-by-sentence layout and inline word lookup via the unified LexicalHub, per-sentence audio playback, and auto-saving progress tracking. The data layer migrates from the old free-form Progress model to an event-sourced ReviewLog + CharacterProgress system.

## Architecture Decisions

1. **Gemini passage generation** — Use free prompt with 5 beginner topics (school, daily routine, family, weather, shopping). Gemini returns JSON with sentence array. No hard vocabulary constraints — segmenter handles word identification at read time.
   - Rationale: Fighting LLM constraints is unreliable and expensive. Segmenter-based approach is more robust.
   - Alternatives considered: Constrained generation with known vocabulary lists, pre-written passage library.

2. **Word model: commonly-queried fields in DB** — Word table stores frequently accessed fields: simplified, pinyin, meaning, hskLevel, frequencyRank, wordClass. WordHskLevel and CharacterHskLevel retained for many-to-many. Content/ directory is seed source only; production reads go through Prisma.
   - Rationale: All-in-DB strategy eliminates dual-path complexity. Enables relational queries, pgvector embeddings, and simpler caching.
   - Alternatives considered: Pure ID-only with aggregate JSON files (original approach — superseded by clean-slate redesign), hybrid model with enrichment in JSON metadata.
   - Supersedes: Previous "Word model as pure ID-only" decision.

3. **Backend segmentation at read time** — Passages stored as plain text. Backend segmenter parses text against in-memory word index at read time, caches segmented result. Frontend receives pre-tokenized passage with known/unknown annotations.
   - Rationale: Backend handles all processing. Simpler frontend. Caching mitigates latency.
   - Alternatives considered: Frontend-side segmentation, pre-segment on passage creation.

4. **Unified LexicalHub** — Generalized hubStore supporting entityType, entityId, context, and navigationStack. Single modal in AppLayout replaces CharacterHub. Supports word→character→radical navigation via in-modal back button.
   - Rationale: Single hub prevents duplicate code, enables cross-entity navigation.
   - Alternatives considered: Keep separate CharacterHub and WordHub modals.
   - Implications: Requires `useEntityHub` hook backward-compatible with existing `useCharacterHub` callers.

5. **On-demand TTS with Tier-3 fallback (batch pre-generation NOT implemented)** — TTS is generated on demand per sentence (Tier-2) with browser SpeechSynthesis fallback (Tier-3). The BR's Tier-1 GCS batch pre-generation is **not implemented** — GCS pre-generation always misses (see epic BR Known Limitations). Audio URLs are returned via `POST /v1/readers/passages/:id/audio` (`fetchPassageAudio` → `audioStore`).
   - Rationale: Avoids a first-request TTS stall and GCS writes that are never read. On-demand generation keeps the reading flow responsive; the browser SpeechSynthesis fallback covers failures.
   - Alternatives considered: Tier-1 GCS batch pre-generation (documented in the BR, deferred — always misses), stream TTS sentence-by-sentence.

6. **Event-sourced ReviewLog → CharacterProgress** — Every progress update appends a ReviewLog row. SRS engine reads events and upserts CharacterProgress. ReviewLog seeds future CQRS event stream.
   - Rationale: Append-only log enables future analytics, replay, and CQRS without schema changes.
   - Alternatives considered: Direct writes to CharacterProgress, single Progress table for all tracking.

7. **Passage-level progress with sentence-position auto-save** — Passage is completed or not. Auto-saved sentence position enables resume. Zustand store (immediate) + debounced backend sync (2s). `beforeunload` for final save. Guest state is ephemeral (in-memory only).
   - Rationale: Sufficient granularity for reading use case. Debounce balances responsiveness with API call frequency.
   - Alternatives considered: Per-sentence completion tracking, word-level progress.

8. **All-in-DB data architecture** — All structured content lives in PostgreSQL with full indexes and FK relationships. content/ directory is git-versioned seed source only — never read at runtime. GCS for binary assets only (TTS audio, stroke SVGs).
   - Rationale: Eliminates dual read paths, solves GCS O(n) scaling, enables pgvector embeddings.
   - Implications: Larger migration scope but simpler production architecture.
   - Supersedes: ADR-006 4-tier data tiering with aggregate JSON enrichment files.

9. **pgvector for vector embeddings** — ContentEmbedding table stores vectors (~15K rows) in PostgreSQL via pgvector extension on Neon.
   - Rationale: Trivially small data scale. Avoids second database complexity.
   - Implications: Requires pgvector extension. Embedding pipeline runs on seed/update events.

10. **Phase C drops without 2-week safety window** — Old tables (Progress, VocabularyWord, etc.) are superseded, not migrated. Clean-slate drops are immediate.
    - Rationale: No users rely on deprecated tables. Immediate cleanup reduces confusion.
    - Implications: Irreversible. All Phase B migration must be verified before Phase C runs.

11. **Measure word model with permanent content IDs (mw_XXXXX)** — MeasureWord table stores permanent IDs (mw_00001 pattern), simplified/pinyin/meaning, category tag (measure/time/abstract/verb/formal), and usage notes. MeasureWordWord junction table pairs measure words with Word records via wordId, with example sentence and isDefault flag.
    - Rationale: Permanent IDs ensure stable references across seed re-runs. Junction table enables many-to-many noun pairing (one MW pairs with multiple nouns; one noun uses multiple MWs).
    - Alternatives considered: JSON array on Word model, frontend-only static lookup.
    - Implications: Seed script must join against Word table by glyph to resolve wordId references. Idempotent via ON CONFLICT DO NOTHING.

12. **Phase gate calibration via hard-coded thresholds** — Three changes: (a) IME Simulator minimum score 70%→80%, (b) new `QuizAttempt.quizType = "comprehension"` for Phase 3→4 gate, (c) character count ≥500 check in PhaseGateService.
    - Rationale: Thresholds are pedagogical constants that change infrequently. Comprehension gate uses existing QuizAttempt model with `quizType` String value `"comprehension"` (no enum change needed). Character count is a simple query against Character table.
    - Alternatives considered: Configurable per-user thresholds, admin panel for gate settings.
    - Implications: Gate threshold constants extracted to a shared config file (`apps/backend/src/config/gate-thresholds.ts`). `QuizAttempt.quizType` is a `String` (not an enum) — no schema change needed. The tone-sandhi drill is a separate endpoint (`GET /v1/quiz/sandhi-drill/questions`, own `SandhiDrillController`/`SandhiDrillService`), not a `quizType` enum value.

13. **Dedicated Characters Backend Module (`modules/characters/`)** — Following the existing modulith pattern (container.ts, api/, services/, repositories/, types/). 6 read-only GET endpoints: character detail, phonetic component, homophones, decomposition, search (by pinyin/tone/HSK), frequency list. All queries against existing tables populated by 21.1+21.2. No new models or migrations.
    - Rationale: Character data is consumed by multiple features (LexicalHub 21.4, Phonetic Clusters 21.6, IME Simulator Epic 19). A dedicated module prevents ad-hoc endpoint proliferation and provides a single API surface.
    - Alternatives considered: Ad-hoc endpoints in each consuming module, frontend-side JSON consumption.
    - Implications: Requires route audit of `modules/radicals/` for existing character endpoints. Module registration in `app/container.ts`. MSW handlers for frontend testing.

14. **Data Consistency Cleanup** — Strip `metadata.hsk_characters` from all 20 radical entries in `content/radicals/radicals.json`. Add `GET /api/v1/radicals/:id/characters` to existing `modules/radicals/`. Create CI validation script that fails if any radical JSON contains `hsk_characters`. Update Radical Detail Card to fetch from API.
    - Rationale: Enforces all-in-DB ADR — JSON files store only intrinsic attributes; M:N relationships live in the DB. Eliminates data drift risk.
    - Alternatives considered: Keep dual source of truth (JSON + DB), automate JSON→DB sync.
    - Implications: Coordinate frontend change with Epic 19 (Radical Detail Card ownership). CI script is lightweight Node.js (no deps beyond built-ins).

15. **Pinyin Search & Homophone API** — Two endpoints in `modules/characters/`: `GET /api/v1/pinyin/search` queries PinyinSyllable + PinyinCharacterMapping with prefix matching and tone filtering; `GET /api/v1/characters/:glyph/homophones` queries CharacterReading for same-pinyin characters with optional exact-tone filter.
    - Rationale: Both endpoints leverage already-populated tables with simple Prisma queries — high value for minimal effort.
    - Alternatives considered: Client-side filtering of character data (would require loading full dataset).
    - Implications: Both endpoints sit in the characters module (Story 21.10). Pinyin search uses a separate `/api/v1/pinyin/` prefix following REST naming conventions.

16. **Stroke content as structured JSON in content pipeline** — Create `content/strokes/strokes.json` with 5 PRC stroke categories (点/横/竖/撇/折) + 8 extended set + 5 stroke order rules. Frontend loads via `foundationsService.getStrokesReference()` (→ `ROUTE_PATTERNS.foundationsStrokes`).
    - Rationale: Stroke reference data is static reference content, consistent with existing content strategy.
    - Alternatives considered: Hardcoded frontend constants (current state), database tables (overkill).
    - Implications: Content team can update without code changes. Manifest versioning tracks changes.

17. **Mnemonic prompt enhanced with classification + phonetic data** — Add classification, phoneticComponentGlyph, phoneticComponentPinyin, phoneticComponentMeaning to AI prompt. Pictographs skip AI generation (show static "visual memory" note).
    - Rationale: 21.2 already populates all required data. Zero additional token cost.
    - Implications: Backend prompt template change only (~0.5-1d). Blocks 21.20.

18. **Classification-aware mnemonic UI with 4 card layouts** — Pictograph: etymology + visualization. Phono-semantic: meaning/sound columns. Compound ideograph: component breakdown. Simple ideograph: direct explanation.
    - Rationale: Different character types need different presentation. Single layout wastes space.
    - Implications: New `MnemonicCard` component in `apps/frontend/src/shared/components/MnemonicCard/MnemonicCard.tsx`.

19. **Phase D organized as 3 parallel tracks** — Mnemonic (21.14→21.20→21.21), Sandhi Quiz (21.16→21.17), IME+Phonetic (21.15→21.18, 21.19). No cross-track dependencies.
    - Rationale: Maximizes throughput. Each track assigned to one engineer for end-to-end ownership.
    - Implications: Requires coordination on 21.3 and 21.10 availability.

20. **Phase C is MVP cutoff** — Graded Readers MVP (Phase C, 21.4-21.7) is a shippable milestone. Phase D items explicitly deferrable.
    - Rationale: With 21 stories, the epic could stretch to 4-6 weeks. Phase C is the natural ship point.
    - Implications: Phase D items documented as deferrable. 21.9 must complete before Phase C ships.

## Technical Challenges & Solutions

### Gemini raw generation without truncation

**Problem:** `GeminiService.generateText()` truncates output at 500 chars and swallows errors — too short and too opaque for full passage JSON.

**Root Cause:** The truncation + fallback behavior was designed for short quiz-feedback prompts, not structured generation.

**Solution:** Added `generateRaw()` — no substring truncation, `maxTokens` default 1024, 30s timeout, throws `GeminiError` on failure. `PassageGenerationService` calls `geminiService.generateRaw(...)` and validates the returned JSON.

### On-demand TTS instead of batch pre-generation

**Problem:** The BR's Tier-1 GCS batch pre-generation would always miss — passages are AI-generated on demand, so pre-generating audio at generation time produces GCS writes that are never read.

**Root Cause:** Pre-generation assumes a fixed passage library; the reading flow creates passages on the fly.

**Solution:** Tier-2 on-demand TTS per sentence with Tier-3 browser SpeechSynthesis fallback. Audio URLs are returned via `POST /v1/readers/passages/:id/audio` (`fetchPassageAudio` → `audioStore`) rather than embedded in the passage content.

### Word index loaded from the database, not content files

**Problem:** The original design loaded the word index from `content/words/` at server startup; the all-in-DB ADR makes content files a seed-only source.

**Root Cause:** A dual read path (filesystem + DB) violates the all-in-DB data architecture decision.

**Solution:** `SegmenterService.loadWordIndex()` lazy-loads the index from the database via `prisma.word.findMany` + `prisma.character.findMany` on first use (promise-guarded against concurrent init).

### `quizType` is a String, not an enum

**Problem:** Some docs claimed the tone-sandhi drill required extending a `quizType` enum.

**Root Cause:** `QuizAttempt.quizType` is a plain `String` in `schema.prisma` — there is no enum to extend.

**Solution:** The sandhi drill shipped as its own endpoint (`GET /v1/quiz/sandhi-drill/questions` with `SandhiDrillController`/`SandhiDrillService`); `"sandhi-drill"` works as an arbitrary string with no schema change.

## Technical Implementation

### Architecture

The graded readers feature follows the existing modulith pattern, with clear data flow between layers:

**Frontend (React) → Backend (Express) → External Services**

- The frontend library view fetches passages via `GET /v1/readers/passages` and the reading view fetches a single passage with pre-segmented sentences via `GET /v1/readers/passages/:id`.
- The backend `PassageGenerationService` orchestrates generation: it calls `GeminiService.generateRaw()` (no 500-char truncation), passes the result to the `Segmenter` which parses text against the in-memory `WordIndex` (lazy-loaded from the database via `SegmenterService.loadWordIndex()` — `prisma.word.findMany` + `prisma.character.findMany`), and stores the plain-text passage in the DB with a cached segmented result.
- TTS audio is generated on demand per sentence (Tier-2) with browser SpeechSynthesis fallback (Tier-3). Tier-1 GCS batch pre-generation is not implemented. Audio URLs are returned via `POST /v1/readers/passages/:id/audio` (`fetchPassageAudio` → `audioStore`).
- Reading progress flows from the frontend Zustand store → debounced PUT to `/v1/readers/sessions/:passageId` → backend upserts `ReadingSession` records.
- Word lookups (taps in the reading view) are logged as `WordLookupEvent` records for aggregate analytics.
- The `LexicalHub` mounts in the AppLayout modal and routes between entity views based on hubStore state (entityType, entityId, navigationStack).

### API Endpoints

| Method   | Endpoint                                      | Auth         | Description                                                                      |
| -------- | --------------------------------------------- | ------------ | -------------------------------------------------------------------------------- |
| `GET`    | `/v1/readers/passages`                        | optionalAuth | List cached passages (guests see 6 demo passages), optional `?hskLevel=N` filter |
| `GET`    | `/v1/readers/passages/:id`                    | optionalAuth | Passage detail with segmented sentences (guests read-only)                       |
| `POST`   | `/v1/readers/passages/:id/audio`              | Required     | Get audio URLs for all sentences (GCS → on-demand TTS)                           |
| `POST`   | `/v1/readers/generate`                        | Required     | Generate new passage, body: `{ topic }`. Rate-limited to 5/day                   |
| `GET`    | `/v1/readers/sessions/:passageId`             | Required     | Get reading session (position, completed)                                        |
| `PUT`    | `/v1/readers/sessions/:passageId`             | Required     | Update reading position, auto-save                                               |
| `POST`   | `/v1/readers/sessions/:passageId/complete`    | Required     | Mark passage completed                                                           |
| `GET`    | `/v1/readers/bookmarks`                       | Required     | List bookmarked passages                                                         |
| `POST`   | `/v1/readers/bookmarks`                       | Required     | Add bookmark (body: `{ passageId }`)                                             |
| `DELETE` | `/v1/readers/bookmarks/by-passage/:passageId` | Required     | Remove bookmark by passage ID                                                    |

### Component Relationships

**Frontend components (in `features/readers/`):**

- `ReadersPage` — Page-level container mounted at `/learn/readers` (lives at `apps/frontend/src/pages/learn/readers/ReadersPage.tsx`). Phase-gated (requires Phase 3). Renders library or reading view based on route state.
- `ReaderLibrary` — HSK level filter pills + passage card grid (3-col desktop, 2-col tablet, 1-col mobile). States: loading (skeleton), empty (CTA to generate), error (retry), populated.
- `PassageCard` — Passage preview in library: HSK badge, title preview, bookmark toggle, completion checkmark.
- `ReadingView` — Sentence-by-sentence layout with pinyin below each sentence. Inline WordPopover on tap. Integrates AudioControlBar.
- `SentenceDisplay` — Per-sentence row: highlighted text, pinyin below, per-sentence play button (drives `audioStore`).
- `WordPopover` — Compact card with glyph, pinyin, meaning. "Open in Word Hub" button. Audio pauses when open.
- `AudioControlBar` — Play/pause, speed control (0.75x, 1x, 1.25x), progress indicator. Highlights current sentence during playback.
- `PhoneticClusters` — DB-driven cluster browser with HSK filter (separate `features/phonetic-clusters/` feature). Clickable character → opens CharacterHub.

**LexicalHub components (in `features/lexical-hub/`):**

- `LexicalHubRouter` — Mounted in AppLayout Modal. Routes between `WordHubContent`, `CharacterHubContent`, and `RadicalView` based on hubStore state.
- `WordHubContent` — Word-level detail: pinyin, definitions (polysemy), HSK badge, constituent characters as clickable chips.
- `CharacterHubContent` — Existing content moved into lexical-hub feature folder. No functional changes.
- `hubStore` — Generalized Zustand store: `{ entityType, entityId, context, navigationStack }`. Backward-compatible with existing `useCharacterHub` API.

**Backend modules (in `modules/readers/`):**

- `PassageController` — REST endpoints for passage CRUD, generation, sessions, bookmarks.
- `PassageService` — Business logic: generation orchestration, segmentation coordination, cache management.
- `Segmenter` — Parses plain text against in-memory word index. Returns tokenized sentences with known/unknown annotations.
- `GeminiService.generateRaw()` — Generic raw generation (no 500-char truncation, `maxTokens` default 1024, 30s timeout); `PassageGenerationService` calls it and validates/extracts the JSON.
- `TtsService` — On-demand TTS generation per sentence (Tier-2) with browser SpeechSynthesis fallback (Tier-3).
- `WordIndex` — In-memory cache lazy-loaded from the database (Prisma) via `SegmenterService.loadWordIndex()`. Provides simplified→wordId and wordId→hskLevel reverse indexes.

### Phase D: Parallel Execution Tracks

Phase D (Character Practice UI/UX, stories 21.13–21.21) operates as three parallel sub-tracks:

| Sub-track              | Stories               | Depends On                                | Can Start When                 |
| ---------------------- | --------------------- | ----------------------------------------- | ------------------------------ |
| **Mnemonic Track**     | 21.14 → 21.20 → 21.21 | 21.2 ✅                                   | Immediately (21.2 done)        |
| **Sandhi Quiz Track**  | 21.16 → 21.17         | 21.3 → 21.16                              | After Phase B (21.3)           |
| **IME+Phonetic Track** | 21.15 → 21.18, 21.19  | 21.2 ✅ → 21.15; 21.10+21.6 → 21.18/21.19 | After 21.10/21.6 (mid Phase B) |

**Key insight:** 21.14 (Mnemonic Prompt Enhancement, ~0.5-1d) and 21.15 (Badges, ~1d) can start immediately since they only depend on 21.2 which is complete. These are the highest-leverage early actions in Phase D.

### Implementation Plan

1. **Story 21.1 (Redesigned)** — Data Lifecycle: Phase A schema (4 new models: MeasureWord, MeasureWordWord, Component, CharacterComponent), Phase B data population (Character ≥2,971 enriched, Word pinyin/meaning/wordClass ≥2,000, PinyinSyllable ≥1,300, PinyinCharacterMapping ≥2,971, MeasureWord ≥50, MeasureWordWord ≥100, Component ≥500, CharacterComponent ≥2,000), Phase C content regeneration (characters.json, words.json, manifest.json), verification gates
2. **Story 21.2** — Character Content Generation (Make Me a Hanzi import, phonetic inference, classification, pinyin index)
3. **Story 21.3** — Passage Generation Backend (Gemini, segmenter, sandhi rules, polyphone)
4. **Story 21.4** — Reading UI + LexicalHub Phase 1 (Library, reading view, WordPopover, hub, frequency badges, HSK pills)
5. **Story 21.5** — Audio Sync (On-demand TTS, sandhi-aware, Tier-2/Tier-3 fallback)
6. **Story 21.6** — Phonetic Clusters (DB-driven clusters, API, UI tab, HSK filter)
7. **Story 21.7** — Reading Progress (Auto-save, bookmarks, completion tracking)
8. **Story 21.8** — Measure Word Foundation (MeasureWord + MeasureWordWord seed, API endpoint, LexicalHub display integration)
9. **Story 21.9** — Phase Gate Calibration (IME threshold 70%→80%, comprehension gate, character count gate)
10. **Story 21.10** — Characters Backend Module (modules/characters/ with 6 endpoints, container registration, MSW handlers, route audit)
11. **Story 21.11** — Data Consistency Cleanup (strip hsk_characters from radical JSON, radicals/:id/characters endpoint, CI validation)
12. **Story 21.12** — Pinyin Search & Homophone API (GET /api/v1/pinyin/search, GET /api/v1/characters/:glyph/homophones)
13. **Story 21.13** — Stroke Content Foundation (content/strokes/strokes.json, manifest update, strokes endpoint wiring)
14. **Story 21.14** — Phonetic Component in Mnemonic Prompt (AI prompt extension, pictograph skip logic)
15. **Story 21.15** — Pictograph Classification Badges (badge component, golden border, etymology tooltip on Radical Detail Card)
16. **Story 21.16** — Audio-to-Type Neutral Tone & Sandhi Extension (tone 0 button, neutral questions, sandhi-aware scoring)
17. **Story 21.17** — Tone Sandhi Practice Quiz (SandhiDrill micro-quiz with rule cards and dedicated `GET /v1/quiz/sandhi-drill/questions` endpoint; `quizType` stays a `String` — no enum extension)
18. **Story 21.18** — IME Simulator Phonetic Hints (phonetic hint on wrong answer, radical hint toggle, score by type)
19. **Story 21.19** — Radical Trees — Phonetic Tree Toggle (dual-tree toggle, phonetic families, phase-gated preview)
20. **Story 21.20** — Classification-Aware Mnemonic UI (MnemonicCard with 4 layouts, badge pill, regeneration guidance)
21. **Story 21.21** — Pictograph Warmup (PictographGallery, oracle bone evolution, Pictograph Match mini-game)

### Doc Truth-Check (Verify Against Code)

- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
