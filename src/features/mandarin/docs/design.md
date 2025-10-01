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

- Uses React Context API (`ProgressContext`, `useMandarinContext`) and custom hooks (`useMandarinProgress`) for shared state and progress tracking
- Page components and UI components consume context directly, eliminating prop drilling
- Navigation is handled through React Router with nested routes
- Atomic story-driven workflow: each story implements a focused change
- Documentation separation: high-level in epic docs, detailed in story docs

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
