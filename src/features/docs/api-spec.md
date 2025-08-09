# Features API Specification

This project is primarily frontend, but some features interact with backend APIs (see [src/api/](../../../api/)).

## Example: Text-to-Speech API

- Endpoint: [/api/get-tts-audio](../../../api/get-tts-audio.js)
- Method: POST
- Body: `{ text: string }` (1-15 words)
- Response: `{ audioUrl: string }` (Google Cloud Storage URL)

See feature-specific API specs in each feature's [docs/api-spec.md](../mandarin/docs/api-spec.md).
