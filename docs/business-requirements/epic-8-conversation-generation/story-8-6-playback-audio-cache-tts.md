# Story 8.6: Playback Integration — audio cache & on-demand TTS

## Description

**As a** learner,
**I want to** listen to conversation audio on-demand with smart caching,
**So that** I can practice pronunciation and listening comprehension while controlling costs through efficient audio generation.

## Business Value

This story provides the audio capability that transforms text conversations into immersive learning experiences. By generating audio only when explicitly requested, we control TTS costs while providing high-quality pronunciation examples. The caching system ensures learners get immediate playback for previously generated audio while maintaining cost efficiency for new content.

## Acceptance Criteria

- [ ] Audio API checks for cached audio at `audio/{conversationId}/{voice}/{bitrate}.mp3`
- [ ] TTS generation is triggered only when learner explicitly requests playback
- [ ] Audio generation is idempotent - repeated requests return same cached audio
- [ ] Generated audio includes timeline metadata with per-turn timestamps
- [ ] Audio files are written atomically using GCS preconditions to avoid conflicts
- [ ] Response includes working audio URL and timeline metadata for UI highlighting
- [ ] Fallback behavior handles TTS service failures gracefully
- [ ] Cost guards prevent excessive TTS usage through rate limiting

## Business Rules

1. Audio generation must only occur on explicit user request (never automatic)
2. Cache must be checked before every TTS API call to avoid duplicates
3. Timeline metadata must enable precise turn-by-turn highlighting in UI
4. Audio quality must be suitable for language learning (clear pronunciation)
5. Generated audio must include perceptible pauses between speaker turns

## Related Issues

- #8-1 / [**Design Conversation Schema & Scaffolder**](./story-8-1-design-schema-and-scaffolder.md) (Uses ConversationAudio schema)
- #8-3 / [**Scaffolder — Audio endpoint (deterministic)**](./story-8-3-scaffolder-audio-endpoint.md) (Replaces this scaffolder)
- #8-4 / [**Conversation Box UI: wire to scaffolder**](./story-8-4-conversation-box-ui.md) (Integrates with this audio system)
- #8-5 / [**Generator — Text generation & cache (backend)**](./story-8-5-generator-text-cache.md) (Dependency for conversation content)

## Implementation Status

- **Status**: Planned
- **PR**: #[PR-NUMBER]
- **Merge Date**: [Date]
- **Key Commit**: [commit-hash] ([Brief commit description])

## User Journey

1. Learner views conversation and decides to hear pronunciation
2. Learner clicks audio playback button in Conversation Box UI
3. System checks cache for existing audio with matching voice/bitrate
4. If cached: returns audio URL immediately for instant playback
5. If not cached: generates audio using Google Cloud TTS with conversation text
6. Generated audio is cached and URL returned to UI
7. Audio plays with turn-by-turn highlighting synchronized to timeline metadata
8. Future requests for same conversation return cached audio instantly
