# API Module API Specification

> **Migration Status:** Fully migrated from `local-backend` to Vercel serverless functions.
> See `local-backend/docs/api-spec.md` for original Express-based API documentation.

## TTS Endpoints

### POST /api/tts

Generate or retrieve cached TTS audio for given text.

**Request Body:**

```json
{
  "text": "你好世界",
  "voice": "cmn-CN-Wavenet-B" // optional, defaults to config
}
```

**Response (200 OK):**

```json
{
  "audioUrl": "https://storage.googleapis.com/bucket/tts/abc123.mp3",
  "cached": true
}
```

**Errors:**

- `400 VALIDATION_ERROR`: Missing or invalid text, word count exceeds limit (1-15 words)
- `405`: Method not allowed (only POST supported)
- `500 TTS_ERROR`: TTS generation or GCS upload failed

**Error Response Format:**

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Text is required.",
  "metadata": { "field": "text" }
}
```

## Conversation Endpoints

### POST /api/conversation

Unified endpoint for conversation text and audio generation.

#### Text Generation

Generate or retrieve cached conversation text for a vocabulary word.

**Request Body:**

```json
{
  "type": "text",
  "wordId": "word-123",
  "word": "你好",
  "generatorVersion": "v1" // optional
}
```

**Response (200 OK):**

```json
{
  "id": "word-123-abc456",
  "wordId": "word-123",
  "word": "你好",
  "generatorVersion": "v1",
  "prompt": "...",
  "turns": [
    {
      "speaker": "A",
      "chinese": "你好！",
      "pinyin": "Nǐ hǎo!",
      "english": "Hello!",
      "audioUrl": ""
    },
    {
      "speaker": "B",
      "chinese": "你好吗？",
      "pinyin": "Nǐ hǎo ma?",
      "english": "How are you?",
      "audioUrl": ""
    }
  ],
  "generatedAt": "2025-12-02T12:00:00.000Z",
  "_metadata": {
    "mode": "real",
    "processedAt": "2025-12-02T12:00:05.000Z"
  }
}
```

**Errors:**

- `400 VALIDATION_ERROR`: Missing wordId or word
- `500 CONVO_TEXT_ERROR`: Gemini API failure or parsing error

#### Audio Generation (Per-Turn)

Generate or retrieve cached audio for a specific conversation turn. Conversation text must exist first.

**Request Body:**

```json
{
  "type": "audio",
  "wordId": "word-123",
  "turnIndex": 0,
  "text": "你好！",
  "voice": "cmn-CN-Wavenet-B" // optional
}
```

**Response (200 OK):**

```json
{
  "conversationId": "word-123-abc456",
  "turnIndex": 0,
  "audioUrl": "https://storage.googleapis.com/bucket/convo/word-123/turn1-def789.mp3",
  "voice": "cmn-CN-Wavenet-B",
  "cached": false,
  "generatedAt": "2025-12-02T12:00:10.000Z"
}
```

**Errors:**

- `400 VALIDATION_ERROR`: Missing wordId, turnIndex, or text
- `500 CONVO_AUDIO_ERROR`: Conversation text not found, TTS failure, or GCS upload failed

## Error Response Format

All errors follow this structure:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "metadata": {} // Optional additional context
}
```

**Common Error Codes:**

- `VALIDATION_ERROR` (400): Invalid or missing required fields
- `TTS_ERROR` (500): TTS generation failure
- `CONVO_TEXT_ERROR` (500): Conversation text generation failure
- `CONVO_AUDIO_ERROR` (500): Conversation audio generation failure

## Environment Variables

### Required

**For TTS + Conversation Audio:**

- `GOOGLE_TTS_CREDENTIALS_RAW`: Service account JSON (stringified)
- `GCS_CREDENTIALS_RAW` or `GOOGLE_TTS_CREDENTIALS_RAW`: GCS service account JSON
- `GCS_BUCKET_NAME`: Google Cloud Storage bucket name

**For Conversation Text (Gemini API):**

- `GEMINI_API_CREDENTIALS_RAW`: Service account JSON for Gemini (stringified)
- `GCS_BUCKET_NAME`: Google Cloud Storage bucket name

### Optional

- `GEMINI_MODEL`: Gemini model name (default: `models/gemini-2.0-flash-lite`)
- `GEMINI_ENDPOINT`: API endpoint (default: `https://generativelanguage.googleapis.com/v1beta`)
- `GEMINI_TEMPERATURE`: Sampling temperature 0-1 (default: 0.7)
- `GEMINI_MAX_TOKENS`: Max output tokens (default: 1000)

## Migration Notes

### Key Differences from `local-backend`

1. **Unified Conversation Endpoint:** `/api/conversation` with `type` field routing (instead of separate `/text/generate` and `/audio/generate` routes)
2. **No Health Check:** Health check endpoints not migrated (serverless platforms provide built-in health monitoring)
3. **No Scaffold Mode:** Only "real" mode implemented (scaffold mode remains in `local-backend`)
4. **Stateless Functions:** Each endpoint is a standalone Vercel serverless function
5. **Error Format:** Plain JSON objects (no `requestId` header in Vercel by default)

### Shared Code Structure

```
api/
  ├─ tts.js                          # /api/tts
  ├─ conversation.js                 # /api/conversation
  └─ _lib/                           # Shared code (not routable)
       ├─ config/index.js
       ├─ controllers/
       ├─ services/
       └─ utils/
```
