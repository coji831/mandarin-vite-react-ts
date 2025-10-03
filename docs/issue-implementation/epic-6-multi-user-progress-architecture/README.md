# Epic 6: Multi-User Progress Architecture

## Epic Summary

**Goal:** Refactor the application's data architecture to separate vocabulary content from user progress using WordId-based references.

**Key Points:**

- Create dedicated ProgressStore with WordId-based references
- Separate state management into VocabularyProvider and ProgressProvider
- Implement user/device identification system for progress association
- Refactor components to work with the new architecture
- Design for future synchronization capabilities

**Status:** Planned

## Technical Overview

**Implementation Goal:** To restructure the application's data architecture by separating vocabulary content from user progress tracking, enabling multi-user support and establishing a foundation for cross-device synchronization.

**Status:** Planned

**Last Updated:** October 1, 2025

## Architecture Decisions

1. **Complete Separation of Concerns**: Fully separate vocabulary data (content) from progress data (user state) to enable independent scaling and management of each concern.

2. **WordId as Primary Reference Key**: Use WordId as the universal identifier across the system to reference vocabulary items in progress tracking, enabling flexible vocabulary updates without breaking progress references.

3. **Provider Pattern for State Management**: Continue using React Context API with separate providers for vocabulary and progress to maintain the existing state management pattern while achieving separation.

4. **Local-First Data Strategy**: Implement a local-first approach where progress is stored locally and prepared for future synchronization, prioritizing offline functionality while enabling future online features.

5. **User/Device Identification**: Implement a simple but extensible identification system that starts with device-based identity but can expand to account-based identity.

## Technical Implementation

### Module Structure

```
src/features/mandarin/
├── context/
│   ├── VocabularyContext.tsx (new - vocabulary only)
│   ├── ProgressContext.tsx (refactored - progress only)
│   └── useMandarinContext.ts (updated to combine both contexts)
├── hooks/
│   ├── useVocabulary.ts (new - vocabulary operations)
│   └── useProgress.ts (refactored from useMandarinProgress)
├── store/
│   ├── VocabularyStore.ts (new - vocabulary loading & caching)
│   ├── ProgressStore.ts (new - progress tracking & persistence)
│   └── UserIdentityStore.ts (new - user/device identification)
└── types/
    ├── Vocabulary.ts (unchanged)
    ├── Progress.ts (updated with WordId references)
    └── User.ts (new - user/device identity types)
```

### Data Model Changes

1. **Progress Store Model**:

```typescript
// src/features/mandarin/types/Progress.ts
export type WordProgress = {
  wordId: string; // Reference to vocabulary item
  status: ProgressStatus; // 'new' | 'learning' | 'reviewing' | 'mastered'
  firstSeen: number; // timestamp
  lastReviewed: number; // timestamp
  reviewCount: number;
  correctCount: number;
  nextReviewDue: number; // timestamp for spaced repetition
  notes?: string; // user notes for this word
};

export type ListProgress = {
  listId: string; // Reference to vocabulary list
  started: number; // timestamp
  lastStudied: number; // timestamp
  completed: boolean;
  sections: {
    [sectionId: string]: {
      started: boolean;
      completed: boolean;
      wordIds: string[]; // reference to words in this section
    };
  };
};

export type UserProgress = {
  userId: string; // User or device identifier
  vocabularyProgress: Record<string, WordProgress>; // keyed by wordId
  listProgress: Record<string, ListProgress>; // keyed by listId
  lastSynced?: number; // timestamp of last sync, for future use
};
```

2. **User Identity Model**:

```typescript
// src/features/mandarin/types/User.ts
export type UserIdentity = {
  userId: string; // UUID for user/device
  displayName?: string; // Optional user display name
  createdAt: number; // timestamp
  lastActive: number; // timestamp
  preferences?: UserPreferences;
};

export type UserPreferences = {
  dailyGoal?: number;
  reviewFrequency?: "low" | "medium" | "high";
  theme?: "light" | "dark" | "system";
  // Additional user preferences
};
```

