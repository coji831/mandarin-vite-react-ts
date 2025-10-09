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

### State Management & Architecture (Update)

- **Progress Tracking:**  
  All vocabulary progress is tracked per user/device using the `ProgressStore` utility.  
  Progress is stored in localStorage, namespaced by user/device ID from `useUserIdentity`.  
  All progress operations (marking words, loading lists, persisting state) are centralized in the `useProgressData` hook.

- **React Context API:**

  - `ProgressContext` provides mastered words, selected list, and selected words for the current user.
  - `useMandarinContext` combines progress and vocabulary context for unified access in components.
  - All UI components consume context directly—no prop drilling.

- **Custom Hooks:**

  - `useProgressData`: Manages all progress logic, including loading words, updating mastered state, and persisting to localStorage.
  - `useUserIdentity`: Manages user/device identity and persistence.

- **Vocabulary List UI:**

  - Card-based layout with progress bar, search/filter, and responsive design.
  - Progress indicator uses context state for per-list mastered percentage.

- **No Daily Commitment Logic:**

  - All legacy daily commitment and section logic has been removed.
  - Progress is now list-focused and user-centric.

- **Multi-User Ready:**
  - Architecture supports multiple users and prepares for future cloud sync.
  - All progress is scoped to the current user/device.

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

---

## 5. Vocabulary List UI (Epic 5)

- **Card-Based Layout**: Vocabulary lists are shown as cards with name, description, metadata (word count, difficulty, tags), and progress indicator.
- **Search & Filtering**: Users can search by name/description and filter by difficulty or tags. Filters use OR/AND logic and update results in real time.
- **Progress Indicator**: Each card shows user progress (as a percentage bar) for started lists.
- **Responsive & Accessible**: Layout adapts to all screen sizes. Cards and controls have accessible focus, touch targets, and dark mode support.
- **Components**:
  - `VocabularyListPage.tsx`: Handles search/filter UI, card grid, and state
  - `VocabularyCard.tsx`: Renders each card with metadata and progress
  - `VocabularyCard.css`: Styles for all UI, feedback, and responsive features
- **Implemented in Epic 5 (Stories 5.1–5.4)**
