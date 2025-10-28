# System Architecture

> Note: Several older docs reference legacy progress hooks (e.g., `useMandarinProgress` / `useProgressData`). The progress API has been migrated to a reducer + provider model — see `src/features/mandarin/docs/design.md` for the current contract and migration notes.

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

The application uses a **reducer-based architecture with React Context API** for centralized state management.

### Architecture Pattern

**Mandarin Feature State:**

- **Provider:** `ProgressProvider` wraps the Mandarin feature (in `MandarinLayout`)
- **State:** Managed via `useReducer` with composed sub-reducers
- **Persistence:** Automatic localStorage sync on state changes

### Reducer Composition

The root reducer combines three domain-specific sub-reducers:

1. **`listsReducer`**: Manages normalized vocabulary data

   - State: `{ wordsById: Record<WordId, WordEntity>, wordIds: WordId[] }`
   - Handles: Word mastery status, vocabulary data normalization
   - Actions: `INIT`, `RESET`, `MARK_WORD_LEARNED`

2. **`userReducer`**: Manages user identity and preferences

   - State: `{ userId: string, preferences: Record<string, unknown> }`
   - Handles: User settings, device identity
   - Actions: `USER/SET_ID`, `USER/SET_PREF`

3. **`uiReducer`**: Manages UI state and legacy compatibility
   - State: `{ isLoading, lastUpdated, selectedList, selectedWords, masteredProgress, error }`
   - Handles: Loading states, current selection, mastered word tracking
   - Actions: `UI/SET_LOADING`, `UI/SET_SELECTED_LIST`, `UI/SET_SELECTED_WORDS`, `UI/ADD_MASTERED_WORD`, etc.

### Split Context Pattern

For performance optimization, state and dispatch are provided via separate contexts:

- **`ProgressStateContext`**: Read-only state access (type: `RootState`)
- **`ProgressDispatchContext`**: Action dispatch function

This prevents unnecessary re-renders when components only need to dispatch actions.

### Custom Hooks

**Reading State:**

```typescript
useProgressState(selector: (s: RootState) => T): T
```

- Memoized selector hook for granular subscriptions
- Always access via slice pattern: `s.ui.*`, `s.lists.*`, `s.user.*`
- Examples:
  - `useProgressState(s => s.ui?.selectedWords ?? [])`
  - `useProgressState(s => s.ui?.isLoading ?? false)`
  - `useProgressState(s => s.lists?.wordsById)`

**Updating State:**

```typescript
useProgressActions(): ActionCreators
```

- Returns stable, memoized action creator functions
- Available actions: `setSelectedList()`, `setSelectedWords()`, `markWordLearned()`, `setLoading()`, `setError()`, `setMasteredProgress()`, `resetProgress()`, `init()`
- Example: `const { markWordLearned } = useProgressActions()`

**User Identity:**

```typescript
useUserIdentity(): [UserIdentity, () => void]
```

- Manages user/device identity and persistence
- Returns: `[identity, refresh]` tuple

### Data Flow

```
Component
  ↓ (reads via selector)
useProgressState(s => s.ui.selectedWords)
  ↓
ProgressStateContext (RootState)
  ↑ (updates via reducer)
rootReducer(state, action)
  ↑ (dispatches action)
useProgressActions().markWordLearned(id)
  ↑ (calls action creator)
Component
```

### Multi-User Support

- **User Identity**: Tracked per device via `getUserIdentity()` helper
- **Progress Isolation**: All progress namespaced by `userId` in localStorage
- **Storage Keys**:
  - `user_identity`: User/device identity
  - `progress_{userId}`: Per-user progress data
- **Architecture**: Ready for future cloud sync or authentication integration

### Persistence Strategy

- **Auto-save**: Progress automatically persisted to localStorage on state changes
- **Initialization**: Progress loaded from localStorage on `ProgressProvider` mount
- **Format**: Serialized to JSON for storage, deserialized to Sets/Objects for runtime
- **Helpers**: `progressHelpers.ts` provides `getUserProgress()`, `saveUserProgress()`, `persistMasteredProgress()`, `restoreMasteredProgress()`

For detailed state management documentation, see [`src/features/mandarin/docs/design.md`](../src/features/mandarin/docs/design.md) and [`src/features/mandarin/docs/api-spec.md`](../src/features/mandarin/docs/api-spec.md).

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

## Navigation & Routing

The Mandarin feature uses nested routing with React Router.

**Route Structure:**

```
/ (Root)
└── /mandarin/* (MandarinRoutes)
    ├── /mandarin/ → redirects to /vocabulary-list
    ├── /mandarin/vocabulary-list (VocabularyListPage)
    └── /mandarin/flashcards/:listId (FlashCardPage)
```

**Navigation Flow:**

1. User visits `/mandarin` → auto-redirects to `/mandarin/vocabulary-list`
2. User selects a vocabulary list → navigates to `/mandarin/flashcards/:listId`
3. `FlashCardPage` loads CSV data for the selected list
4. User studies flashcards and marks words as mastered
5. Progress auto-saves to localStorage
6. User returns to vocabulary list → sees updated progress percentages

**Implementation:**

- Routes defined in [`src/router/Router.tsx`](../src/router/Router.tsx)
- Path constants in [`src/constants/paths.ts`](../src/constants/paths.ts)
- Feature routes in [`src/features/mandarin/router/MandarinRoutes.tsx`](../src/features/mandarin/router/MandarinRoutes.tsx)

- **Architecture**: This file for system-level design
- **Implementation**: Detailed implementation notes in [./issue-implementation/](./issue-implementation/)
- **Business Requirements**: Planning and requirements in [./business-requirements/](./business-requirements/)
- **Feature-Specific**: For detailed design of specific features, see each feature's docs folder (e.g., [../src/features/mandarin/docs/](../src/features/mandarin/docs/))

## Future Architecture (Placeholders)

- **Authentication System**: [Not implemented yet]
- **Database Integration**: [Not implemented yet]
- **Server-Side Rendering**: [Not implemented yet]
- **Testing Strategy**: [Not implemented yet]
