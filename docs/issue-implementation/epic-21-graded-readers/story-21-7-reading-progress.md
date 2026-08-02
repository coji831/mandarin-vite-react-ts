# Implementation 21-7: Reading Progress

**Last Updated:** July 30, 2026

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-7-reading-progress.md`

## Technical Scope

Add reading progress tracking: Zustand readingStore, backend session/bookmark API endpoints, auto-save with debounce and beforeunload, restore-on-reopen flow.

**Files:**

- `packages/shared-constants/src/index.js` — add route constant functions
- `packages/shared-constants/src/index.d.ts` — add route constant type declarations
- `apps/frontend/src/features/readers/stores/readingStore.ts` — Zustand store (extend existing)
- `apps/frontend/src/features/readers/hooks/useAutoSaveProgress.ts` — auto-save hook (NEW)
- `apps/frontend/src/features/readers/components/ReadingView.tsx` — restore flow + integration
- `apps/frontend/src/features/readers/components/PassageCard.tsx` — bookmark/completion indicators
- `apps/backend/prisma/schema.prisma` — ReadingSession, Bookmark models (created in Story 21.1)
- `apps/backend/src/modules/readers/api/ReadersController.ts` — session + bookmark endpoints (existing class)
- `apps/backend/src/modules/readers/services/ReadersService.ts` — session + bookmark business logic (existing class)
- `apps/backend/src/modules/readers/repositories/ReadersRepository.ts` — session + bookmark persistence (existing class)

## Implementation Details

### ROUTE_PATTERNS — Add to `packages/shared-constants/src/`

```javascript
// New constants to add to existing readers routes object:
readersSessionByPassageId: (id) => `/v1/readers/sessions/${id}`,
readersSessionCompleteByPassageId: (id) => `/v1/readers/sessions/${id}/complete`,
readersBookmarks: "/v1/readers/bookmarks",
readersBookmarkByPassageId: (id) => `/v1/readers/bookmarks/by-passage/${id}`,
```

### Type declarations — Add to `packages/shared-constants/src/index.d.ts`

```typescript
readonly readersSessionByPassageId: (id: string) => string;
readonly readersSessionCompleteByPassageId: (id: string) => string;
readonly readersBookmarks: string;
readonly readersBookmarkByPassageId: (id: string) => string;
```

### API Endpoints

| Method   | Endpoint                                      | Auth     | Description                                                                  |
| -------- | --------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| `GET`    | `/v1/readers/sessions/:passageId`             | Required | Get or create reading session (returns `{ currentSentence, isCompleted }`)   |
| `PUT`    | `/v1/readers/sessions/:passageId`             | Required | Update position. Body: `{ currentSentence: number }`                         |
| `POST`   | `/v1/readers/sessions/:passageId/complete`    | Required | Mark passage completed. Idempotent. Returns `{ passageId }`                  |
| `GET`    | `/v1/readers/bookmarks`                       | Required | List bookmarked passage IDs. Returns `{ bookmarks: string[] }`               |
| `POST`   | `/v1/readers/bookmarks`                       | Required | Add bookmark. Body: `{ passageId }`. Returns `{ passageId }`                 |
| `DELETE` | `/v1/readers/bookmarks/by-passage/:passageId` | Required | Remove bookmark by passage ID                                                |
| `GET`    | `/v1/readers/bookmarks/by-passage/:passageId` | Required | Check if a single passage is bookmarked. Returns `{ isBookmarked: boolean }` |

**Design note:** The client never stores bookmark IDs — only passage IDs. All bookmark operations are by-passage. The `GET /v1/readers/bookmarks` list endpoint returns an array of passage IDs for simplicity.

### readingStore Interface (Zustand)

```typescript
interface ReadingStore {
  // Session state
  currentPassageId: string | null;
  currentSentence: number;
  completedPassages: Set<string>;
  bookmarkedPassages: Set<string>;
  isAuthenticated: boolean; // or reads from auth context

  // Actions — local (optimistic) update then background sync
  setCurrentSentence: (sentence: number) => void;
  markCompleted: (passageId: string) => void;
  toggleBookmark: (passageId: string) => void;

  // Backend sync
  saveProgress: () => Promise<void>; // PUT current position — no-op if !isAuthenticated
  restoreSession: (passageId: string) => Promise<void>; // GET + scroll to position
  fetchBookmarks: () => Promise<void>; // GET bookmarks list on mount
  syncBookmark: (passageId: string, bookmarked: boolean) => Promise<void>; // POST or DELETE

