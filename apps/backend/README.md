# Backend Server

Express server for Mandarin learning platform, providing TTS, AI conversation generation, vocabulary management, and progress tracking.

## Architecture

**Clean Architecture (Story 13-6)**: Separates concerns into layers for maintainability and future .NET migration.

```
apps/backend/src/
├── api/                    # HTTP layer (controllers, routes, middleware)
│   ├── controllers/       # HTTP request/response mapping
│   ├── routes/            # Route definitions with DI
│   ├── middleware/        # Auth, error handling, async wrapper
│   └── docs/              # OpenAPI 3.1 specification
├── core/                   # Business logic (framework-agnostic)
│   ├── services/          # Business logic services
│   ├── interfaces/        # Repository & service interfaces
│   └── domain/            # Domain models
├── infrastructure/         # External dependencies
│   ├── repositories/      # Data access (Prisma)
│   ├── external/          # API clients (Gemini, TTS, GCS)
│   ├── cache/             # Redis cache implementation
│   └── database/          # Database client
├── config/                # Configuration management
├── utils/                 # Shared utilities
└── index.js              # Application entry point
```

**Design Principles:**

- **Dependency Injection**: All controllers/services receive dependencies via constructor
- **Interface-Based**: Core layer depends on interfaces, not concrete implementations
- **Separation of Concerns**: No Prisma/Express in core/, no business logic in api/
- **OpenAPI First**: API documented with Swagger UI (`/api-docs`)

## Purpose

- **Development Environment**: Test and debug API functionality without deploying
- **Production Ready**: Deployed to Railway with PostgreSQL + Redis
- **Clean Architecture**: Prepared for .NET migration (Epic 14)
- **API Documentation**: Interactive Swagger UI for all endpoints

## Features

- ✅ **Clean Architecture**: Layered design (api/core/infrastructure)
- ✅ **OpenAPI 3.1**: Interactive Swagger UI at `/api-docs`
- ✅ **Vocabulary API**: Fetch lists/words from GCS, search/filter
- ✅ **Progress Tracking**: User progress with spaced repetition
- ✅ **Conversation Generation**: AI-powered dialogues via Gemini API
- ✅ **Text-to-Speech**: Google Cloud TTS with caching
- ✅ **Redis Caching**: Automatic caching for TTS and conversations
- ✅ **JWT Authentication**: Secure endpoints with access/refresh tokens
- ✅ **Error Tracing**: Request ID propagation for debugging

## Quick Start

```powershell
# Install dependencies
npm install

# Set up environment (see below)
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev  # Runs on http://localhost:3001

# Or start production mode
npm start
```

### API Documentation

- **Swagger UI**: http://localhost:3001/api-docs
- **OpenAPI JSON**: http://localhost:3001/api-docs.json
- **Route List**: View all routes at `/api-docs`

## Environment Variables

Set in `.env.local` (see `.env.local.example`):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mandarin

# Redis Cache
REDIS_URL=redis://localhost:6379
CACHE_ENABLED=true

# JWT Authentication
JWT_SECRET=your-secret-key-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Google Cloud Services
GCS_BUCKET_NAME=mandarin-vocab-data
GOOGLE_TTS_CREDENTIALS_RAW={"type":"service_account",...}
GEMINI_API_CREDENTIALS_RAW={"type":"service_account",...}
```

### Optional Configuration

````env
PORT=3001
NODE_ENV=development
GEMINI_MODEL=models/gemini-2.0-flash-lite
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=1000
CACHE_TTL_TTS=86400        # 24 hours
CACHE_TTL_CONVERSATION=3600  # 1 hour
ENABLE_DETAILED_LOGS=true
```

## Redis Caching

The backend uses **Railway Redis** for caching TTS and conversation responses to reduce API costs and improve performance.

