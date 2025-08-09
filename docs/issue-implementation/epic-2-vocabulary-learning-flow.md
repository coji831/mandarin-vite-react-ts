# Epic 2: Integrate New Vocabulary Learning User Flow into Existing System

## Epic Summary

**Epic Goal:** Extend the current application to include a new user flow between the Mandarin root page and the flashcard page, enabling users to select a vocabulary list, commit to a daily word goal, divide the list into sections, study a chosen section via flashcards, and track progress in localStorage using wordId to link datasets.

**Status:** Completed - Merged via PR #1 into `main` branch (Merge commit: 7cfb258)

**Last Update:** August 10, 2025

## Background

The current implementation needs to integrate a new vocabulary learning user flow into the existing Mandarin learning system. This involves enhancing the application, which already includes a flashcard page and a root page (called Mandarin), by creating a structured flow between these pages.

The new user flow allows users to:

- Select from multiple large vocabulary lists (~500 words each)
- Set a daily word commitment
- Divide the selected list into manageable sections
- Choose a section to study on the flashcard page
- Track learning progress efficiently

The system leverages the existing wordId field to separate static word data (e.g., from mandarin.json) from dynamic tracking/learning data stored in localStorage, ensuring modularity and efficient progress tracking.

## Architecture Decisions

1. **Data Separation**: Static vocabulary data is kept separate from user progress data
2. **Local Storage**: User progress is stored in browser localStorage using wordId as a key
3. **Component Organization**: New components follow a modular approach for better maintainability
4. **State Management**: Parent components manage state and pass handlers to child components
5. **Pure Presentational Components**: Components are designed to be pure presentational with clearly defined responsibilities
6. **Consistent Component Documentation**: Each component includes JSDoc comments describing its purpose and behavior

## Implementation Details

- Added documentation structure for all main modules and features
- Updated API specs for both local development and serverless functions
- Improved component organization in the Mandarin feature
- Created new components for vocabulary organization
- Implemented persistent storage for tracking progress
- Created a reusable ToggleSwitch component for consistent UI interactions
- Implemented robust error handling for data loading and processing
- Built an import/export system for user progress data
- Added comprehensive JSDoc comments to all components

### Key Components Added/Modified

1. **VocabularyListSelector**: Select from HSK 3.0 vocabulary lists
2. **SectionSelect & SectionConfirm**: Divide lists into manageable sections
3. **DailyCommitment**: Set and track daily word learning goals
4. **FlashCard**: Enhanced with toggle options for pinyin/meaning visibility
5. **Sidebar**: Improved with better organization and filtering
6. **ToggleSwitch**: Reusable UI component for toggle interactions
7. **PlayButton**: TTS audio playback for Mandarin text
8. **WordDetails**: Display detailed information for a vocabulary card

### Related Features

This epic is connected to [Epic 1: Google Cloud TTS Integration](./epic-1-google-cloud-tts-integration.md) which provides audio pronunciation for the vocabulary words.

## Key Commits

