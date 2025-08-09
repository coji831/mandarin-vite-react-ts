# Project Conventions

## Coding Standards

- Use TypeScript for all React components and logic.
- Use functional components and React hooks.
- Organize features in [src/features/](../src/features/) with each feature in its own folder.
- Use [src/constants/paths.ts](../src/constants/paths.ts) for route constants.

## File/Folder Structure

- [src/features/](../src/features/) for main features (e.g., mandarin).
- [src/data/](../src/data/) for static JSON data (vocabulary, examples).
- [src/components/](../src/components/) for reusable UI components.
- [api/](../api/) for serverless functions (e.g., TTS).
- [local-backend/](../local-backend/) for local development server.

## Documentation

- High-level docs in [docs/](./).
- Feature-specific docs in `src/features/<feature>/docs/`.
