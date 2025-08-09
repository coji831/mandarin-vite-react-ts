# Mandarin Feature Design

The Mandarin feature provides vocabulary learning, flashcards, review, and daily commitment tracking.

## Data

- Vocabulary and example sentences are loaded from JSON files in [src/data/vocabulary/](../../../../src/data/vocabulary/) and [src/data/examples/](../../../../src/data/examples/).
- Each word includes: character, pinyin, meaning, example sentence, and translations.

## Main Components

- **AddForm**: Allows adding new vocabulary items.
- **Basic**: Basic component for displaying vocabulary.
- **DailyCommitment**: Lets users set and track daily word learning goals.
- **FlashCard**: Displays a word and its details, allows audio playback.
- **Import**: Component for importing vocabulary.
- **NabBar**: Navigation bar for the Mandarin feature.
- **PlayButton**: Integrates with TTS API for audio.
- **ReviewFlow**: Guides the user through daily review sessions.
- **ReviewHistory**: Shows history of reviewed words.
- **SectionConfirm**: Confirms section selection.
- **SectionSelector**: Organizes words into sections for easier study.
- **Sidebar**: Lists all words, supports search and selection.
- **VocabularyListSelector**: Allows selecting vocabulary lists.
- **WordDetails**: Displays detailed information about a word.

## Pages

- Main page: [src/features/mandarin/pages/Mandarin.tsx](../../pages/Mandarin.tsx) (handles state, routing, and logic for the feature).

## Routing

- Route: `/mandarin` (see [src/constants/paths.ts](../../../../src/constants/paths.ts) and [src/router/Router.tsx](../../../../src/router/Router.tsx)).

## Design Notes

- Uses React functional components and hooks.
- Data is kept in local state and loaded from static files.
- Audio is fetched from the backend TTS API.
