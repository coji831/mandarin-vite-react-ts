---
purpose: TTS endpoints — POST /v1/tts
status: active
last-verified: 2026-08-03
type: guide
---

# TTS Endpoints

**Last Updated:** August 3, 2026

## POST /v1/tts

Generate or retrieve cached TTS audio for given text. **Auth:** `optionalAuth` (guests and users both POST).

Implemented on the NestJS shell by `AudioNestController` (`src/modules/audio/nest/audio-nest.controller.ts`) → `AudioService.getTtsUrl` → `AudioSynthesizer.synthesizeToPath(text, tts/{hash}.mp3)` (exists-or-synthesize primitive wrapped in `AudioPathCache` single-flight) → `AudioUrlSigner`.

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
- `cached: true` means the MP3 **already existed in GCS** — GCS existence is the single source of truth, so a hit just re-signs a fresh URL; `cached: false` means it was freshly synthesized, uploaded to GCS, and the path recorded in Redis on this request.
- Redis stores the GCS **file path** (`tts:path:{hash}`, 24h TTL), never the audio bytes or the signed URL (signed URLs expire and must not be served stale). Redis is a **write-only pre-gen path index** at runtime — `setPath` fires on fresh-create; `getPath` is unused in the request path. A write failure never fails the request.
