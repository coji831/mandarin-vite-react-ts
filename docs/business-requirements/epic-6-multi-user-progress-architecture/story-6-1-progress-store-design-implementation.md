# Story 6.1: Progress Store Design and Implementation

## Description

**As a** developer,
**I want to** create a dedicated ProgressStore with WordId references,
**So that** user progress can be managed independently from vocabulary content.

Create a dedicated ProgressStore with WordId-based references for managing user progress independently from vocabulary content. Key points:

- Design ProgressStore data structure with WordId references
- Implement storage and retrieval of progress data using localStorage
- Create utility functions for CRUD operations on progress data
- Add user/device identification for progress association
- Ensure backward compatibility with existing progress format

**Status:** Completed

## Acceptance Criteria

- [x] ProgressStore data structure is designed with WordId references
- [x] Storage and retrieval functions are implemented using localStorage
- [x] CRUD operations are available for progress data
- [x] Progress data is associated with user/device identification
- [x] Utility functions are created for common progress operations
- [x] Backward compatibility with existing progress format is maintained
- [x] Code reviewed and documented per project guides

## Implementation Details

### Completion Summary (2025-10-03)

- Implemented `ProgressStore.ts` utility for multi-user progress storage, user/device identity, and migration from old format.
- All CRUD and migration logic is encapsulated in a single, well-documented module.
- No breaking changes to the rest of the app; integration with hooks/context is deferred to later stories.
- Code reviewed and verified per project conventions and review checklist.

### Data Structure Design

1. Create a new Progress.ts file with updated types:

```typescript
// src/features/mandarin/types/Progress.ts

export type ProgressStatus = "new" | "learning" | "reviewing" | "mastered";

export type WordProgress = {
  wordId: string; // Reference to vocabulary item
  status: ProgressStatus;
  firstSeen: number; // timestamp
  lastReviewed: number; // timestamp
  reviewCount: number;
  correctCount: number;
  nextReviewDue?: number; // timestamp for spaced repetition
};

export type SectionProgress = {
  sectionId: string;
  started: boolean;
  completed: boolean;
  wordIds: string[]; // reference to words in this section
};

export type ListProgress = {
  listId: string; // Reference to vocabulary list name
  started: number; // timestamp
  lastStudied: number; // timestamp
  completed: boolean;
  dailyWordCount: number;
  sections: Record<string, SectionProgress>;
};

export type UserProgress = {
  userId: string; // User or device identifier
  vocabularyProgress: Record<string, WordProgress>; // keyed by wordId
  listProgress: Record<string, ListProgress>; // keyed by listId
};
```

2. Create a User.ts file for identification types:

```typescript
// src/features/mandarin/types/User.ts

export type UserIdentity = {
  userId: string; // UUID for user/device
  createdAt: number; // timestamp
  lastActive: number; // timestamp
};
```

### ProgressStore Implementation

1. Create the ProgressStore:

```typescript
// src/features/mandarin/store/ProgressStore.ts

import { v4 as uuidv4 } from "uuid";
import { UserProgress, WordProgress, ListProgress, SectionProgress } from "../types/Progress";
import { UserIdentity } from "../types/User";

// Constants
const USER_IDENTITY_KEY = "user_identity";
const PROGRESS_KEY_PREFIX = "progress_";

// User Identity Management
export function getUserIdentity(): UserIdentity {
  const storedIdentity = localStorage.getItem(USER_IDENTITY_KEY);

  if (storedIdentity) {
    return JSON.parse(storedIdentity);
  }

  // Create new identity if none exists
  const newIdentity: UserIdentity = {
    userId: uuidv4(),
    createdAt: Date.now(),
    lastActive: Date.now(),
  };

  localStorage.setItem(USER_IDENTITY_KEY, JSON.stringify(newIdentity));
  return newIdentity;
}

// Update last active timestamp
export function updateUserActivity(): void {
  const identity = getUserIdentity();
  identity.lastActive = Date.now();
  localStorage.setItem(USER_IDENTITY_KEY, JSON.stringify(identity));
}

// Progress Management
export function getUserProgress(userId: string): UserProgress {
  const storageKey = `${PROGRESS_KEY_PREFIX}${userId}`;
  const storedProgress = localStorage.getItem(storageKey);

  if (storedProgress) {
    return JSON.parse(storedProgress);
  }

  // Create new progress object if none exists
  const newProgress: UserProgress = {
    userId,
    vocabularyProgress: {},
    listProgress: {},
  };

  localStorage.setItem(storageKey, JSON.stringify(newProgress));
  return newProgress;
}

export function saveUserProgress(userId: string, progress: UserProgress): void {
  const storageKey = `${PROGRESS_KEY_PREFIX}${userId}`;
  localStorage.setItem(storageKey, JSON.stringify(progress));
}

// Word Progress Operations
export function getWordProgress(userId: string, wordId: string): WordProgress | undefined {
  const progress = getUserProgress(userId);
  return progress.vocabularyProgress[wordId];
}

export function updateWordProgress(
  userId: string,
  wordId: string,
  update: Partial<WordProgress>
): WordProgress {
  const progress = getUserProgress(userId);

  // Create or update word progress
  const existing = progress.vocabularyProgress[wordId] || {
    wordId,
    status: "new",
    firstSeen: Date.now(),
    lastReviewed: Date.now(),
    reviewCount: 0,
    correctCount: 0,
  };

  progress.vocabularyProgress[wordId] = {
    ...existing,
    ...update,
    lastReviewed: Date.now(),
  };

  saveUserProgress(userId, progress);
  return progress.vocabularyProgress[wordId];
}

// List Progress Operations
export function getListProgress(userId: string, listId: string): ListProgress | undefined {
  const progress = getUserProgress(userId);
  return progress.listProgress[listId];
}

export function updateListProgress(
  userId: string,
  listId: string,
  update: Partial<ListProgress>
): ListProgress {
  const progress = getUserProgress(userId);

  // Create or update list progress
  const existing = progress.listProgress[listId] || {
    listId,
    started: Date.now(),
    lastStudied: Date.now(),
    completed: false,
    dailyWordCount: 10, // default
    sections: {},
  };

  progress.listProgress[listId] = {
    ...existing,
    ...update,
    lastStudied: Date.now(),
  };

  saveUserProgress(userId, progress);
  return progress.listProgress[listId];
}

// Section Operations
export function updateSectionProgress(
  userId: string,
  listId: string,
  sectionId: string,
  update: Partial<SectionProgress>
): SectionProgress {
  const progress = getUserProgress(userId);

  // Ensure list progress exists
  if (!progress.listProgress[listId]) {
    updateListProgress(userId, listId, {});
  }

  // Create or update section progress
  const existing = progress.listProgress[listId].sections[sectionId] || {
    sectionId,
    started: false,
    completed: false,
    wordIds: [],
  };

  progress.listProgress[listId].sections[sectionId] = {
    ...existing,
    ...update,
  };

  saveUserProgress(userId, progress);
  return progress.listProgress[listId].sections[sectionId];
}

// Migration from old format (for backward compatibility)
export function migrateOldProgressFormat(): void {
  // Implementation to convert old format to new format
  // Will be detailed in a separate function
}
```

