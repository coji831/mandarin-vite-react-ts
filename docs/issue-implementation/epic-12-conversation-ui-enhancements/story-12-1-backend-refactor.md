# Implementation 12-1: Backend Refactor for Modern Google API and Vercel Compatibility

**Epic:** [epic-12-conversation-ui-enhancements](../../business-requirements/epic-12-conversation-ui-enhancements/README.md)
**Story:** [story-12-1-backend-refactor](../../business-requirements/epic-12-conversation-ui-enhancements/story-12-1-backend-refactor.md)
**Status:** Completed
**Last Update:** 2025-11-16

## Technical Scope

Refactored `local-backend/` to implement clean service layer architecture:

**Services Created:**

- `services/gcsService.js` - Google Cloud Storage operations
- `services/ttsService.js` - Google Cloud Text-to-Speech client
- `services/geminiService.js` - Google Gemini API client
- `services/conversationService.js` - High-level conversation orchestration

**Controllers Refactored:**

- `controllers/ttsController.js` - TTS audio generation
- `controllers/conversationController.js` - Conversation text/audio endpoints
- `controllers/scaffoldController.js` - Fixture serving
- `controllers/healthController.js` - Health checks

**Infrastructure:**

- `config/index.js` - Centralized configuration with environment variable validation
- `middleware/asyncHandler.js` - Async route wrapper with logging
- `middleware/errorHandler.js` - Request ID propagation
- `utils/errorFactory.js` - Standardized error creation
- `utils/logger.js` - Consistent logging utility
- `utils/promptUtils.js` - Prompt generation
- `utils/hashUtils.js` - Cache key generation
- `utils/conversationUtils.js` - Conversation helpers

**Removed:**

- `utils/cacheWrapper.js` - Over-engineered abstraction eliminated

## Implementation Details

### Service Layer Pattern

```javascript
// gcsService.js - Pure functions, no Express coupling
export async function uploadFile(filePath, buffer, contentType) {
  const file = getGCSFile(filePath);
  await file.save(buffer, { contentType });
}

export async function fileExists(filePath) {
  const file = getGCSFile(filePath);
  const [exists] = await file.exists();
  return exists;
}

export function getPublicUrl(filePath) {
  const bucket = getBucketName();
  return `https://storage.googleapis.com/${bucket}/${filePath}`;
}
```

### Inline Caching (Removed Wrapper)

```javascript
// conversationService.js - Simple, readable caching
export async function generateConversationText(wordId, word) {
  const hash = computeConversationTextHash(wordId);
  const cachePath = config.cachePaths.conversationText
    .replace("{wordId}", wordId)
    .replace("{hash}", hash);

  // Check cache first
  const exists = await gcsService.fileExists(cachePath);
  if (exists) {
    logger.info(`Cache hit: ${cachePath}`);
    const buffer = await gcsService.downloadFile(cachePath);
    return JSON.parse(buffer.toString());
  }

  // Cache miss - generate
  logger.info(`Cache miss: ${cachePath}`);
  const prompt = createConversationPrompt(word);
  const rawText = await geminiService.generateText(prompt, config.gemini);
  const turns = parseConversationText(rawText);

  const conversation = {
    id: `${wordId}-${hash}`,
    wordId,
    word,
    turns,
    generatedAt: new Date().toISOString(),
  };

  // Save to cache
  const buffer = Buffer.from(JSON.stringify(conversation));
  await gcsService.uploadFile(cachePath, buffer, "application/json");

  return conversation;
}
```

### Modern Google API Usage

```javascript
// geminiService.js - google-auth-library with JWT
import { JWT } from "google-auth-library";

const jwtClient = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ["https://www.googleapis.com/auth/generative-language"],
});

const accessToken = await jwtClient.getAccessToken();
```

```javascript
// ttsService.js - @google-cloud/text-to-speech
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

const ttsClient = new TextToSpeechClient({
  credentials: ttsCredentials,
  projectId: ttsCredentials.project_id,
});

const [response] = await ttsClient.synthesizeSpeech(request);
return response.audioContent;
```

```javascript
// gcsService.js - @google-cloud/storage
import { Storage } from "@google-cloud/storage";

const storageClient = new Storage({
  credentials: credentials,
  projectId: credentials.project_id,
});

