# Features Design

This directory contains the main features of the application. Each feature is organized in its own folder under [src/features/](../../features/).

## Current Features

- **mandarin**: Mandarin vocabulary learning, flashcards, review, and daily commitment.

See each feature's [docs/design.md](../mandarin/docs/design.md) for details.

## State Management & Multi-User Architecture (Epic 6)

- All features that track user progress (e.g., mandarin) now use a per-user ProgressStore and user/device identity system.
- Progress is stored in localStorage, namespaced by user/device ID, supporting multi-user and future sync features.
- For details, see the feature's design doc (e.g., `mandarin/docs/design.md`) and Epic 6 documentation.
