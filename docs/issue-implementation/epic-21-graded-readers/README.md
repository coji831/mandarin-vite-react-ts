# Epic 21: Graded Readers — Implementation

**BR Reference:** `docs/business-requirements/epic-21-graded-readers/README.md`

**Status:** In Progress

**Last Update:** July 23, 2026

## Epic Summary

**Goal:** Implement AI-generated graded reading passages with inline word lookup, sentence-level audio, and progress tracking, backed by a pure ID-only word model and event-sourced progress system.

**Key Points:**

- Gemini API generates passages from 5 beginner topics as structured JSON sentences
- Backend segmenter parses plain-text passages against in-memory word index at read time
- Word model stores only IDs in DB; all attributes in `content/` static JSON files
- LexicalHub generalizes CharacterHub for unified word→character→radical navigation
- Batch TTS pre-generation with dual-flow fallback (GCS → on-demand → browser SpeechSynthesis)
- Zustand + debounced backend sync (2s) for reading progress auto-save
- Event-sourced ReviewLog → CharacterProgress SRS engine pipeline
- Phase 3 gating; guest users get 6 demo passages with read-only access

**Status:** In Progress

**Last Update:** July 23, 2026

## Technical Overview

This epic implements the full graded readers feature across frontend, backend, and data layers. The backend provides Gemini-powered passage generation, word segmentation, HSK profile computation, and TTS audio generation. The frontend delivers a library view with HSK-level filtering, a reading view with sentence-by-sentence layout and inline word lookup via the unified LexicalHub, per-sentence audio playback, and auto-saving progress tracking. The data layer migrates from the old free-form Progress model to an event-sourced ReviewLog + CharacterProgress system with pure ID-only Word tables.

## Architecture Decisions

1. **Gemini passage generation** — Use free prompt with 5 beginner topics (school, daily routine, family, weather, shopping). Gemini returns JSON with sentence array. No hard vocabulary constraints — segmenter handles word identification at read time.
   - Rationale: Fighting LLM constraints is unreliable and expensive. Segmenter-based approach is more robust.
   - Alternatives considered: Constrained generation with known vocabulary lists, pre-written passage library.

2. **Word model: pure ID-only** — Word table stores only `{ id }`. All attributes (simplified, pinyin, definitions, POS, examples) live in `content/words/*.json` static files. Classification via WordHskLevel and CharacterHskLevel tables.
   - Rationale: Following the radicals module pattern. DB only for relationships. In-memory cache provides reverse indexes for text lookups.
   - Alternatives considered: Full word attributes in DB columns, hybrid model with partial denormalization.

3. **Backend segmentation at read time** — Passages stored as plain text. Backend segmenter parses text against in-memory word index at read time, caches segmented result. Frontend receives pre-tokenized passage with known/unknown annotations.
   - Rationale: Backend handles all processing. Simpler frontend. Caching mitigates latency.
   - Alternatives considered: Frontend-side segmentation, pre-segment on passage creation.

4. **Unified LexicalHub** — Generalized hubStore supporting entityType, entityId, context, and navigationStack. Single modal in AppLayout replaces CharacterHub. Supports word→character→radical navigation via in-modal back button.
   - Rationale: Single hub prevents duplicate code, enables cross-entity navigation.
   - Alternatives considered: Keep separate CharacterHub and WordHub modals.
   - Implications: Requires `useEntityHub` hook backward-compatible with existing `useCharacterHub` callers.

5. **Batch TTS pre-generation** — All sentences queued for TTS when passage is first requested. Parallel generation with 5s timeout per sentence. GCS path: `tts/{passageHash}/{sentenceIndex}.mp3`. Dual-flow fallback: pre-generated → on-demand → browser SpeechSynthesis.
   - Rationale: Per-sentence latency would ruin reading flow. Batch parallel generation reduces total wait time.
   - Alternatives considered: Stream TTS sentence-by-sentence, generate on-demand per sentence.

6. **Event-sourced ReviewLog → CharacterProgress** — Every progress update appends a ReviewLog row. SRS engine reads events and upserts CharacterProgress. ReviewLog seeds future CQRS event stream.
   - Rationale: Append-only log enables future analytics, replay, and CQRS without schema changes.
   - Alternatives considered: Direct writes to CharacterProgress, single Progress table for all tracking.

7. **Passage-level progress with sentence-position auto-save** — Passage is completed or not. Auto-saved sentence position enables resume. Zustand store (immediate) + debounced backend sync (2s). `beforeunload` for final save. Guest state is ephemeral (in-memory only).
   - Rationale: Sufficient granularity for reading use case. Debounce balances responsiveness with API call frequency.
   - Alternatives considered: Per-sentence completion tracking, word-level progress.

