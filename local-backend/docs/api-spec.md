# Local Backend API Specification

## POST /api/get-tts-audio

- **Request Body:** `{ text: string }`
- **Response:** `{ audioUrl: string }` (on success)
- **Errors:**
  - 400: Missing or invalid text
  - 500: TTS/GCS errors (see logs for details)

## Environment Variables

- `GOOGLE_TTS_CREDENTIALS_RAW`: Google service account JSON
- `GCS_BUCKET_NAME`: GCS bucket for caching
