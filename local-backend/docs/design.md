# Local Backend Design

## Purpose

Provides a local Express server for TTS (Text-to-Speech) requests, with Google Cloud Storage caching.

## Key Features

- Loads credentials and config from `.env.local`
- Uses Google Cloud Text-to-Speech and Storage
- Caches generated audio in GCS using MD5 hash of text
- Returns public URL for cached or newly generated audio

## Flow

1. Receives POST `/api/get-tts-audio` with `{ text }`.
2. Checks GCS for cached audio (by hash).
3. If found, returns URL. If not, generates audio, uploads to GCS, then returns URL.

## Error Handling

- Handles missing credentials, GCS errors, and API errors with clear logs and HTTP status codes.