const file = storageClient.bucket(bucket).file(filePath);
await file.save(buffer, { contentType });
```

### Centralized Configuration

```javascript
// config/index.js - Environment variable validation
function parseJsonEnv(envVar, required = false) {
  const value = process.env[envVar];
  if (!value && required) {
    throw new Error(`${envVar} is required but not set`);
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`${envVar} contains invalid JSON`);
  }
}

export const config = {
  conversationMode: process.env.CONVERSATION_MODE || "scaffold",
  googleTtsCredentials: parseJsonEnv("GOOGLE_TTS_CREDENTIALS_RAW"),
  geminiCredentials: parseJsonEnv("GEMINI_API_CREDENTIALS_RAW"),
  gcsCredentials: parseJsonEnv("GCS_CREDENTIALS_RAW") || parseJsonEnv("GOOGLE_TTS_CREDENTIALS_RAW"),
  gcsBucket: process.env.GCS_BUCKET_NAME,
  // ... other config
};

// Validation for real mode
if (config.conversationMode === "real") {
  if (!config.gcsBucket) throw new Error("GCS_BUCKET_NAME required");
  if (!config.googleTtsCredentials) throw new Error("GOOGLE_TTS_CREDENTIALS_RAW required");
  if (!config.geminiCredentials) throw new Error("GEMINI_API_CREDENTIALS_RAW required");
}
```

## Architecture Integration

```
Client Request
     ↓
Express Routes (routes/index.js)
     ↓
Controllers (ttsController, conversationController)
     ↓ validation, error wrapping
Services (conversationService, ttsService, geminiService, gcsService)
     ↓ business logic, caching
External APIs (Google Cloud TTS, Gemini, GCS)
```

**Key Integration Points:**

- Controllers use `asyncHandler` for consistent error handling
- Services are imported as modules, no singleton dependencies
- Configuration accessed via `config` import
- All errors flow through `errorHandler` middleware with request IDs

**Vercel Compatibility:**

```javascript
// Future Vercel API endpoint can directly use services
import * as conversationService from "../local-backend/services/conversationService.js";

export default async function handler(req, res) {
  const { wordId, word } = req.body;
  const result = await conversationService.generateConversationText(wordId, word);
  res.json(result);
}
```

## Technical Challenges & Solutions

**Challenge 1: Over-engineered cacheWrapper abstraction**

```javascript
// Problem: Callback-based wrapper made code hard to read
const result = await cacheOrGenerate(
  cachePath,
  async () => { /* business logic buried here */ },
  { logPrefix: "...", parseResponse: ..., contentType: ... }
);

// Solution: Inline caching with clear linear flow
const exists = await gcsService.fileExists(cachePath);
if (exists) return cached;
const generated = await generate();
await gcsService.uploadFile(cachePath, generated, contentType);
return generated;
```

**Challenge 2: GCS permission errors with wrong credentials**

```javascript
// Problem: Used Gemini credentials for GCS operations
// Error: "gemini-service does not have storage.objects.delete access"

// Solution: Fallback chain for GCS credentials
gcsCredentials: parseJsonEnv("GCS_CREDENTIALS_RAW") || parseJsonEnv("GOOGLE_TTS_CREDENTIALS_RAW");
// TTS credentials have sufficient GCS permissions
```

**Challenge 3: Service initialization patterns inconsistent**

```javascript
// Problem: Both explicit init and lazy init existed

// Solution: Document lazy init as primary, explicit as optional
/**
 * Optional explicit initialization of GCS client
 * If not called, client will be lazily initialized on first use
 */
export function initializeGCS(credentials, bucket) { ... }
```

## Testing Implementation

**Existing Tests:**

- `tests/errorHandler.test.js` - Error middleware and request ID propagation
- `tests/googleTTSService.test.js` - TTS service (legacy, needs update)

**Test Patterns:**

```javascript
// Mock-friendly service design
import * as gcsService from "../services/gcsService.js";

jest.mock("../services/gcsService.js");

