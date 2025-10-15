# Story 8.1: Design Conversation Schema & Scaffolder

## Description

**As a** developer, design canonical `Conversation` and `ConversationAudio` schemas, produce deterministic JSON fixtures, and document versioning rules so UI, scaffolder, generator, and the local harness share a single source of truth.

**I want to** have canonical conversation schemas and deterministic JSON fixtures,

**So that** UI and backend can iterate with consistent data structures and predictable test data.

## Business Value

Deterministic scaffolded data enables fast UI iteration, predictable demos for designers and stakeholders, and a clear contract for generator and UI integration. For CI or headless validation prefer the small local harness and deterministic fixtures rather than calling external AI/TTS services.

This story provides the foundational data structures and mock data needed for all subsequent conversation features. By establishing clear schemas and fixtures early, we enable parallel development of UI and backend components while ensuring consistency across the system. The deterministic fixtures allow for reliable testing and development workflows without external dependencies.

## Acceptance Criteria

- [ ] A TypeScript type file or JSON Schema exists for `Conversation` and `ConversationAudio`.

- [ ] At least one deterministic fixture exists under `public/data/examples/conversations/` including `generatorVersion` and `promptHash` fields.

- [ ] `Conversation` and `ConversationAudio` TypeScript schemas are defined with proper types.

- [ ] A short schema README documents the fixture naming and the 3–5 turns constraint.

- [ ] JSON fixtures are created under `public/data/examples/conversations/` with sample data.

- [ ] A local/staging scaffolder endpoint is implemented and documented. Current code exposes POST endpoints under the local-backend router and the server mounts the router under `/api` in development. The primary scaffolder/generation endpoints are:

  - `POST /api/conversation/text/generate` — accepts `{ wordId, word?, generatorVersion? }` and returns a deterministic `Conversation` object when `CONVERSATION_MODE` is set to `scaffold`.
  - `POST /api/conversation/audio/generate` — accepts `{ wordId, voice?, bitrate?, format? }` and returns deterministic audio metadata in scaffold mode (supports `format: "url"` or `format: "base64"`).

- [ ] Schema documentation is added explaining field purposes and constraints.

- [ ] Scaffolder behavior can be toggled via environment variable `CONVERSATION_MODE` (set to `scaffold` for fixture mode, or `real` for Gemini/TTS/GCS mode).

- [ ] Fixtures include `generatorVersion` and a `hash` field (the runtime cache code uses a deterministic short hash derived from the `wordId` and stores JSON/MP3 artifacts under `convo/${wordId}/${hash}` in GCS).

- [ ] Conversation fixtures conform to 3-5 turns constraint with realistic dialogue

## Business Rules

- [ ] Schema validation passes for all fixture files

- [ ] Audio fixtures include timeline metadata for UI highlighting support

1. Conversations must be between 3-5 turns to maintain focus and reduce audio costs.

2. Each turn must be 1-2 short sentences suitable for language learning

3. Schema must support both English and Mandarin text with optional translations

- Implement a small express route in `local-backend/server.js` or reuse an existing dev endpoint (guarded by `CONVERSATION_MODE="scaffold"`) to serve fixtures from `public/data/examples/conversations/fixtures/`.

4. All fixtures must be deterministic and suitable for automated testing

- Provide deterministic audio fixtures for headless harnesses if audio playback is required.

5. Audio metadata must include timeline information for turn-by-turn highlighting

- Use the local harness or a small validation script to verify fixture structure (e.g., `turns.length ∈ [3,5]`) in CI rather than relying on external AI/TTS services.

## Related Issues## Related Stories

- #8-2 / [**Scaffolder — Text endpoint**](./story-8-2-scaffolder-text-endpoint.md) (Depends on this story)- #8-2 — Scaffolder — Text endpoint (implements the scaffolder route and fixtures)

- #8-3 / [**Scaffolder — Audio endpoint (deterministic)**](./story-8-3-scaffolder-audio-endpoint.md) (Depends on this story)- #8-3 — Scaffolder — Audio endpoint (deterministic audio response for CI)

- #8-4 / [**Conversation Box UI: wire to scaffolder**](./story-8-4-conversation-box-ui.md) (Depends on this story)

## Implementation Status

- **Status**: Completed
- **PR**: [Epic 8 PR]
- **Merge Date**: 2025-10-11
- **Key Commit**: [Scaffolder, schema, fixtures, endpoint, docs]

## User Journey

1. Developer starts working on conversation features
2. Developer imports conversation schemas for type safety
3. Developer uses fixture data for component development
4. Developer validates component behavior with deterministic test data
5. Developer runs tests that use consistent fixture responses
6. Developer can iterate quickly without external API dependencies
