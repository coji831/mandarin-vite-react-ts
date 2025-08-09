# API Module Design

## Purpose

Provides serverless functions for text-to-speech conversion using Google Cloud TTS with GCS caching.

## Key Features

- Uses Google Cloud Text-to-Speech API for high-quality Mandarin audio generation
- Caches generated audio in Google Cloud Storage using MD5 hash of text
- Returns public URL for cached or newly generated audio
- Deployed as serverless functions on Vercel

## Flow

1. Receives POST request with `{ text }` payload
2. Validates input (1-15 words)
3. Generates MD5 hash of text
4. Checks GCS for existing audio with that hash
5. If found, returns URL; if not, generates audio, uploads to GCS, then returns URL

## Error Handling

- Handles missing credentials, GCS errors, and API errors with clear logs and HTTP status codes
