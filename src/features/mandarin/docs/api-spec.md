# Mandarin Feature API Specification

## Text-to-Speech API

- Endpoint: [/api/get-tts-audio](../../../../api/get-tts-audio.js)
- Method: GET
- Query Parameters:
  - `text`: string (1-15 words of Mandarin text)
  - `voice`: string (optional, defaults to standard Mandarin female voice)
- Response: `{ audioUrl: string }` (Google Cloud Storage URL)
- Used by: `PlayButton` component to generate audio for vocabulary
- Cache Strategy: Generated audio is cached in Google Cloud Storage using MD5 hash of the text
- For details: See [`docs/issues/google-cloud-tts-integration.md`](../../../../docs/issues/google-cloud-tts-integration.md)

## Data Loading

- Vocabulary and example sentences are loaded from static JSON files in [src/data/](../../../../src/data/).
- No external API for vocabulary; all data is local.
