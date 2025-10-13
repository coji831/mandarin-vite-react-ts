# Epic 8: Conversation Generation and Caching System

## Epic Summary

**Goal:** Generate short, contextual conversations on-demand from the flashcard detail (single keyword per request). Cache generated conversation text in GCS with a 30-day lifecycle for low-latency reads. Audio remains optional and should only be created when a learner requests playback (idempotent, cache-checked).

**Key Points:**

- On-demand single-keyword generation from the flashcard detail page.
- Cache conversation text in GCS with a 30-day lifecycle for low-latency reads.
- Audio generation is idempotent and on-demand; generate audio only when a learner requests playback.
- Reuse Epic 1's TTS, caching, and IaC patterns to accelerate implementation and ensure consistency.
- Prioritize cost controls, lifecycle rules, and least-privilege IAM for production assets.

**Status:** Completed

**Last Update:** 2025-10-12

## Background

Learners benefit from short, contextual conversations that show vocabulary in use. Generating these examples on-demand minimizes storage and TTS costs while providing immediate contextual practice. Caching generated text (and audio when requested) reduces latency and API costs. Epic 8 reuses existing TTS and caching infra from Epic 1 and focuses on a gated rollout to validate UX and cost behavior before broadening scope.

Dependencies & reuse from Epic 1:

- Epic 1 completed a Google Cloud Text-to-Speech integration and implemented caching patterns (including GCS lifecycle policies and local dev server testing). We should reuse the established components where applicable rather than re-implementing them.
- Reusable assets to consider:
  - GCS bucket naming, lifecycle rule configuration, and IAM role patterns from Epic 1 implementation.
  - TTS integration code and configuration (service account usage, TTS voice/config defaults).
  - Caching logic and retry/error-handling patterns used in Epic 1 (including logging and monitoring hooks).
  - Local development server patterns (Express local-backend) used for previewing TTS and caching flows.
- Reference: Epic 1 Implementation Documentation: ../../issue-implementation/epic-1-google-cloud-tts-integration/README.md

By explicitly reusing these components we reduce risks, speed implementation, and ensure consistent behavior across TTS-related features.

## User Stories

This epic consists of the following user stories:

1. #8-1 / [**Design Conversation Schema & Scaffolder**](./story-8-1-design-schema-and-scaffolder.md)

   - As a developer, I want canonical conversation schemas and fixtures, so that UI and backend can iterate with consistent data structures.

2. #8-2 / [**Scaffolder — Text endpoint**](./story-8-2-scaffolder-text-endpoint.md)

   - As a developer, I want a scaffolder text endpoint, so that UI development can proceed with deterministic conversation data.

3. #8-3 / [**Scaffolder — Audio endpoint (deterministic)**](./story-8-3-scaffolder-audio-endpoint.md)

   - As a developer, I want a scaffolder audio endpoint, so that harness and headless tests can use reproducible audio artifacts.

4. #8-4 / [**Conversation Box UI: wire to scaffolder**](./story-8-4-conversation-box-ui.md)

   - As a learner, I want to view conversation examples on flashcard detail pages, so that I can see vocabulary used in context.

5. #8-5 / [**Generator — Text generation & cache (backend)**](./story-8-5-generator-text-cache.md)

   - As a learner, I want on-demand conversation generation with caching, so that I get fast responses without redundant API calls.

6. #8-6 / [**Playback Integration — audio cache & on-demand TTS**](./story-8-6-playback-audio-cache-tts.md)

   - As a learner, I want to listen to conversation audio on-demand, so that I can practice pronunciation and listening comprehension.

7. #8-7 / [**Local Harness & Validation (CI-friendly)**](./story-8-7-unit-tests-and-harness.md)

   - As a developer, I want automated testing and validation, so that conversation features work reliably in CI and local development.

8. #8-8 / [**Hook to Real APIs, Deploy, and Finalize**](./story-8-8-hook-real-apis-and-finalize.md)

   - As a developer, I want production-ready infrastructure and deployment, so that conversation features can be safely deployed to users.

## Story Breakdown Logic

This epic is divided into stories based on the following approach:

