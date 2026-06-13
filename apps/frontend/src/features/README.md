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

| Feature          | Description                                                                          | README                             |
| ---------------- | ------------------------------------------------------------------------------------ | ---------------------------------- |
| **auth**         | JWT-based authentication with login, register, and token refresh                     | [`auth/README.md`](auth/README.md) |
| **dashboard**    | User dashboard with learning statistics and leech detection                          | —                                  |
| **gamification** | Study streaks, badges, XP, mystery box rewards, and achievement display              | —                                  |
| **quiz**         | Quiz system with multiple question types, progress tracking, and session management  | —                                  |
| **vocabulary**   | Flashcard-based vocabulary learning with spaced repetition, audio, and word examples | —                                  |

## Documentation

Each feature should include its own documentation in the `docs/` folder. See the [docs/](../../docs/) folder for project-wide design and implementation documentation.

> **Frontend conventions:** See [Frontend Conventions](../../../../../docs/guides/conventions/frontend.md) for coding standards, naming rules, and export patterns.