| Commit Hash | Description                                                            |
| ----------- | ---------------------------------------------------------------------- |
| 394c078     | Remove HSK 3.0 Band 1 vocabulary lists and related JSON files          |
| bf98f05     | Refactor components: update Sidebar and FlashCard                      |
| ed92ec8     | Add vocabulary lists and example sentences for HSK 3.0 Band 1          |
| ae74907     | Divide List into Sections (Issue #5)                                   |
| 9908dc9     | Update DailyCommitment component to validate input                     |
| 6209fe8     | Add HSK 3.0 vocabulary lists and implement daily commitment feature    |
| 9d7bff8     | Add ToggleSwitch component and integrate it into FlashCard and Sidebar |
| c743e9a     | Update component JSDoc comments for better documentation               |
| f8a2d15     | Implement import/export functionality for user progress data           |
| b6d901c     | Add error handling for data loading and processing                     |

## User Stories

This epic consists of the following user stories:

1. [**Select Vocabulary List from Mandarin Page**](./epic-2-stories/story-1-select-vocabulary-list.md) (#3) - Allow users to choose from available vocabulary lists (e.g., HSK 3.0 lists)

2. [**Set Daily Word Commitment**](./epic-2-stories/story-2-set-daily-commitment.md) (#4) - Enable users to set their daily learning goal and see estimated completion time

3. [**Divide List into Sections**](./epic-2-stories/story-3-divide-list-into-sections.md) (#5) - Create a mechanism to split large vocabulary lists into manageable sections

4. [**Select Section for Learning**](./epic-2-stories/story-4-select-section-for-learning.md) (#6) - Implement interface for users to choose which section to study

5. [**Update Flashcard Page to Support Selected Section**](./epic-2-stories/story-5-update-flashcard-page.md) (#7) - Modify the flashcard page to display only words from the chosen section

6. [**Manage Tracking Data in localStorage**](./epic-2-stories/story-6-manage-tracking-data.md) (#8) - Implement system to store and manage user progress in browser's localStorage

7. [**Export and Import Tracking Data**](./epic-2-stories/story-7-export-import-tracking-data.md) (#9) - Allow users to backup and restore their learning progress

## Lessons Learned

- Separation of static and dynamic data provides flexibility
- Modular component design enables easier testing and maintenance
- Local storage provides a good balance of persistence and simplicity for this use case
- Pure presentational components with props-based state management improves code clarity
- Consistent JSDoc documentation improves developer onboarding and maintenance
- Clear component responsibilities and boundaries prevent state management complexity
- Reusable UI components like ToggleSwitch improve development efficiency and consistency

## Component Reference

### Core Learning Flow Components

1. **VocabularyListSelector**:

   - Purpose: Allows users to select from available vocabulary lists
   - Key Features: Fetches and displays lists with sample words, handles list selection
   - Props: `onSelect` callback for when a list is chosen
   - File: `src/features/mandarin/components/VocabularyListSelector.tsx`

2. **DailyCommitment**:

   - Purpose: Sets daily learning goal for vocabulary words
   - Key Features: Input validation, calculates estimated completion time
   - Props: Selected list, word data, input handlers, and commitment state
   - File: `src/features/mandarin/components/DailyCommitment.tsx`

3. **SectionConfirm**:

   - Purpose: Confirms sections created from vocabulary list
   - Key Features: Displays section summary with word counts
   - Props: `sections`, `wordsPerSection`, and `onProceed` callback
   - File: `src/features/mandarin/components/SectionConfirm.tsx`

4. **SectionSelect**:

   - Purpose: Allows selection of a specific section to study
   - Key Features: Progress tracking, section filtering, section visualization
   - Props: Section data, selection state, progress metrics, and navigation callbacks
   - File: `src/features/mandarin/components/SectionSelect.tsx`

5. **FlashCard**:
   - Purpose: Displays flashcards for selected section words
   - Key Features: Navigation between cards, marking words as mastered, audio playback
   - Props: Section words, progress state, mastery tracking, and navigation callbacks
   - File: `src/features/mandarin/components/FlashCard.tsx`

### Supporting Components

1. **Sidebar**:

   - Purpose: Provides word navigation and filtering in flashcard view
   - Key Features: Search functionality, progress display, word list with mastery indicators
   - Props: Current state, filtered words, search handlers, and navigation callbacks
   - File: `src/features/mandarin/components/Sidebar.tsx`

2. **WordDetails**:

   - Purpose: Displays detailed information for a vocabulary card
   - Key Features: Shows pinyin, meaning, example sentences and translations
   - Props: Word data from `Card` type
   - File: `src/features/mandarin/components/WordDetails.tsx`

3. **PlayButton**:

   - Purpose: Provides audio playback for Mandarin text
   - Key Features: TTS functionality, audio caching, error handling
   - Props: `mandarinText` string to be spoken
   - File: `src/features/mandarin/components/PlayButton.tsx`

4. **ToggleSwitch**:

   - Purpose: Reusable UI component for toggle functionality
   - Key Features: Accessible design, customizable label, consistent styling
   - Props: `label`, `checked` state, and `onChange` handler
   - File: `src/components/ToggleSwitch.tsx`

5. **NavBar**:
   - Purpose: Navigation between main application views
   - Key Features: Simple button-based navigation
   - Props: `setCurrentPage` callback for navigation
   - File: `src/features/mandarin/components/NabBar.tsx`

## Future Considerations

- Consider server-side persistence for user data
- Evaluate performance with very large vocabulary lists
- Explore additional learning algorithms for optimized word presentation
- Add analytics to understand user learning patterns
- Implement more advanced spaced repetition algorithms for optimal learning
- Add user authentication for multi-user support
