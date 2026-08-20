# Epic 2: Vocabulary Learning User Flow

## Technical Overview

**Implementation Goal:** Implement a structured vocabulary learning flow with list selection, sectioning, progress tracking, and flashcard integration using React components and localStorage persistence.

**Status:** Completed - Merged via PR #1 into `main` branch (Merge commit: 7cfb258)

**Last Updated:** August 10, 2025

> **AI-OPTIMIZED TIP**: For business context and user stories, see [Business Requirements](../../../business-requirements/archive/epic-2-vocabulary-learning-flow/README.md). This document focuses on technical implementation details.

## Architecture Decisions

1. **Data Separation Pattern**: Static vocabulary data (JSON files) kept separate from dynamic user progress data (localStorage) using wordId as the linking key

   - Rationale: Enables separate updates to vocabulary content without affecting user progress
   - Alternative considered: Single data store (rejected due to size and update complexity)

2. **Client-Side Persistence**: Used localStorage with JSON serialization for progress data

   - Rationale: Enables offline usage and avoids need for authentication system
   - Alternative considered: Server-side database (rejected for MVP to reduce complexity)

3. **Component Architecture**: Modular components with clearly defined responsibilities

   - Implementation: Presentational/Container pattern with SectionSelect (container) and SectionConfirm (presentational)
   - Rationale: Improves maintainability, testing, and component reusability

4. **State Management**: Parent-to-child prop passing with callback handlers

   - Implementation: Observer pattern with progress update callbacks passed to child components
   - Rationale: Simpler than global state, enables real-time progress visualization
   - Alternative considered: Context API (reserved for future if complexity increases)

5. **Data Integration**: Adapter pattern using wordId as linking key

   - Rationale: Decouples static vocabulary data from dynamic progress tracking
   - Benefit: Independent data updates and simplified data flow

6. **User Data Management**: Import/Export pattern for data portability
   - Implementation: JSON serialization for progress data
   - Benefit: Data backup without server infrastructure

## Technical Implementation

### Architecture

```
                      +-----------------+
                      �  vocabularyData � ?-- Static JSON files
                      �    (static)     �     (React 18 + TypeScript)
                      +-----------------+
                               �
                               ?
+-----------------+     +-----------------+    +-----------------+
�  List Selection +----?� Section Division+---?� Flashcard Study � ?-- Prop drilling pattern
�   Components    �     �   Components    �    �   Components    �     (Parent-to-child)
+-----------------+     +-----------------+    +-----------------+
                                                       �
                                                       ?
                                              +-----------------+
                                              �   localStorage  � ?-- JSON serialization
                                              �  (user progress)�     (wordId as key)
                                              +-----------------+
```

### Data Flow & Component Relationships

```
1. VocabularyListSelector ? 2. DailyCommitment ? 3. SectionConfirm ? 4. SectionSelect ? 5. FlashCard
   [Static data loaded]       [Pace calculation]    [Division algorithm]   [Section state]    [Progress tracking]
                                                                                                     ?
                                                                                           6. localStorage
                                                                                              [Persistence]
```

### Component Organization

```
App ? MandarinPage ? [Selection ? Commitment ? Sections ? Flashcards]
                        ?              ?            ?
          [Vocabulary Data]            +-[localStorage Persistence]-+
```

### Component Reference

**Key Patterns:**

- **Presentational:** WordDetails (UI only)
- **Container/State:** SectionSelect (manages selections)
- **Integration:** PlayButton (Google Cloud TTS)

> For detailed component documentation, see [Component Documentation](../../../src/features/mandarin/components/README.md)

### Data Structures & Caching

```typescript
// Core data models with linking pattern
interface VocabularyWord {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  examples?: Example[];
}
interface UserProgress {
  wordId: string;
  masteryLevel: number;
  lastPracticed: string;
  reviewCount: number;
}

// Static/dynamic data linking pattern
const combinedData = words.map((word) => ({
  ...word,
  progress: progressData[word.id] || defaultProgress,
}));
```

