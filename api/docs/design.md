# API Module Design

> **Migration Status:** Fully migrated from `local-backend` to Vercel serverless functions (December 2025).

## Purpose

Provides serverless functions for:

- Text-to-speech conversion using Google Cloud TTS
- Conversation generation using Gemini API
- GCS-based caching for both audio and text

## Architecture

### Folder Structure

```
api/
  ├─ tts.js                          # /api/tts endpoint handler
  ├─ conversation.js                 # /api/conversation endpoint handler
  ├─ _lib/                           # Shared code (not routable)
  │    ├─ config/
  │    │    └─ index.js             # Environment variable parsing
  │    ├─ controllers/
  │    │    ├─ ttsController.js     # TTS request handling
  │    │    └─ conversationController.js  # Conversation routing
  │    ├─ services/
  │    │    ├─ ttsService.js        # Google Cloud TTS client
  │    │    ├─ gcsService.js        # Google Cloud Storage operations
  │    │    ├─ geminiService.js     # Gemini API client
  │    │    └─ conversationService.js  # Conversation orchestration
  │    └─ utils/
  │         ├─ hashUtils.js         # Hash generation for caching
  │         ├─ errorFactory.js      # Standardized error creation
  │         ├─ logger.js            # Consistent logging
  │         ├─ conversationUtils.js # Response formatting
  │         └─ promptUtils.js       # Gemini prompt generation
  └─ docs/
       ├─ api-spec.md
       └─ design.md
```

### Design Principles

1. **Stateless Functions:** Each endpoint is a standalone Vercel serverless function
2. **Shared `_lib/` Folder:** All shared code in `_lib/` (not directly routable)
3. **Service Layer Pattern:** Controllers → Services → External APIs
4. **Lazy Client Initialization:** Google Cloud clients initialized once per cold start
5. **Inline Caching:** Simple GCS-based caching with explicit cache checks
6. **Consistent Error Handling:** Standardized error codes and metadata

## Key Features

### TTS Endpoint (`/api/tts`)

- Google Cloud Text-to-Speech API for high-quality Mandarin audio
- MD5-based caching in GCS (cache key: `tts/{hash}.mp3`)
- Voice selection support (default: `cmn-CN-Wavenet-B`)
- Input validation (1-15 words)

### Conversation Endpoint (`/api/conversation`)

**Text Generation (`type: "text"`):**

- Gemini API for natural conversation generation
- SHA256-based caching in GCS (cache key: `convo/{wordId}/{hash}.json`)
- Structured turn format (speaker, chinese, pinyin, english)
- Fallback conversation on parsing errors

**Audio Generation (`type: "audio"`):**

- Per-turn audio synthesis using TTS service
- Updates conversation JSON with audio URLs
- Requires conversation text to exist first

## Flow Diagrams

### TTS Flow

```
POST /api/tts { text, voice? }
  ↓
[ttsController] Validate input
  ↓
Generate hash: MD5(text + voice)
  ↓
Check GCS: tts/{hash}.mp3 exists?
  ↓ YES → Return cached URL
  ↓ NO
[ttsService] Call Google Cloud TTS
  ↓
[gcsService] Upload to GCS
  ↓
Return new URL + cached=false
```

### Conversation Text Flow

```
POST /api/conversation { type: "text", wordId, word }
  ↓
[conversationController] Route by type
  ↓
Generate hash: SHA256(wordId)
  ↓
Check GCS: convo/{wordId}/{hash}.json exists?
  ↓ YES → Return cached conversation
  ↓ NO
[promptUtils] Create Gemini prompt
  ↓
[geminiService] Call Gemini API
  ↓
Parse turns (A/B format)
  ↓
[gcsService] Upload JSON to GCS
  ↓
Return conversation object
```

### Conversation Audio Flow

```
POST /api/conversation { type: "audio", wordId, turnIndex, text }
  ↓
Load conversation JSON from GCS
  ↓
Check if turn already has audioUrl?
  ↓ YES → Return cached URL
  ↓ NO
Generate hash: SHA256(text)
  ↓
Check GCS: convo/{wordId}/{hash}-turn{N}-{hash}.mp3 exists?
  ↓ NO → [ttsService] Generate audio
  ↓
[gcsService] Upload audio to GCS
  ↓
Update conversation JSON with audioUrl
  ↓
Return audio metadata
```

## Error Handling

- **Validation Errors (400):** Missing/invalid input parameters
- **TTS Errors (500):** Google Cloud TTS API failures, billing issues
- **Conversation Errors (500):** Gemini API failures, parsing errors
- **GCS Errors (500):** Storage permission issues, upload failures

All errors include:

- `code`: Machine-readable error code
- `message`: Human-readable error message
- `metadata`: Additional context (e.g., field names, original error)

## Best Practices Implemented

✅ ES modules with `.js` extensions (required for Vercel)
✅ Error responses as plain JSON objects (not Error instances)
✅ Stateless serverless functions (no global Express app)
✅ Lazy client initialization (once per cold start)
✅ `_lib/` folder for shared code (prevents accidental routing)
✅ Consistent logging with prefixes
✅ Standardized error codes and metadata

## Migration from `local-backend`

### What Changed

1. **No Express Router:** Direct handler exports instead of `express.Router()`
2. **Unified Conversation Endpoint:** Single `/api/conversation` with `type` field
3. **No `asyncHandler` Middleware:** Error handling inline in controllers
4. **Import Paths:** `.js` extensions required
5. **No Health/Scaffold Endpoints:** Skipped in migration

### What Stayed the Same

1. **Service Layer Pattern:** Same separation of concerns
2. **Caching Strategy:** Same GCS-based caching logic
3. **Error Factory:** Same standardized error creation
4. **Logger Pattern:** Same consistent logging approach
5. **Business Logic:** Same TTS/Gemini/conversation logic
