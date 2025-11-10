# Mandarin Feature Design

The Mandarin feature provides vocabulary learning, flashcards, and review.

---

## 1. Data Model

- Vocabulary data is loaded from CSV files:
  - [public/data/vocabulary/](../../../../public/data/vocabulary/)
  - Structure follows standard format: `No,Chinese,Pinyin,English`
  - CSV files are organized by HSK level and band (e.g., `hsk3.0/band1/`)
  - Loaded using `csvLoader.ts` utility in [src/utils/](../../../../src/utils/)
- Example sentences are loaded from JSON files:
  - [public/data/examples/](../../../../public/data/examples/)
- Each word includes:
  - Character (Chinese)
  - Pinyin
  - Meaning (English)
  - Example sentence (optional)
  - Translations (optional)

---

## 2. Main Components

- **PlayButton**: Integrate with TTS API for audio
- **FlashCard**: Show word details, audio playback (uses context for all state/actions)
- **WordDetails**: Show detailed word info

### Pages

**ListSelectionPage**: Page for choosing vocabulary lists to study
**FlashcardPage**: Page for displaying individual vocabulary items for study

---

## 3. State Management & Architecture

**Progress Tracking:**

- All vocabulary progress is tracked per user/device using a reducer-driven context architecture.
- Progress is automatically persisted to localStorage, namespaced by user/device ID.
- State management follows a unidirectional data flow pattern with four canonical state slices:
  - `vocabLists`: Normalized vocabulary data (itemsById, itemIds)
  - `progress`: Normalized progress data (wordsById, wordIds)
  - `user`: User identity and settings
  - `ui`: UI state (selected list, selected words, loading states)
- The root reducer (`rootReducer`) composes all slices into a single state tree: `{ vocabLists, progress, user, ui }`.

**Context Architecture:**

- Split context pattern for performance optimization:
  - `ProgressStateContext`: Provides read-only state access
  - `ProgressDispatchContext`: Provides action dispatch function
- Contexts are defined separately from the provider component for React Fast Refresh compatibility.
- `ProgressProvider` wraps the application and initializes state from localStorage on mount.

**Custom Hooks:**

- `useProgressState(selector)`: Selector hook for reading state with memoization to prevent unnecessary re-renders.
  - Signature: `useProgressState<T>(selector: (s: RootState) => T): T`
  - Examples:
    - `const selectedWords = useProgressState(s => s.ui?.selectedWords ?? [])`
    - `const loading = useProgressState(s => s.ui?.isLoading ?? false)`
    - `const masteredProgress = useProgressState(s => s.ui?.masteredProgress ?? {})`
- `useProgressActions()`: Returns stable, memoized action creators for all state updates.
  - Returns object with functions:
    - `setSelectedList(listId)` - Select vocabulary list
    - `setSelectedWords(words)` - Set current words
    - `markWordLearned(id)` - Mark word as mastered
    - `setMasteredProgress(mastered)` - Bulk update progress
    - `setLoading(isLoading)` - Update loading state
    - `setError(error)` - Set error message
    - `resetProgress()` - Clear all progress
    - `init()` - Initialize state
  - Example: `const { markWordLearned, setSelectedList } = useProgressActions()`
- `useProgressDispatch()`: Direct access to dispatch function (used internally by action creators).
- `useUserIdentity()`: Manages user/device identity and persistence.
  - Returns: `[UserIdentity, refreshFn]`

**Component Integration:**

- Components use granular selectors via `useProgressState` to subscribe only to needed state slices.
  - All selectors access state via `s.ui.*`, `s.vocabLists.*`, `s.progress.*`, or `s.user.*` pattern
  - Example: `useProgressState(s => s.ui?.selectedWords ?? [])` instead of legacy `s.selectedWords`
- All state mutations go through action creators from `useProgressActions()`.
- No prop drilling—all components access context directly via hooks.
  - State type is `RootState` with four slices: `vocabLists`, `progress`, `user`, `ui`

**Vocabulary List UI:**

- Card-based layout with progress tracking, search/filter, and responsive design.
- Progress indicators calculate mastered percentage from context state per list.

**Multi-User Architecture:**

- All progress is scoped to the current user/device identity.
- Architecture supports multiple users with isolated progress tracking.
- Designed for future cloud sync integration.

---

## 4. Page Structure

**Root**: [`MandarinRoot.tsx`](../../pages/mandarin/MandarinRoot.tsx) — handles layout and nested routes
**List Selection**: [`ListSelectionPage.tsx`](../../pages/mandarin/ListSelectionPage.tsx) — select vocabulary list
**Flashcard**: [`FlashcardPage.tsx`](../../pages/mandarin/FlashcardPage.tsx) — study vocabulary

---

## 5. Routing

- Base route: `/mandarin`
  - `/` - Root page (redirects to list selection)
  - `/list-selection` - List selection page
    // ...existing code...
  - `/flashcard` - Flashcard page
  - See [`paths.ts`](../../../../src/constants/paths.ts) and [`Router.tsx`](../../../../src/router/Router.tsx)

---

## 6. Design Notes

- React functional components and hooks
- Data loaded from CSV files using csvLoader.ts utility
- CSV system enables easy vocabulary updates and maintenance
- Standard data format (No,Chinese,Pinyin,English) ensures consistency
- Audio fetched from backend TTS API
