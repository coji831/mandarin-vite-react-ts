# Epic 21: Foundation Complete — Graded Readers & Character Practice

## Epic Summary

**Goal:** Complete the remaining gaps from Epics 18–21: ship AI-generated graded reading passages with inline word lookup, sentence-level audio, and progress tracking, while simultaneously delivering the full set of character practice enhancements identified in the Epics 18–20 audits — including pictograph warmup, classification-aware mnemonics, sandhi practice, IME phonetic hints, phonetic tree browsing, and structured stroke content.

**Key Points:**

- AI-generated passages via Gemini API with free prompt
- Segmentation on read — backend segmenter against word index
- HSK discovery, not gate — hskProfile computed on read
- Word model: Commonly-queried fields in DB (simplified, pinyin, meaning, hskLevel, frequencyRank, wordClass). WordHskLevel and CharacterHskLevel retained for many-to-many relationships.
- All-in-DB architecture: content/ directory is seed source only; production reads go through Prisma. GCS for binary assets only (TTS audio, stroke SVGs). pgvector for RAG readiness.
- Three-tier tracking: ReviewLog (events), CharacterProgress (SRS state), WordLookupEvent (taps)
- Clean-slate data model: Word widened, Character enhanced (classification, phoneticComponentId), Component model, PinyinSyllable/PinyinCharacterMapping, PhoneticCluster/ClusterMembership, MeasureWord/MeasureWordWord, ContentEmbedding (pgvector)
- Deprecated tables dropped: Progress, VocabularyWord, VocabularyList, WordList, Category, PinyinCombination, ContentItem
- Reading UI with inline word lookup → LexicalHub
- Per-sentence TTS audio with dual-flow fallback
- Reading progress tracking (auto-save, bookmarks)
- Phonetic Clusters browser

**Status:** In Progress
**Last Update:** July 25, 2026

## Background

The graded readers epic introduces an extensive reading experience to the Mandarin learning platform. Learners progress through HSK levels by learning individual characters and radicals, but lack connected reading practice — comprehension is the ultimate goal of language learning, and reading passages bridge the gap between isolated vocabulary study and real-world language use.

**Pedagogical Foundation.** The approach is segmentation-based: passages are generated via Gemini API without hard vocabulary constraints, and the backend segmenter identifies known vs. unknown words at read time against the in-memory word index. HSK level is a discovery tool, not a gate — the `hskProfile` is computed after the fact to let learners browse passages at their approximate level. This avoids the brittleness of enforcing strict 95/5 vocabulary ratios via LLM prompting.

**Market Context.** Competitors like The Chairman's Bao and Mandarin Companion offer graded reading at a subscription cost. This feature differentiates by: (a) AI-generated passages on demand (not a fixed library), (b) tight integration with the learner's existing SRS progress for known-word detection, and (c) a unified LexicalHub that connects word lookup → character breakdown → radical reference in a single flow.

**Audit-Driven Scope Expansion.** Following a comprehensive audit of Epics 18–21, 9 remaining gaps were identified spanning character practice enhancements, mnemonic improvements, sandhi practice, and IME/phonetic features. These have been merged into Epic 21 as stories 21.13–21.21, making this epic the single delivery vehicle for all remaining foundational gaps. The epic now follows a 5-phase model: Phase A (Foundation Data), Phase B (Core Backend), Phase C (Graded Readers MVP), Phase D (Character Practice UI/UX with 3 parallel tracks), and Phase E (Quality & Polish).

**Codebase Readiness.** The existing platform provides a strong foundation:

- ✅ CharacterHub infrastructure (Zustand store + Modal in AppLayout) — extensible to LexicalHub
- ✅ AudioService + TTS integration (existing `/v1/tts` endpoint)
- ✅ Phase gating (PhaseGate model) — readers require Phase 3
- ✅ Design token system (CSS variables in `globals.css`)
- ✅ Shared components: Card, Grid, Modal, LoadingScreen, ErrorScreen, Tabs
- ✅ Storybook + MSW for visual component testing
- ✅ Passage/reading models in Prisma schema (Story 21.1 — Phase A schema complete)
- ✅ Word index seeded with 11,092 words from HSK 3.0 CSV (Story 21.1)
- ⏳ PinyinSyllable table seeding (≥1,300 entries) — pending Story 21.1 Phase B population
- ✅ pgvector extension enabled on Neon
- ⏳ CharacterRadical.decompositionType schema exists — population pending Story 21.1 Phase B enrichment
- ⏳ Character.classification — schema exists with 9 characters classified; bulk population (≥500) pending Story 21.1 Phase B
- ⏳ Character enrichment (strokeCount, pinyin, etymology, frequencyRank, commonWords, phoneticComponentId) — pending Story 21.1 Phase B data population
- ⏳ MeasureWord + Component models — pending Story 21.1 new schema addition
- ✅ Progress table dropped per clean-slate migration
- ❌ GeminiService capped at 500 tokens — needs `generatePassage()` method

