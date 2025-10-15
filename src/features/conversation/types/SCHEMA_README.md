# Conversation Schema Documentation

## Purpose

Defines canonical TypeScript schemas for `Conversation` and `ConversationAudio` used across UI, scaffolder, generator, and harness.

## Field Explanations

- `id`: Unique identifier, format `${wordId}-${generatorVersion}-${shortHash}`
- `wordId`: Vocabulary word identifier
- `word`: Mandarin word
- `meaning`: English meaning
- `context`: Usage context
- `turns`: Array of 3–5 `ConversationTurn` objects
- `generatedAt`: ISO 8601 timestamp
- `generatorVersion`: Version for cache invalidation
- `hash`: Hash of generation prompt
  Note: Current implementation uses a deterministic id format `${wordId}-${hash}` where `hash` is a SHA256 of the `wordId`. `generatorVersion` is optional metadata and is not included in the cache key by default. If you change prompts or want version-aware invalidation, update the cache key strategy to include `generatorVersion` and a prompt fingerprint.

### ConversationTurn

- `speaker`: "A", "B", or descriptive name
- `text`: Mandarin dialogue
- `translation`: Optional English translation

### ConversationAudio

- `conversationId`: Links to Conversation
- `audioUrl`: Audio file URL
- `durationSeconds`: Length in seconds
- `timeline`: Array of turn metadata for UI highlighting
- `voice`: TTS voice identifier
- `bitrate`: Audio quality

## Constraints

- 3–5 turns per conversation
- Each turn: 1–2 short sentences
- All fields required unless marked optional

## Versioning

- Use `generatorVersion` and `hash` for cache and test data management

## Validation

- Use provided utilities to validate fixtures and schema compliance
