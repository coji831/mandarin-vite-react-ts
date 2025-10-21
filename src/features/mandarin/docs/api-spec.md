# Mandarin Feature API Specification

## Text-to-Speech API

- Endpoint: [/api/get-tts-audio](../../../../api/get-tts-audio.js)
- Method: POST
- Request Body (JSON):
  - `text`: string (1-15 words of Mandarin text) (required)
  - `voice`: string (optional, defaults to standard Mandarin female voice)
- Response: `{ audioUrl: string }` (Google Cloud Storage URL)
- Used by: `PlayButton` component to generate audio for vocabulary
- Cache Strategy: Generated audio is cached in Google Cloud Storage using MD5 hash of the text
- For details: See [`docs/issues/google-cloud-tts-integration.md`](../../../../docs/issues/google-cloud-tts-integration.md)

## Data Loading

- Vocabulary and example sentences are loaded from static files under `public/data/` (for example `public/data/examples/` and `public/data/vocabulary/`).
- These files are served as static assets by the frontend; there is no external API for vocabulary data.

## Local Progress API (Epic 9)

- All progress is tracked per user/device using a reducer-driven context/provider architecture.
- Progress is stored in localStorage, namespaced by user/device ID (from `useUserIdentity`).
- Progress operations (CRUD) are managed entirely client-side via `ProgressProvider`, `useProgressState`, and `useProgressActions` hooks.
- Legacy helpers and localStorage keys have been removed; see `scripts/cleanup-report.json` for audit history.
- The architecture supports multiple users on the same device and prepares for future cross-device sync.
- See Epic 9 documentation and `mandarin/docs/design.md` for details on the multi-user progress architecture and migration process.