## User Stories

This epic consists of the following user stories:

1. #ISSUE-21.1 / **Data Lifecycle** _(story-21-1-data-lifecycle.md)_
   - As a learner, I want the graded readers to have accurate HSK vocabulary leveling, normalized content, and reliable progress tracking, so that my reading experience is based on well-organized, level-appropriate content.

2. #ISSUE-21.2 / **Character Content Generation** _(story-21-2-character-content.md)_
   - As a learner, I want characters to be enriched with decomposition data, phonetic component analysis, classification (pictograph/phono-semantic), and coverage milestones, so that the reading experience includes rich character-level context.

3. #ISSUE-21.3 / **Passage Generation Backend** _(story-21-3-passage-generation.md)_
   - As a learner, I want to receive AI-generated reading passages that are accurately segmented and leveled, with sandhi-aware pronunciation and polyphone disambiguation, so that I always have fresh, linguistically accurate reading material.

4. #ISSUE-21.4 / **Reading UI + LexicalHub Phase 1** _(story-21-4-reading-ui-lexical-hub.md)_
   - As a learner, I want to browse passages by HSK level, read with inline word lookup via LexicalHub, see frequency badges and HSK pills, and access phonetic decomposition, so that I can understand new vocabulary in context.

5. #ISSUE-21.5 / **Audio Sync** _(story-21-5-audio-sync.md)_
   - As a learner, I want to hear each sentence read aloud via TTS with sandhi-aware pronunciation and fallback support, so that I can practice listening and pronunciation simultaneously.

6. #ISSUE-21.6 / **Phonetic Clusters** _(story-21-6-phonetic-clusters.md)_
   - As a learner, I want to browse characters grouped by shared phonetic elements, with DB-driven clusters and HSK-level filters, so that I can recognize pronunciation patterns and guess how new characters sound.

7. #ISSUE-21.7 / **Reading Progress** _(story-21-7-reading-progress.md)_
   - As a learner, I want to track which passages I've completed, bookmark my position, and auto-save my reading progress, so that I can resume reading later.

8. #ISSUE-21.8 / **Measure Word Foundation** _(story-21-8-measure-word-foundation.md)_
   - As a learner, I want to see measure words paired with their associated nouns during vocabulary lookup, so that I can learn which measure word to use with which noun in context.

9. #ISSUE-21.9 / **Phase Gate Calibration** _(story-21-9-phase-gate-calibration.md)_
   - As a learner, I want phase gates to accurately assess my readiness before unlocking new content, so that I progress at the right pace and don't skip foundational knowledge.

10. #ISSUE-21.10 / **Characters Backend Module** _(story-21-10-characters-module.md)_
    - As a developer/learner, I want a dedicated characters backend module with proper API endpoints for character lookup, decomposition, phonetic components, homophones, search, and frequency data, so that the LexicalHub (21.4), Phonetic Clusters (21.6), and other features can consume consistent, well-documented APIs instead of ad-hoc endpoints scattered across modules.

11. #ISSUE-21.11 / **Data Consistency Cleanup — Radical JSON → API** _(story-21-11-data-consistency-cleanup.md)_
    - As a developer, I want radical data to have a single source of truth by migrating hsk_characters from radical JSON files into the database and exposing them via API, so that we eliminate data drift between content JSON and the database, enforce the all-in-DB architecture decision, and prevent future inconsistency bugs.

12. #ISSUE-21.12 / **Pinyin Search & Homophone API** _(story-21-12-pinyin-search-homophones.md)_
    - As a learner, I want to search characters by pinyin and find homophones (characters sharing the same pronunciation), so that I can discover characters by sound, understand homophone relationships, and build a foundation for IME autocomplete and phonetic cluster exploration.

13. #ISSUE-21.13 / **Stroke Content Foundation** _(story-21-13-stroke-content-foundation.md)_
    - As a learner, I want stroke reference data to be part of the structured content pipeline rather than hardcoded frontend constants, so that stroke categories, types, and order rules are consistent across the platform and maintainable as the content library grows.

14. #ISSUE-21.14 / **Phonetic Component in Mnemonic Prompt** _(story-21-14-phonetic-component-mnemonic-prompt.md)_
    - As a learner, I want mnemonics to leverage phonetic components and character classification data, so that AI-generated memory aids are more accurate and tailored to how each character is actually constructed.

15. #ISSUE-21.15 / **Pictograph Classification Badges** _(story-21-15-pictograph-classification-badges.md)_
    - As a learner, I want to instantly recognize character type (pictograph, phono-semantic, compound ideograph, simple ideograph) through visual badges and see special treatment for pictographs, so that I intuitively understand how each character works.

16. #ISSUE-21.16 / **Audio-to-Type Neutral Tone & Sandhi Extension** _(story-21-16-audio-to-type-neutral-tone-sandhi.md)_
    - As a learner, I want to practice distinguishing neutral tone (tone 5) from full tones and receive sandhi-aware scoring in the Audio-to-Type quiz, so that I can recognize toneless syllables and tone sandhi patterns in natural speech.

