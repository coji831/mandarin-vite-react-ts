# Components

This directory contains reusable UI components for the application.

## Component Organization

Components in this directory are application-wide reusable UI elements that are not specific to any particular feature. They should be:

- **Reusable**: Designed to be used in multiple places
- **Presentational**: Focused on UI rather than business logic
- **Self-contained**: Minimal dependencies on other components

## Available Components

- **Button** — Reusable button with various style variants and click handling
- **Input** — Form input with styling, validation display, and accessibility
- **ToggleSwitch** — Customizable toggle switch for boolean inputs with label and onChange
- **LoadingScreen** — Loading state indicator with minimal styling, used during quiz initialization
- **ErrorScreen** — Error state display with error message and retry button callback
- **ProgressBar** — Visual progress indicator showing "X / Y completed" with percentage bar
- **FilterChip** — Toggleable filter button with selected state and aria-pressed accessibility

## Feature-Specific Components

Feature-specific components should be placed in their respective feature directories:

```
src/features/[feature-name]/components/
```

This helps maintain separation of concerns and keeps the component directory focused on truly reusable elements.

## Conventions

- **Frontend Conventions**: See [docs/guides/conventions/frontend.md](../../../../docs/guides/conventions/frontend.md) for component patterns, naming rules, and export conventions.
