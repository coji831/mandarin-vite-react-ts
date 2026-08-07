# Backend Server

Express server for PinyinPal, providing TTS, content data (characters/words/radicals/grammar), progression, quiz, review, mnemonics, and graded readers.

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

| Command                  | Description                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `npm run dev`            | Start dev server with hot reload                                                              |
| `npm start`              | Start production mode                                                                         |
| `npm run dev:backend`    | Backend-only dev (root script — run from project root; inside apps/backend use `npm run dev`) |
| `npm test`               | Run tests (changed scope)                                                                     |
| `npx prisma studio`      | Open Prisma Studio (DB UI)                                                                    |
| `npx prisma migrate dev` | Apply database migrations                                                                     |

> **Selected commands** — see [`apps/backend/package.json`](./package.json) for the full set (~50 scripts).

## API Endpoints

| Endpoint                                                                   | Description                                                                             |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `GET /api/v1/health`                                                       | Server health check                                                                     |
| `POST /api/v1/auth/*`                                                      | Authentication (register, login, refresh, logout)                                       |
| `GET /api/v1/progression/foundation-progress(/:sectionId)`                 | Foundation progress                                                                     |
| `GET /api/v1/progression/phase-gate`                                       | Phase gate status                                                                       |
| `GET /api/v1/progression/gates`                                            | Phase gates                                                                             |
| `GET /api/v1/progression/radical-progress(/:radicalId)`                    | Radical progress                                                                        |
| `POST /api/v1/quiz/attempts`                                               | Create quiz attempt                                                                     |
| `POST /api/v1/quiz/attempts/:id/answers`                                   | Submit answer for a quiz attempt                                                        |
| `PUT /api/v1/quiz/attempts/:id/complete`                                   | Complete a quiz attempt                                                                 |
| `GET /api/v1/quiz/attempts`                                                | List quiz attempts                                                                      |
| `GET /api/v1/quiz/config`                                                  | Quiz configuration                                                                      |
| `GET /api/v1/quiz/questions`                                               | Quiz questions                                                                          |
| `GET /api/v1/quiz/sandhi-drill/questions`                                  | Sandhi drill questions                                                                  |
| `POST /api/v1/quiz/feedback`                                               | AI feedback                                                                             |
| `GET /api/v1/review/items`                                                 | Review items (SRS due cards)                                                            |
| `POST /api/v1/review/result`                                               | Review result submission                                                                |
| `GET /api/v1/review/due-count`                                             | Review due count                                                                        |
| `GET /api/v1/foundations/data/{pinyin-tones,pinyin-character-map,strokes}` | Foundations reference data                                                              |
| `GET /api/v1/characters/:glyph`                                            | Character detail                                                                        |
| `GET /api/v1/characters/:glyph/{phonetic,homophones,decomposition}`        | Character phonetic / homophones / decomposition                                         |
| `GET /api/v1/characters/search`                                            | Character search                                                                        |
| `GET /api/v1/characters/frequency`                                         | Character frequency                                                                     |
| `GET /api/v1/pinyin/search`                                                | Pinyin search                                                                           |
| `GET /api/v1/phonetic-clusters(/:id)`                                      | Phonetic cluster families                                                               |
| `GET /api/v1/radicals(/:id)`                                               | Radical data                                                                            |
| `GET /api/v1/radicals/:radicalId/characters`                               | Characters associated with a radical                                                    |
| `GET /api/v1/words/:glyph`                                                 | Word data                                                                               |
| `GET /api/v1/words/:glyph/measure-words`                                   | Measure words (量词)                                                                    |
| `GET /api/v1/mnemonics(/:glyph)`                                           | Mnemonic stories                                                                        |
| `GET /v1/grammar/patterns`                                                 | Grammar pattern list (additive `search`/`hskLevel`/`phase` filters + `page`/`pageSize`) |
| `GET /v1/grammar/patterns/:id`                                             | Grammar pattern detail by `content_id` (`gr_XXXX`)                                      |
| `GET /api/v1/readers/passages`                                             | Reading passages                                                                        |
| `GET /api/v1/readers/passages/:id`                                         | Full passage (segmentation + HSK profile)                                               |
| `POST /api/v1/readers/passages/:id/audio`                                  | Passage sentence audio URLs (GCS → on-demand TTS)                                       |
| `POST /api/v1/readers/generate`                                            | Generate passage                                                                        |
| `GET /api/v1/readers/sessions/:passageId`                                  | Get or create reading session                                                           |
| `PUT /api/v1/readers/sessions/:passageId`                                  | Update reading position                                                                 |
| `POST /api/v1/readers/sessions/:passageId/complete`                        | Mark passage completed                                                                  |
| `GET /api/v1/readers/bookmarks`                                            | Reading bookmarks                                                                       |
| `POST /api/v1/readers/bookmarks`                                           | Add reading bookmark                                                                    |
| `GET /api/v1/readers/bookmarks/by-passage/:passageId`                      | Check if passage is bookmarked                                                          |
| `DELETE /api/v1/readers/bookmarks/by-passage/:passageId`                   | Remove bookmark by passage                                                              |
| `POST /api/v1/tts`                                                         | TTS audio (returns `audioUrl` — signed GCS URL, ~1h TTL — plus `cached` flag)           |

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
npm test -- errorHandler.test.ts
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
