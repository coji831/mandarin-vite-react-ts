# Local Backend API Specification

## Health Check

### GET /api/health

General health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "mode": "real",
  "timestamp": "2025-11-16T12:00:00.000Z"
}
```

## TTS Endpoints

### POST /api/get-tts-audio

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

- `400 VALIDATION_ERROR`: Missing or invalid text, word count exceeds limit
- `500 TTS_ERROR`: TTS generation or GCS upload failed

## Conversation Endpoints

### POST /api/mandarin/conversation/text/generate

Generate or retrieve cached conversation text for a vocabulary word.

**Request Body:**

```json
{
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
  "prompt": "Generate a short Mandarin conversation using 你好",
  "turns": [
    { "speaker": "A", "text": "你好，今天天气真好。" },
    { "speaker": "B", "text": "是的，我们去公园走走吧。" },
    { "speaker": "A", "text": "好主意，我们现在就走。" }
  ],
  "generatedAt": "2025-11-16T12:00:00.000Z",
  "_metadata": {
    "mode": "real",
    "processedAt": "2025-11-16T12:00:05.000Z"
  }
}
```

**Errors:**

- `400 VALIDATION_ERROR`: Missing wordId or word
- `500 CONVO_TEXT_ERROR`: Gemini API failure or parsing error

### POST /api/mandarin/conversation/audio/generate

Generate or retrieve cached audio for a conversation. Conversation text must exist first.

**Request Body:**

```json
{
  "wordId": "word-123",
  "voice": "cmn-CN-Wavenet-B" // optional
}
```

**Response (200 OK):**

```json
{
  "conversationId": "word-123-abc456",
  "audioUrl": "https://storage.googleapis.com/bucket/convo/word-123/def789.mp3",
  "voice": "cmn-CN-Wavenet-B",
  "cached": false,
  "generatedAt": "2025-11-16T12:00:10.000Z"
}
```

**Errors:**

- `400 VALIDATION_ERROR`: Missing wordId
- `500 CONVO_AUDIO_ERROR`: Conversation text not found, TTS failure, or GCS upload failed

### GET /api/mandarin/conversation/health

Conversation-specific health check.

**Response:**

```json
{
  "mode": "real",
  "timestamp": "2025-11-16T12:00:00.000Z",
  "uptime": 3600
}
```

## Error Response Format

All errors follow this structure:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "requestId": "uuid-v4",
  "metadata": {} // Optional additional context
}
```

**Common Error Codes:**

- `VALIDATION_ERROR` (400): Invalid or missing required fields
- `NOT_FOUND` (404): Resource not found
- `TTS_ERROR` (500): TTS generation failure
- `CONVO_TEXT_ERROR` (500): Conversation text generation failure
- `CONVO_AUDIO_ERROR` (500): Conversation audio generation failure
- `INTERNAL_ERROR` (500): Unexpected server error

**Response Headers:**

- `X-Request-Id`: Unique request identifier for tracing
- `Access-Control-Allow-Origin`: CORS header (`*` in development)

## Environment Variables

### Required (Real Mode)

- `CONVERSATION_MODE`: `real` or `scaffold`
- `GCS_BUCKET_NAME`: Google Cloud Storage bucket name
- `GOOGLE_TTS_CREDENTIALS_RAW`: Service account JSON (stringified)
- `GEMINI_API_CREDENTIALS_RAW`: Service account JSON for Gemini (stringified)

### Optional

- `GCS_CREDENTIALS_RAW`: Dedicated GCS service account (defaults to TTS credentials)
- `PORT`: Server port (default: 3001)
- `GEMINI_MODEL`: Gemini model name (default: `models/gemini-2.0-flash-lite`)
- `GEMINI_TEMPERATURE`: Sampling temperature 0-1 (default: 0.7)
- `GEMINI_MAX_TOKENS`: Max output tokens (default: 1000)
- `ENABLE_DETAILED_LOGS`: Enable debug logs (default: false)
- `ENABLE_CACHE`: Enable caching (default: true)
- `ENABLE_METRICS`: Enable metrics collection (default: false)
