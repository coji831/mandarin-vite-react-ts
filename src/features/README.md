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
      └── api.md       # API documentation
```

## Available Features

- **mandarin**: Mandarin vocabulary learning feature with flashcards and progress tracking

## Documentation

Each feature should include its own documentation in the `docs/` folder. See the [docs/](../../docs/) folder for project-wide design and implementation documentation.