test("generates conversation on cache miss", async () => {
  gcsService.fileExists.mockResolvedValue(false);
  gcsService.uploadFile.mockResolvedValue();

  const result = await conversationService.generateConversationText("word-123", "你好");

  expect(gcsService.uploadFile).toHaveBeenCalled();
  expect(result.turns).toHaveLength(3);
});
```

**Edge Cases Handled:**

- Missing environment variables (validation throws early)
- Invalid JSON credentials (parseJsonEnv throws with clear message)
- Gemini API returns insufficient turns (fallback to hardcoded)
- Empty conversation text extraction (fallback text for TTS)
- GCS upload failures (propagate with request ID)

**Manual Testing:**

- Scaffold mode: Fixtures loaded correctly
- Real mode: Live API calls with proper caching
- Cache hit/miss logging verified
- Request ID propagation through error stack

## Documentation Updates

**Updated Files:**

- ✅ `local-backend/README.md` - Complete rewrite with quick start, architecture, troubleshooting
- ✅ `local-backend/docs/design.md` - Service layer architecture, flow examples, configuration
- ✅ `local-backend/docs/api-spec.md` - Complete API endpoint specifications with examples
- ✅ `local-backend/docs/conversation-scaffolder.md` - Scaffold mode guide with fixture management

**Documentation Quality:**

- Architecture diagrams showing layer separation
- Code examples for each service
- Request/response schemas for all endpoints
- Environment variable reference
- PowerShell credential setup helpers
- Troubleshooting common issues
- Vercel migration guide

---

**Completion Date:** 2025-11-16 (local-backend refactor)
**Vercel Migration Completion:** 2025-12-09

---

## Vercel API Migration (December 2025)

### Migration Overview

Following the local-backend refactor, all backend services were successfully migrated to Vercel serverless functions under `api/` folder. This enables production deployment on Vercel while maintaining `local-backend/` for local development.

### Folder Structure

```
api/
├── tts.js                              # Vercel handler for /api/tts
├── conversation.js                     # Vercel handler for /api/conversation
├── _lib/                               # Shared business logic
│   ├── config/
│   │   └── index.js                    # Simplified config (no mode validation)
│   ├── controllers/
│   │   ├── ttsController.js            # TTS logic (refactored from Express)
│   │   └── conversationController.js   # Conversation logic (unified endpoint)
│   ├── services/
│   │   ├── ttsService.js               # Google Cloud TTS client
│   │   ├── gcsService.js               # Google Cloud Storage operations
│   │   ├── geminiService.js            # Gemini API client
│   │   └── conversationService.js      # Conversation orchestration
│   └── utils/
│       ├── hashUtils.js                # Cache key generation
│       ├── errorFactory.js             # Error creation helpers
│       ├── logger.js                   # Simplified logging
│       ├── conversationUtils.js        # Conversation helpers
│       └── promptUtils.js              # Prompt generation
└── docs/
    ├── api-spec.md                     # Vercel endpoint specifications
    ├── design.md                       # Serverless architecture
    └── README.md                       # Migration guide and setup
```

### Architecture Changes

**Express → Vercel Handler Pattern:**

```javascript
// local-backend/controllers/ttsController.js (Express)
export const generateTTSAudio = asyncHandler(async (req, res) => {
  const { text, language, voiceName } = req.body;
  // ... validation and logic
  res.json({ audioUrl });
});

// api/_lib/controllers/ttsController.js (Vercel)
export async function ttsController(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  const { text, language, voiceName } = req.body;
  // ... same validation and logic
  res.json({ audioUrl });
}

// api/tts.js (Vercel entry point)
import { ttsController } from "./_lib/controllers/ttsController.js";