17. #ISSUE-21.17 / **Tone Sandhi Practice Quiz** _(story-21-17-tone-sandhi-practice-quiz.md)_
    - As a learner, I want to practice tone sandhi rules in context through interactive drills, so that I can internalize how tones change in natural speech (3-3 → 2-3, 不 before 4th, 一 tone shifts).

18. #ISSUE-21.18 / **IME Simulator Phonetic Hints** _(story-21-18-ime-simulator-phonetic-hints.md)_
    - As a learner, I want phonetic hints when I answer incorrectly in the IME Simulator, so that I can learn from mistakes by seeing the phonetic component relationship, with optional radical hints at a score penalty.

19. #ISSUE-21.19 / **Radical Trees — Phonetic Tree Toggle** _(story-21-19-radical-trees-phonetic-tree-toggle.md)_
    - As a learner, I want to browse characters by shared phonetic elements with a dual-tree toggle (Radical↔Phonetic), so that I can discover pronunciation patterns and see which characters share the same sound component.

20. #ISSUE-21.20 / **Classification-Aware Mnemonic UI** _(story-21-20-classification-aware-mnemonic-ui.md)_
    - As a learner, I want mnemonics tailored to character type with four distinct card layouts (pictograph, phono-semantic, compound ideograph, simple ideograph), so that memory aids match the character's actual construction logic.

21. #ISSUE-21.21 / **Pictograph Warmup (Gallery + Mini-game)** _(story-21-21-pictograph-warmup-gallery-mini-game.md)_
    - As a learner, I want to start with a pictograph-focused warmup featuring an oracle bone evolution gallery and matching mini-game, so that I build intuition for character origins before tackling complex characters.

## Story Breakdown Logic

This epic is divided into stories based on a dependency chain updated by the clean-slate data model redesign:

- **Story 21.1 (Data Lifecycle)** is the critical prerequisite — establishes the foundational schema (Word, Character, PinyinSyllable, MeasureWord, Component scaffold, CharacterComponent, PinyinCharacterMapping), seeds all reference data (≥2,971 characters, ≥1,300 pinyin syllables, ≥50 measure words, ≥500 components, ≥2,000 decomposition records), enriches character fields (strokeCount, classification, etymology, frequencyRank, commonWords, phoneticComponentId, pinyin readings), enriches word fields (pinyin, meaning, wordClass for ≥2,000 words), and regenerates aggregate content files. Redesigned scope adds 4 new models (MeasureWord, MeasureWordWord, Component, CharacterComponent), Make Me a Hanzi import pipeline for decomposition data, and CC-CEDICT/Unihan import for pinyin/definitions.
- **Story 21.2 (Character Content Generation)** — Depends on 21.1. Imports Make Me a Hanzi decomposition data, infers phonetic components, populates character classification and CharacterRadical.decompositionType, generates the pinyin→character reverse index. Blocks 21.4 (frequency badges/HSK pills) and 21.6 (DB-driven phonetic clusters).
- **Story 21.3 (Passage Generation Backend)** depends on 21.1 only. Builds the server-side foundation with Gemini integration, sandhi-aware segmentation, and polyphone disambiguation.
- **Story 21.4 (Reading UI + LexicalHub)** depends on 21.1 and 21.2 — consumes passage API and enriched character data. Renders the reading experience with frequency badges, HSK pills, phonetic decomposition layout.
- **Story 21.5 (Audio Sync)** depends on 21.3 — uses ToneSandhiService from 21.3 for sandhi-aware TTS. Can proceed in parallel with 21.4.
- **Story 21.6 (Phonetic Clusters)** — DB-driven clusters. Depends on 21.2 (character enrichment with phonetic component data). Phase 2 gated (was Phase 3). Can run in parallel with 21.4.
- **Story 21.7 (Reading Progress)** — Depends on 21.4 and 21.5. Minimal changes from original scope.
- **Story 21.8 (Measure Word Foundation)** — Depends on 21.1 (MeasureWord + MeasureWordWord schema and seed data now part of 21.1). Consumes the already-seeded data to expose a `GET /api/v1/words/:id/measure-words` endpoint and integrate measure word display into LexicalHub. No longer needs to create models or seed data — those responsibilities moved to 21.1. Not on the critical path for 21.4 reading UI, but blocks measure word display integration in LexicalHub. Can proceed in parallel with 21.4-21.7.
- **Story 21.9 (Phase Gate Calibration)** — Standalone — no data dependencies. Raises IME Simulator threshold from 70%→80%, implements a Phase 3→4 comprehension gate (≥60% on 5 passage questions + ≥90% known words), and adds a character count ≥500 gate check for Phase 2→3. Should complete before 21.4 ships to ensure correct gating for reading content.
- **Story 21.10 (Characters Backend Module)** — Depends on 21.1 and 21.2. Creates `modules/characters/` following the modulith pattern with 6 read-only endpoints (character detail, phonetic component, homophones, decomposition, search, frequency). All data already exists in tables populated by 21.1+21.2 — purely an API wiring task. Blocks 21.4 (LexicalHub needs character API) and 21.6 (Phonetic Clusters needs phonetic component API). Should be implemented before those stories complete their backend work.
- **Story 21.11 (Data Consistency Cleanup)** — Depends on 21.1 (CharacterRadical table) and 21.2 (character data). Strips `metadata.hsk_characters` from radical JSON files, adds `GET /api/v1/radicals/:id/characters` endpoint, updates Radical Detail Card to consume API instead of JSON, adds CI validation. Independent of most other stories — can proceed in parallel with 21.4-21.9. Touches Epic 19 surface (Radical Detail Card) — coordinate frontend changes.
- **Story 21.12 (Pinyin Search & Homophone API)** — Depends on 21.10 (Characters module provides route infrastructure). Adds `GET /api/v1/pinyin/search` and `GET /api/v1/characters/:glyph/homophones` endpoints. Data already populated by 21.2 (PinyinSyllable ≥1,300 entries, PinyinCharacterMapping, CharacterReading). Feeds 21.4 LexicalHub homophone display and Epic 19 IME Simulator autocomplete.