- Stories 8.1-8.3 focus on scaffolding and deterministic fixtures (Phase 1 - Scaffolding)
- Stories 8.4-8.5 focus on UI integration and real backend (Phase 2 - Integration)
- Stories 8.6-8.8 focus on audio generation and production deployment (Phase 3 - Real integration)

Implementation strategy follows three clear phases to keep work small, reviewable, and low-risk: Phase 1 creates scaffolded endpoints with mock data, Phase 2 wires UI and backend with fixtures, and Phase 3 integrates real generators and TTS services.

## Acceptance Criteria

- [ ] Story 8.1 — Conversation schema and `ConversationAudio` schema are designed, documented, and agreed upon. Verification: sample fixture JSON exists and schema validation passes for fixture; fixture conforms to 3–5 turns constraint.
- [ ] Story 8.2 — Text scaffolder endpoint (local & staging) returns deterministic `Conversation` objects for test words. Verification: GET/POST to `/conversation?wordId=` returns JSON matching schema and `turns.length` in [3,5].
- [ ] Story 8.3 — Scaffolder audio endpoint returns deterministic audio artifacts (URL or base64) usable in harness/headless runs. Verification: endpoint returns HTTP 200 and a playable audio URL that a harness can fetch.
- [ ] Story 8.4 — Conversation Box UI is implemented and consumes scaffolded data, shows loading/error states, and supports scaffold vs generator mode via feature flag. Verification: Component renders with scaffold fixture and can call play/highlight handlers.
- [ ] Story 8.5 — Generator endpoint integrates with cache and returns text conversations with `generatedAt` and `generatorVersion` metadata. Verification: calling generator twice with same input yields cached response on second call and identical `id`.
- [ ] Story 8.6 — Playback API checks for cached audio and returns cached URL or generates audio on-demand, persists it, and returns audio URL with timeline metadata (marks or per-turn timestamps). Verification: call audio endpoint -> if no audio exists it returns a working audio URL and timeline metadata; subsequent calls return cached URL.
- [ ] Story 8.7 — Provide a small local harness and deterministic fixtures to validate scaffold → generator → cache → UI logic in headless or CI-friendly runs. Verification: harness runs without external TTS calls.
- [ ] Story 8.8 — System can be wired to local and hosted backends with IaC for GCS lifecycle and IAM; schemas and API examples are finalized and documented. Verification: Terraform plan / IaC PR references and staging smoke test instructions present.

## Architecture Decisions

- Decision: Start with a scaffolder that returns deterministic/constrained sample data (choice: scaffolder-first)

  - Rationale: enables rapid UI validation, reduces early dependence on external AI services, and simplifies testing.
  - Alternatives considered: integrate generator immediately (higher fidelity but costlier and slower feedback loop).
  - Implications: scaffolder must be kept in sync with final schema; include versioning.

- Decision: Use generatorVersion + promptHash for cache keys (choice: deterministic keys)

  - Rationale: avoids collisions and enables safe cache invalidation when prompts or logic change.
  - Alternatives considered: time-based TTL only (less deterministic, harder to invalidate by version).

- Decision: Audio generation on-demand only (choice: explicit user request)

  - Rationale: reduces TTS costs and avoids unnecessary audio generation for content that is never played.
  - Alternatives considered: pre-generate all audio (higher cost, storage overhead).
  - Implications: UI must handle loading states for audio requests; cache management is critical for performance.

## Implementation Plan

1. Story 8.1 — Design Conversation and ConversationAudio schemas and produce sample JSON fixtures.
2. Story 8.2 — Build text scaffolder endpoint that returns seeded Conversation objects for given wordId/word.
3. Story 8.3 — Build scaffolder audio endpoint that returns deterministic mock audio artifacts.
4. Story 8.4 — Implement Conversation Box UI and wire View Example to scaffolder endpoint.
5. Story 8.5 — Implement generator endpoint with cache lookup/write (text) and integrate with UI (replace scaffolder in staging).
6. Story 8.6 — Implement audio cache-check and on-demand TTS generation, returning timeline metadata.
7. Story 8.7 — Add comprehensive unit tests with mocks and a small local harness for CI.
8. Story 8.8 — Wire local-backend and hosted backend for generator and TTS, configure secrets and IAM, and finalize docs.

