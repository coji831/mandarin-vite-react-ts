# Local Backend API Specification

## POST /api/get-tts-audio

- **Request Body:** `{ text: string }`
- **Response:** `{ audioUrl: string }` (on success)
- **Errors:**

  - 400: Missing or invalid text
  - 500: TTS/GCS errors (see logs for details)
  - All error responses are JSON objects with the following structure:
    ```json
    {
      "code": "ERROR_CODE",
      "message": "Error message",
      "requestId": "..."
    }
    ```
  - The `X-Request-Id` header is included in all responses for traceability.

## Environment Variables

- `GOOGLE_TTS_CREDENTIALS_RAW`: Google service account JSON
- `GCS_BUCKET_NAME`: GCS bucket for caching

Recommended environment variables:

- `GOOGLE_TTS_CREDENTIALS_RAW` (recommended): stringified Google service account JSON used by local and serverless functions
- `GCS_BUCKET_NAME` (required for caching): Google Cloud Storage bucket name for audio caching

Optional fallback:

- `GOOGLE_APPLICATION_CREDENTIALS`: local path to service-account JSON (useful for local-only setups)