### Migration Utility

For backward compatibility, implement a migration function:

```typescript
// src/features/mandarin/store/migrationUtils.ts

import { getUserIdentity, getUserProgress, saveUserProgress } from "./ProgressStore";
import { UserProgress, WordProgress, ListProgress } from "../types/Progress";

export function migrateFromLegacyFormat(): void {
  // Check for legacy data
  const legacyData = localStorage.getItem("user_progress");
  if (!legacyData) return;

  try {
    // Parse legacy data
    const oldFormat = JSON.parse(legacyData);
    if (!oldFormat || !oldFormat.lists || !Array.isArray(oldFormat.lists)) return;

    // Get current user ID
    const { userId } = getUserIdentity();

    // Start with empty new format
    const newProgress: UserProgress = getUserProgress(userId);

    // Migrate each list
    for (const list of oldFormat.lists) {
      const listId = list.listName;

      // Create list progress
      if (!newProgress.listProgress[listId]) {
        newProgress.listProgress[listId] = {
          listId,
          started: Date.now(), // approximate
          lastStudied: Date.now(), // approximate
          completed: false,
          dailyWordCount: list.dailyWordCount || 10,
          sections: {},
        };
      }

      // Migrate sections
      if (list.sections && Array.isArray(list.sections)) {
        for (const section of list.sections) {
          const sectionId = section.sectionId;

          newProgress.listProgress[listId].sections[sectionId] = {
            sectionId,
            started: false, // Default
            completed: false, // Default
            wordIds: section.wordIds || [],
          };

          // Migrate word progress
          if (section.progress) {
            for (const [wordKey, oldWordProgress] of Object.entries(section.progress)) {
              // Use the word ID from the old format
              const wordId = wordKey;

              newProgress.vocabularyProgress[wordId] = {
                wordId,
                status: "learning", // Default for migrated words
                firstSeen: Date.now(), // approximate
                lastReviewed: Date.now(), // approximate
                reviewCount: oldWordProgress.count || 0,
                correctCount: oldWordProgress.correct || 0,
              };
            }
          }
        }
      }
    }

    // Save the migrated data
    saveUserProgress(userId, newProgress);

    // Optionally, back up but don't delete the legacy data
    localStorage.setItem("user_progress_legacy_backup", legacyData);
  } catch (error) {
    console.error("Error migrating legacy progress data:", error);
  }
}
```

### Testing Strategy

1. **Unit Tests**:

   - Test creating and retrieving user identity
   - Test CRUD operations for word progress
   - Test CRUD operations for list and section progress
   - Verify migration from old format to new format

2. **Manual Tests**:
   - Verify persistence across page refreshes
   - Check migration behavior with existing data
   - Test multiple user IDs in localStorage

## Related Issues

- Parent Epic: [Epic 6: Multi-User Progress Architecture](../README.md)
- Depends on: None
- Required for: [Story 6.2: Provider Separation and Context Refactoring](./story-6-2-provider-separation.md)

## Notes

- This implementation focuses on the core ProgressStore functionality without changing the components yet
- Migration utility is included but should be carefully tested with real data
- User identity is currently device-based but can be extended to account-based in the future