export default async function handler(req, res) {
  try {
    await ttsController(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
```

**Unified Conversation Endpoint:**

```javascript
// api/_lib/controllers/conversationController.js
export async function conversationController(req, res) {
  const { type } = req.body; // "text" or "audio"

  if (type === "text") {
    return generateConversationText(req, res);
  } else if (type === "audio") {
    return generateTurnAudio(req, res);
  } else {
    res.status(400).json({ error: "Invalid type. Must be 'text' or 'audio'" });
  }
}

// Single endpoint: /api/conversation
// POST with { type: "text", wordId, word } → conversation text
// POST with { type: "audio", conversationId, turnIndex, text, language } → audio URL
```

### Key Migrations

**1. Services (100% Code Reuse)**

All service files were migrated with minimal changes:

- Removed optional explicit `initialize()` functions (Vercel uses lazy init only)
- Simplified config imports (no mode checking in services)
- Preserved all business logic, caching, error handling

**2. Controllers (Refactored from Express)**

Controllers were adapted from Express middleware to plain async functions:

- Removed `asyncHandler` wrapper (direct try-catch in handlers)
- Manual HTTP method checking (no Express router)
- Direct `res.status().json()` instead of middleware error throwing
- Error responses as plain JSON objects `{ code, message, metadata }`

**3. Configuration (Simplified)**

```javascript
// api/_lib/config/index.js
export const config = {
  googleTtsCredentials: parseJsonEnv("GOOGLE_TTS_CREDENTIALS_RAW"),
  geminiCredentials: parseJsonEnv("GEMINI_API_CREDENTIALS_RAW"),
  gcsCredentials: parseJsonEnv("GCS_CREDENTIALS_RAW") || parseJsonEnv("GOOGLE_TTS_CREDENTIALS_RAW"),
  gcsBucket: process.env.GCS_BUCKET_NAME,
  cachePaths: {
    /* ... */
  },
  gemini: {
    /* ... */
  },
};

// No mode validation (Vercel is production-only, always "real" mode)
// No server port/host config
```

**4. Utils (Subset Migration)**

Only real-mode utilities were migrated:

- ✅ `hashUtils.js` - Cache key generation
- ✅ `errorFactory.js` - Error creation
- ✅ `logger.js` - Simplified logging (no request ID, no file transport)
- ✅ `conversationUtils.js` - Conversation parsing
- ✅ `promptUtils.js` - Prompt generation
- ❌ Scaffold utilities (not needed in production)
- ❌ Express middleware (`asyncHandler`, `errorHandler`)

### API Path Updates

**Frontend Services Updated:**

```typescript
// src/features/mandarin/services/audioService.ts
// OLD: /api/get-tts-audio
// NEW: /api/tts

// src/features/mandarin/services/conversationService.ts
// OLD: /api/mandarin/conversation/text
// NEW: /api/conversation with { type: "text" }
// OLD: /api/mandarin/conversation/audio
// NEW: /api/conversation with { type: "audio" }
```

**Shared Constants:**

```javascript
// shared/constants/apiPaths.js
export const API_ROUTES = {
  ttsAudio: "/api/tts",
  conversation: "/api/conversation",
  // Legacy aliases maintained for compatibility
  conversationText: "/api/conversation",
  conversationAudio: "/api/conversation",
};
```

### Import Path Changes

All imports in `api/_lib/` require `.js` extensions for ES modules:

```javascript
// Required for Vercel
import { ttsService } from "../services/ttsService.js";
import { config } from "../config/index.js";

// Will fail in Vercel
import { ttsService } from "../services/ttsService";
```

### Testing & Validation

**Frontend Tests Updated:**

```typescript
// src/features/mandarin/services/__tests__/audioService.test.ts
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({ audioUrl: "https://storage.googleapis.com/..." }),
  })
) as jest.Mock;

expect(global.fetch).toHaveBeenCalledWith("/api/tts", expect.objectContaining({ method: "POST" }));
```

**Manual Verification:**

- ✅ TTS endpoint returns audio URLs
- ✅ Conversation text endpoint returns ConversationTurn structure
- ✅ Conversation audio endpoint generates per-turn audio
- ✅ All Google Cloud API calls succeed
- ✅ Caching works correctly in GCS
- ✅ Error responses are well-formed JSON

### Documentation Updates

**Files Updated:**

- ✅ `api/README.md` - Complete Vercel setup guide
- ✅ `api/docs/api-spec.md` - Endpoint specifications with examples
- ✅ `api/docs/design.md` - Serverless architecture
- ✅ `shared/constants/apiPaths.js` - New endpoint paths
- ✅ `shared/constants/apiPaths.ts` - TypeScript declarations
- ✅ Frontend service files and tests
- ✅ Feature documentation (audio, conversation)

### Dual Backend Approach

**Development:** `local-backend/` Express server

- Full Express middleware stack
- Scaffold mode for offline development
- Health checks and debugging endpoints
- Comprehensive logging

**Production:** `api/` Vercel serverless

- Stateless handlers
- Real mode only (live Google APIs)
- Simplified error handling
- Optimized for cold starts

**Benefits:**

- Local development with full Express features
- Production deployment with Vercel scalability
- Shared business logic (services, utils)
- Independent evolution of each backend

### Files Removed

- ❌ `api/get-tts-audio.js` (legacy standalone TTS file)

### Completion Metrics

- **Services migrated:** 4 (tts, gcs, gemini, conversation)
- **Controllers migrated:** 2 (tts, conversation)
- **Utils migrated:** 5 (subset for production)
- **Endpoints migrated:** 2 handlers (tts, unified conversation)
- **Frontend files updated:** 6 (services, tests, constants)
- **Documentation files updated:** 8 (API specs, guides, architecture)
