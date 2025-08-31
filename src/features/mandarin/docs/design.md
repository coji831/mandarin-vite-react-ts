# Mandarin Feature Design

The Mandarin feature provides vocabulary learning, flashcards, review, and daily commitment tracking.

---

## 1. Data Model

- Vocabulary and example sentences are loaded from JSON files:
  - [src/data/vocabulary/](../../../../src/data/vocabulary/)
  - [src/data/examples/](../../../../src/data/examples/)
- Each word includes:
  - Character
  - Pinyin
  - Meaning
  - Example sentence
  - Translations

---

## 2. Main Components

- **AddForm**: Add new vocabulary items
- **Basic**: Display vocabulary
- **DailyCommitment**: Set and track daily word learning goals
- **FlashCard**: Show word details, audio playback
- **Import**: Import vocabulary
- **NavBar**: Navigation bar for Mandarin feature
- **PlayButton**: Integrate with TTS API for audio
- **SectionConfirm**: Confirm section selection (now uses context for all state/actions, no progress-related props)
- **SectionSelect**: Organize words into sections (now uses context for all state/actions, no progress-related props)
- **Sidebar**: List/search/select words
- **VocabularyListSelector**: Select vocabulary lists (now uses context)
- **WordDetails**: Show detailed word info

---

## 3. State Management & Architecture

- Uses React Context API (`ProgressContext`, `useMandarinContext`) and custom hooks (`useMandarinProgress`) for shared state and progress tracking
- Components (e.g., `VocabularyListSelector`, `DailyCommitment`) consume context directly, eliminating prop drilling
- Navigation between sections/components (e.g., after confirming daily commitment) is handled via callback props for parent-driven control
- Atomic story-driven workflow: each story implements a focused change
- Documentation separation: high-level in epic docs, detailed in story docs

---

## 4. Pages

- **Main page**: [`Mandarin.tsx`](../../pages/Mandarin.tsx) — handles state, routing, and logic for the feature

---

## 5. Routing

- Route: `/mandarin`
  - See [`paths.ts`](../../../../src/constants/paths.ts) and [`Router.tsx`](../../../../src/router/Router.tsx)

---

## 6. Design Notes

- React functional components and hooks
- Data loaded from static files
- Audio fetched from backend TTS API
