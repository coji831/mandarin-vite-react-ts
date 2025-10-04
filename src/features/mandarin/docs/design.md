# Mandarin Feature Design

The Mandarin feature provides vocabulary learning, flashcards, review, and daily commitment tracking.

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

- **ListSelectionPage**: Page for choosing vocabulary lists to study
- **CommitmentPage**: Page for setting daily learning goals
- **SectionDividerPage**: Page for dividing vocabulary into manageable sections
- **SectionSelectorPage**: Page for selecting which section to study
- **FlashcardPage**: Page for displaying individual vocabulary items for study

---

## 3. State Management & Architecture

- **Per-User Progress Tracking:**
  - All progress is now tracked per user/device using a dedicated `ProgressStore` utility.
  - Each user's progress is stored in localStorage, namespaced by a unique user/device ID (from `useUserIdentity`).
  - The architecture supports multiple users on the same device and prepares for future cross-device sync.
  - Migration utilities ensure legacy single-user progress is moved to the new per-user format without data loss.
- **React Context API:**
  - Uses `ProgressContext` and `useMandarinContext` for shared state and progress tracking.
  - Page and UI components consume context directly, eliminating prop drilling.
- **Custom Hooks:**
  - `useMandarinProgress` manages all progress logic, delegating CRUD to `ProgressStore` and always scoping to the current user.
  - `useUserIdentity` provides the current user/device ID and manages identity persistence.
- **Navigation:**
  - Handled through React Router with nested routes.
- **Workflow & Documentation:**
  - Atomic story-driven workflow: each story implements a focused change.
  - Documentation separation: high-level in epic docs, detailed in story docs.

### Multi-User Architecture

- The system is architected for multi-user support, with all progress operations scoped to the current user/device.
- The design is ready for future features such as user switching and cloud sync.
- See Epic 6 documentation for further details on the multi-user progress architecture and migration process.

---

## 4. Page Structure

- **Root**: [`MandarinRoot.tsx`](../../pages/mandarin/MandarinRoot.tsx) — handles layout and nested routes
- **List Selection**: [`ListSelectionPage.tsx`](../../pages/mandarin/ListSelectionPage.tsx) — select vocabulary list
- **Commitment**: [`CommitmentPage.tsx`](../../pages/mandarin/CommitmentPage.tsx) — set daily learning goals
- **Section Divider**: [`SectionDividerPage.tsx`](../../pages/mandarin/SectionDividerPage.tsx) — divide vocabulary
- **Section Selector**: [`SectionSelectorPage.tsx`](../../pages/mandarin/SectionSelectorPage.tsx) — select section
- **Flashcard**: [`FlashcardPage.tsx`](../../pages/mandarin/FlashcardPage.tsx) — study vocabulary

---

## 5. Routing

- Base route: `/mandarin`
  - `/` - Root page (redirects to list selection)
  - `/list-selection` - List selection page
  - `/commitment` - Commitment page
  - `/section-divider` - Section divider page
  - `/section-selector` - Section selector page
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
