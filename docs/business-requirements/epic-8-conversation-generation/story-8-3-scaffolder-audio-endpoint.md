# Story 8.3: Scaffolder — Audio endpoint (deterministic)

## Description

**As a** developer,
**I want to** have a scaffolder audio endpoint that returns deterministic audio metadata and URLs,
**So that** harness and headless tests can use reproducible audio artifacts without requiring real TTS services.

## Business Value

This story provides deterministic audio responses for testing and development, eliminating dependencies on external TTS services during early development phases. It ensures consistent behavior in CI environments and enables developers to test audio-related UI features with predictable responses, reducing development friction and test flakiness.

## Acceptance Criteria

- [ ] Audio scaffolder endpoint returns deterministic audio metadata consistently
- [ ] Endpoint provides stable audio URLs or base64 encoded audio data
- [ ] Sample audio artifacts stored under `public/data/examples/conversations/audio/`
- [ ] Response includes timeline metadata for turn-by-turn highlighting
- [ ] Audio endpoint returns HTTP 200 with playable audio URLs for harness validation
- [ ] Response format matches production audio API specification
- [ ] Supports multiple voice and bitrate parameters for testing different scenarios
- [ ] Audio files are small (under 1MB) to avoid repository bloat

## Business Rules

1. Audio responses must be deterministic for same conversation ID input
2. Timeline metadata must include per-turn timestamps for UI highlighting
3. Audio files must be suitable for language learning (clear, appropriate pace)
4. Scaffolder audio must not require external API calls or credentials
5. Response format must exactly match real TTS endpoint specification

## Related Issues

- #8-1 / [**Design Conversation Schema & Scaffolder**](./story-8-1-design-schema-and-scaffolder.md) (Dependency)
- #8-4 / [**Conversation Box UI: wire to scaffolder**](./story-8-4-conversation-box-ui.md) (Enables this story)
- #8-6 / [**Playback Integration — audio cache & on-demand TTS**](./story-8-6-playback-audio-cache-tts.md) (Will replace this scaffolder)
- #8-7 / [**Local Harness & Validation (CI-friendly)**](./story-8-7-unit-tests-and-harness.md) (Uses this scaffolder)

## Implementation Status

- **Status**: Completed
- **PR**: #[to-fill]
- **Merge Date**: 2025-10-11
- **Key Commit**: [to-fill] (Scaffolder audio endpoint, deterministic metadata, base64 support, and all ACs fulfilled)

## User Journey

1. Developer or test harness requests audio for conversation ID
2. Scaffolder endpoint returns predetermined audio URL immediately
3. Audio file is available at predictable location with consistent content
4. UI can test playback functionality with reliable audio source
5. Timeline metadata enables testing of turn-by-turn highlighting
6. Headless tests can validate audio endpoint without external dependencies
