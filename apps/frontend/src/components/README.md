# Components

This directory contains reusable UI components for the application. See the [docs/](../../docs/) folder for design and usage documentation.

## Component Organization

Components in this directory are application-wide reusable UI elements that are not specific to any particular feature. They should be:

- **Reusable**: Designed to be used in multiple places
- **Presentational**: Focused on UI rather than business logic
- **Self-contained**: Minimal dependencies on other components
- **Well-documented**: Include props documentation and usage examples

## Available Components

- **ToggleSwitch**: A customizable toggle switch component that can be used for boolean inputs

## Feature-Specific Components

Feature-specific components should be placed in their respective feature directories:

- `src/features/[feature-name]/components/`

This helps maintain separation of concerns and keeps the component directory focused on truly reusable elements.
