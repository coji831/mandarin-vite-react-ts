# Conversation Endpoints

## POST /api/mandarin/conversation/text/generate

Generate or retrieve cached conversation text for a vocabulary word.

**Request Body:**

```json
{
  "wordId": "word-123",
  "word": "你好",
  "generatorVersion": "v1"
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
      "audioUrl": "https://storage.googleapis.com/bucket/convo/word-123/turn1.mp3"
    },
    {
      "speaker": "B",
      "chinese": "你好吗？",
      "pinyin": "Nǐ hǎo ma?",
      "english": "How are you?",
      "audioUrl": "https://storage.googleapis.com/bucket/convo/word-123/turn2.mp3"
    }
  ],
  "generatedAt": "2025-11-16T12:00:00.000Z",
  "_metadata": { "mode": "real", "processedAt": "2025-11-16T12:00:05.000Z" }
}
```

**Errors:** `400 VALIDATION_ERROR` (missing wordId or word), `500 CONVO_TEXT_ERROR` (Gemini API failure)

---

## POST /api/mandarin/conversation/audio/generate

Generate or retrieve cached audio for a conversation. Conversation text must exist first.

**Request Body:**

```json
{
  "wordId": "word-123",
  "voice": "cmn-CN-Wavenet-B"
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

**Errors:** `400 VALIDATION_ERROR` (missing wordId), `500 CONVO_AUDIO_ERROR` (text not found, TTS failure, or GCS upload failed)

---

## GET /api/mandarin/conversation/health

Conversation-specific health check.

**Response:**

```json
{
  "mode": "real",
  "timestamp": "2025-11-16T12:00:00.000Z",
  "uptime": 3600
}
```

---

## POST /v1/examples/single-line (Story 16.1)

Generate a single-line Chinese example for a vocabulary word using only HSK 1-3 vocabulary.

**Behavior:**

- Validate input server-side before any model calls
- Check cache key `examples/<sha256(word|hskLevel|language|v1)>.json` and return cached object when present
- Call Gemini via `generateStructured` when cache miss; validate output and retry once on failure
- Cache successful, validated outputs to GCS using deterministic cache key

**Request Body:**

```json
{
  "word": "饭",
  "hskLevel": 1,
  "language": "zh-CN"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "chinese": "我吃饭",
    "pinyin": "wǒ chī fàn",
    "english": "I eat"
  }
}
```

**Errors:**

- `400 VALIDATION_ERROR`: Missing/invalid inputs, control characters, unsupported hskLevel, prompt-injection detected
- `502 INVALID_GENERATION`: Model produced invalid output even after retry
- `503 SERVICE_UNAVAILABLE`: External AI service unavailable