  // Guest fallback
  // When isAuthenticated === false, saveProgress() is a no-op.
  // All state is ephemeral (cleared on tab close).
}
```

**Optimistic update semantics:** Store updates immediately (toggleBookmark flips the Set before the network call). Backend sync follows asynchronously. If the network call fails, the optimistic update is reverted.

**Guest fallback:** `saveProgress` checks `isAuthenticated` first — if false, it returns immediately without making any network request. The store still tracks position/state in memory, but nothing persists across sessions.

### PassageSummary Type

```typescript
interface PassageSummary {
  id: string;
  title: string;
  hskLevel: number;
  knownWordRatio: number;
  isCompleted?: boolean; // added — set from readingStore.completedPassages
  isBookmarked?: boolean; // added — set from readingStore.bookmarkedPassages
}
```

### useAutoSaveProgress Hook

```
File: apps/frontend/src/features/readers/hooks/useAutoSaveProgress.ts

Behavior:
1. Registers 'beforeunload' listener in useEffect (calls saveProgress() on unload)
2. Watches currentSentence from readingStore
3. Debounces 2s on sentence change — starts a timer, resets on each change
4. When debounce timer fires, calls readingStore.saveProgress()
5. On component unmount (useEffect cleanup), calls saveProgress() synchronously
6. Error handling: one silent retry attempt on failure, then console.warn and continue

Dependencies:
- readingStore (currentSentence, saveProgress, isAuthenticated)
- Must only activate when isAuthenticated === true
```

### Restore Flow

```
When ReadingView mounts a passage:

1. Component calls readingStore.restoreSession(passageId)
2. restoreSession dispatches GET /v1/readers/sessions/:passageId
3. Backend returns { currentSentence: number, isCompleted: boolean }
4. If currentSentence > 0:
   - Set readingStore.currentSentence = returned value
   - Scroll/jump to that sentence in the UI
5. If currentSentence === 0 (new passage or no saved session):
   - Start at sentence 0 (beginning of passage)
   - No scroll needed
6. If backend returns 404 (no session exists yet):
   - Backend creates session with currentSentence: 0
   - Start at sentence 0

Edge cases:
- If restore fails (network error), start at sentence 0 and continue — never block reading
- If passageId changes (user navigates to different passage), previous restore is discarded
- Bookmark list is fetched once on library mount via restoreSession
```

### Error Handling Strategy

| Operation             | Failure Behavior                                                                 |
| --------------------- | -------------------------------------------------------------------------------- |
| Auto-save (PUT)       | Silent retry (1 attempt, no exponential backoff). Log warning. Continue reading. |
| Bookmark (POST)       | Show small toast: "Could not save bookmark". Revert optimistic update.           |
| Un-bookmark (DELETE)  | Show small toast: "Could not remove bookmark". Revert optimistic update.         |
| Session restore (GET) | Log warning. Start at sentence 0. Continue reading.                              |
| Completion (POST)     | Silent retry (1 attempt). Log warning. Local completion state preserved.         |

**Principle:** Never block reading. All progress/bookmark operations are non-critical — the reading experience takes priority.

### DI Scope

No new classes needed. Session and bookmark methods are added to **existing** classes:

- **`ReadersController`** — Add route handlers for session GET/PUT, completion POST, bookmark GET/POST/DELETE/check-by-passage
- **`ReadersService`** — Add business logic: session upsert, completion toggle, bookmark CRUD, guest/no-op routing
- **`ReadersRepository`** — Add Prisma queries: `ReadingSession.upsert`, `ReadingSession.findUnique`, `Bookmark.create`/`delete`/`findMany`/`findFirst`

## Architecture Integration

```
[Story 21.7: Reading Progress]
├── readingStore (Zustand) → client state management
│   ├── currentSentence, currentPassageId → local position
│   ├── completedPassages → Set<string> (optimistic + sync)
│   ├── bookmarkedPassages → Set<string> (optimistic + sync)
│   └── isAuthenticated → gate for backend sync
├── useAutoSaveProgress (hook)
│   ├── debounce 2s on sentence change → saveProgress()
│   ├── beforeunload → saveProgress()
│   └── unmount → saveProgress()
├── Backend API (ReadersController → ReadersService → ReadersRepository)
│   ├── GET/PUT /sessions/:passageId → session position
│   ├── POST /sessions/:passageId/complete → completion
│   └── GET/POST/DELETE/GET /bookmarks[/by-passage/:passageId] → bookmark CRUD
└── ReadingView integration
    ├── Mount → restoreSession(passageId) → scroll to sentence
    ├── Sentence change → auto-save
    └── Final sentence → markCompleted
