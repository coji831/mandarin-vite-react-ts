# API Module API Specification

## POST /api/get-tts-audio

Serverless function for converting text to speech.

- **Request Body:** `{ text: string }` (1 to 15 words of Mandarin text)
- **Response:** `{ audioUrl: string }` (URL to the generated audio in GCS)
- **Errors:**
  - 400: Missing or invalid text, word count out of range
  - 405: Method not allowed (only POST)
  - 500: TTS or GCS errors

## Environment Variables

- `GOOGLE_TTS_CREDENTIALS_RAW`: Google service account JSON (required)
- `GCS_BUCKET_NAME`: Google Cloud Storage bucket for caching (required)

Recommended environment variables:

- `GOOGLE_TTS_CREDENTIALS_RAW` (recommended): stringified Google service account JSON used by serverless functions
- `GCS_BUCKET_NAME` (required for caching): Google Cloud Storage bucket name for audio caching

Optional local fallback: `GOOGLE_APPLICATION_CREDENTIALS` pointing to a service account JSON file path
