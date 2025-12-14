# Features API Specification

This project is primarily frontend, but some features interact with backend APIs (see [src/api/](../../../api/)).

## Example: Text-to-Speech API

- Endpoint: [/api/tts](../../../api/tts.js) (migrated from `/api/get-tts-audio`)
- Method: POST
- Body: `{ text: string, voice?: string }` (1-15 words)
- Response: `{ audioUrl: string, cached: boolean }` (Google Cloud Storage URL)
- **Migration Note**: Fully migrated to Vercel serverless (December 2025). See [api/docs/api-spec.md](../../../api/docs/api-spec.md) for complete specification.

See feature-specific API specs in each feature's [docs/api-spec.md](../mandarin/docs/api-spec.md).

## Multi-User Progress API (Epic 6)

- Features that track user progress (e.g., mandarin) now use a per-user ProgressStore and user/device identity system for all progress operations.
- Progress is stored and retrieved per user/device, supporting multi-user and future sync features.
- For details, see the feature's API spec (e.g., `mandarin/docs/api-spec.md`) and Epic 6 documentation.
