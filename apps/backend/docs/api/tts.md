# TTS Endpoints

**Last Updated:** August 2, 2026

## POST /v1/tts

Generate or retrieve cached TTS audio for given text.

**Request Body:**

```json
{
  "text": "你好世界",
  "voice": "cmn-CN-Wavenet-B"
}
```

- `text` (required): Text to convert to speech
- `voice` (optional): TTS voice identifier, defaults to config

**Response (200 OK):**

```json
{
  "audioUrl": "https://storage.googleapis.com/bucket/tts/abc123.mp3",
  "cached": true
}
```

**Errors:** `400 VALIDATION_ERROR` (missing/invalid text, word count limit), `500 TTS_ERROR` (generation or GCS upload failed)

**Notes on signed URLs & `cached` semantics:**

- The returned `audioUrl` is a **short-lived signed GCS URL** (1-hour TTL — `TTS_SIGNED_URL_TTL_SECONDS = 3600`), re-signed on every read. It must be played before it expires; treat it as ephemeral, not a persistent resource URL.
- `cached: true` means the audio already existed in GCS (either Redis path cache hit or GCS-only fallback hit); `cached: false` means it was freshly synthesized and uploaded on this request.
- Redis stores the GCS **file path** (`tts:path:{hash}`, 24h TTL), never the audio bytes or the signed URL (signed URLs expire and must not be served stale).