### Key Functionality Implementation

1. **ProgressStore**:

   - Local storage persistence with userId namespacing
   - CRUD operations for progress data using WordId references
   - Hooks for accessing progress by wordId or listId

2. **User Identity Management**:

   - Generate and persist device/user identifiers
   - Associate progress data with specific users
   - Create extensible model for future authentication integration

3. **Context & Provider Separation**:

   - VocabularyProvider for vocabulary content
   - ProgressProvider for user progress
   - Combined context access through useMandarinContext

4. **Component Refactoring**:
   - Update all components to use separated contexts
   - Modify progress references to use WordId
   - Ensure backward compatibility during transition

### Storage Implementation

1. **Local Storage Structure**:

```
localStorage:
├── vocabulary_lists (cached vocabulary lists)
├── vocabulary_words_<listId> (cached vocabulary words by list)
├── user_identity (user/device identifier)
└── progress_<userId> (progress data for specific user)
```

2. **Future Sync Preparation**:

```typescript
// Timestamp-based change tracking for future sync
type ChangeRecord = {
  entityType: "word" | "list" | "section";
  entityId: string;
  changedAt: number;
  changes: Record<string, any>;
};

// Local changes queue for offline-first operation
const trackChange = (userId: string, change: ChangeRecord) => {
  const changes = getLocalChanges(userId);
  saveLocalChanges(userId, [...changes, change]);
};
```

## Design Decisions & Tradeoffs

### Decisions

1. **Local Storage vs. IndexedDB**: Using localStorage for simplicity in this phase, with the understanding that larger datasets may require migration to IndexedDB in the future.

2. **Device ID First Approach**: Starting with device-based identification before implementing full user authentication to enable incremental development.

3. **Maintaining Context API Pattern**: Continuing with React Context rather than switching to a different state management library to preserve familiarity and avoid a more complex refactoring.

### Alternatives Considered

1. **Redux or MobX**: Considered but decided to maintain the Context API approach for state management to minimize changes to the application architecture.

2. **Backend-First Approach**: Considered developing a backend synchronization service first, but opted for local-first to ensure offline functionality and simplify the initial implementation.

3. **Embedding Limited Progress in Vocabulary**: Considered keeping some progress data with vocabulary for performance, but chose clean separation for better scalability.

## Known Issues & Limitations

1. **Migration Path**: Existing progress data will need migration to the new format, which may require a one-time conversion process.

2. **Performance with Large Datasets**: localStorage has size limitations and performance considerations with large datasets; future optimization may be needed.

3. **Limited Conflict Resolution**: The initial implementation will have basic timestamp-based conflict resolution, which may need enhancement for complex multi-device scenarios.

## Testing Information

### Unit Tests

Unit tests will focus on:

- ProgressStore CRUD operations
- User identity generation and management
- Data transformation between old and new formats

### Integration Tests

Integration tests will verify:

- Context providers working together
- Component behavior with the refactored architecture
- localStorage persistence and retrieval

### Migration Testing Checklist

- Verify existing progress data is properly migrated
- Test user experience across page refreshes
- Verify persistence of progress across sessions

## API Endpoints

For future synchronization capabilities, these API endpoints will be designed:

```
GET /api/progress/:userId
POST /api/progress/:userId/sync
GET /api/users/:userId/preferences
PUT /api/users/:userId/preferences
```

## Component Reference

Components affected by this refactoring:

1. **VocabularyListPage**: Update to use separate vocabulary and progress contexts
2. **FlashcardPage**: Modify to reference words by ID and look up progress separately
3. **ProgressContext**: Refactor to handle only progress data with WordId references
4. **All components using useMandarinContext**: Update to work with the separated contexts

## References

- [React Context API Documentation](https://reactjs.org/docs/context.html)
- [Local Storage vs IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [Offline-First Web Development](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [Current Progress Implementation](../../../src/features/mandarin/hooks/useMandarinProgress.ts)
