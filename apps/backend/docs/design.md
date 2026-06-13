# Backend Design

**Last Updated:** June 11, 2026

## Purpose

Provides an Express server for development and production, supporting:

- Text-to-Speech (TTS) generation via Google Cloud TTS
- Vocabulary management, quiz sessions, and spaced repetition
- User authentication with JWT refresh token rotation
- Progress tracking, gamification (streaks, badges, XP)
- AI-powered feedback for incorrect quiz answers via Gemini API
- Word examples generation via Gemini API
- Google Cloud Storage (GCS) caching for audio data

## Architecture

### Modular Monolith Structure

```
src/
├── app/                          ← Express app bootstrap, DI container, routes
│   ├── index.js                  ← Express app entry point
│   ├── container.js              ← DI composition root (15 exported instances)
│   └── routes.js                 ← 11 route routers registered under /v1/
├── modules/                      ← 8 business modules
│   ├── auth/                     ← Simple CRUD (login, register, refresh)
│   ├── word/                     ← Simple CRUD (word lookup)
│   ├── vocabulary/               ← Feature Slices (lists, categories)
│   ├── quiz/                     ← Clean Architecture (use-cases/, services/, repositories/)
│   ├── gamification/             ← Simple CRUD (streaks, badges, XP)
│   ├── examples/                 ← Feature Slices (word examples)
│   ├── tts/                      ← Simple (TTS audio generation)
│   └── health/                   ← Simple (health check)
└── shared/
    ├── config/index.js           ← Centralized env config with validation
    ├── infrastructure/
    │   ├── cache/                ← CacheService + CacheFactory
    │   ├── database/client.js    ← Prisma client singleton
    │   ├── external/             ← GCSClient, GeminiClient, GoogleTTSClient
    │   ├── redis/                ← RedisClient + RedisLockManager
    │   ├── security/             ← JwtService, PasswordService, HmacManager
    │   └── storage/              ← GcsFileStore + StorageFactory
    ├── middleware/               ← asyncHandler, authMiddleware, cacheMiddleware, errorHandler
    └── utils/                    ← logger, errorFactory, hashUtils, dateUtils
```

### Layer Responsibilities

| Layer                  | Responsibility                        | Location                                   |
| ---------------------- | ------------------------------------- | ------------------------------------------ |
| **API (Controller)**   | Parse request, call service, respond  | `modules/<name>/api/`                      |
| **Service / Use-Case** | Business logic, orchestration         | `modules/<name>/services/` or `use-cases/` |
| **Repository**         | Data access (via Prisma)              | `modules/<name>/repositories/`             |
| **Infrastructure**     | External APIs, cache, database client | `shared/infrastructure/`                   |

### Key Components

**Modules** (`modules/`):

- Each module self-contains its own `api/` (controllers + routes), `services/` (business logic), `repositories/` (data access), and `__tests__/`
- Modules expose public API via `index.js` — only services, never internal files
- Quiz module is the largest, with dedicated `use-cases/` directory for Clean Architecture

**Shared Infrastructure** (`shared/infrastructure/`):

- `external/GoogleTTSClient.js` - Google Cloud Text-to-Speech client
- `external/GeminiClient.js` - Google Gemini API client for AI feedback & examples
- `external/GCSClient.js` - Google Cloud Storage operations
- `cache/CacheService.js` - Redis-backed caching with fail-open behavior
- `redis/RedisClient.js` - Redis connection management
- `redis/RedisLockManager.js` - Distributed lock for single-flight cache patterns
- `security/JwtService.js` - JWT creation and verification
- `security/PasswordService.js` - bcrypt password hashing
- `security/HmacManager.js` - HMAC signing for cache integrity
- `storage/GcsFileStore.js` - GCS file operations abstraction
- `storage/StorageFactory.js` - Per-module GCS storage instance factory

**Middleware** (`shared/middleware/`):

- `asyncHandler.js` - Async route wrapper with logging and validation
- `authMiddleware.js` - JWT verification from cookies/headers
- `cacheMiddleware.js` - Route-level caching
- `errorHandler.js` - Centralized error handling with request ID propagation

**Configuration** (`shared/config/`):

- `index.js` - Centralized config with environment variable validation

### Key Features

- **Modular Monolith**: 8 self-contained modules, each owning its domain
- **Dependency Injection**: Container-based DI in `container.js` — services receive dependencies via constructor
- **Fail-Open Caching**: Redis failures degrade gracefully to live API calls
- **Repository Pattern**: All database access through repositories (abstracts Prisma)
- **Error Tracing**: Request IDs propagated through all layers

