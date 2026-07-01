# Features

This directory contains the main features of the application, organized following a feature-based architecture. Each feature is contained in its own directory with its own components, state management, and documentation.

## Feature Organization

Each feature should be organized as follows:

```
feature-name/
  ├── components/      # Feature-specific UI components
  ├── context/         # Context providers for feature state
  ├── hooks/           # Custom hooks for feature logic
  ├── pages/           # Page components for routing
  ├── utils/           # Utility functions for the feature
  ├── types.ts         # TypeScript types for the feature
  └── docs/            # Feature-specific documentation
      ├── design.md    # Design documentation
      └── api-spec.md  # API specification
```

## Available Features

| Feature           | Description                                                                             | README                             |
| ----------------- | --------------------------------------------------------------------------------------- | ---------------------------------- |
| **auth**          | JWT-based authentication with login, register, and token refresh                        | [`auth/README.md`](auth/README.md) |
| **character-hub** | Slide-up overlay panel showing character/word details, radical decomposition, mnemonics | —                                  |
| **foundations**   | Phase 1 learning: pinyin, tones, strokes, animations                                    | —                                  |
| **quiz**          | Phase-gated assessment via Strategy pattern with multiple quiz modes                    | —                                  |
| **radicals**      | Radical browser, detail cards, radical trees, character decomposition                   | —                                  |
| **review**        | SRS flip-card practice with SM-2 scheduling, multiple content types                     | —                                  |

## Documentation

Each feature should include its own documentation in the `docs/` folder. See the [docs/](../../docs/) folder for project-wide design and implementation documentation.

> **Frontend conventions:** See [Frontend Conventions](../../../../../docs/guides/conventions/frontend.md) for coding standards, naming rules, and export patterns.
