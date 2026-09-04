---
purpose: "Backend modulith architecture — modules, shared infrastructure, layer responsibilities"
status: active
last-verified: 2026-08-23
covers: auth, characters, chengyu, foundations, grammar, health, mnemonics, phonetic-clusters, progression, quiz, radicals, readers, review, audio, words
type: architecture
---

# Backend Design

**Last Updated:** August 23, 2026

## Purpose

Provides a NestJS 11 (Express platform adapter) server for development and production, supporting:

- Text-to-Speech (TTS) generation via Google Cloud TTS
- Quiz sessions and spaced repetition
- User authentication with JWT refresh token rotation
- AI-powered feedback for incorrect quiz answers via Gemini API
- Google Cloud Storage (GCS) caching for audio data

## Architecture

### Modular Monolith Structure

All source files are TypeScript (`.ts`). The `.js` extension in import paths refers to compiled output (Node.js ESM requires file extensions in imports).

```
src/
├── nest/                         ← NestJS 11 shell (Express platform adapter)
│   ├── main.ts                   ← NestJS production entry point (node dist/nest/main.js)
│   ├── app.module.ts             ← Root module — wires feature modules + shared infra
│   └── configure-app.ts          ← Express-adapter config: /api prefix, CORS, body parsers, swagger, error bridge
├── modules/                      ← Business modules (Nest controller + module under each <name>/nest/)
│   ├── auth/                     ← Simple CRUD (login, register, refresh)
│   ├── characters/               ← Read-only character detail, phonetic, homophones, search, frequency APIs
│   ├── chengyu/                  ← Read-only idiom reference: search + detail (Prisma)
│   ├── foundations/              ← Simple CRUD (pinyin, tones, strokes)
│   ├── grammar/                  ← Read-only grammar pattern reference: search + detail (Prisma)
│   ├── health/                   ← Simple (health check)
│   ├── mnemonics/                ← AI mnemonic generation (Gemini)
│   ├── phonetic-clusters/        ← DB-driven phonetic cluster browser
│   ├── progression/              ← Clean Architecture (learner progression)
│   ├── quiz/                     ← Clean Architecture (strategies/, services/, repositories/)
│   ├── radicals/                 ← Simple CRUD (radical data)
│   ├── readers/                  ← Graded readers: passages, sessions, bookmarks, audio
│   ├── review/                   ← Clean Architecture (SRS review)
│   ├── audio/                    ← Audio (TTS) capability: exists-or-synthesize, Redis path index → GCS → Google TTS
│   └── words/                    ← Word + measure-word data APIs
└── shared/
    ├── config/index.ts           ← Centralized env config with validation
    ├── infrastructure/
    │   ├── cache/                ← CacheService + CacheFactory
    │   ├── database/client.ts    ← Prisma client singleton
    │   ├── external/             ← GCSClient, GeminiClient, GoogleTTSClient, GeminiService (T1)
    │   ├── redis/                ← RedisClient + RedisLockManager
    │   ├── security/             ← JwtService, PasswordService, HmacManager
    │   └── storage/              ← GcsFileStore + StorageFactory
    ├── middleware/               ← asyncHandler, authMiddleware, cacheMiddleware, errorHandler
    └── utils/                    ← logger, errorFactory, hashUtils, dateUtils
```

### Layer Responsibilities

| Layer                  | Responsibility                        | Location                                    |
| ---------------------- | ------------------------------------- | ------------------------------------------- |
| **API (Controller)**   | Parse request, call service, respond  | `modules/<name>/nest/`                      |
| **Service / Use-Case** | Business logic, orchestration         | `modules/<name>/services/` or `strategies/` |
| **Repository**         | Data access (via Prisma)              | `modules/<name>/repositories/`              |
| **Infrastructure**     | External APIs, cache, database client | `shared/infrastructure/`                    |

### Key Components

**Modules** (`modules/`):

- Each module self-contains its own `nest/` (Nest controllers + module), `services/` (business logic), `repositories/` (data access), and `__tests__/`
- Modules expose public API via `index.ts` — only services, never internal files
- Quiz module is the largest, with dedicated `strategies/` directory for Clean Architecture

**Shared Infrastructure** (`shared/infrastructure/`):

- `external/GoogleTTSClient.ts` - Google Cloud Text-to-Speech client
- `external/GeminiClient.ts` - Google Gemini API client for AI feedback & examples
- `external/GCSClient.ts` - Google Cloud Storage operations
- `cache/CacheService.ts` - Redis-backed caching with fail-open behavior
- `redis/RedisClient.ts` - Redis connection management
- `redis/RedisLockManager.ts` - Distributed lock for single-flight cache patterns
- `security/JwtService.ts` - JWT creation and verification
- `security/PasswordService.ts` - bcrypt password hashing
- `security/HmacManager.ts` - HMAC signing for cache integrity
- `storage/GcsFileStore.ts` - GCS file operations abstraction
- `storage/StorageFactory.ts` - Per-module GCS storage instance factory

**Middleware** (`shared/middleware/`):

