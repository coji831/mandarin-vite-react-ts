# API Directory

This directory contains backend/serverless functions for the application, primarily focused on Text-to-Speech (TTS) functionality using Google Cloud services.

## Main Components

- `get-tts-audio.js`: Handles Text-to-Speech conversion for Mandarin vocabulary
  - Converts Mandarin text to natural-sounding speech
  - Interfaces with Google Cloud TTS API
  - Implements caching via Google Cloud Storage (GCS)

## API Endpoints

- `GET /api/get-tts-audio`: Generates or retrieves audio for Mandarin text
  - Query parameters: `text` (required), `voice` (optional)
  - Returns: JSON with audio URL or base64-encoded audio data

## Configuration

Requires environment variables:

- `GOOGLE_APPLICATION_CREDENTIALS`: Path to service account key
- `GCS_BUCKET_NAME`: Name of the GCS bucket for audio caching

For detailed implementation information, see:

- [`docs/issues/google-cloud-tts-integration.md`](../docs/issues/google-cloud-tts-integration.md)
