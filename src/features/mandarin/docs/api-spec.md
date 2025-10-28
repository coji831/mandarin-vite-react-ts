# Mandarin Feature API Specification

## Text-to-Speech API

- **Endpoint**: [/api/get-tts-audio](../../../../api/get-tts-audio.js)
- **Method**: POST
- **Request Body** (JSON):
  - `text`: string (1-15 words of Mandarin text) (required)
  - `voice`: string (optional, defaults to standard Mandarin female voice)
- **Response**: `{ audioUrl: string }` (Google Cloud Storage URL)
- **Used by**: `PlayButton` component to generate audio for vocabulary words
- **Cache Strategy**: Generated audio is cached in Google Cloud Storage using MD5 hash of the text to avoid regeneration
- **Error Handling**: Returns error messages for invalid text or voice parameters
- For implementation details, see [`docs/issues/google-cloud-tts-integration.md`](../../../../docs/issues/google-cloud-tts-integration.md)

## Data Loading

- **Vocabulary Data**: Loaded from CSV files under `public/data/vocabulary/`
  - Structure: `No,Chinese,Pinyin,English`
  - Organized by HSK level and band (e.g., `hsk3.0/band1/`)
  - Loaded using `csvLoader.ts` utility from `src/utils/`
- **Example Sentences**: Loaded from JSON files under `public/data/examples/`
- **Serving**: All data files are served as static assets by the frontend
- **No External API**: Vocabulary and example data is bundled with the application

## State Management API

Components interact with progress state through custom hooks. The state follows a structured pattern with three main slices.

### State Structure (RootState)

```typescript
{
  lists: {              // Normalized vocabulary data
    wordsById: Record<WordId, WordEntity>
    wordIds: WordId[]
  }
  user: {               // User preferences
    userId: string
    preferences: Record<string, unknown>
  }
  ui: {                 // UI state
    isLoading: boolean
    lastUpdated: string
    selectedList: string
    selectedWords: Word[]
    masteredProgress: Map<listId, Set<wordId>>
    error: string
  }
}
```

### Read State (useProgressState)

```typescript
const data = useProgressState(selector);
```

- **Purpose**: Subscribe to specific slices of state with memoization
- **Signature**: `useProgressState<T>(selector: (s: RootState) => T): T`
- **Pattern**: Pass selector function to extract only needed data
- **Important**: Always access via `s.ui.*`, `s.lists.*`, or `s.user.*` pattern
- **Examples**:
  - `useProgressState(s => s.ui?.selectedWords ?? [])`
  - `useProgressState(s => s.ui?.isLoading ?? false)`
  - `useProgressState(s => s.ui?.masteredProgress ?? {})`
  - `useProgressState(s => s.lists?.wordsById)`
  - `useProgressState(s => s.user?.userId)`

### Update State (useProgressActions)

```typescript
const { markWordLearned, setSelectedList } = useProgressActions();
```

- **Purpose**: Get stable action creators for state mutations
- **Returns**: Object with memoized functions:
  - `setSelectedList(listId)`: Select a vocabulary list
  - `setSelectedWords(words)`: Set current word selection
  - `markWordLearned(id)`: Mark a word as mastered
  - `setMasteredProgress(mastered)`: Set entire mastered progress map
  - `setLoading(isLoading)`: Update loading state
  - `setError(error)`: Set error message
  - `resetProgress()`: Clear all progress
  - `init()`: Initialize state

### User Identity (useUserIdentity)

```typescript
const [identity, refresh] = useUserIdentity();
```

- **Purpose**: Get current user/device identity for progress scoping
- **Returns**: Tuple with:
  - `identity`: `UserIdentity` object containing `userId` and `lastActive`
  - `refresh`: Function to manually reload identity from localStorage
- **Persistence**: Identity is persisted across sessions in localStorage
- **Note**: Used internally by `ProgressProvider`, typically not needed in components

## Context Providers

### ProgressProvider

Wraps the application to provide state management functionality.

- **State Initialization**: Loads persisted progress from localStorage on mount
- **Auto-Persistence**: Automatically saves progress changes to localStorage
- **Exports**:
  - `ProgressStateContext`: Read-only state context (type: `RootState | null`)
  - `ProgressDispatchContext`: Dispatch function context
- **Usage**: Already configured in `MandarinLayout`, no additional setup needed

### UserIdentityProvider

Manages user/device identity.

- **Purpose**: Provides user identity context
- **Exports**: `useUserIdentityContext()` hook
- **Usage**: Wraps `ProgressProvider` in `MandarinLayout`

## Reducer Actions

The following actions are available via `useProgressActions()`:

| Action                | Type                       | Payload                                                 | Description                                                         |
| --------------------- | -------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| `setSelectedList`     | `UI/SET_SELECTED_LIST`     | `{ listId: string \| null }`                            | Select a vocabulary list                                            |
| `setSelectedWords`    | `UI/SET_SELECTED_WORDS`    | `{ words: Word[] }`                                     | Set current word selection                                          |
| `setLoading`          | `UI/SET_LOADING`           | `{ isLoading: boolean }`                                | Update loading state                                                |
| `setError`            | `UI/SET_ERROR`             | `{ error?: string }`                                    | Set error message                                                   |
| `setMasteredProgress` | `UI/SET_MASTERED_PROGRESS` | `{ mastered: Record<string, Record<string, boolean>> }` | Bulk update mastered words                                          |
| `markWordLearned`     | Multiple                   | `id: string`                                            | Mark word as learned (dispatches to both `lists` and `ui` reducers) |
| `resetProgress`       | `RESET`                    | none                                                    | Clear all progress data                                             |
| `init`                | `INIT`                     | none                                                    | Initialize state                                                    |
