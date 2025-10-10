# Story 8.5: Generator — Text generation & cache (backend)

## Description

**As a** learner,
**I want to** have on-demand conversation generation with intelligent caching,
**So that** I get fast responses for repeated requests while accessing fresh, contextual conversations for my vocabulary words.

## Business Value

This story replaces the scaffolder with real AI-generated conversations, providing learners with truly contextual and varied dialogue examples. The caching system ensures cost efficiency by avoiding redundant API calls while maintaining fast response times. This delivers the core value proposition of dynamic, personalized conversation examples that adapt to the learner's vocabulary.

## Acceptance Criteria

- [ ] Generator endpoint computes `promptHash` for cache key generation
- [ ] Cache lookup checks GCS for existing conversations using `generatorVersion` and `promptHash`
- [ ] New conversations are generated when cache miss occurs
- [ ] Generated conversations are stored in GCS under `convo/{wordId}/{generatorVersion}/{promptHash}.json`
- [ ] Response includes `generatedAt` timestamp and unique `id` field
- [ ] Calling generator twice with same input returns cached response with identical `id`
- [ ] Generator supports single-word prompts and produces 3-5 turn conversations
- [ ] Error handling covers AI service failures and cache write failures

## Business Rules

1. Cache keys must be deterministic based on input parameters and generator version
2. Generated conversations must strictly adhere to 3-5 turns constraint
3. Each turn must be appropriate for language learning context
4. Generator must handle single vocabulary words and produce relevant dialogue
5. Cache entries must include metadata for validation and debugging

## Related Issues

- #8-1 / [**Design Conversation Schema & Scaffolder**](./story-8-1-design-schema-and-scaffolder.md) (Uses schemas from this story)
- #8-2 / [**Scaffolder — Text endpoint**](./story-8-2-scaffolder-text-endpoint.md) (Replaces this scaffolder)
- #8-4 / [**Conversation Box UI: wire to scaffolder**](./story-8-4-conversation-box-ui.md) (Integrates with this generator)
- #8-6 / [**Playback Integration — audio cache & on-demand TTS**](./story-8-6-playback-audio-cache-tts.md) (Consumes conversations from this generator)

## Implementation Status

- **Status**: Planned
- **PR**: #[PR-NUMBER]
- **Merge Date**: [Date]
- **Key Commit**: [commit-hash] ([Brief commit description])

## User Journey

1. Learner requests conversation example for specific vocabulary word
2. Generator computes cache key from word and current prompt version
3. System checks GCS cache for existing conversation
4. If cache hit: returns existing conversation immediately
5. If cache miss: generates new conversation using AI service
6. New conversation is stored in cache for future requests
7. Learner receives contextual conversation showcasing their vocabulary word