## Flow Examples

### TTS Audio Generation

1. POST `/api/v1/tts` with `{ text, voice? }`
2. TTS controller validates input and computes cache hash
3. TTS service checks GCS for cached audio (via `GcsFileStore`)
4. If cache miss: calls Google TTS API → uploads to GCS
5. Returns public URL `{ audioUrl, cached }`

### Quiz Session Flow

1. POST `/api/v1/quiz/session/start` with `{ hskLevel?, count? }`
2. Quiz controller validates input
3. Quiz use-case selects due words, builds 10-question session, stores in Redis
4. POST `/api/v1/quiz/session/:sessionId/answer` with `{ questionId, answer }`
5. Quiz use-case checks correctness, updates spaced repetition, awards XP
6. If incorrect: calls Gemini API via `AiFeedbackService` for personalized explanation
7. Returns `{ correct, feedback?, xpEarned, nextReview? }`

### Word Examples Generation

1. POST `/api/v1/examples` with `{ word, hskLevel, language }`
2. Examples controller validates input
3. Examples service calls Gemini API to generate 3–5 contextual example sentences
4. Results cached via Redis (24-hour TTL)
5. Returns `{ word, examples: [{ sentence, pinyin, translation }] }`

## Error Handling

- All API requests are assigned a unique `requestId` (via `requestIdMiddleware` in `shared/middleware/`)
- Errors are handled by centralized `errorHandler` middleware (registered last)
- All error responses are structured as:
  ```json
  {
    "code": "ERROR_CODE",
    "message": "Error message",
    "requestId": "..."
  }
  ```
- Domain-specific errors created via `errorFactory.js` (`shared/utils/`):
  - `validationError()` - 400 Bad Request
  - `ttsError()` - TTS generation failures
  - `authError()` - Authentication failures
  - `notFoundError()` - Resource not found
- Request IDs logged at all layers for traceability
- Prisma errors (P2002, P2025) are mapped to proper HTTP status codes
- See `shared/middleware/errorHandler.js` and `shared/utils/errorFactory.js`

## Configuration

### Required Environment Variables

**Database & Auth:**

- `DATABASE_URL`: PostgreSQL connection string (Prisma)
- `JWT_SECRET`: JWT signing secret (min 32 chars)
- `JWT_REFRESH_SECRET`: Refresh token signing secret

**Google Cloud:**

- `GCS_BUCKET_NAME`: Google Cloud Storage bucket for caching
- `GOOGLE_TTS_CREDENTIALS_RAW`: Service account JSON for TTS
- `GEMINI_API_CREDENTIALS_RAW`: Service account JSON for Gemini API

**Redis (optional):**

- `REDIS_URL`: Redis connection string (cache degrades gracefully if absent)

**Optional:**

- `PORT`: Server port (default: 3001)
- `FRONTEND_URL`: CORS allowed origin (default: `http://localhost:5173`)
- `GEMINI_MODEL`: Model name (default: `models/gemini-3.1-flash-lite`)
- `ENABLE_DETAILED_LOGS`: Enable debug logging (`true`/`false`)

### Service Initialization

All services are initialized via the DI container in `src/app/container.js`:

```js
// container.js — composition root
import { CacheFactory } from "../shared/infrastructure/cache/CacheFactory.js";
import { config } from "../shared/config/index.js";

export const cacheService = await CacheFactory.create("default");
// ... 15 exported instances: repositories, services, infrastructure clients
const exists = await gcsService.fileExists(path); // Auto-initializes
```

### Cache Paths

Defined in `shared/config/index.js`:

- TTS: `tts/{hash}.mp3`
- AI Feedback: `ai_feedback/{wordId}/{hash}.json`

## Usage Examples

### Generate TTS Audio

```js
import { container } from "./app/container.js";
const ttsService = container.get("ttsService");
const audioBuffer = await ttsService.synthesizeSpeech("你好世界", {
  voice: "cmn-CN-Wavenet-B",
});
```

### Start Quiz Session

```js
import { container } from "./app/container.js";
const quizSessionService = container.get("quizSessionService");
const session = await quizSessionService.startSession({ userId: "user-123", hskLevel: 1 });
// Returns: { sessionId, questions: [...], totalQuestions: 10 }
```

### Get AI Feedback

```js
import { container } from "./app/container.js";
const aiFeedbackService = container.get("aiFeedbackService");
const feedback = await aiFeedbackService.getFeedback("user-123", "ma1", "ma3");
// Returns: { explanation, errorType, suggestion }
```