- `asyncHandler.ts` - Async route wrapper with logging and validation
- `authMiddleware.ts` - JWT verification from cookies/headers
- `cacheMiddleware.ts` - Route-level caching
- `errorHandler.ts` - Centralized error handling with request ID propagation

**Configuration** (`shared/config/`):

- `index.ts` - Centralized config with environment variable validation

### Key Features

- **Modular Monolith**: 15 self-contained modules, each owning its domain
- **Dependency Injection**: NestJS `@Module` DI — feature modules declare their controllers/providers and import shared infrastructure via `SharedModule`/`DatabaseModule`; services receive dependencies via constructor injection
- **Fail-Open Caching**: Redis failures degrade gracefully to live API calls
- **Repository Pattern**: All database access through repositories (abstracts Prisma)
- **Error Tracing**: Request IDs propagated through all layers

## Flow Examples

### TTS Audio Generation

1. POST `/api/v1/tts` with `{ text, voice? }`
2. TTS controller validates input and computes cache hash
3. TTS service checks GCS for cached audio (via `GcsFileStore`)
4. If cache miss: calls Google TTS API → uploads to GCS
5. Returns a short-lived signed GCS URL (1h TTL) `{ audioUrl, cached }`

### Quiz Flow

Quiz endpoints now use the strategy-based `QuizAttempt` system (see `apps/backend/src/modules/quiz/`). Each quiz mode (multiple choice, pinyin typing, etc.) is implemented as a pluggable strategy, decoupling question generation from answer evaluation.

Key differences from the legacy session-based system:

- Questions are evaluated immediately via the active strategy
- Spaced repetition updates are handled by the `Review` module
- No Redis-backed session storage; state is managed per-attempt

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
- Domain-specific errors created via `errorFactory.ts` (`shared/utils/`):
  - `validationError()` - 400 Bad Request
  - `ttsError()` - TTS generation failures
  - `authError()` - Authentication failures
  - `notFoundError()` - Resource not found
- Request IDs logged at all layers for traceability
- Prisma errors (P2002, P2025) are mapped to proper HTTP status codes
- See `shared/middleware/errorHandler.ts` and `shared/utils/errorFactory.ts`

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

Services are bootstrapped by the NestJS 11 shell in `src/nest/` — there is no
hand-rolled `container.ts` composition root:

- `src/nest/main.ts` — production entry (`node dist/nest/main.js`): runs
  `validateConfig()`, then `NestFactory.create(AppModule, { bodyParser: false })`
- `src/nest/app.module.ts` — root module: wires the 15 feature modules plus
  `SharedModule` (which imports `DatabaseModule`) and `GuardsModule` (auth
  guards); registers the global `AppExceptionFilter` via `APP_FILTER`
- `src/nest/configure-app.ts` — Express-adapter config: `/api` prefix, CORS
  allowlist, body parsers, requestId middleware, per-route rate limiters,
  swagger (`/api-docs`)
- `src/nest/exception.filter.ts` — `mountExpressErrorBridge` installs the
  `{ code, message, requestId }` error envelope last

```ts
// src/nest/main.ts — NestJS composition
const app = await NestFactory.create(AppModule, { bodyParser: false });
configureNestShellApp(app); // /api prefix, CORS, body parsers, requestId, rate limits, swagger
mountExpressErrorBridge(app); // Express error bridge → {code, message, requestId} envelope
await app.listen(config.port, "0.0.0.0");
```

### Cache Paths

Defined in `shared/config/index.ts`. Cache layer with Redis for general caching and GCS for file storage.

## Usage Examples

In the Nest shell there is no manual composition root (`container.ts`) —
services are providers declared by their module and injected via constructor DI.

### Generate TTS Audio

`AudioModule` (`modules/audio/nest/audio.module.ts`) provides `AudioService`
(constructor-injected with `CacheService` + `GCSClient` + `GoogleTTSClient`)
and exports it for cross-module DI (e.g. `HealthModule`):

```typescript
// AudioNestController — POST /v1/tts (@UseGuards(OptionalAuthGuard), @HttpCode(200))
const { text, voice } = body ?? {}; // voice defaults via audioConfig.voiceDefault
return this.audioService.getTtsUrl(text, voice); // { audioUrl, cached }
```

### Submit Quiz Attempt

`QuizModule` provides `QuizService` (constructor-injected with `QuizRepository`

- `ProgressionService` via `forwardRef`), consumed by `QuizNestController`:

```typescript
// QuizNestController — POST /v1/quiz/attempts/:id/answers
const answer = await this.quizService.submitAnswer(id, body);
// Registered user → persisted; guest → session-local mock answer
```

### Get AI Feedback

The AI-feedback handler (formerly Express `api/aiFeedbackRoutes.ts`) now lives
on `QuizNestController` (`POST /v1/quiz/feedback`, `@UseGuards(RequireAuthGuard)`),
which injects `GeminiService` (provided by `SharedModule`):

```typescript
const prompt = buildFeedbackPrompt({ wordId, userAnswer, correctAnswer, questionType });
const explanation = await this.geminiService.generateText(prompt, { timeout: 5000 });
// Returns: { explanation, errorType: "ai_feedback" }
```
