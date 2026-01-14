# Mandarin Feature API Specification

## Text-to-Speech API

### Word Audio (Single Word)

- **Endpoint**: [/api/tts](../../../../../backend/api/tts.js) (migrated from `/api/get-tts-audio`)
- **Method**: POST
- **Request Body** (JSON):
  - `text`: string (1-15 words of Mandarin text) (required)
  - `voice`: string (optional, defaults to `cmn-CN-Wavenet-B`)
- **Response**: `{ audioUrl: string, cached: boolean }` (Google Cloud Storage URL)
- **Used by**: `PlayButton` component, `fetchWordAudio` in AudioService
- **Cache Strategy**: Generated audio is cached in Google Cloud Storage using MD5 hash of the text to avoid regeneration
- **Error Handling**: Returns standardized error objects with `code`, `message`, and `metadata`

### Conversation Turn Audio (Per-Turn)

- **Endpoint**: [/api/conversation](../../../../../backend/api/conversation.js) (unified endpoint)
- **Method**: POST
- **Request Body** (JSON):
  - `type`: "audio" (required)
  - `wordId`: string (required)
  - `turnIndex`: number (required)
  - `text`: string (Mandarin text for the turn, required)
  - `voice`: string (optional)
- **Response**: `{ conversationId: string, turnIndex: number, audioUrl: string, voice: string, cached: boolean, generatedAt: string }`
- **Used by**: `ConversationTurns` component, `fetchTurnAudio` in AudioService
- **Error Handling**: Returns standardized error objects with `code`, `message`, and `metadata`

### Notes

- All audio features use the robust, type-safe `AudioService` abstraction, which supports backend swap/fallback and browser TTS fallback (see `useAudioPlayback`).
- `fetchConversationAudio` is legacy/test only; all production code uses `fetchTurnAudio` for per-turn audio.

## Data Loading

- **Vocabulary Data**: Loaded from CSV files under `public/data/vocabulary/`
  - Structure: `No,Chinese,Pinyin,English`
  - Organized by HSK level and band (e.g., `hsk3.0/band1/`)
  - Loaded using `csvLoader.ts` utility from `src/utils/`
- **Example Sentences**: Loaded from JSON files under `public/data/examples/`
- **Serving**: All data files are served as static assets by the frontend
- **No External API**: Vocabulary and example data is bundled with the application

## State Management API

Components interact with progress state through custom hooks. The state follows a structured pattern with four main slices.

### State Structure (RootState)

```typescript
{
  vocabLists: {              // Normalized vocabulary data
    itemsById: Record<string, WordBasic>
    itemIds: string[]
  },
  progress: {                // Normalized progress data
    wordsById: Record<string, WordProgress>
    wordIds: string[]
  },
  user: {                    // User identity and preferences
    userId?: string | null
    preferences?: Record<string, unknown>
  },
  ui: {                      // UI state
    isLoading: boolean
    lastUpdated?: string | null
    selectedList?: string | null
    selectedWords?: WordBasic[]
    error?: string
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
- **Important**: Always access via `s.ui.*`, `s.vocabLists.*`, `s.progress.*`, or `s.user.*` pattern
- **Examples**:
  - `useProgressState(s => s.ui?.selectedWords ?? [])`
  - `useProgressState(s => s.ui?.isLoading ?? false)`
  - `useProgressState(s => s.vocabLists?.itemsById)`
  - `useProgressState(s => s.user?.userId)`

### Update State (useProgressActions)

```typescript
const { markWordLearned, setSelectedList } = useProgressActions();
```

- **Purpose**: Get stable action creators for state mutations
- **Returns**: Object with memoized functions:
  - `setSelectedList(listId)`: Select a vocabulary list
  - `setSelectedWords(words)`: Set current word selection (array of WordBasic)
  - `markWordLearned(id)`: Mark a word as mastered
  - `setMasteredProgress(mastered)`: Set entire mastered progress map (Record<string, Set<string>>)
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

| Action             | Type                    | Payload                      | Description                                                              |
| ------------------ | ----------------------- | ---------------------------- | ------------------------------------------------------------------------ |
| `setSelectedList`  | `UI/SET_SELECTED_LIST`  | `{ listId: string \| null }` | Select a vocabulary list                                                 |
| `setSelectedWords` | `UI/SET_SELECTED_WORDS` | `{ words: WordBasic[] }`     | Set current word selection                                               |
| `setLoading`       | `UI/SET_LOADING`        | `{ isLoading: boolean }`     | Update loading state                                                     |
| `setError`         | `UI/SET_ERROR`          | `{ error?: string }`         | Set error message                                                        |
| `markWordLearned`  | Multiple                | `id: string`                 | Mark word as learned (dispatches to both `vocabLists` and `ui` reducers) |
| `resetProgress`    | `RESET`                 | none                         | Clear all progress data                                                  |
| `init`             | `INIT`                  | none                         | Initialize state                                                         |