## Risks & mitigations

- Risk: Scaffolder drift vs. generator output — Severity: Medium

  - Mitigation: Version scaffold outputs and include generatorVersion and promptHash in stored objects; run compatibility checks in CI.
  - Rollback: Revert UI to scaffolded endpoint until generator changes are validated.

- Risk: TTS cost overruns — Severity: High

  - Mitigation: Audio generation only on explicit user request; enforce cache checks and lifecycle rules; add cost monitoring/alerts.
  - Rollback: Disable TTS endpoint and fallback to text-only mode; remove or tighten permissions on service accounts.

- Risk: Test flakiness due to external AI variability — Severity: Medium

  - Mitigation: Use deterministic scaffolder in CI for stable tests; mock generator responses where needed.
  - Rollback: Re-run or use scaffolded fixtures for failed CI runs.

## Implementation notes

- Conventions: follow `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md`
- Operational notes: Audio generation is idempotent and on-demand; use feature flags for scaffolder vs generator mode
- Links: reference implementation templates at `docs/templates/implementation-large-epic-template.md`

### Conversation length guideline

- Conversations should be short and focused. Target 3–5 turns per conversation. Each turn should be 1–2 short sentences or phrases. This constraint should be captured in the schema and sample fixtures so UI, generator, and tests validate length and keep audio durations small.

### Schema examples

```ts
type Conversation = {
  id: string; // conversationId: `${wordId}-${generatorVersion}-${shortHash}`
  wordId: string;
  word: string;
  meaning?: string;
  context?: string;
  turns: Array<{ speaker: string; text: string; translation?: string }>;
  generatedAt: string; // ISO
  generatorVersion: string;
};

type ConversationAudio = {
  conversationId: string;
  audioUrl: string;
  durationSeconds?: number;
  generatedAt: string; // ISO
  voice?: string;
};
```

### API examples

Generator (text):
POST /api/conversation/text/generate
Request: `{ "wordId": "w123", "word": "你好" }`
Response: `{ "id": "w123-<hash>", "wordId": "w123", "word": "你好", "turns": [...], "generatedAt": "2025-10-09T12:00:00Z" }`

Audio (on-demand):
POST /api/conversation/audio/generate
Request: `{ "wordId": "w123", "voice": "cmn-CN-Standard-A", "bitrate": 128 }`
Response: `{ "audioUrl": "https://storage.googleapis.com/<bucket>/convo/w123/<hash>.mp3", "conversationId": "w123-<hash>", "timeline": [...] }`

Notes:

- Current generator implementation uses Google Gemini (Generative Language API) for text generation (JWT-based service account authentication).
- Current cache key strategy in the code uses a deterministic SHA256 hash of the `wordId` and stores text under `convo/${wordId}/${hash}.json`. If you want version-aware invalidation (generatorVersion+promptHash), see the implementation plan in the issue docs and update `local-backend/utils/hashUtils.js`.
- File locations in the repository:
  - Text generation: `local-backend/utils/conversationGenerator.js`
  - Conversation processing and audio orchestration: `local-backend/utils/conversationProcessor.js`
  - Cache utilities: `local-backend/utils/conversationCache.js`
  - Express routes: `local-backend/routes/conversation.js`

Environment variables used by current implementation:

- `CONVERSATION_MODE` - `scaffold` or `real` (controls local-backend behavior)
- `GCS_BUCKET_NAME` - Google Cloud Storage bucket used for cache
- `GEMINI_API_CREDENTIALS_RAW` - service account JSON used for Gemini (and GCS) operations
- `GOOGLE_TTS_CREDENTIALS_RAW` - service account JSON used for Google Text-to-Speech client (used by `conversationProcessor`)

If you prefer the original docs' version-aware cache keys (generatorVersion + promptHash), we can update code to compute a prompt fingerprint and include generatorVersion in the cache key (recommended for controlled invalidation).
