# Epic 21: Graded Readers

## Epic Summary

**Goal:** Provide AI-generated graded reading passages at controlled HSK vocabulary levels so learners can practice reading in context, with inline word lookup, sentence-level audio, and progress tracking.

**Key Points:**

- AI-generated passages via Gemini API with free prompt
- Segmentation on read — backend segmenter against word index
- HSK discovery, not gate — hskProfile computed on read
- Word model: Pure ID-only, WordHskLevel/CharacterHskLevel tables
- Three-tier tracking: ReviewLog (events), CharacterProgress (SRS state), WordLookupEvent (taps)
- Reading UI with inline word lookup → LexicalHub
- Per-sentence TTS audio with dual-flow fallback
- Reading progress tracking (auto-save, bookmarks)
- Phonetic Clusters browser

**Status:** In Progress
**Last Update:** July 23, 2026

## Background

The graded readers epic introduces an extensive reading experience to the Mandarin learning platform. Learners progress through HSK levels by learning individual characters and radicals, but lack connected reading practice — comprehension is the ultimate goal of language learning, and reading passages bridge the gap between isolated vocabulary study and real-world language use.

**Pedagogical Foundation.** The approach is segmentation-based: passages are generated via Gemini API without hard vocabulary constraints, and the backend segmenter identifies known vs. unknown words at read time against the in-memory word index. HSK level is a discovery tool, not a gate — the `hskProfile` is computed after the fact to let learners browse passages at their approximate level. This avoids the brittleness of enforcing strict 95/5 vocabulary ratios via LLM prompting.

**Market Context.** Competitors like The Chairman's Bao and Mandarin Companion offer graded reading at a subscription cost. This feature differentiates by: (a) AI-generated passages on demand (not a fixed library), (b) tight integration with the learner's existing SRS progress for known-word detection, and (c) a unified LexicalHub that connects word lookup → character breakdown → radical reference in a single flow.

**Codebase Readiness.** The existing platform provides a strong foundation:

- ✅ CharacterHub infrastructure (Zustand store + Modal in AppLayout) — extensible to LexicalHub
- ✅ AudioService + TTS integration (existing `/v1/tts` endpoint)
- ✅ Phase gating (PhaseGate model) — readers require Phase 3
- ✅ Design token system (CSS variables in `globals.css`)
- ✅ Shared components: Card, Grid, Modal, LoadingScreen, ErrorScreen, Tabs
- ✅ Storybook + MSW for visual component testing
- ❌ No passage/reading models in Prisma schema
- ❌ Word index only has 11 characters seeded — needs HSK 3.0 vocabulary data
- ❌ Old Progress model uses free-form `wordId` — needs migration to CharacterProgress
- ❌ GeminiService capped at 500 tokens — needs `generatePassage()` method

## User Stories

This epic consists of the following user stories:

1. #ISSUE-21.1 / **Data Lifecycle** _(story-21-1-data-lifecycle.md)_
   - As a learner, I want the graded readers to have accurate HSK vocabulary leveling, normalized content, and reliable progress tracking, so that my reading experience is based on well-organized, level-appropriate content.

2. #ISSUE-21.2 / **Passage Generation Backend** _(story-21-2-passage-generation.md)_
   - As a learner, I want to receive AI-generated reading passages on demand that are accurately segmented and leveled to my ability, so that I always have fresh, level-appropriate reading material.

3. #ISSUE-21.3 / **Reading UI + LexicalHub Phase 1** _(story-21-3-reading-ui-lexical-hub.md)_
   - As a learner, I want to browse passages by HSK level, read with inline word lookup via LexicalHub, and see word-level detail in a unified hub, so that I can understand new vocabulary in context.

4. #ISSUE-21.4 / **Audio Sync** _(story-21-4-audio-sync.md)_
   - As a learner, I want to hear each sentence read aloud via TTS with fallback support, so that I can practice listening and pronunciation simultaneously.

5. #ISSUE-21.5 / **Reading Progress** _(story-21-5-reading-progress.md)_
   - As a learner, I want to track which passages I've completed, bookmark my position, and auto-save my reading progress, so that I can resume reading later.

6. #ISSUE-21.6 / **Phonetic Clusters** _(story-21-6-phonetic-clusters.md)_
   - As a learner, I want to browse characters grouped by shared phonetic elements, so that I can recognize pronunciation patterns and guess how new characters sound.

## Story Breakdown Logic

This epic is divided into stories based on a clear dependency chain:

- **Story 21.1 (Data Lifecycle)** is the critical prerequisite — nothing else works without a seeded word index, classified vocabulary, and migrated progress data. It establishes the pure ID-only Word model, classification tables, and event-sourced ReviewLog.
- **Story 21.2 (Passage Generation Backend)** depends on 21.1 and builds the server-side foundation: Gemini integration, segmentation, caching, and rate limiting.
- **Story 21.3 (Reading UI + LexicalHub)** depends on 21.1 and 21.2 — it consumes the passage API and renders the reading experience with inline word lookup. It also generalizes the existing CharacterHub into a unified LexicalHub.
- **Stories 21.4 (Audio Sync) and 21.5 (Reading Progress)** both depend on 21.3 — audio playback and progress tracking require the reading UI to exist. They can be built in parallel after 21.3 is complete.
- **Story 21.6 (Phonetic Clusters)** depends only on 21.1 (character data) and can run in parallel with stories 21.2–21.5.

## Acceptance Criteria

- [ ] All 6 stories implemented with passing acceptance criteria
- [ ] Feature fully functional for authenticated users (generation, reading, audio, progress)
- [ ] Guest users can read 6 demo passages (1 per HSK level 1-6) with read-only lookup
- [ ] Phase 3 gating respected — users cannot access readers before completing Phase 2
- [ ] 0 lint errors across frontend and backend
- [ ] Test coverage meets minimums: unit tests for all new services/utilities, Storybook stories covering loading/empty/error/populated states for every new component
- [ ] No regressions in existing CharacterHub usage
- [ ] Rate limiting enforced: 5 generations/day for auth users, 0 for guests
- [ ] Old Progress model migrated to CharacterProgress + WordStudyContext with verified row counts
- [ ] Design token compliance verified via `npm run design-audit`

## Architecture Decisions

- **Decision: Passage generation via Gemini API (free prompt)**
  - Rationale: Segmenter handles word identification at read time. No hard vocabulary constraints needed in the prompt.
  - Alternatives considered: Constrained generation with known vocabulary lists baked into prompt, pre-written passage library
  - Implications: Gemini API costs scale with usage; inconsistent quality requires fallback/retry logic

- **Decision: Word model as pure ID-only**
  - Rationale: Database stores only relationships (WHERE, JOIN, ORDER BY). All attributes live in `content/words/*.json` static files, following the radicals module pattern.
  - Alternatives considered: Full word attributes in DB columns, hybrid model
  - Implications: Requires in-memory cache layer for word attribute lookups; simpler DB schema and migration path

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

## Implementation Plan

1. Data Lifecycle — Seed word index, classification tables, migrate old Progress model
2. Passage Generation Backend — Gemini integration, segmenter, caching, rate limiting
3. Reading UI + LexicalHub Phase 1 — Library view, reading view, inline WordPopover, unified LexicalHub
4. Audio Sync — Per-sentence TTS playback, dual-flow fallback, audio controls
5. Reading Progress — Auto-save, bookmarks, completion tracking, guest ephemeral state
6. Phonetic Clusters — Static data, cluster browser, CharacterHub integration
