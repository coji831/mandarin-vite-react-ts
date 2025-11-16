# Implementation 12-3: Update Conversation API to Return Rich ConversationTurn Structure

**Epic:** [epic-12-conversation-ui-enhancements](../../business-requirements/epic-12-conversation-ui-enhancements/README.md)
**Story:** [story-12-3-update-conversation-api](../../business-requirements/epic-12-conversation-ui-enhancements/story-12-3-update-conversation-api.md)
**Last Update:** 2025-11-16

## Technical Scope

- Conversation API now returns a ConversationTurn object for each turn (Chinese, pinyin, English, speaker, audioUrl).
- Audio files are stored and referenced by URL per turn (not inline data).
- LLM/Gemini API usage is optimized for minimal token cost (concise prompt, only required context).
- OpenAPI/spec and frontend API types updated.
- Tests expanded for new structure and edge cases.

## Implementation Details

- `ConversationTurn` and `Conversation` types updated in backend and frontend code.
- API handler returns structured conversation data with all required fields.
- Audio file storage integrated; each turn updated with audio URL.
- API response handles missing audio gracefully (audioUrl nullable).
- API structure documented in OpenAPI/spec and consumers updated.

## Architecture Integration

- Conversation API endpoint returns a structured conversation object with turns.
- Audio files are stored externally and referenced by URL in each turn.
- API and frontend types are kept in sync for maintainability.

## Technical Challenges & Solutions

- Challenge: Avoiding audio data duplication and ensuring efficient storage.
  - Solution: Store audio once per turn, reference by URL, and implement caching.
- Challenge: Controlling LLM API token usage.
  - Solution: Trim prompts/context, monitor usage, and optimize request payloads.

## Testing Implementation

- Unit tests for ConversationTurn structure and API handler.
- Integration tests for audio URL generation and error cases.
- Edge cases: missing audio, missing pinyin/English, LLM API failures.

## Documentation

- OpenAPI/spec updated for new ConversationTurn structure.
- Usage/migration notes added for frontend consumers.

### Example Response

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

---

> Update this file as implementation progresses. Link to PRs and commits as needed.
