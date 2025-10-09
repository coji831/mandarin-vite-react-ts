# System Architecture

This project is a Vite + React + TypeScript application for Mandarin vocabulary learning and related features.

## Main Modules

- **api**: Contains backend/serverless functions for Text-to-Speech services
- **local-backend**: Express server for local development
- **public/data/vocabulary**: CSV-based vocabulary data organized by HSK level
- **src/features**: Feature-based organization of React components and logic
- **src/components**: Reusable UI components
- **src/utils**: Utilities including csvLoader.ts for processing vocabulary data
- **src/router**: React Router configuration
- **src/constants**: Application-wide constants and configuration
- **docs**: Documentation structure for architecture, implementation, and templates

## Module Interaction

- The frontend (React) interacts with backend APIs (e.g., TTS) via HTTP requests
- Features are organized in self-contained modules with their own components and logic
- Common UI elements are shared via the components directory
- Routing handles navigation between different features and pages

## State Management

- **Context API**: The application uses React Context API for state management
- **Custom Hooks**: Feature-specific logic is encapsulated in custom hooks (e.g., `useMandarinProgress`).
- **Multi-User Progress**: As of Epic 6, all user progress is tracked per user. The `useMandarinProgress` hook and related helpers require a `userId` (from `useUserIdentity`) to load and save progress, enabling support for multiple users on the same device or in future backend integrations.
- **User/Device Switching UI (Planned)**: A user-facing UI for selecting and switching users/devices will be added (see story 6-4). This will allow users to manage their identity and progress directly from the app interface.
- **Progress Helpers**: Progress calculation and data loading logic are extracted to `progressHelpers.ts` for maintainability and clarity.
- **Local Storage**: User progress and settings are persisted in browser's localStorage, namespaced by user ID.

- **Google Cloud Text-to-Speech**: Integration in [../api/get-tts-audio.js](../api/get-tts-audio.js)
- **Google Cloud Storage**: Used for caching generated audio files

- **Local Backend**: Express server providing TTS/GCS functionality during development

  - Mirrors the serverless functions in the [../api/](../api/) directory
  - Includes detailed logging and error handling for development

- **Mandarin Feature**: Contains vocabulary learning flow and flashcard system

  - Loads vocabulary data from CSV files in [../public/data/vocabulary/](../public/data/vocabulary/)
  - CSV data structure follows standard format: `No,Chinese,Pinyin,English`
  - Processes CSV data using [../src/utils/csvLoader.ts](../src/utils/csvLoader.ts) utility
  - Uses context-based state management (implemented in Epic 3)
  - Uses nested routing structure (implemented in Epic 4)
  - Organized as separate page components for each step in the learning workflow
  - **Multi-User Progress (Epic 6)**: Progress is now tracked per user. All progress state, persistence, and logic are user-specific. The system is ready for future backend or authentication integration.
  - **Progress Logic Extraction**: All progress calculation logic is handled by helpers in `progressHelpers.ts`.

- **Mandarin Feature: Vocabulary List UI (Epic 5)**

  - **Card-Based UI**: Vocabulary lists are displayed as interactive cards with metadata (word count, difficulty, tags) and progress indicators.
  - **Search & Filter**: Users can search by name/description and filter by difficulty or tags, with real-time updates and combined logic.
  - **Responsive Design**: Layout adapts to mobile, tablet, and desktop using CSS Grid/Flexbox. Touch targets and accessibility are ensured.
  - **Visual Feedback**: Cards provide hover, focus, and active states, with subtle animations and dark mode support.
  - **Components**:
    - `VocabularyListPage.tsx`: Main selection page with search/filter UI and card grid
    - `VocabularyCard.tsx`: Card component for each vocabulary list, showing metadata and progress
    - `VocabularyCard.css`: Styles for card layout, feedback, and responsiveness
  - **Implemented in Epic 5 (Stories 5.1–5.4)**

- Navigation is handled by React Router
- Routes defined in [../src/router/Router.tsx](../src/router/Router.tsx)
- Path constants in [../src/constants/paths.ts](../src/constants/paths.ts)

- **Architecture**: This file for system-level design
- **Implementation**: Detailed implementation notes in [./issue-implementation/](./issue-implementation/)
- **Business Requirements**: Planning and requirements in [./business-requirements/](./business-requirements/)
- **Feature-Specific**: For detailed design of specific features, see each feature's docs folder (e.g., [../src/features/mandarin/docs/](../src/features/mandarin/docs/))

## Future Architecture (Placeholders)

- **Authentication System**: [Not implemented yet]
- **Database Integration**: [Not implemented yet]
- **Server-Side Rendering**: [Not implemented yet]
- **Testing Strategy**: [Not implemented yet]
