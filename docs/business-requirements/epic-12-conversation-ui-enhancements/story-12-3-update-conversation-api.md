# Story 12.3: Update Conversation API to Return Rich ConversationTurn Structure

## Story Summary

**Goal:**
Update the backend conversation API to return a detailed, efficient ConversationTurn structure for each turn, including Chinese, pinyin, English, speaker, and audio URLs, with a scalable and maintainable storage approach for audio and text.

**Status:** Draft

**Last Update:** 2025-11-14

## Background

The current API returns conversation data with limited fields and inconsistent audio handling. To support new UI and learning features, the API must provide a richer, more structured response, and audio should be managed efficiently to avoid duplication and support future scalability.

## Acceptance Criteria

- [x] API returns a ConversationTurn object for each turn, including: Chinese, pinyin, English, speaker, and audioUrl fields.
- [x] Audio URLs are generated and linked only when audio is available, not as inline blobs or base64.
- [x] Conversation object structure supports referencing audio by URL in each turn, not duplicating audio data.
- [x] If the API consumes Gemini (or other LLM) endpoints, requests are optimized to minimize token usage (concise prompts, only required context sent).
- [x] API response is documented in OpenAPI/spec and includes all new fields.
- [x] Storage approach allows for efficient retrieval and caching of audio files (e.g., S3, CDN, or similar), and is ready for future batch or on-demand audio generation.
- [x] Unit/integration tests cover new structure and edge cases (missing audio, missing pinyin/English, etc).

## Implementation Approach

- Refactor the conversation API to return a top-level conversation object, with an array of ConversationTurn sub-objects.
- Each ConversationTurn includes all required fields and an audioUrl that points to a static file or CDN location (not inline data).
- When generating audio, store the file in a persistent storage (e.g., S3 bucket, Vercel Blob, or similar), and update the ConversationTurn with the audio URL.
- Avoid duplicating audio or text data; reference audio by URL only.
- If using Gemini or other LLM APIs, always:
  - Trim prompts and context to the minimum required for the task.
  - Avoid sending unnecessary data or repeated context.
  - Monitor and log token usage for optimization.
- Consider a structure like:

```json
{
  "conversationId": "abc123",
  "turns": [
    {
      "speaker": "A",
      "chinese": "你好！",
      "pinyin": "Nǐ hǎo!",
      "english": "Hello!",
      "audioUrl": "https://cdn.example.com/audio/abc123/turn1.mp3"
    },
    {
      "speaker": "B",
      "chinese": "你好吗？",
      "pinyin": "Nǐ hǎo ma?",
      "english": "How are you?",
      "audioUrl": "https://cdn.example.com/audio/abc123/turn2.mp3"
    }
  ]
}
```

> **Note:** Each turn now includes `chinese`, `pinyin`, `english`, and `audioUrl` fields. Audio is referenced by URL per turn.

- Document the new structure in OpenAPI/spec and update all consumers.
- Ensure the API can handle missing audio gracefully (e.g., null or absent audioUrl).
- Optimize for batch audio generation and caching to reduce API cost and latency.

## Risks & Mitigations

- Risk: Audio generation/storage cost increases — Mitigation: Use caching, batch processing, and only generate audio on demand.
- No customer migration or rollback is required, as no external consumers will be affected by these changes.

## Implementation Notes

- Follow code conventions and solid principles.
- Use environment variables for storage credentials/URLs.
- Prefer stateless, RESTful design for future extensibility.