### Phase D: Character Practice UI/UX (Stories 21.13–21.21)

The 9 new stories are organized into three parallel tracks that can proceed concurrently once upstream dependencies are met:

**Mnemonic Track** (21.14 → 21.20 → 21.21):

- **Story 21.14 (Mnemonic Prompt Enhancement)** — Depends only on 21.2 ✅ (classification + phoneticComponentId populated). Tiny backend prompt change (~0.5-1d). Immediately actionable. Adds classification, phoneticComponentGlyph/pinyin/meaning to AI prompt. Pictographs skip AI generation.
- **Story 21.20 (Classification-Aware Mnemonic UI)** — Depends on 21.14 (prompt enhancement). Redesigns mnemonic display card with 4 classification-aware layouts. Purely frontend after 21.14.
- **Story 21.21 (Pictograph Warmup)** — Depends on 21.20 (reuses mnemonic card layout). Adds PictographGallery tab with oracle bone evolution, Pictograph Match mini-game. Phase-gated.

**Sandhi Quiz Track** (21.16 → 21.17):

- **Story 21.16 (Neutral Tone & Sandhi Extension)** — Depends on 21.3 (ToneSandhiService). Extends Audio-to-Type quiz with tone 5 button, neutral-tone questions, sandhi-aware scoring.
- **Story 21.17 (Tone Sandhi Practice Quiz)** — Depends on 21.16. New SandhiDrill micro-quiz with rule cards and 10-question drill. New quiz strategy.

**IME+Phonetic Track** (21.15 → 21.18, 21.19):

- **Story 21.15 (Pictograph Classification Badges)** — Depends on 21.2 ✅ (classification field populated). Pure frontend badge component (~1d). Immediately actionable. Blocks 21.18 and 21.19.
- **Story 21.18 (IME Simulator Phonetic Hints)** — Depends on 21.10 (characters module API) and 21.15. Extends IME Simulator with phonetic hint on wrong answer, radical hint toggle with -5% score penalty.
- **Story 21.19 (Phonetic Tree Toggle)** — Depends on 21.6 (Phonetic Clusters API) and 21.10 (characters module) and 21.15. Largest new story (~4-5d). Adds dual-tree toggle to Radical Trees.

**Standalone**:

- **Story 21.13 (Stroke Content Foundation)** — No dependencies. Creates structured stroke content in `content/strokes/strokes.json`. Phase A data task.

## Acceptance Criteria

