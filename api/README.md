# API Directory

Vercel serverless functions for the application. All endpoints refactored to match local-backend service layer patterns for consistency and maintainability.

## Architecture

All API endpoints follow the same clean pattern as `local-backend`:

- Service-oriented functions (no Express coupling)
- Inline caching (simple and readable)
- Consistent error handling
- Modern async/await patterns
- Latest Google Cloud libraries

## API Endpoints

### TTS

**POST /api/get-tts-audio**

- Generates or retrieves cached TTS audio for Mandarin text
- Request: `{ text: string, voice?: string }`
- Response: `{ audioUrl: string, cached: boolean }`
- Uses Google Cloud TTS + GCS caching

### Conversation

**POST /api/mandarin/conversation/text/generate**

- Generates conversation text using Gemini API
- Request: `{ wordId: string, word: string, generatorVersion?: string }`
- Response: Conversation object with turns
- Uses Gemini API + GCS caching

**POST /api/mandarin/conversation/audio/generate**

- Generates audio for existing conversation
- Request: `{ wordId: string, voice?: string }`
- Response: `{ conversationId: string, audioUrl: string, cached: boolean }`
- Requires conversation text to exist first

## Configuration

Required environment variables (set in Vercel):

**For TTS + Conversation Audio:**

- `GOOGLE_TTS_CREDENTIALS_RAW`: Google service account JSON (stringified)
- `GCS_BUCKET_NAME`: Google Cloud Storage bucket name

**For Conversation Text:**

- `GEMINI_API_CREDENTIALS_RAW`: Gemini API service account JSON (stringified)
- `GCS_BUCKET_NAME`: Google Cloud Storage bucket name

**Optional:**

- `GEMINI_MODEL`: Model name (default: `models/gemini-2.0-flash-lite`)

## Service Patterns

All endpoints use shared patterns:

```javascript
// Initialize clients (once per cold start)
function initializeClients() {
  if (client) return;
  const credentials = JSON.parse(process.env.CREDENTIALS_RAW);
  client = new GoogleCloudClient({ credentials });
}

// Inline caching (simple and readable)
const exists = await fileExists(cachePath);
if (exists) {
  return cached;
}
const generated = await generate();
await uploadFile(cachePath, generated, contentType);
return generated;
```

## Related Documentation

- Local Backend: [`../local-backend/README.md`](../local-backend/README.md)
- API Specs: [`../local-backend/docs/api-spec.md`](../local-backend/docs/api-spec.md)
- Implementation: [`../docs/issue-implementation/`](../docs/issue-implementation/)
