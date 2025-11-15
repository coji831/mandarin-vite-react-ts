# Local Backend Design

## Purpose

Provides a local Express server for TTS (Text-to-Speech) requests, with Google Cloud Storage caching.

- ## Key Features

- Loads credentials and config from `.env` (or use `GOOGLE_APPLICATION_CREDENTIALS` path). Prefer `GOOGLE_TTS_CREDENTIALS_RAW` (stringified service account JSON) for parity with Vercel.
- Uses Google Cloud Text-to-Speech and Storage
- Caches generated audio in GCS using MD5 hash of text
- Returns public URL for cached or newly generated audio

## Flow

1. Receives POST [/api/get-tts-audio](../../api/get-tts-audio.js) with `{ text }`.
2. Checks GCS for cached audio (by hash).
3. If found, returns URL. If not, generates audio, uploads to GCS, then returns URL.

## Error Handling

- All API requests are assigned a unique `requestId` (via `requestIdMiddleware`).
- Errors are handled by a centralized `errorHandler` middleware.
- All error responses are structured as:
  ```json
  {
    "code": "ERROR_CODE",
    "message": "Error message",
    "requestId": "..."
  }
  ```
- Errors are logged with the requestId for traceability.
- See `utils/errorHandler.js` for implementation details.

# Google TTS Service

This backend uses Google Cloud Text-to-Speech (TTS) for audio generation. All credentials and configuration are loaded from environment variables only.

## Required Environment Variables

- `CONVERSATION_MODE`: `real` or `scaffold`
- `GCS_BUCKET_NAME`: Google Cloud Storage bucket for audio/conversation cache
- `GEMINI_API_CREDENTIALS_RAW`: Service account JSON for Gemini API and GCS
- `GOOGLE_TTS_CREDENTIALS_RAW`: Service account JSON for GCP TTS

## Migration Notes

- All Google API logic is modularized in `utils/googleTTSService.js`.
- No credentials are hardcoded; all are loaded from `.env.local`.
- Express handlers and routes should use only async service functions for TTS.

## Usage Example

```js
import { synthesizeSpeech } from "../utils/googleTTSService.js";
const audioContent = await synthesizeSpeech("你好世界");
```

See `googleTTSService.js` for details.