- [ ] All 21 stories implemented with passing acceptance criteria
- [ ] Feature fully functional for authenticated users (generation, reading, audio, progress)
- [ ] Guest users can read 6 demo passages (1 per HSK level 1-6) with read-only lookup
- [ ] Phase 3 gating respected — users cannot access readers before completing Phase 2
- [ ] 0 lint errors across frontend and backend
- [ ] Test coverage meets minimums: unit tests for all new services/utilities, Storybook stories covering loading/empty/error/populated states for every new component
- [ ] No regressions in existing CharacterHub usage
- [ ] Rate limiting enforced: 5 generations/day for auth users, 0 for guests
- [ ] Character table populated with ≥2,971 unique characters from HSK vocabulary
- [ ] Character enrichment fields populated: strokeCount (100%), classification (≥500), etymology (≥500), frequencyRank (≥2,971), commonWords (all chars), phoneticComponentId (all phono-semantic), pinyin readings (≥2,000)
- [ ] Word enrichment fields populated: pinyin (≥2,000), meaning (≥2,000), wordClass (≥2,000)
- [ ] PinyinSyllable table seeded with ≥1,300 entries
- [ ] PinyinCharacterMapping table populated with ≥2,971 entries
- [ ] CharacterRadical.decompositionType populated for all characters ('semantic' | 'phonetic' | 'remaining')
- [ ] Character.classification populated for ≥500 characters (pictographs, ideographs, phono-semantic compounds)
- [ ] Component scaffold populated with ≥500 components
- [ ] CharacterComponent decomposition data populated for ≥2,000 characters
- [ ] Measure word table seeded with ≥50 HSK 1-3 common measure words
- [ ] MeasureWordWord noun-pairing table populated with ≥100 correct measure word → noun associations
- [ ] pgvector extension enabled on Neon
- [ ] Deprecated tables dropped: Progress, VocabularyWord, VocabularyList, WordList, Category, PinyinCombination, ContentItem (Phase C)
- [ ] Phase C table drops executed immediately (no 2-week safety window — clean-slate drops old data)
- [ ] `content/characters/characters.json` regenerated with ≥2,971 enriched entries
- [ ] `content/words/words.json` and `content/words/index.json` refreshed
- [ ] `content/manifest.json` updated to reflect all entity counts
- [ ] Verification gates passed: SQL count queries match targets, file sizes within range, spot-checks pass
- [ ] Design token compliance verified via `npm run design-audit`
- [ ] `GET /api/v1/words/:id/measure-words` endpoint returns measure words for a given noun
- [ ] IME Simulator threshold raised from 70%→80%
- [ ] Phase 3→4 comprehension gate implemented: ≥60% on 5 passage questions + ≥90% known words
- [ ] Character count ≥500 gate check implemented for Phase 2→3
- [ ] Seed scripts for measure words are idempotent (safe to re-run)
- [ ] Characters module (`modules/characters/`) created with 6 REST endpoints — registered in app container
- [ ] Radical JSON files stripped of `metadata.hsk_characters` — CI validation script prevents reintroduction
- [ ] `GET /api/v1/radicals/:id/characters` endpoint returns characters from DB (not JSON)
- [ ] `GET /api/v1/pinyin/search` endpoint returns characters grouped by tone, paginated
- [ ] `GET /api/v1/characters/:glyph/homophones` endpoint returns same-pronunciation characters
- [ ] MSW handlers created for all new endpoints (characters, radicals/characters, pinyin/search)
- [ ] Unit tests for all new service methods
- [ ] Radical Detail Card fetches characters from API instead of reading from JSON
- [ ] `content/strokes/strokes.json` created with 5 PRC stroke categories + 8 extended set + 5 stroke order rules
- [ ] `content/manifest.json` updated with stroke entity reference count
- [ ] Frontend loads stroke data from `content/strokes/` via ContentIndexService (not hardcoded constants)
- [ ] AI mnemonic prompt includes classification, phoneticComponentGlyph, phoneticComponentPinyin, phoneticComponentMeaning for non-pictograph characters
- [ ] Pictograph characters skip AI mnemonic generation — show static "visual memory" note instead
- [ ] Classification badges (🖼️/🔤/🧩/⚡) displayed on Radical Detail Card example character grid
- [ ] Pictographs shown with golden border + tooltip explaining oracle bone origin
- [ ] Audio-to-Type quiz has tone 5 button for neutral tone questions
- [ ] Neutral-tone questions generated from common particles (吗, 了, 的, 着, 过, 们, 子)
- [ ] SandhiDrill micro-quiz created with rule explanation cards + 10-question drill
- [ ] QuizAttempt.quizType extended to support "sandhi-drill" enum value
- [ ] IME Simulator shows phonetic hint on wrong answer with radical hint toggle (-5% score penalty)
- [ ] Score breakdown by character type in IME Simulator results
- [ ] Radical Trees feature has dual-tree toggle (Radical↔Phonetic view)
- [ ] Phonetic tree shows top 10 families in Phase 2 preview, full expansion (~100+ families) in Phase 3
- [ ] Mnemonic display card has 4 distinct layouts based on character classification
- [ ] PictographGallery tab added with 12–20 common pictographs showing oracle bone script evolution
- [ ] Pictograph Match mini-game implemented (oracle bone form → choose correct character, 4-option MCQ)
- [ ] Phase C (Graded Readers MVP) documented as the MVP cutoff — Phase D items can be deferred to follow-up

## Architecture Decisions

- **Decision: Passage generation via Gemini API (free prompt)**
  - Rationale: Segmenter handles word identification at read time. No hard vocabulary constraints needed in the prompt.
  - Alternatives considered: Constrained generation with known vocabulary lists baked into prompt, pre-written passage library
  - Implications: Gemini API costs scale with usage; inconsistent quality requires fallback/retry logic

