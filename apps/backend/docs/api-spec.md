# Local Backend API Specification

## Table of Contents

- [Health Check](#health-check)
- [Caching Strategy](#caching-strategy)
- [TTS Endpoints](#tts-endpoints)
- [Conversation Endpoints](#conversation-endpoints)
- [Progress Tracking Endpoints](#progress-tracking-endpoints-story-134)
- [Authentication](#authentication)

## Health Check

### GET /api/health

General health check endpoint with Redis cache status and metrics.

**Response:**

```json
{
  "status": "ok",
  "mode": "real",
  "timestamp": "2025-11-16T12:00:00.000Z",
  "services": {
    "gemini": true,
    "tts": true
  },
  "cache": {
    "redis": {
      "connected": true
    },
    "metrics": {
      "services": {
        "TTS": {
          "hits": 150,
          "misses": 50,
          "total": 200,
          "hitRate": "75.00"
        },
        "Conversation": {
          "hits": 80,
          "misses": 20,
          "total": 100,
          "hitRate": "80.00"
        }
      },
      "overall": {
        "hits": 230,
        "misses": 70,
        "total": 300,
        "hitRate": "76.67"
      }
    }
  }
}
```

**Cache Metrics Fields:**

- `hits`: Number of cache hits (requests served from Redis)
- `misses`: Number of cache misses (requests requiring external API calls)
- `total`: Total requests processed
- `hitRate`: Percentage of requests served from cache (as string)

## Caching Strategy

The backend implements Redis-based caching to reduce external API calls and improve response times.

### TTS Caching

- **Cache Key Format**: `tts:{SHA256(text + voice)}`
- **TTL**: 24 hours (86400 seconds)
- **Storage**: Audio data stored as base64-encoded strings
- **Behavior**: First request fetches from Google TTS and caches result; subsequent requests return cached audio instantly

### Conversation Caching

- **Cache Key Format**: `conv:{wordId}:{SHA256(prompt)}`
- **TTL**: 1 hour (3600 seconds)
- **Storage**: Conversation JSON serialized as string
- **Invalidation**: Can be manually cleared by wordId pattern via `clearCache()` method
- **Behavior**: First request generates via Gemini and caches result; subsequent requests return cached conversation

### Cache Fallback

When Redis is unavailable:

- System automatically falls back to `NoOpCacheService`
- All requests bypass cache and call external APIs directly
- No errors thrown; graceful degradation
- Health endpoint shows `redis.connected: false`

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
  "_metadata": {
    "mode": "real",
    "processedAt": "2025-11-16T12:00:05.000Z"
  }
}
```

> **Note:** Each turn now includes `chinese`, `pinyin`, `english`, and `audioUrl` fields. Audio is referenced by URL per turn.

**Errors:**

- `400 VALIDATION_ERROR`: Missing wordId or word
- `500 CONVO_TEXT_ERROR`: Gemini API failure or parsing error

## Progress Tracking Endpoints (Story 13.4)

All progress endpoints require authentication via JWT Bearer token.

### GET /api/v1/progress

Get all progress records for authenticated user.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
[
  {
    "id": "uuid-1",
    "wordId": "word-123",
    "studyCount": 5,
    "correctCount": 4,
    "confidence": 0.8,
    "nextReview": "2026-01-20T10:00:00.000Z",
    "createdAt": "2026-01-10T08:00:00.000Z",
    "updatedAt": "2026-01-14T14:30:00.000Z"
  }
]
```

**Errors:**

- `401 UNAUTHORIZED`: Missing or invalid JWT token

### GET /api/v1/progress/:wordId

Get progress for specific word.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "id": "uuid-1",
  "wordId": "word-123",
  "studyCount": 5,
  "correctCount": 4,
  "confidence": 0.8,
  "nextReview": "2026-01-20T10:00:00.000Z",
  "createdAt": "2026-01-10T08:00:00.000Z",
  "updatedAt": "2026-01-14T14:30:00.000Z"
}
```

**Errors:**

- `401 UNAUTHORIZED`: Missing or invalid JWT token
- `404 PROGRESS_NOT_FOUND`: No progress record exists for this word

### PUT /api/v1/progress/:wordId

Update or create progress for specific word.

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "studyCount": 6,
  "correctCount": 5,
  "confidence": 0.9
}
```

**Response (200 OK):**

```json
{
  "id": "uuid-1",
  "wordId": "word-123",
  "studyCount": 6,
  "correctCount": 5,
  "confidence": 0.9,
  "nextReview": "2026-01-25T10:00:00.000Z",
  "createdAt": "2026-01-10T08:00:00.000Z",
  "updatedAt": "2026-01-14T15:00:00.000Z"
}
```

**Validation:**

- `studyCount`: must be non-negative integer
- `correctCount`: must be non-negative integer
- `confidence`: must be number between 0 and 1

**Errors:**

- `400 MISSING_WORD_ID`: wordId parameter is required
- `400 INVALID_STUDY_COUNT`: studyCount must be non-negative number
- `400 INVALID_CORRECT_COUNT`: correctCount must be non-negative number
- `400 INVALID_CONFIDENCE`: confidence must be between 0 and 1
- `401 UNAUTHORIZED`: Missing or invalid JWT token

### DELETE /api/v1/progress/:wordId

Delete progress for specific word (toggle mastery).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

No response body on success.

**Errors:**

- `400 MISSING_WORD_ID`: wordId parameter is required
- `401 UNAUTHORIZED`: Missing or invalid JWT token
- `404 PROGRESS_NOT_FOUND`: No progress record exists for this word

### POST /api/v1/progress/batch

Batch update progress for multiple words (atomic transaction).

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "updates": [
    {
      "wordId": "word-123",
      "studyCount": 1,
      "confidence": 0.5
    },
    {
      "wordId": "word-456",
      "studyCount": 2,
      "confidence": 0.7
    }
  ]
}
```

**Response (200 OK):**

```json
[
  {
    "id": "uuid-1",
    "wordId": "word-123",
    "studyCount": 1,
    "correctCount": 0,
    "confidence": 0.5,
    "nextReview": "2026-01-15T10:00:00.000Z",
    "createdAt": "2026-01-14T16:00:00.000Z",
    "updatedAt": "2026-01-14T16:00:00.000Z"
  },
  {
    "id": "uuid-2",
    "wordId": "word-456",
    "studyCount": 2,
    "correctCount": 0,
    "confidence": 0.7,
    "nextReview": "2026-01-18T10:00:00.000Z",
    "createdAt": "2026-01-14T16:00:00.000Z",
    "updatedAt": "2026-01-14T16:00:00.000Z"
  }
]
```

**Errors:**

- `400 INVALID_UPDATES`: updates must be an array
- `400 EMPTY_UPDATES`: updates array cannot be empty
- `400 MISSING_WORD_ID`: Each update must have a wordId
- `401 UNAUTHORIZED`: Missing or invalid JWT token

### GET /api/v1/progress/stats

Get progress statistics summary for authenticated user.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "totalWords": 1500,
  "studiedWords": 250,
  "masteredWords": 85,
  "totalStudyCount": 1200,
  "averageConfidence": 0.68,
  "wordsToReviewToday": 12
}
```

**Errors:**

- `401 UNAUTHORIZED`: Missing or invalid JWT token

**Notes:**

- `masteredWords`: Words with confidence ≥ 0.8
- `wordsToReviewToday`: Words with `nextReview` date ≤ current time
- `averageConfidence`: Mean confidence across all studied words

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

## Progress Endpoints (Story 13.4)

### GET /api/v1/progress

Get all progress records for authenticated user.

**Auth:** Required (JWT Bearer token)

**Response (200 OK):**

```json
[
  {
    "id": "uuid-1",
    "userId": "user-123",
    "wordId": "hsk1_001",
    "studyCount": 5,
    "correctCount": 3,
    "confidence": 0.6,
    "nextReview": "2026-01-15T10:00:00.000Z",
    "createdAt": "2026-01-10T08:00:00.000Z",
    "updatedAt": "2026-01-14T12:00:00.000Z"
  }
]
```

**Errors:**

- `401 UNAUTHORIZED`: Missing or invalid JWT token

### GET /api/v1/progress/:wordId

Get progress for specific word.

**Auth:** Required (JWT Bearer token)

**Path Parameters:**

- `wordId` (string): Unique word identifier

**Response (200 OK):**

```json
{
  "id": "uuid-1",
  "userId": "user-123",
  "wordId": "hsk1_001",
  "studyCount": 5,
  "correctCount": 3,
  "confidence": 0.6,
  "nextReview": "2026-01-15T10:00:00.000Z",
  "createdAt": "2026-01-10T08:00:00.000Z",
  "updatedAt": "2026-01-14T12:00:00.000Z"
}
```

**Errors:**

- `401 UNAUTHORIZED`: Missing or invalid JWT token
- `404 PROGRESS_NOT_FOUND`: No progress record exists for this word

### PUT /api/v1/progress/:wordId

Update or create progress for specific word. Uses upsert pattern.

**Auth:** Required (JWT Bearer token)

**Path Parameters:**

- `wordId` (string): Unique word identifier

**Request Body:**

```json
{
  "studyCount": 6,
  "correctCount": 5,
  "confidence": 0.9
}
```

> **Note:** All fields are optional. `nextReview` date is calculated server-side based on `confidence` using spaced repetition algorithm.

**Response (200 OK):**

```json
{
  "id": "uuid-1",
  "userId": "user-123",
  "wordId": "hsk1_001",
  "studyCount": 6,
  "correctCount": 5,
  "confidence": 0.9,
  "nextReview": "2026-01-20T10:00:00.000Z",
  "createdAt": "2026-01-10T08:00:00.000Z",
  "updatedAt": "2026-01-14T14:30:00.000Z"
}
```

**Errors:**

- `400 INVALID_CONFIDENCE`: Confidence must be between 0 and 1
- `400 INVALID_STUDY_COUNT`: Study count must be non-negative
- `401 UNAUTHORIZED`: Missing or invalid JWT token

### DELETE /api/v1/progress/:wordId

Delete progress record for specific word. Used for "toggle mastery" feature.

**Auth:** Required (JWT Bearer token)

**Path Parameters:**

- `wordId` (string): Unique word identifier

**Response (204 No Content):**

No response body on success.

**Errors:**

- `401 UNAUTHORIZED`: Missing or invalid JWT token
- `404 PROGRESS_NOT_FOUND`: No progress record exists for this word

### POST /api/v1/progress/batch

Batch update progress for multiple words. Atomic transaction (all succeed or all fail).

**Auth:** Required (JWT Bearer token)

**Request Body:**

```json
{
  "updates": [
    {
      "wordId": "hsk1_001",
      "studyCount": 5,
      "correctCount": 3,
      "confidence": 0.6
    },
    {
      "wordId": "hsk1_002",
      "studyCount": 2,
      "correctCount": 1,
      "confidence": 0.3
    }
  ]
}
```

**Response (200 OK):**

```json
[
  {
    "id": "uuid-1",
    "wordId": "hsk1_001",
    "studyCount": 5,
    "correctCount": 3,
    "confidence": 0.6
  },
  {
    "id": "uuid-2",
    "wordId": "hsk1_002",
    "studyCount": 2,
    "correctCount": 1,
    "confidence": 0.3
  }
]
```

**Errors:**

- `400 EMPTY_UPDATES`: Updates array cannot be empty
- `400 INVALID_UPDATES`: Updates must be an array
- `400 MISSING_WORD_ID`: Each update must have a wordId
- `401 UNAUTHORIZED`: Missing or invalid JWT token

### GET /api/v1/progress/stats

Get summary statistics for authenticated user's progress.

**Auth:** Required (JWT Bearer token)

**Response (200 OK):**

```json
{
  "totalWords": 150,
  "studiedWords": 45,
  "masteredWords": 12,
  "totalStudyCount": 230,
  "averageConfidence": 0.72,
  "wordsToReviewToday": 8
}
```

**Field Definitions:**

- `totalWords`: Total vocabulary words available in system
- `studiedWords`: Number of words user has studied (any progress record exists)
- `masteredWords`: Words with confidence ≥ 0.8
- `totalStudyCount`: Sum of all studyCount values
- `averageConfidence`: Mean confidence across all studied words
- `wordsToReviewToday`: Words with `nextReview` date ≤ today

**Errors:**

- `401 UNAUTHORIZED`: Missing or invalid JWT token