**Storage Strategy**:

- Schema: `mandarin-progress-{listId}` in localStorage
- Updates: In-memory with unmount sync + debounced batch operations

### Additional Implementation Details

### Key Commits

| Commit Hash | Feature Area        | Description                                         |
| ----------- | ------------------- | --------------------------------------------------- |
| ae74907     | Section Management  | Divide List into Sections (Issue #5)                |
| 6209fe8     | Core Implementation | Implement daily commitment and vocabulary structure |
| 9d7bff8     | UI Components       | Add ToggleSwitch and integrate with UI components   |
| f8a2d15     | Data Management     | Implement import/export for user progress data      |
| b6d901c     | Error Handling      | Add resilient error handling for data operations    |

### Implementation Highlights

- **Component organization**: Structured feature-based organization in mandarin feature
- **Data handling**: Error-resilient data loading with localStorage persistence
- **Component patterns**: Reusable UI controls (ToggleSwitch) and container/presentational pairs
- **Import/Export**: JSON-based data portability system
- **Documentation**: Comprehensive JSDoc comments for developer experience
- **Key insights**: Decoupled data architecture and pure presentational components significantly improved testing and maintainability

## Implementation Stories

Each story implements a specific part of this epic:

1. [Select Vocabulary List](./story-2-1-select-vocabulary-list.md) - List selection component and data loading
2. [Set Daily Commitment](./story-2-2-set-daily-commitment.md) - Study pace setting with completion estimation
3. [Divide List into Sections](./story-2-3-divide-list-into-sections.md) - List sectioning algorithm
4. [Select Section for Learning](./story-2-4-select-section-for-learning.md) - Section selection and navigation
5. [Update Flashcard Page](./story-2-5-update-flashcard-page.md) - Integration with flashcard system
6. [Manage Tracking Data](./story-2-6-manage-tracking-data.md) - localStorage persistence implementation
7. [Export/Import Tracking Data](./story-2-7-export-import-tracking-data.md) - Data portability features

## Design Decisions & Tradeoffs

- **Local-First Architecture**: Using localStorage prioritizes offline functionality and simplified deployment at the expense of server-side features like sharing and cloud backup
- **Component Granularity**: Smaller, focused components improve maintainability but increase prop-drilling complexity
- **Data Structure Simplification**: Flat structure for progress data optimizes localStorage but limits complex queries
- **Progressive Enhancement**: Basic functionality works without TTS integration, enhanced when available
- **Section-Based Study**: Improves user experience by breaking large lists into manageable chunks at the cost of additional UI complexity

## Known Issues & Limitations

**Current Limitations**:

- **Validation**: No schema validation for localStorage data
- **Performance**: List rendering jank (visual stuttering during scrolling) in `VocabularyListSelector.tsx` (needs virtualization)
- **Data integrity**: Silent import failures with mismatched schemas (basic type checking only)
- **Storage limits**: 5-10MB localStorage constraint (using compressed JSON format)

**Future Improvements**:

- Replace manual localStorage with dedicated storage library
- Implement virtualized lists for large datasets
- Add schema versioning for data import/export
- Consider Context API for deeper component trees
- Implement advanced spaced repetition algorithm

## Configuration

```
# Key Files
- public/data/vocabularyLists.json: Vocabulary data
- src/constants/localStorage.ts: Storage keys and defaults
```

PROGRESS_DATA: 'mandarin-progress-',
SETTINGS: 'mandarin-settings',
LAST_SECTION: 'mandarin-last-section'
};

```

## Testing Information

Unit tests cover component rendering and localStorage persistence. Test fixtures include vocabularyLists-test.json and progress-data.json.

## References

- [Related Epic: Google Cloud TTS Integration](../epic-1-google-cloud-tts-integration/README.md)
- [React localStorage Patterns](https://reactjs.org/docs/hooks-reference.html)
- [Vocabulary Data Schema](../../../public/data/vocabularyLists.json)
- [Component Documentation](../../../src/features/mandarin/components/README.md)
```
