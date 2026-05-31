# Local Backend API Specification

## Table of Contents

- [Health Check](#health-check)
- [Caching Strategy](#caching-strategy)
- [TTS Endpoints](#tts-endpoints)
- [Conversation Endpoints](#conversation-endpoints)
- [Progress Tracking Endpoints](#progress-tracking-endpoints-story-134)
- [Gamification Endpoints](#gamification-endpoints-story-153)
- [AI Feedback Endpoints](#ai-feedback-endpoints-story-154)
- [Authentication](#authentication)

## Authentication

All authentication endpoints are at `/api/v1/auth`.

### POST /api/v1/auth/register

Create a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "John Doe" // optional
}
```

**Password Requirements:**

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

**Response (201 Created):**

```json
{
  "user": {
    "id": "uuid-123",
    "email": "user@example.com",
    "displayName": "John Doe",
    "createdAt": "2026-01-14T10:00:00.000Z"
  },
  "accessToken": "eyJhbGc...xyz",
  "expiresIn": 900
}
```

**Set-Cookie Header:**

```
refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/
```

**Errors:**

- `400 INVALID_EMAIL`: Email format is invalid
- `400 WEAK_PASSWORD`: Password does not meet requirements
- `409 EMAIL_EXISTS`: Email already registered
- `500 REGISTRATION_ERROR`: Server error during registration

---

### POST /api/v1/auth/login

Authenticate existing user and issue tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid-123",
    "email": "user@example.com",
    "displayName": "John Doe"
  },
  "accessToken": "eyJhbGc...xyz",
  "expiresIn": 900
}
```

**Set-Cookie Header:**

```
refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/
```

**Errors:**

- `400 MISSING_CREDENTIALS`: Email or password not provided
- `401 INVALID_CREDENTIALS`: Email or password incorrect
- `429 TOO_MANY_REQUESTS`: Rate limit exceeded (max 5 attempts per minute per IP)
- `500 LOGIN_ERROR`: Server error during login

**Rate Limiting:**

- Maximum 5 login attempts per minute per IP address
- Failed attempts are logged for security monitoring

---

### POST /api/v1/auth/refresh

Exchange refresh token for new access token.

**Request:**

No body required. Refresh token is read from httpOnly cookie.

**Cookie Header:**

```
refreshToken=<token>
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGc...xyz",
  "expiresIn": 900
}
```

**Set-Cookie Header:**

```
refreshToken=<new_token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/
```

> **Note:** Refresh token rotation is implemented. Old refresh token is invalidated and new one is issued.

**Errors:**

- `401 MISSING_REFRESH_TOKEN`: No refresh token cookie present
- `401 INVALID_REFRESH_TOKEN`: Refresh token expired or invalid
- `500 REFRESH_ERROR`: Server error during token refresh

---

### POST /api/v1/auth/logout

Invalidate refresh token and clear session.

**Request:**

No body required. Refresh token is read from httpOnly cookie.

**Cookie Header:**

```
refreshToken=<token>
```

**Response (204 No Content):**

No response body. `Set-Cookie` header clears the refresh token.

**Set-Cookie Header:**

```
refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/
```

**Errors:**

- `401 UNAUTHORIZED`: Missing or invalid refresh token
- `500 LOGOUT_ERROR`: Server error during logout

---

### GET /api/v1/auth/me

Get currently authenticated user's profile.

**Auth:** Required (JWT Bearer token)

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "id": "uuid-123",
  "email": "user@example.com",
  "displayName": "John Doe",
  "createdAt": "2026-01-10T08:00:00.000Z"
}
```

**Errors:**

- `401 UNAUTHORIZED`: Missing, expired, or invalid access token
- `404 USER_NOT_FOUND`: User account no longer exists

---

### JWT Token Details

**Access Token:**

- **Type**: Bearer token (sent in Authorization header)
- **Lifetime**: 15 minutes
- **Payload**: `{ userId, email, type: "access" }`
- **Usage**: Include in Authorization header for all protected endpoints

**Refresh Token:**

- **Type**: HttpOnly cookie (automatic browser handling)
- **Lifetime**: 7 days
- **Payload**: `{ userId, tokenId, type: "refresh" }`
- **Storage**: Database-backed (can be revoked server-side)
- **Rotation**: New refresh token issued on every refresh request

**Security Features:**

- bcrypt password hashing (cost factor: 10)
- Refresh token rotation prevents replay attacks
- HttpOnly cookies prevent XSS attacks
- Secure flag enforced in production (HTTPS only)
- Rate limiting on login endpoint (5 attempts/minute/IP)

---

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

````json
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

      ---

      ## Single-Line Example Endpoint (Story 16.1)

      Generate a single-line Chinese example for a vocabulary `word` using only HSK 1-3 vocabulary.

      ### POST /v1/examples/single-line

      **Behavior**:
      - Validate input server-side before any model calls (reject control chars / injection patterns).
      - Check cache key `examples/<sha256(word|hskLevel|language|v1)>.json` and return cached object when present.
      - Call Gemini via `generateStructured` when cache miss. Validate model output and retry once on validation failure.
      - Cache successful, validated outputs to GCS using the deterministic cache key (no plain-text in object name).

      **Request Body:**

      ```json
      {
        "word": "饭",
        "hskLevel": 1,
        "language": "zh-CN"
      }
      ```

      **Successful Response (200 OK):**

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
      - `400 VALIDATION_ERROR`: Missing or invalid inputs (control characters, unsupported hskLevel, prompt-injection detected).
      - `502 INVALID_GENERATION`: Model produced invalid or unsafe output even after a retry.
      - `503 SERVICE_UNAVAILABLE`: External AI service unavailable (opaque to client; server logs contain details).

      **Cache Key Format:** `examples/<sha256(word|hskLevel|language|v1)>.json` (deterministic, no cleartext in object name)

      **Notes:**
      - HSK 1-3 canonical list loaded from `packages/shared-constants/hsk-1-3.json` at service startup.
      - Generated outputs are strictly validated: presence of `chinese`, `pinyin`, and `english`; no HTML/script tags; Chinese tokens must be in HSK 1-3 or the target word itself.
      - All Gemini/internal errors are logged in full to server logs; client-facing responses are intentionally opaque to avoid leaking secrets or internals.

````

> **Note:** Each turn now includes `chinese`, `pinyin`, `english`, and `audioUrl` fields. Audio is referenced by URL per turn.

**Errors:**

- `400 VALIDATION_ERROR`: Missing wordId or word
- `500 CONVO_TEXT_ERROR`: Gemini API failure or parsing error

## Progress Tracking Endpoints

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

---

## Spaced Repetition Algorithm (Story 15.1)

The progress system uses a **unified spaced repetition algorithm** that supports both flashcard (confidence-based) and quiz (performance-based) study modes.

### Unified Formula

```
newDelay = baseDelay * performanceMultiplier
finalDays = 1 + (30 - 1) * multiplier
```

Where:

- `baseDelay`: Current spacing interval in days (or 1 for first review)
- `performanceMultiplier`: Scaling factor based on activity type
- Final result: 1-30 day range

### Performance Multipliers

| Activity Type        | Multiplier Calculation | Example                                               |
| -------------------- | ---------------------- | ----------------------------------------------------- |
| **Flashcard**        | `confidence²`          | 0.8 confidence → 0.64 multiplier → ~19 days           |
| **Quiz (Correct)**   | `1.0` (fixed)          | Correct answer → 1.0 multiplier → 30 days max         |
| **Quiz (Incorrect)** | `0.0` (fixed)          | Incorrect answer → 0.0 multiplier → 1 day (immediate) |

### Feature Detection

The system automatically determines which algorithm to use based on **most recent activity**:

1. If `quiz_results.answeredAt > progress.updatedAt` → **Quiz algorithm**
2. Otherwise → **Flashcard algorithm**

This allows seamless coexistence:

- User does flashcard review (confidence 0.8) → nextReview set to 19 days
- User then does quiz (correct) → nextReview updated to 30 days (quiz wins)
- User later does flashcard (confidence 0.5) → nextReview updated to 8 days (flashcard wins)

### Schema Additions

**Progress Table (Enhanced):**

```typescript
{
  // Existing fields...
  lapseCount: number; // Consecutive incorrect quiz answers (Story 15.1)
  currentDelay: number | null; // Current spacing interval in days (Story 15.1)
}
```

**QuizResult Table (New):**

```typescript
{
  id: string;
  userId: string;
  wordId: string;
  correct: boolean;
  questionType: "multiple_choice" | "type_pinyin" | "type_character";
  timeSpentMs: number | null;
  answeredAt: Date;
}
```

**StudyStreak Table (New):**

```typescript
{
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  freezeCount: number;
}
```

### Backward Compatibility

All existing flashcard API calls continue to work without modification:

- `PUT /api/v1/progress/:wordId` with `confidence` → uses `confidence²` multiplier
- Quiz-specific endpoints (Story 15.2) → use explicit multipliers (1.0 or 0.0)
- Service layer automatically selects correct algorithm based on activity type

### Leeches

Words with `lapseCount >= 5` are flagged as "leeches" (difficult vocabulary requiring targeted review). Leech tracking is exposed via:

- `POST /api/progress/test-result` response includes `isLeech: boolean`
- `GET /api/v1/learning/leeches` endpoint (Story 15.2) returns high-difficulty words

---

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

## Progress Endpoints

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

---

### GET /api/v1/progress/due

Get vocabulary words due for review based on spaced repetition schedule. Returns words where `nextReview <= requestedDate`.

**Auth:** Required (JWT Bearer token)

**Query Parameters:**

- `date` (string, optional): Target date in YYYY-MM-DD format. Defaults to current date if not provided.

**Response (200 OK):**

```json
{
  "date": "2026-02-12",
  "count": 15,
  "words": [
    {
      "id": "hsk3-band1-001",
      "simplified": "你好",
      "traditional": "你好",
      "pinyin": "nǐ hǎo",
      "english": "hello",
      "nextReview": "2026-02-10T08:00:00.000Z",
      "studyCount": 5,
      "lapseCount": 1,
      "currentDelay": 3,
      "categories": ["Greetings", "Daily Communication"]
    }
  ]
}
```

**Business Rules:**

- Maximum 20 words returned per request (prevents user fatigue)
- Results sorted by `nextReview` ascending (oldest due first)
- Only returns words belonging to authenticated user
- Includes vocabulary enrichment (chinese, pinyin, english, categories)

**Errors:**

- `400 INVALID_DATE`: Date format must be YYYY-MM-DD
- `401 UNAUTHORIZED`: Missing or invalid JWT token

**Example:**

```bash
# Get words due today
curl -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/v1/progress/due

# Get words due on specific date
curl -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/v1/progress/due?date=2026-02-15
```

---

### POST /api/v1/progress/test-result

Save quiz answer and update progress using quiz-specific spaced repetition algorithm. Updates `nextReview`, `lapseCount`, `studyCount`, and creates audit record in `quiz_results` table.

**Auth:** Required (JWT Bearer token)

**Request Body:**

```json
{
  "wordId": "hsk3-band1-042",
  "correct": true,
  "questionType": "multiple_choice",
  "timeSpentMs": 3500
}
```

**Field Definitions:**

- `wordId` (string, required): Unique word identifier
- `correct` (boolean, required): Whether answer was correct
- `questionType` (enum, required): One of `multiple_choice`, `type_pinyin`, `type_character`
- `timeSpentMs` (number, optional): Time spent on question in milliseconds

**Response (200 OK):**

```json
{
  "nextReviewDate": "2026-03-14T08:00:00.000Z",
  "lapseCount": 0,
  "isLeech": false,
  "xpEarned": 15,
  "newBadges": [
    {
      "id": "bronze_flame",
      "name": "Bronze Flame",
      "streakRequired": 7,
      "icon": "🔥"
    }
  ],
  "freezeAwarded": true,
  "mysteryBox": {
    "type": "xp",
    "amount": 50,
    "name": "Bonus XP",
    "icon": "✨"
  }
}
```

- **Gamification side effects (Story 15.3):**
  - Updates user's study streak (48-hour grace period)
  - Awards XP: +10 base per correct answer, +5 bonus if current streak ≥ 7 days
  - Checks and awards badges at 7/30/100/365-day streak milestones
  - Awards 1 freeze per 10 consecutive perfect quizzes (max 5 freezes)
  - Rolls for mystery box drop (5% chance) on streak milestones (7, 14, 21, 28...)
    **Response Field Definitions:**

- `nextReviewDate`: Calculated next review date using spaced repetition
  - Correct answer: 30 days (maximum spacing)
  - Incorrect answer: 1 day (immediate review)
- `lapseCount`: Total consecutive incorrect answers (resets to 0 on correct answer)
- `isLeech`: True if `lapseCount >= 5` (flagged for targeted review)
- `xpEarned` (Story 15.3): XP points awarded for this answer (+10 base, +5 bonus if streak ≥ 7)
- `newBadges` (Story 15.3): Array of newly unlocked badges (7/30/100/365-day streak milestones)
- `freezeAwarded` (Story 15.3): True if user earned 1 freeze (10 consecutive perfect quizzes)
- `mysteryBox` (Story 15.3): Random reward object if dropped (5% chance on 7-day streak multiples), null otherwise

**Business Rules:**

- Uses unified spaced repetition algorithm with quiz-specific multipliers
- Correct answer: `performanceMultiplier = 1.0` → 30 day interval
- Incorrect answer: `performanceMultiplier = 0.0` → 1 day interval
- `lapseCount` increments on incorrect, resets on correct
- Creates audit record in `quiz_results` table with timestamp and metadata
- Rate limited to 100 requests/hour per user (prevents XP farming)

**Errors:**

- `400 MISSING_WORD_ID`: wordId is required
- `400 INVALID_CORRECT`: correct must be boolean
- `400 INVALID_QUESTION_TYPE`: questionType must be one of [multiple_choice, type_pinyin, type_character]
- `401 UNAUTHORIZED`: Missing or invalid JWT token
- `429 RATE_LIMIT_EXCEEDED`: Too many quiz submissions (max 100/hour)

**Example:**

```bash
# Submit correct answer
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"wordId":"hsk3-band1-042","correct":true,"questionType":"multiple_choice","timeSpentMs":3500}' \
  https://api.example.com/api/v1/progress/test-result

# Submit incorrect answer
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"wordId":"hsk3-band1-042","correct":false,"questionType":"type_pinyin"}' \
  https://api.example.com/api/v1/progress/test-result
```

---

### GET /api/v1/learning/leeches

Get vocabulary words with high lapse counts (struggling vocabulary requiring targeted review). Returns words where `lapseCount >= threshold`.

**Auth:** Required (JWT Bearer token)

**Query Parameters:**

- `minLapseCount` (number, optional): Minimum lapse count threshold. Defaults to 5 if not provided.

**Response (200 OK):**

```json
{
  "count": 8,
  "words": [
    {
      "id": "hsk3-band1-123",
      "simplified": "虽然",
      "traditional": "雖然",
      "pinyin": "suīrán",
      "english": "although",
      "nextReview": "2026-02-12T08:00:00.000Z",
      "studyCount": 15,
      "lapseCount": 8,
      "currentDelay": 1,
      "categories": ["Grammar", "Conjunctions"]
    }
  ]
}
```

**Business Rules:**

- Default threshold: `lapseCount >= 5` (configurable via query param)
- Results sorted by `lapseCount` descending (highest struggle first)
- Maximum 20 words returned per request
- Includes vocabulary enrichment (chinese, pinyin, english, categories)
- Leech status helps identify 15% of words causing 50% of failures (Pareto principle)

**Errors:**

- `400 INVALID_LAPSE_COUNT`: minLapseCount must be positive integer
- `401 UNAUTHORIZED`: Missing or invalid JWT token

**Example:**

```bash
# Get default leeches (lapseCount >= 5)
curl -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/v1/learning/leeches

# Get severely struggling words (lapseCount >= 10)
curl -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/v1/learning/leeches?minLapseCount=10
```

---

## Gamification Endpoints (Story 15.3)

All gamification endpoints require authentication via JWT Bearer token.

### GET /api/v1/progress/streak

Get current study streak data for authenticated user.

**Auth:** Required (JWT Bearer token)

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "currentStreak": 14,
  "longestStreak": 28,
  "freezeCount": 2,
  "lastActivityDate": "2026-02-11T15:30:00.000Z"
}
```

**Response Field Definitions:**

- `currentStreak`: Consecutive days with quiz activity (resets if >48h inactive without freeze)
- `longestStreak`: All-time longest streak achieved (never decreases)
- `freezeCount`: Available freeze currency to protect streak (0-5 cap)
- `lastActivityDate`: Timestamp of most recent quiz completion

**Business Rules:**

- **48-hour grace period**: User has 48 hours from `lastActivityDate` to complete another quiz before streak resets
- Streak increments by 1 per calendar day (multiple quizzes per day still count as 1)
- Grace period accommodates time zones and weekend travel patterns

**Errors:**

- `401 UNAUTHORIZED`: Missing or invalid JWT token
- `404 STREAK_NOT_FOUND`: User has never completed a quiz
- `500 INTERNAL_ERROR`: Database or service error

**Example:**

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/v1/progress/streak
```

---

### POST /api/v1/progress/streak/freeze

Spend 1 freeze to protect current streak by extending grace period by 24 hours.

**Auth:** Required (JWT Bearer token)

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

None (empty body).

**Response (200 OK):**

```json
{
  "message": "Freeze spent successfully",
  "freezeCount": 1,
  "lastActivityDate": "2026-02-10T15:30:00.000Z"
}
```

**Response Field Definitions:**

- `freezeCount`: Remaining freezes after spending (decremented by 1)
- `lastActivityDate`: Extended grace period end (original date + 24 hours)

**Business Rules:**

- Can only spend freeze when streak is **at risk** (>48 hours since `lastActivityDate`)
- Cannot spend freeze if within normal 48-hour grace period (400 error)
- Extends `lastActivityDate` by exactly 24 hours (not current time)
- Maximum 1 freeze spend per 7-day period (prevents hoarding abuse)
- Freeze spend does NOT increment `currentStreak` (only protects existing streak)

**Validation Rules:**

- `freezeCount >= 1` required (400 error if 0 freezes)
- Streak must be at risk: `(now - lastActivityDate) > 48 hours` (400 error if not at risk)
- User must have active streak record (404 error if no streak exists)

**Errors:**

- `400 NO_FREEZES_AVAILABLE`: User has 0 freezes remaining
- `400 STREAK_NOT_AT_RISK`: Cannot spend freeze within 48-hour grace period
- `401 UNAUTHORIZED`: Missing or invalid JWT token
- `404 NO_STREAK_RECORD`: User has never completed a quiz
- `500 INTERNAL_ERROR`: Database or service error

**Example:**

```bash
# Spend freeze to protect streak
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/v1/progress/streak/freeze
```

**Use Cases:**

- User goes on vacation and wants to preserve 100-day streak
- Emergency scenarios (illness, travel) where quiz completion impossible
- Strategic use before known busy periods

---

### GET /api/v1/gamification/badges

Get earned badges and progress toward available badges for authenticated user.

**Auth:** Required (JWT Bearer token)

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "earned": [
    {
      "id": "bronze_flame",
      "name": "Bronze Flame",
      "streakRequired": 7,
      "icon": "🔥",
      "earnedDate": "2026-01-18T10:00:00.000Z"
    },
    {
      "id": "silver_flame",
      "name": "Silver Flame",
      "streakRequired": 30,
      "icon": "🔥",
      "earnedDate": "2026-02-08T14:30:00.000Z"
    }
  ],
  "available": [
    {
      "id": "gold_flame",
      "name": "Gold Flame",
      "streakRequired": 100,
      "icon": "🔥",
      "progress": 42,
      "percentComplete": 42
    },
    {
      "id": "diamond_flame",
      "name": "Diamond Flame",
      "streakRequired": 365,
      "icon": "💎",
      "progress": 42,
      "percentComplete": 12
    }
  ]
}
```

**Response Field Definitions:**

**Earned Badges:**

- `id`: Unique badge identifier (bronze_flame, silver_flame, gold_flame, diamond_flame)
- `name`: Display name for badge
- `streakRequired`: Streak milestone required to earn badge
- `icon`: Emoji icon representing badge
- `earnedDate`: Timestamp when badge was unlocked

**Available Badges:**

- `id`, `name`, `streakRequired`, `icon`: Same as earned badges
- `progress`: User's current `longestStreak` value (toward this badge)
- `percentComplete`: Progress percentage (0-100, rounded to integer)

**Badge Milestones:**

| Badge ID          | Name                | Streak Required             | Icon |
| ----------------- | ------------------- | --------------------------- | ---- |
| bronze_flame      | Bronze Flame        | 7 days                      | 🔥   |
| silver_flame      | Silver Flame        | 30 days                     | 🔥   |
| gold_flame        | Gold Flame          | 100 days                    | 🔥   |
| diamond_flame     | Diamond Flame       | 365 days                    | 💎   |
| golden_flame_rare | Golden Flame (Rare) | N/A (mystery box exclusive) | ✨🔥 |

**Business Rules:**

- Each badge awarded only once (no duplicates)
- Badges awarded based on `longestStreak`, not `currentStreak` (permanent achievement)
- Progress shown for next unearned badge tier
- `available` array shows all unearned badges with progress (not just next tier)
- `golden_flame_rare` badge not shown in available list (mystery box surprise)

**Errors:**

- `401 UNAUTHORIZED`: Missing or invalid JWT token
- `404 NO_STREAK_RECORD`: User has never completed a quiz
- `500 INTERNAL_ERROR`: Database or service error

**Example:**

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/v1/gamification/badges
```

**Use Cases:**

- Display badge collection in user profile
- Show progress bars for next badge milestones
- Celebrate badge unlocks with confetti/animations
- Social sharing of badge achievements

---

### Mystery Box System

Mystery boxes are **not** a standalone endpoint. They are awarded as part of quiz completion (`POST /api/v1/progress/test-result` response).

**Drop Conditions:**

- User must be on a streak milestone (7-day multiple: 7, 14, 21, 28, 35...)
- 5% random chance per eligible quiz
- Only drops once per milestone (e.g., if missed at day 14, can still drop at day 21)

**Reward Types:**

```json
[
  { "type": "xp", "amount": 50, "name": "Bonus XP", "icon": "✨" },
  { "type": "freeze", "amount": 1, "name": "Streak Freeze", "icon": "❄️" },
  { "type": "badge", "id": "golden_flame_rare", "name": "Golden Flame (Rare)", "icon": "✨🔥" }
]
```

**Business Rules:**

- Random selection from 3 reward types (equal probability)
- XP rewards bypass daily 500 XP cap (bonus incentive)
- Freeze rewards can exceed 5-freeze cap temporarily
- Rare badge variant is exclusive to mystery box (not achievable via streaks)

**Example Response (in test-result):**

```json
{
  "nextReviewDate": "2026-03-14T08:00:00.000Z",
  "xpEarned": 10,
  "mysteryBox": {
    "type": "freeze",
    "amount": 1,
    "name": "Streak Freeze",
    "icon": "❄️"
  }
}
```

---

### XP System

XP (experience points) are awarded via quiz completion. No standalone XP endpoint exists.

**XP Formula:**

```
xpEarned = baseXP + streakBonus
baseXP = correct ? 10 : 0
streakBonus = currentStreak >= 7 ? 5 : 0
```

**Examples:**

- Correct answer, 3-day streak: `10 + 0 = 10 XP`
- Correct answer, 7-day streak: `10 + 5 = 15 XP`
- Incorrect answer: `0 XP` (no penalty, just no reward)

**Business Rules:**

- Only correct answers award XP (incorrect = 0 XP)
- Streak bonus activates at 7+ day streak (Bronze Flame milestone)
- Daily XP cap: **500 XP** (prevents marathon gaming sessions)
- Mystery box XP rewards **bypass** daily cap (bonus incentive)
- XP resets do not occur (lifetime cumulative)

**Future Expansion (Not in Story 15.3):**

- User profile displaying total XP count
- Leaderboards (weekly/monthly/all-time)
- XP-based unlocks (premium word lists, themes)

**Use Cases:**

- Targeted review sessions for difficult vocabulary
- Identifying words needing mnemonic devices or alternative learning strategies
- Prioritizing vocabulary for focused practice

---

## AI Feedback Endpoints (Story 15.4)

AI-powered error explanations using Gemini API with Redis caching for cost optimization.

### POST /api/v1/quiz/feedback

Generate AI-powered explanation for incorrect quiz answers.

**Auth:** Required (JWT Bearer token)

**Rate Limit:** 10 requests per minute per user

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "wordId": 1,
  "userAnswer": "mǎ",
  "correctAnswer": "mā",
  "questionType": "tone_audio"
}
```

**Request Field Definitions:**

- `wordId` (number, required): ID of the vocabulary word being tested
- `userAnswer` (string, required): User's incorrect answer (max 100 chars)
- `correctAnswer` (string, required): Correct answer for comparison (max 100 chars)
- `questionType` (string, required): Type of quiz question

**Valid Question Types:**

- `tone_audio`: Listening comprehension (tone identification)
- `character_choice`: Multiple choice (Chinese characters)
- `pinyin_choice`: Multiple choice (pinyin)
- `english_choice`: Multiple choice (English meaning)
- `character_input`: Free-text input (Chinese characters)

**Response (200 OK):**

```json
{
  "explanation": "You confused mā (mother) with mǎ (horse). These words use the same syllable but different tones. The first tone (mā) is high and level, while the third tone (mǎ) starts low, dips, and rises. Practice listening carefully to tone differences!",
  "errorType": "tone"
}
```

**Response Field Definitions:**

- `explanation` (string): 2-3 sentence explanation of the error (max 300 chars)
- `errorType` (string): Classification of error type

**Error Types:**

- `tone`: Different tones on same pinyin syllable (mā vs mǎ)
- `character`: Different Chinese characters (妈 vs 马)
- `meaning`: Semantic confusion (hello vs hi, mother vs mom)
- `generic`: Fallback when AI unavailable or error classification uncertain

**Caching Behavior:**

- Cache key: `quiz:feedback:{wordId}:{userAnswer}` (case-insensitive)
- TTL: 24 hours
- Cache shared across users (common errors benefit all learners)
- Cache hit rate logged every 50 requests
- Target: >60% hit rate after 1 week of usage

**Business Rules:**

1. **Input Sanitization:**
   - User answer and correct answer stripped of dangerous characters (`<>{}[]`)
   - Maximum 100 characters per field
   - Empty strings after sanitization rejected (400 error)

2. **Timeout Handling:**
   - Gemini API call has 3-second timeout
   - Timeout returns generic fallback message (non-blocking UX)
   - Fallback: "We couldn't generate detailed feedback right now. Review this word again to reinforce your memory. Pay attention to tones, character shapes, and meanings."

3. **AI Prompt Strategy:**
   - Prompts Gemini to classify error type AND provide explanation
   - Response expected in JSON format: `{"errorType": "...", "explanation": "..."}`
   - Fallback classification logic if JSON parsing fails
   - Beginner-friendly language (no linguistic jargon)

4. **Rate Limiting:**
   - 10 requests per minute per user IP
   - 429 error returned if limit exceeded
   - Prevents API abuse and cost overruns

5. **Cost Optimization:**
   - Redis caching reduces API calls by ~70-80%
   - Cache metrics logged for monitoring
   - Daily Gemini API quota monitoring (future: auto-disable if exceeded)

**Errors:**

- `400 BAD_REQUEST`: Missing required fields, invalid wordId, empty answers after sanitization
- `401 UNAUTHORIZED`: Missing or invalid JWT token
- `404 NOT_FOUND`: Word ID does not exist in database
- `429 TOO_MANY_REQUESTS`: Rate limit exceeded (10/minute)
- `503 SERVICE_UNAVAILABLE`: Gemini API credentials missing or invalid
- `500 INTERNAL_ERROR`: Unexpected server error

**Error Response Examples:**

```json
// Missing required fields
{
  "error": "Missing required fields: wordId, userAnswer, correctAnswer, questionType are all required"
}

// Invalid wordId
{
  "error": "Invalid wordId: must be a positive number"
}

// Word not found
{
  "error": "Word not found"
}

// Rate limit exceeded
{
  "error": "Too many feedback requests. Please wait a moment before requesting more explanations."
}

// Gemini API unavailable
{
  "error": "AI feedback service is temporarily unavailable"
}
```

**Example Request:**

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wordId": 1,
    "userAnswer": "mǎ",
    "correctAnswer": "mā",
    "questionType": "tone_audio"
  }' \
  https://api.example.com/api/v1/quiz/feedback
```

**Example Response (Tone Error):**

```json
{
  "explanation": "You confused mā (mother) with mǎ (horse). The first tone (mā) is high and level, while the third tone (mǎ) starts low, dips, and rises. Practice listening carefully to tone differences!",
  "errorType": "tone"
}
```

**Example Response (Character Error):**

```json
{
  "explanation": "These characters look similar but have different radicals. 妈 (mother) has the 女 (woman) radical on the left, while 马 (horse) is a standalone character. Focus on the left side of the character to distinguish them.",
  "errorType": "character"
}
```

**Example Response (Fallback - AI Timeout):**

```json
{
  "explanation": "We couldn't generate detailed feedback right now. Review this word again to reinforce your memory. Pay attention to tones, character shapes, and meanings.",
  "errorType": "generic"
}
```

**Gemini Prompt Template:**

```
You are a Mandarin Chinese tutor helping a beginner student understand their mistake.

**Student's mistake:**
- Question type: {questionType}
- Student answered: "{userAnswer}"
- Correct answer: "{correctAnswer}"
- Word: {simplified} ({pinyin}) meaning "{english}"

**Task:**
1. Classify the error type as one of: "tone", "character", or "meaning"
   - "tone": Different tone marks (e.g., mā vs mǎ)
   - "character": Different Chinese characters (e.g., 妈 vs 马)
   - "meaning": Semantic confusion (e.g., confusing hello with hi)

2. Explain the confusion in 2-3 simple sentences suitable for beginners.
3. Provide a helpful learning tip if applicable.

**Format your response as JSON:**
{
  "errorType": "tone"|"character"|"meaning",
  "explanation": "Your 2-3 sentence explanation here."
}

Keep language simple and encouraging. Focus on helping the student understand WHY they made this mistake.
```

**Use Cases:**

- Post-quiz feedback screen: show explanation after incorrect answer
- Review mode: allow users to request explanations for previously missed words
- Study insights: aggregate error types to identify weak areas (tone vs character recognition)
- Adaptive learning: prioritize practice sessions based on error type patterns

**Performance Metrics:**

- Average response time: ~500ms (cache hit), ~1.5s (cache miss + Gemini call)
- Cache hit rate target: >60% after 1 week, >80% after 1 month
- Gemini API cost per request: ~$0.0001 USD (highly cost-effective with caching)
- Rate limit prevents excessive costs from individual users

---
