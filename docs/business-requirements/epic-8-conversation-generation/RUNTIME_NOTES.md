# Epic-8 Runtime Notes (pointer)

This file is a short pointer for business-level docs to the canonical runtime mapping used by the codebase.

Authoritative runtime notes are maintained in the implementation docs:

- docs/issue-implementation/epic-8-conversation-generation/runtime-notes.md

Canonical runtime facts (summary):

- conversation.id format: `${wordId}-${hash}` where `hash` is a short deterministic hash derived from `wordId` (current runtime).
- Text cache path (GCS): `convo/${wordId}/${hash}.json`
- Audio cache path (GCS): `convo/${wordId}/${hash}.mp3`
- Canonical endpoints (mounted under `/api` in local-backend):
  - `POST /api/conversation/text/generate` (text)
  - `POST /api/conversation/audio/generate` (audio)
  - `GET /api/conversation/health` (health; returns `{ mode }`)

Environment variables used by runtime:

- `CONVERSATION_MODE` - `scaffold` or `real` (controls local-backend behavior)
- `GCS_BUCKET_NAME` - Google Cloud Storage bucket used for cache
- `GEMINI_API_CREDENTIALS_RAW` - service account JSON used for Gemini and GCS operations
- `GOOGLE_TTS_CREDENTIALS_RAW` - service account JSON used for Google Text-to-Speech client

Notes:

- Some older convenience examples reference `GET /conversation?wordId=`; prefer the canonical POST endpoints above in docs and code examples.
- The codebase currently uses a `wordId`-derived hash for deterministic scaffolding; migrating to `generatorVersion + promptHash` is an option and is documented in the implementation docs if you choose to pursue it.
