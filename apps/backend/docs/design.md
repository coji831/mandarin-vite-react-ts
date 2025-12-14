# Local Backend Design

## Purpose

Provides a local Express server for development and testing, supporting:

- Text-to-Speech (TTS) generation via Google Cloud TTS
- AI-powered conversation generation via Google Gemini API
- Google Cloud Storage (GCS) caching for audio and conversation data

## Architecture

### Layer Structure

```
Routes → Controllers → Services → External APIs
  ↓         ↓            ↓
Endpoint  Validation   Business Logic
Mapping   Error Wrap   Cache/Generate
          Logging      API Calls
```

### Key Components

**Services** (`services/`):

- `gcsService.js` - Google Cloud Storage operations (upload, download, exists)
- `ttsService.js` - Google Cloud Text-to-Speech client
- `geminiService.js` - Google Gemini API client for text generation
- `conversationService.js` - High-level conversation text & audio orchestration

**Controllers** (`controllers/`):

- `ttsController.js` - TTS audio generation endpoints
- `conversationController.js` - Conversation text/audio generation (real mode)
- `scaffoldController.js` - Static fixture serving (scaffold mode)
- `healthController.js` - Health check endpoints

**Middleware** (`middleware/`):

- `asyncHandler.js` - Async route wrapper with logging and validation
- `errorHandler.js` - Centralized error handling with request ID propagation

**Configuration** (`config/`):

- `index.js` - Centralized config with environment variable validation

### Key Features

- **Modern Google APIs**: Uses latest `@google-cloud/*` libraries with async/await
- **Credential Management**: All credentials from environment variables (no hardcoded secrets)
- **Service Layer**: Business logic separated from Express for Vercel API portability
- **Caching Strategy**: Check cache → generate if miss → store → return URL
- **Mode Toggle**: `CONVERSATION_MODE=scaffold` for fixtures, `=real` for live APIs
- **Error Tracing**: Request IDs propagated through all layers

## Flow Examples

### TTS Audio Generation

1. POST `/api/get-tts-audio` with `{ text, voice? }`
2. Controller validates input and computes cache hash
3. Service checks GCS for cached audio
4. If cache miss: calls TTS API → uploads to GCS
5. Returns public URL `{ audioUrl, cached }`

### Conversation Text Generation

1. POST `/api/mandarin/conversation/text/generate` with `{ wordId, word }`
2. Controller validates input
3. Service checks GCS for cached conversation JSON
4. If cache miss:
   - Builds prompt using `promptUtils.createConversationPrompt(word)`
   - Calls Gemini API via `geminiService.generateText(prompt)`
   - Parses response into structured turns format
   - Uploads conversation JSON to GCS
5. Returns conversation object with turns

### Conversation Audio Generation

1. POST `/api/mandarin/conversation/audio/generate` with `{ wordId, voice? }`
2. Service retrieves conversation text from GCS (must exist)
3. Extracts Chinese text from turns
4. Checks GCS for cached audio
5. If cache miss: synthesizes speech via TTS → uploads to GCS
6. Returns `{ conversationId, audioUrl, cached }`

## Error Handling

- All API requests are assigned a unique `requestId` (via `requestIdMiddleware`)
- Errors are handled by centralized `errorHandler` middleware
- All error responses are structured as:
  ```json
  {
    "code": "ERROR_CODE",
    "message": "Error message",
    "requestId": "..."
  }
  ```
- Domain-specific errors created via `errorFactory.js`:
  - `validationError()` - 400 Bad Request
  - `ttsError()` - TTS generation failures
  - `convoTextError()` - Conversation text generation failures
  - `convoAudioError()` - Conversation audio generation failures
- Request IDs logged at all layers for traceability
- See `middleware/errorHandler.js` and `utils/errorFactory.js`

## Configuration

### Required Environment Variables

**Mode Selection:**

- `CONVERSATION_MODE`: `real` (live APIs) or `scaffold` (fixtures)

**Google Cloud (Real Mode Only):**

- `GCS_BUCKET_NAME`: Google Cloud Storage bucket for caching
- `GOOGLE_TTS_CREDENTIALS_RAW`: Service account JSON for TTS
- `GEMINI_API_CREDENTIALS_RAW`: Service account JSON for Gemini API
- `GCS_CREDENTIALS_RAW` (optional): Dedicated GCS service account (defaults to TTS credentials)

**Optional:**

- `PORT`: Server port (default: 3001)
- `GEMINI_MODEL`: Model name (default: `models/gemini-2.0-flash-lite`)
- `GEMINI_TEMPERATURE`: Sampling temperature (default: 0.7)
- `ENABLE_DETAILED_LOGS`: Enable debug logging (`true`/`false`)

### Service Initialization

Services use lazy initialization with optional explicit setup:

```js
// Optional explicit initialization in server.js
initializeGCS(config.gcsCredentials, config.gcsBucket);

// Or rely on lazy initialization on first use
const exists = await gcsService.fileExists(path); // Auto-initializes
```

### Cache Paths

Defined in `config/index.js`:

- TTS: `tts/{hash}.mp3`
- Conversation Text: `convo/{wordId}/{hash}.json`
- Conversation Audio: `convo/{wordId}/{hash}.mp3`

## Usage Examples

### Generate TTS Audio

```js
import * as ttsService from "./services/ttsService.js";
const audioBuffer = await ttsService.synthesizeSpeech("你好世界", {
  voice: "cmn-CN-Wavenet-B",
});
```

### Generate Conversation Text

```js
import * as conversationService from "./services/conversationService.js";
const conversation = await conversationService.generateConversationText("word-123", "你好");
// Returns: { id, wordId, word, turns: [{speaker, text}], ... }
```

### Generate Conversation Audio

```js
const audioMeta = await conversationService.generateConversationAudio(
  "word-123",
  "cmn-CN-Wavenet-B"
);
// Returns: { conversationId, audioUrl, cached, voice }
```
