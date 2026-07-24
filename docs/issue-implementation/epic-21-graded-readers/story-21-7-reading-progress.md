# Implementation 21-7: Reading Progress

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-7-reading-progress.md`

## Technical Scope

Add reading progress tracking: Zustand readingStore, backend session/bookmark API endpoints, auto-save with debounce and beforeunload.

**Files:**

- `apps/frontend/src/features/readers/stores/readingStore.ts` — Zustand store
- `apps/backend/prisma/schema.prisma` — ReadingSession, Bookmark models (created in Story 21.1)
- `apps/backend/src/modules/readers/api/ReadersController.ts` — session + bookmark endpoints
- `apps/backend/src/modules/readers/services/ReadersService.ts` — session + bookmark CRUD
- `apps/backend/src/modules/readers/repositories/ReadersRepository.ts` — session + bookmark persistence

## Implementation Details

### API Endpoints

| Method   | Endpoint                                   | Auth     | Description                                  |
| -------- | ------------------------------------------ | -------- | -------------------------------------------- |
| `GET`    | `/v1/readers/sessions/:passageId`          | Required | Get or create reading session                |
| `PUT`    | `/v1/readers/sessions/:passageId`          | Required | Update position. Body: `{ currentSentence }` |
| `POST`   | `/v1/readers/sessions/:passageId/complete` | Required | Mark passage completed                       |
| `GET`    | `/v1/readers/bookmarks`                    | Required | List bookmarked passage IDs                  |
| `POST`   | `/v1/readers/bookmarks`                    | Required | Add bookmark. Body: `{ passageId }`          |
| `DELETE` | `/v1/readers/bookmarks/:id`                | Required | Remove bookmark                              |

### readingStore (Zustand)

```typescript
interface ReadingStore {
  // Session state
  currentPassageId: string | null;
  currentSentence: number;
  completedPassages: Set<string>;
  bookmarkedPassages: Set<string>;

  // Actions
  setCurrentSentence: (sentence: number) => void;
  markCompleted: (passageId: string) => void;
  toggleBookmark: (passageId: string) => void;

  // Auto-save
  saveProgress: () => Promise<void>;
  restoreSession: (passageId: string) => Promise<void>;
}
```

### Auto-save Strategy

- Immediate local state update (Zustand)
- Debounced backend sync (2s debounce)
- `beforeunload` event for final save
- Upsert by (userId, passageId)

### Guest Users

- Ephemeral in-memory only
- No database writes
- State lost on tab close
- Zustand store handles both guest and authenticated paths

## Architecture Integration

```
[Story 21.7: Reading Progress]
├── readingStore (Zustand) → client state management
├── Backend API → session + bookmark CRUD
│   ├── GET/PUT /sessions/:passageId
│   ├── POST /sessions/:passageId/complete
│   └── GET/POST/DELETE /bookmarks
└── ReadingView integration → auto-save, completion, bookmarks
```

## Technical Challenges & Solutions

```
Problem: Reading state loss on unexpected tab close.
Solution: Immediate Zustand store + debounced backend sync (2s). beforeunload
         event for final save. Upsert by (userId, passageId) ensures idempotency.
```
