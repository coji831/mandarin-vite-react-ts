# System Architecture

This project is a Vite + React + TypeScript application for Mandarin vocabulary learning and related features.

## Main Modules

- **api**: Contains backend/serverless functions:

## Module Interaction

- The frontend (React) interacts with backend APIs (e.g., TTS) via HTTP requests.

## How to Use This Document

- For high-level design and system overview, see this file.
  - Google Cloud Text-to-Speech integration in [api/get-tts-audio.js](../api/get-tts-audio.js)
  - Uses Google Cloud Storage for caching generated audio files
    **local-backend**: Contains local Express development server:
  - Provides TTS/GCS functionality during development
  - Mirrors the serverless functions in the [api/](../api/) directory
  - Includes detailed logging and error handling for development
    **features**: Contains all main features of the app, each in its own folder. Example: [mandarin](../src/features/mandarin) for Mandarin learning.
  - The `mandarin` feature loads vocabulary and example data from local JSON files in [src/data/](../src/data/).
  - Navigation is handled by React Router, with routes defined in [src/router/Router.tsx](../src/router/Router.tsx) and constants in [src/constants/paths.ts](../src/constants/paths.ts).
  - For detailed design of a specific feature, see that feature's [docs/design.md](../src/features/mandarin/docs/design.md).
