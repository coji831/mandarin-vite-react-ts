# API Directory

This directory contains backend/serverless functions for the application, primarily focused on Text-to-Speech (TTS) functionality using Google Cloud services.

## Main Components

- `get-tts-audio.js`: Handles Text-to-Speech conversion for Mandarin vocabulary
  - Converts Mandarin text to natural-sounding speech
  - Interfaces with Google Cloud TTS API
  - Implements caching via Google Cloud Storage (GCS)

## API Endpoints

- `POST /api/get-tts-audio`: Generates or retrieves audio for Mandarin text
  - Request body (JSON): `{ "text": string }` (required), optional `voice` can be included in the body
  - Returns: JSON with `audioUrl` pointing to the cached or newly-generated audio in GCS

## Configuration

Recommended environment variables (set these in Vercel or in your local `.env`):

- `GOOGLE_TTS_CREDENTIALS_RAW` (recommended): stringified Google service account JSON used by serverless functions. Example: `{"type":"service_account",...}`
- `GCS_BUCKET_NAME` (required for caching): Google Cloud Storage bucket name for audio caching

Fallback: For local setups you may use `GOOGLE_APPLICATION_CREDENTIALS` pointing to a service account JSON file path, but `GOOGLE_TTS_CREDENTIALS_RAW` is preferred for parity with Vercel.

For detailed implementation information, see:

- [`docs/issues/google-cloud-tts-integration.md`](../docs/issues/google-cloud-tts-integration.md)
