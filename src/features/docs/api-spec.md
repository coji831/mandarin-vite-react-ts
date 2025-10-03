# Features API Specification

This project is primarily frontend, but some features interact with backend APIs (see [src/api/](../../../api/)).

## Example: Text-to-Speech API

- Endpoint: [/api/get-tts-audio](../../../api/get-tts-audio.js)
- Method: POST
- Body: `{ text: string }` (1-15 words)
- Response: `{ audioUrl: string }` (Google Cloud Storage URL)

See feature-specific API specs in each feature's [docs/api-spec.md](../mandarin/docs/api-spec.md).

## Multi-User Progress API (Epic 6)

- Features that track user progress (e.g., mandarin) now use a per-user ProgressStore and user/device identity system for all progress operations.
- Progress is stored and retrieved per user/device, supporting multi-user and future sync features.
- For details, see the feature's API spec (e.g., `mandarin/docs/api-spec.md`) and Epic 6 documentation.
