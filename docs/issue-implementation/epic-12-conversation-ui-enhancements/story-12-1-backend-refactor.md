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

**Completion Date:** 2025-11-16