```env
# Redis connection URL (Railway auto-injects in production)
# For local development, copy REDIS_URL from Railway dashboard → Redis Variables
REDIS_URL=redis://default:password@redis.railway.internal:6379

# Enable or disable caching
CACHE_ENABLED=true

# Cache TTL values (seconds)
CACHE_TTL_TTS=86400        # 24 hours for TTS audio
CACHE_TTL_CONVERSATION=3600  # 1 hour for conversation text
````

**Key Points:**

- **`REDIS_URL`**: Railway automatically injects this in production. For local dev, copy the value from Railway dashboard (Redis service → Variables tab).
- **`CACHE_ENABLED`**: Set to `false` to disable caching (server falls back to `NoOpCacheService`).
- **TTL Values**: Adjust based on content volatility. TTS audio rarely changes (24h), conversations may update more frequently (1h).
- **Namespace**: All keys prefixed with `mandarin:` to isolate from other Railway projects sharing the Redis instance.
- **Graceful Fallback**: If Redis is unavailable, server continues functioning without cache (all requests hit external APIs).

**Cache Metrics**: Visit `/api/health` to see cache hit/miss rates and verify Redis connection status.

**Full Documentation**: See [`docs/guides/redis-caching-guide.md`](../../docs/guides/redis-caching-guide.md) for setup, troubleshooting, and monitoring.

### Scaffold Mode

For development without API keys:

```env
CONVERSATION_MODE=scaffold
# No Google Cloud credentials required
```

## Project Structure

```
local-backend/
├── config/
│   └── index.js              # Centralized configuration
├── controllers/
│   ├── conversationController.js  # Conversation endpoints (real mode)
│   ├── ttsController.js          # TTS endpoints
│   ├── scaffoldController.js     # Fixture serving (scaffold mode)
│   └── healthController.js       # Health checks
├── services/
│   ├── conversationService.js    # Conversation orchestration
│   ├── geminiService.js          # Gemini API client
│   ├── ttsService.js             # Google Cloud TTS client
│   └── gcsService.js             # Google Cloud Storage client
├── middleware/
│   ├── asyncHandler.js           # Async route wrapper
│   └── errorHandler.js           # Centralized error handling
├── utils/
│   ├── conversationUtils.js      # Conversation helpers
│   ├── promptUtils.js            # Prompt generation
│   ├── hashUtils.js              # Cache key generation
│   ├── errorFactory.js           # Error creation
│   └── logger.js                 # Logging utility
├── routes/
│   └── index.js                  # Route aggregation
├── docs/
│   ├── design.md                 # Architecture documentation
│   ├── api-spec.md               # API endpoint specifications
│   └── conversation-scaffolder.md # Scaffold mode guide
└── server.js                     # Express app entry point
```

## API Endpoints

### TTS

- `POST /api/get-tts-audio` - Generate/retrieve TTS audio

### Conversation

- `POST /api/mandarin/conversation/text/generate` - Generate conversation text
- `POST /api/mandarin/conversation/audio/generate` - Generate conversation audio
- `GET /api/mandarin/conversation/health` - Health check

### General

- `GET /api/health` - Server health check

See [`docs/api-spec.md`](./docs/api-spec.md) for detailed API documentation.

## Development Workflow

### Scaffold Mode (No API Keys)

```powershell
# Start server
$env:CONVERSATION_MODE="scaffold"; npm run start-backend

# Test endpoints
curl http://localhost:3001/api/health
curl -X POST http://localhost:3001/api/mandarin/conversation/text/generate `
  -H "Content-Type: application/json" `
  -d '{"wordId": "word-123", "word": "你好"}'
```

Returns deterministic fixtures from `public/data/examples/conversations/`.

### Real Mode (Live APIs)

```powershell
# Set credentials in .env.local first
$env:CONVERSATION_MODE="real"; npm run start-backend

# Same endpoints hit live Google Cloud APIs
```

## Credential Setup

### PowerShell Helper

```powershell
# Convert service account JSON file to stringified format
$json = Get-Content -Raw path\to\service-account.json | ConvertFrom-Json | ConvertTo-Json -Compress
echo "GOOGLE_TTS_CREDENTIALS_RAW=$json" | Out-File -Append .env.local -Encoding utf8
```

### Required Google Cloud Roles

**TTS Service Account:**

- Cloud Text-to-Speech API User
- Storage Object Creator
- Storage Object Viewer

**Gemini Service Account:**

- Vertex AI User (or appropriate Gemini API role)

**GCS Service Account (optional):**

- Storage Object Creator
- Storage Object Viewer

## Testing

```powershell
# Run tests
npm test

# Run specific test file
npm test -- errorHandler.test.js
```

## Troubleshooting

### "GCS credentials not found"

- Ensure `GOOGLE_TTS_CREDENTIALS_RAW` is set and valid JSON
- Or set `GCS_CREDENTIALS_RAW` with dedicated GCS service account

### "Gemini API failed: 403"

- Check `GEMINI_API_CREDENTIALS_RAW` service account has correct roles
- Verify Gemini API is enabled in Google Cloud project

### "Conversation not found"

- Generate conversation text before requesting audio
- Check `wordId` matches between text and audio requests

### Scaffold mode not working

- Verify `CONVERSATION_MODE=scaffold` in environment
- Check fixture files exist in `public/data/examples/conversations/`

## Documentation

- **Architecture**: [`docs/design.md`](./docs/design.md)
- **API Specification**: [`docs/api-spec.md`](./docs/api-spec.md)
- **Scaffold Mode**: [`docs/conversation-scaffolder.md`](./docs/conversation-scaffolder.md)
- **Project Documentation**: [`../docs/issue-implementation/`](../docs/issue-implementation/)

## Migration to Vercel

Services are designed for portability:

1. **Services** (`services/*`) - Pure functions, no Express coupling
2. **Business Logic** - Fully contained in service layer
3. **Configuration** - Environment variable based
4. **Caching** - GCS operations abstracted in `gcsService.js`

To migrate endpoint to Vercel API:

```js
// api/conversation-text.js
import * as conversationService from "../local-backend/services/conversationService.js";
export default async function handler(req, res) {
  const { wordId, word } = req.body;
  const result = await conversationService.generateConversationText(wordId, word);
  res.json(result);
}
```