```

```
[Library View] → GET /bookmarks → populate bookmarkedPassages Set
              → readingStore.completedPassages → isCompleted on PassageCard
```

## Implementation Order

| Phase | What                                                                         | Why                                      |
| ----- | ---------------------------------------------------------------------------- | ---------------------------------------- |
| 1     | Route constants + shared types                                               | Foundation — everything depends on paths |
| 2     | Backend: session endpoints (GET/PUT) in ReadersController/Service/Repository | Enable position tracking                 |
| 3     | Backend: completion endpoint (POST)                                          | Enable completion marking                |
| 4     | Backend: bookmark endpoints (GET/POST/DELETE/check)                          | Enable bookmark CRUD                     |
| 5     | readingStore: interface + guest fallback + optimistic updates                | Client state management                  |
| 6     | useAutoSaveProgress hook + ReadingView restore integration                   | Auto-save + restore behavior             |
| 7     | PassageCard: bookmark/completion indicators + toggle                         | UI integration                           |

## Technical Challenges & Solutions

```
Problem: Reading state loss on unexpected tab close.
Solution: Immediate Zustand store + debounced backend sync (2s). beforeunload
         event for final save. Component unmount also triggers save. This gives
         three layers of protection against data loss.

Problem: Race condition — multiple saveProgress() calls in flight simultaneously.
Solution: Zustand store ensures currentSentence is always the latest value via
         set(). The backend PUT uses upsert by (userId, passageId), making it
         idempotent. Last write wins — acceptable for position tracking.

Problem: Guest users hitting 401 on session endpoints.
Solution: readingStore.isAuthenticated gate prevents any network call for guests.
         saveProgress() returns early. restoreSession() returns early with
         currentSentence=0. Components never see auth errors from session APIs.
```

## Testing

### Backend Tests

- **ReadersRepository tests:**
  - `upsertSession` creates new `ReadingSession` record when none exists
  - `upsertSession` updates `currentSentence` on existing session (idempotent)
  - `completePassage` marks `ReadingSession.isCompleted = true`
  - `completePassage` is idempotent (multiple calls don't error)
  - `createBookmark` creates one `Bookmark` per (userId, passageId)
  - `createBookmark` throws/returns gracefully on duplicate (unique constraint)
  - `deleteBookmarkByPassage` removes bookmark for given (userId, passageId)
  - `deleteBookmarkByPassage` is idempotent (no-op when no bookmark exists)
  - `findBookmarkByPassage` returns bookmark or null
  - `findSessionsById` returns session or null
  - `findAllBookmarks` returns array of passage IDs for user

- **ReadersService tests:**
  - `getOrCreateSession` delegates to repository and returns session
  - `getOrCreateSession` creates new session when 404
  - `updatePosition` validates `currentSentence >= 0`
  - `markCompleted` delegates to repository
  - `addBookmark` delegates to repository, returns passageId
  - `removeBookmarkByPassage` delegates to repository
  - `checkBookmarkByPassage` delegates to repository, returns boolean
  - `listBookmarks` delegates to repository, returns passage IDs
  - All methods propagate repository errors correctly

### Frontend Tests

- **readingStore tests:**
  - `setCurrentSentence` updates `currentSentence`
  - `markCompleted` adds passageId to `completedPassages` Set
  - `toggleBookmark` flips bookmark state optimistically
  - `toggleBookmark` reverts on sync failure (mock network error)
  - `saveProgress` is no-op when `isAuthenticated === false`
  - `restoreSession` calls API and sets `currentSentence`
  - `restoreSession` falls back to 0 on network error
  - `fetchBookmarks` populates `bookmarkedPassages` Set from API
  - Guest: all state changes work in-memory but `saveProgress` never fires
  - Guest: state clears on store reset

- **useAutoSaveProgress tests:**
  - Fires `saveProgress` after 2s debounce on sentence change
  - Resets debounce timer on rapid sentence changes
  - Calls `saveProgress` on `beforeunload` event
  - Calls `saveProgress` on component unmount
  - Does not fire when `isAuthenticated === false`
  - Silent retry: logs warning on failure, does not throw

## Implementation Status

- **Status**: Completed
- **Last Updated**: July 30, 2026

### Doc Truth-Check (Verify Against Code)
- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