## Technical Implementation

### Architecture

The graded readers feature follows the existing modulith pattern, with clear data flow between layers:

**Frontend (React) → Backend (Express) → External Services**

- The frontend library view fetches passages via `GET /v1/readers/passages` and the reading view fetches a single passage with pre-segmented sentences via `GET /v1/readers/passages/:id`.
- The backend `PassageService` orchestrates generation: it calls `GeminiService.generatePassage()` (no 500-char cap), passes the result to the `Segmenter` which parses text against the in-memory `WordIndex` (loaded at server startup from `content/words/`), and stores the plain-text passage in the DB with a cached segmented result.
- TTS audio is generated in parallel batch when a passage is first requested. Audio URLs are stored alongside the segmented passage result.
- Reading progress flows from the frontend Zustand store → debounced PUT to `/v1/readers/sessions/:passageId` → backend upserts `ReadingSession` records.
- Word lookups (taps in the reading view) are logged as `WordLookupEvent` records for aggregate analytics.
- The `LexicalHub` mounts in the AppLayout modal and routes between entity views based on hubStore state (entityType, entityId, navigationStack).

### API Endpoints

| Method   | Endpoint                                   | Auth     | Description                                                    |
| -------- | ------------------------------------------ | -------- | -------------------------------------------------------------- |
| `GET`    | `/v1/readers/passages`                     | Required | List cached passages, optional `?hskLevel=N` filter            |
| `GET`    | `/v1/readers/passages/:id`                 | Required | Passage detail with segmented sentences and audio URLs         |
| `POST`   | `/v1/readers/generate`                     | Required | Generate new passage, body: `{ topic }`. Rate-limited to 5/day |
| `GET`    | `/v1/readers/sessions/:passageId`          | Required | Get reading session (position, completed)                      |
| `PUT`    | `/v1/readers/sessions/:passageId`          | Required | Update reading position, auto-save                             |
| `POST`   | `/v1/readers/sessions/:passageId/complete` | Required | Mark passage completed                                         |
| `GET`    | `/v1/readers/bookmarks`                    | Required | List bookmarked passages                                       |
| `POST`   | `/v1/readers/bookmarks`                    | Required | Add bookmark (body: `{ passageId }`)                           |
| `DELETE` | `/v1/readers/bookmarks/:id`                | Required | Remove bookmark                                                |

### Component Relationships

**Frontend components (in `features/graded-readers/`):**

- `GradedReadersFeature` — Page-level container mounted at `/learn/readers`. Phase-gated (requires Phase 3). Renders library or reading view based on route state.
- `LibraryView` — HSK level filter pills + passage card grid (3-col desktop, 2-col tablet, 1-col mobile). States: loading (skeleton), empty (CTA to generate), error (retry), populated.
- `ReaderCard` — Passage preview in library: HSK badge, title preview, bookmark toggle, completion checkmark.
- `ReadingView` — Sentence-by-sentence layout with pinyin below each sentence. Inline WordPopover on tap. Integrates AudioControlBar.
- `WordPopover` — Compact card with glyph, pinyin, meaning. "Open in Word Hub" button. Audio pauses when open.
- `AudioControlBar` — Play/pause, speed control (0.75x, 1x, 1.25x), progress indicator. Highlights current sentence during playback.
- `PhoneticClustersTab` — Static cluster browser with HSK filter. Clickable character → opens CharacterHub.

**LexicalHub components (in `features/lexical-hub/`):**

- `LexicalHubRouter` — Mounted in AppLayout Modal. Routes between `WordHubContent`, `CharacterHubContent`, and `RadicalView` based on hubStore state.
- `WordHubContent` — Word-level detail: pinyin, definitions (polysemy), HSK badge, constituent characters as clickable chips.
- `CharacterHubContent` — Existing content moved into lexical-hub feature folder. No functional changes.
- `hubStore` — Generalized Zustand store: `{ entityType, entityId, context, navigationStack }`. Backward-compatible with existing `useCharacterHub` API.

**Backend modules (in `modules/readers/`):**

- `PassageController` — REST endpoints for passage CRUD, generation, sessions, bookmarks.
- `PassageService` — Business logic: generation orchestration, segmentation coordination, cache management.
- `Segmenter` — Parses plain text against in-memory word index. Returns tokenized sentences with known/unknown annotations.
- `GeminiService.generatePassage()` — New method (no 500-char cap, `maxTokens` default 1024). Returns structured JSON.
- `TtsService` — Batch TTS generation with parallel requests and per-sentence fallback.
- `WordIndex` — In-memory cache loaded at server startup from `content/words/`. Provides simplified→wordId and wordId→hskLevel reverse indexes.
