# TTS Endpoints

## POST /api/get-tts-audio

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