- **Decision: Word model stores commonly-queried fields in DB**
  - Rationale: All-in-DB strategy requires frequently accessed fields (simplified, pinyin, meaning, hskLevel, frequencyRank, wordClass) to be indexed columns. Eliminates dual-path complexity of DB + JSON aggregate files. Enables relational queries, pgvector embeddings, and simpler caching.
  - Alternatives considered: Pure ID-only with aggregate JSON files (original approach — superseded by clean-slate redesign), hybrid model with enrichment in JSON metadata
  - Implications: Larger migration scope (Phase B widening), but eliminates content file read path for production. Content files remain as seed source only.
  - Supersedes: Previous "Word model as pure ID-only" decision

- **Decision: Backend segments passages at read time**
  - Rationale: Backend handles all processing against the in-memory word index. Frontend receives pre-tokenized passages with known/unknown annotations.
  - Alternatives considered: Frontend-side segmentation with client-side word index, pre-segment on passage creation
  - Implications: Simpler frontend; read-time latency for first load (mitigated by caching)

- **Decision: HSK profile computed lazily, not enforced at generation**
  - Rationale: Passages are decoupled from word lists. The `hskProfile` is computed by the segmenter on first read and cached alongside the passage.
  - Alternatives considered: Pre-compute at generation time, enforce strict 95/5 vocabulary ratio
  - Implications: More flexible but less predictable difficulty; learners may encounter passages slightly above/below their level

- **Decision: Batch TTS pre-generation with dual-flow fallback**
  - Rationale: Per-sentence latency would ruin reading flow. All sentences are queued for TTS when a passage is first requested, with parallel generation.
  - Alternatives considered: Stream TTS sentence-by-sentence, generate on-demand per sentence
  - Implications: Higher initial latency for passage load; better reading experience once cached

- **Decision: Unified LexicalHub replaces standalone CharacterHub**
  - Rationale: Single hub with generalized hubStore supports word → character → radical navigation in one modal, preventing duplicate code across entity types.
  - Alternatives considered: Keep CharacterHub separate, build separate WordHub
  - Implications: Requires backward-compatible hook migration; larger initial implementation scope

- **Decision: Three-tier tracking — ReviewLog (events), CharacterProgress (SRS state), WordLookupEvent (taps)**
  - Rationale: Event-sourced ReviewLog enables future CQRS. CharacterProgress tracks per-glyph SRS state. WordLookupEvent provides aggregate analytics.
  - Alternatives considered: Single Progress table for all tracking, no event sourcing
  - Implications: More tables to maintain; richer analytics capability; clear separation of concerns

- **Decision: Passage-level granularity for progress with auto-saved sentence position**
  - Rationale: Passage is either completed or not completed. Auto-saved sentence position enables resume without per-sentence state overhead.
  - Alternatives considered: Per-sentence completion tracking, word-level progress within passages
  - Implications: Simpler implementation; sufficient for the reading use case

- **Decision: All-in-DB data architecture**
  - Rationale: Eliminates dual read paths (DB + filesystem/GCS), solves GCS O(n) scaling for radicals/characters, enables pgvector embeddings, simplifies caching to Redis-caches-DB-results. content/ directory becomes git-versioned seed source only — never read at runtime.
  - Implications: Larger DB storage (~50MB — negligible). Seeding is critical path (~30s). Devs lose hot-edit of JSON (mitigated by fast `npm run db:seed`).
  - Supersedes: ADR-006 4-tier data tiering architecture with aggregate JSON enrichment files

- **Decision: pgvector for vector embeddings**
  - Rationale: Data scale (~15K vectors) is trivially small for pgvector. Neon supports it. Avoids second database complexity. ContentEmbedding table decouples schema from embedding lifecycle.
  - Implications: Requires pgvector extension on Neon. Embedding pipeline runs on seed/update events.

- **Decision: Phase C drops without 2-week safety window**
  - Rationale: Old tables (Progress, VocabularyWord, etc.) contain data from previous schema that is being superseded, not migrated. No users rely on these tables. Clean-slate drops are immediate.
  - Implications: Irreversible after execution. All Phase B migration must be verified before Phase C runs.

- **Decision: Measure word model with permanent content IDs (mw_XXXXX)**
  - Rationale: Measure words are content entities with pedagogical value (noun pairing, category classification, usage notes). Permanent IDs ensure stability across seed re-runs and enable future relational queries (e.g., "find all nouns compatible with 个").
  - Alternatives considered: JSON metadata on Word records, static lookup table in frontend code
  - Implications: MeasureWordWord junction table required for many-to-many noun pairing. Seed scripts must be idempotent via ON CONFLICT DO NOTHING.

- **Decision: Phase gate calibration via configuration — hard thresholds, not dynamic**
  - Rationale: Thresholds (IME 80%, comprehension ≥60%, character count ≥500) are pedagogical constants, not user-configurable settings. Hard-coding avoids complexity of a gate-configuration UI and prevents learners from lowering standards.
  - Alternatives considered: Configurable thresholds per user, server-side admin panel
  - Implications: Changes require a deploy. Acceptable — gate thresholds change infrequently (months/years). Add config constants file for single-source-of-truth.

