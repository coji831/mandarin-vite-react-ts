# API Directory

Vercel serverless functions for the application. Migrated from `local-backend` with full service layer patterns for consistency and maintainability.

## Architecture

All API endpoints follow serverless best practices:

- **Stateless handlers**: Each endpoint is a standalone Vercel function
- **Shared `_lib/` folder**: Controllers, services, utils, config (not directly routable)
- **Service-oriented**: Clean separation of concerns (no Express coupling)
- **Inline caching**: GCS-based caching with simple, readable patterns
- **Consistent error handling**: Standardized error responses
- **Modern async/await**: Latest Google Cloud libraries

## Folder Structure

```
api/
  ├─ tts.js                          # /api/tts endpoint
  ├─ conversation.js                 # /api/conversation endpoint
  ├─ _lib/                           # Shared code (not routable)
  │    ├─ config/
  │    ├─ controllers/
  │    ├─ middleware/
  │    ├─ services/
  │    ├─ utils/
  ├─ docs/
  └─ README.md
```

## API Endpoints

### TTS

**POST /api/tts**

- Generates or retrieves cached TTS audio for Mandarin text
- Request: `{ text: string, voice?: string }`
- Response: `{ audioUrl: string, cached: boolean }`
- Uses Google Cloud TTS + GCS caching

### Conversation

**POST /api/conversation**

Unified endpoint for conversation text and audio generation.

**Text Generation:**

- Request: `{ type: "text", wordId: string, word: string, generatorVersion?: string }`
- Response: Conversation object with turns
- Uses Gemini API + GCS caching

**Audio Generation:**

- Request: `{ type: "audio", wordId: string, turnIndex: number, text: string, voice?: string }`
- Response: `{ conversationId: string, turnIndex: number, audioUrl: string, cached: boolean }`
- Requires conversation text to exist first

## Configuration

Required environment variables (set in Vercel):

**For TTS + Conversation Audio:**

- `GOOGLE_TTS_CREDENTIALS_RAW`: Google service account JSON (stringified)
- `GCS_CREDENTIALS_RAW` or `GOOGLE_TTS_CREDENTIALS_RAW`: GCS service account JSON
- `GCS_BUCKET_NAME`: Google Cloud Storage bucket name

**For Conversation Text (Gemini API):**

- `GEMINI_API_CREDENTIALS_RAW`: Gemini API service account JSON (stringified)
- `GCS_BUCKET_NAME`: Google Cloud Storage bucket name

**Optional:**

- `GEMINI_MODEL`: Model name (default: `models/gemini-2.0-flash-lite`)
- `GEMINI_ENDPOINT`: API endpoint (default: `https://generativelanguage.googleapis.com/v1beta`)
- `GEMINI_MAX_TOKENS`: Max output tokens (default: `1000`)
- `GEMINI_TEMPERATURE`: Sampling temperature (default: `0.7`)

## Service Patterns

All endpoints use shared patterns from `_lib/`:

**Controllers:** Handle request validation, error responses
**Services:** Business logic (TTS, Gemini, GCS operations)
**Utils:** Hashing, logging, error factories, prompts
**Config:** Centralized environment variable parsing

```javascript
// Example: Inline caching pattern
const exists = await gcsService.fileExists(cachePath);
if (exists) {
  logger.info(`Cache hit: ${cachePath}`);
  return cached;
}
logger.info(`Cache miss: ${cachePath}`);
const generated = await generate();
await gcsService.uploadFile(cachePath, generated, contentType);
return generated;
```

## Migration Status

✅ **Completed:**

- `/tts` endpoint (from `local-backend/controllers/ttsController.js`)
- `/conversation` endpoint (from `local-backend/controllers/conversationController.js`)
- All services: `ttsService`, `gcsService`, `geminiService`, `conversationService`
- All utils: `hashUtils`, `errorFactory`, `logger`, `conversationUtils`, `promptUtils`
- Configuration with environment variable parsing

❌ **Skipped (as per plan):**

- Health check endpoint
- Scaffold endpoint
- Testing files

## Best Practices Implemented

✅ ES modules with `.js` extensions in all imports
✅ Error responses as plain JSON objects (not Error instances)
✅ Stateless serverless functions (no global Express app)
✅ Lazy client initialization (once per cold start)
✅ `_lib/` folder for shared code (prevents accidental routing)
✅ Consistent logging with prefixes
✅ Standardized error codes and metadata

## Related Documentation

- Local Backend: [`../local-backend/README.md`](../local-backend/README.md)
- API Specs: [`./docs/api-spec.md`](./docs/api-spec.md)
- Implementation: [`../docs/issue-implementation/`](../docs/issue-implementation/)
