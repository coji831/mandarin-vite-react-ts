# Backend Server

Express server for Mandarin learning platform, providing TTS, vocabulary management, progress tracking, quiz sessions, and gamification.

> **For detailed setup, architecture, environment variables, and troubleshooting:** See [Backend Development Guide](../../docs/guides/setup/backend-development.md).

## Quick Start

```powershell
# Install dependencies (from project root)
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with required credentials

# Start development server
npm run dev  # Runs on http://localhost:3001

# Or start production mode
npm start
```

### API Documentation

- **Swagger UI**: http://localhost:3001/api-docs
- **OpenAPI JSON**: http://localhost:3001/api-docs.json

## Development Commands

| Command                  | Description                      |
| ------------------------ | -------------------------------- |
| `npm run dev`            | Start dev server with hot reload |
| `npm start`              | Start production mode            |
| `npm run start-backend`  | Start backend only (standalone)  |
| `npm test`               | Run tests                        |
| `npx prisma studio`      | Open Prisma Studio (DB UI)       |
| `npx prisma migrate dev` | Apply database migrations        |

## API Endpoints

| Endpoint                          | Description                      |
| --------------------------------- | -------------------------------- |
| `GET /api/health`                 | Server health check              |
| `POST /api/v1/auth/*`             | Authentication (login, register) |
| `GET/POST /api/v1/progress/*`     | Progress tracking                |
| `GET/POST /api/v1/quiz/session/*` | Quiz sessions                    |
| `GET/POST /api/v1/learning/*`     | Learning endpoints               |
| `POST /api/v1/quiz/feedback`      | AI feedback                      |
| `GET /api/v1/gamification/*`      | Streaks, badges, XP              |
| `GET /api/v1/vocabulary/*`        | Vocabulary lists                 |
| `GET /api/v1/words/*`             | Word data                        |
| `POST /api/v1/examples/*`         | Word examples                    |
| `POST /api/v1/tts/*`              | TTS audio                        |
| `GET /api/v1/word/*`              | Word lookup                      |

> **Full specification:** See [`docs/api-spec.md`](./docs/api-spec.md) for complete request/response schemas and error handling.

## References

- [Backend Development Guide](../../docs/guides/setup/backend-development.md) — Setup, architecture, conventions
- [Environment Setup Guide](../../docs/guides/getting-started/environment-setup.md) — All environment variables
- [Caching Patterns Guide](../../docs/guides/operations/caching-patterns.md) — Redis caching details
- [Backend API Spec](./docs/api-spec.md) — Complete endpoint reference
- [Backend Design Doc](./docs/design.md) — Architecture decisions and design rationale
- [Database Setup](../../docs/guides/setup/database.md) — PostgreSQL/Prisma configuration

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

## Documentation

- **Architecture**: [`docs/design.md`](./docs/design.md)
- **API Specification**: [`docs/api-spec.md`](./docs/api-spec.md)
- **Project Documentation**: [`../../docs/issue-implementation/`](../../docs/issue-implementation/)