- **Decision: Stroke content as structured JSON in content pipeline**
  - Rationale: Stroke reference data (categories, types, order rules) is static reference content, not user-generated data. Storing in the content pipeline with manifest tracking is consistent with the existing content strategy (characters, radicals, pinyin). The frontend loads via ContentIndexService just like other content types.
  - Alternatives considered: Hardcoded frontend constants (current state — violates DRY), database tables (overkill for static reference data that rarely changes)
  - Implications: Content team can update stroke data without code changes. Manifest versioning tracks changes.

- **Decision: Mnemonic prompt enhanced with classification and phonetic component data**
  - Rationale: 21.2 already populates Character.classification and CharacterComponent for phonetic components. Adding these to the AI prompt costs ~0 extra tokens per prompt (using existing data) and significantly improves mnemonic quality. Pictographs skip AI entirely since their construction is visual, not compositional.
  - Alternatives considered: Post-process AI output to add classification labels, client-side classification-only UI without prompt changes
  - Implications: Backend prompt template change only. No frontend changes in 21.14. Blocks 21.20 (mnemonic UI).

- **Decision: Classification-aware mnemonic UI with 4 distinct card layouts**
  - Rationale: Different character types benefit from different presentation: pictographs need etymology/visualization; phono-semantic needs meaning/sound columns; compound ideographs need component breakdown; simple ideographs need concise direct explanation. A single layout for all types wastes space and confuses the learner.
  - Alternatives considered: Single layout with classification badge only (loses pedagogical opportunity), separate components per type (over-engineering)
  - Implications: New MnemonicCard component required in features/mnemonics/. Reuses classification data from 21.2.

- **Decision: Phase D organized as 3 parallel tracks (Mnemonic, Sandhi Quiz, IME+Phonetic)**
  - Rationale: The 8 Phase D stories have no cross-track dependencies — they only depend on Phase B/C stories. Running them in parallel maximizes throughput. Each track can be assigned to a single engineer for end-to-end ownership.
  - Alternatives considered: Sequential execution (extends delivery timeline by 2-3 weeks), full parallel with no track grouping (ownership fragmentation)
  - Implications: Requires coordination on 21.3 and 21.10 availability since both are upstream bottlenecks for multiple tracks.

- **Decision: Phase C (Graded Readers MVP) is the MVP cutoff**
  - Rationale: With 21 stories, the epic could stretch to 4-6 weeks. The Graded Readers MVP (Phase C, stories 21.4-21.7) is a natural shippable milestone. If Phase D items slip, they can be deferred to a follow-up epic without blocking the reading experience.
  - Alternatives considered: Ship all 21 stories together (high risk of delay), split into two epics now (more documentation overhead)
  - Implications: Phase D items are explicitly documented as deferrable. Story 21.9 (Phase Gate Calibration) should complete before Phase C ships to ensure correct gating.

- **Decision: Dedicated Characters Backend Module (`modules/characters/`)**
  - Rationale: Character data is consumed by multiple features (LexicalHub, Phonetic Clusters, IME Simulator, reading UI). A dedicated module following the modulith pattern prevents ad-hoc endpoint proliferation and provides a single, consistent API surface. All data is already in the DB (populated by 21.1+21.2) — this module is purely an API wiring layer.
  - Alternatives considered: Ad-hoc character endpoints in each consuming module (violates DRY), frontend-side JSON consumption (violates all-in-DB ADR), keep in radicals module (mixes concerns)
  - Implications: Requires audit of existing radicals module for character-specific routes that need refactoring. New module has no model changes — only controllers, services, and repositories.

## Implementation Plan

1. Data Lifecycle (Redesigned) — Add 4 new models (MeasureWord, MeasureWordWord, Component, CharacterComponent), populate Character table ≥2,971, enrich all character fields (strokeCount, classification, etymology, frequencyRank, commonWords, phoneticComponentId, pinyin readings), enrich Word fields (pinyin, meaning, wordClass for ≥2,000), seed PinyinSyllable ≥1,300 + PinyinCharacterMapping ≥2,971, seed MeasureWord ≥50 + MeasureWordWord ≥100, import Make Me a Hanzi decomposition data for Component scaffold ≥500 + CharacterComponent ≥2,000, import CC-CEDICT/Unihan for pinyin/definitions, regenerate all aggregate content files, run verification gates
2. Character Content Generation — Make Me a Hanzi import, phonetic inference, pinyin index, character classification
3. Passage Generation Backend — Gemini integration, segmenter, sandhi rules engine, polyphone disambiguation, caching, rate limiting
4. Reading UI + LexicalHub Phase 1 — Library view, reading view, inline WordPopover, unified LexicalHub, frequency badges, HSK pills
5. Audio Sync — Per-sentence TTS playback, sandhi-aware pronunciation, dual-flow fallback, audio controls
6. Phonetic Clusters — DB-driven cluster browser, phonetic family API, HSK filter, Phase 2 gating
7. Reading Progress — Auto-save, bookmarks, completion tracking, guest ephemeral state
8. Measure Word Foundation — MeasureWord + MeasureWordWord models, seed ~50 HSK 1-3 entries, API endpoint
9. Phase Gate Calibration — Raise IME threshold 70%→80%, comprehension gate, character count gate
10. Characters Backend Module — Create modules/characters/ with 6 endpoints (detail, phonetic, homophones, decomposition, search, frequency), register in container, add MSW handlers
11. Data Consistency Cleanup — Strip hsk_characters from radical JSON, add radicals/:id/characters endpoint, update Radical Detail Card, add CI validation
12. Pinyin Search & Homophone API — Add GET /api/v1/pinyin/search and GET /api/v1/characters/:glyph/homophones endpoints in characters module
13. Stroke Content Foundation — Create content/strokes/strokes.json with 5 categories + 8 types + 5 rules, update manifest, wire ContentIndexService
14. Phonetic Component in Mnemonic Prompt — Extend AI prompt with classification + phonetic component data, add pictograph skip logic
15. Pictograph Classification Badges — Add classification badges to Radical Detail Card example character grid, golden border for pictographs, etymology tooltip
16. Audio-to-Type Neutral Tone & Sandhi Extension — Add tone 5 button, neutral-tone questions, sandhi-aware scoring, QuizAttempt metadata
17. Tone Sandhi Practice Quiz — Create SandhiDrill with rule cards + 10-question drill, new quiz strategy, QuizAttempt.quizType extension
18. IME Simulator Phonetic Hints — Add phonetic hint on wrong answer, radical hint toggle with -5% penalty, score by character type
19. Radical Trees — Phonetic Tree Toggle — Add dual-tree toggle (Radical↔Phonetic), Phase 2 preview (top 10 families), Phase 3 full expansion
20. Classification-Aware Mnemonic UI — Create MnemonicCard with 4 distinct layouts based on character classification, badge pill, regeneration guidance
21. Pictograph Warmup (Gallery + Mini-game) — Add PictographGallery tab with 12-20 pictographs, oracle bone evolution, Pictograph Match mini-game

## Risks & mitigations

- Risk: Gemini API cost overrun due to passage generation volume — Severity: Medium
  - Mitigation: Rate limiting (5 generations/day per user). Prompt design minimizes token usage. Cache passages to avoid regeneration.
  - Rollback: Disable generation endpoint. Fall back to 6 seed demo passages.

- Risk: Migration data loss during Phase B→C transition — Severity: High
  - Mitigation: Phase B verified before Phase C executes. All transforms validated via integrity checks (record count matching, FK consistency).
  - Rollback: Database backup restore. Phase C is irreversible — backup must exist.

- Risk: Seed script timing — Severity: Low
  - Mitigation: All seeds are idempotent (ON CONFLICT DO NOTHING). Re-running seeds is safe and fast.
  - Rollback: Re-run the seed script. No data loss from re-execution.

- Risk: Character pipeline complexity (Story 21.2) — Severity: Medium
  - Mitigation: Incremental milestone of 500 characters classified before full 2,971. Manual override list for known phonetic component exceptions.
  - Rollback: Use existing 11-character fallback set. Classification inference can be deferred without blocking other stories.

- Risk: Scope creep from 12→21 stories (doubled delivery horizon) — Severity: Medium
  - Mitigation: Phase C (Graded Readers MVP) documented as MVP cutoff. Phase D items explicitly deferrable to follow-up epic if needed.
  - Rollback: Defer unfinished Phase D stories to a new follow-up epic. Ship Phase C as Epic 21.

- Risk: Ownership fragmentation across 3 Phase D tracks touching different feature areas — Severity: Medium
  - Mitigation: Assign each track (Mnemonic, Sandhi Quiz, IME+Phonetic) to a single engineer for end-to-end ownership. Avoid splitting a track across multiple people.
  - Rollback: Consolidate tracks under one owner if fragmentation causes integration issues.

- Risk: Dependencies on unstarted stories (21.10, 21.6) block Phase D tracks — Severity: Medium-High
  - Mitigation: Prioritize 21.10 and 21.6 within Phase B since both are upstream bottlenecks for multiple Phase D stories. 21.10 is pure API wiring — lowest-risk Phase B story.
  - Rollback: Implement 21.18 and 21.19 as frontend-only with mock data if backend APIs not ready, then swap to real API later.

## Implementation notes

- Backend implementation follows conventions in `docs/guides/conventions/backend.md`
- SOLID principles applied throughout service layer — see `docs/knowledge-base/practices/solid-principles.md`
- Prisma schema changes must follow `.github/instructions/prisma-schema-changes.instructions.md`
- All new Prisma migrations require verification via `npm run db:seed` before commit
- Frontend API calls must use the service layer pattern per `.github/instructions/frontend-api-client.instructions.md`
- Storybook-first mandate applies to all new UI components per `.github/instructions/frontend-visual-design-protocol.instructions.md`
