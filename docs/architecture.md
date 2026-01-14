# System Architecture

> Note: This project now uses a **monorepo structure** with npm workspaces. Frontend is in `apps/frontend/`, backend in `apps/backend/`, and shared packages in `packages/`. Several older docs reference legacy progress hooks (e.g., `useMandarinProgress` / `useProgressData`). The progress API has been migrated to a reducer + provider model — see `apps/frontend/src/features/mandarin/docs/design.md` for the current contract and migration notes.

This project is a Vite + React + TypeScript application for Mandarin vocabulary learning and related features.

## ConversationTurn Structure & Per-Turn Audio (Epic 12)

The backend Conversation API now returns a rich `ConversationTurn` structure for each turn, including:

- `speaker`: "A", "B", or descriptive name
- `chinese`: Mandarin text
- `pinyin`: Pinyin transcription
- `english`: English translation
- `audioUrl`: URL to audio for this turn

Audio is synthesized and stored per turn, and each turn references its audio by URL. This supports scalable storage, efficient frontend consumption, and future extensibility.

---

## Robust Service Layer for Audio & Conversation

The application implements a robust, type-safe service layer for all audio (TTS) and conversation (text generation) features. All backend interactions for audio and conversation are routed through dedicated service modules:

- **AudioService**: Implements `IAudioService`, supports backend swap and browser TTS fallback, with unified error handling and type-safe request/response.
- **ConversationService**: Implements `IConversationService`, supports backend swap/fallback, and uses type-safe request params.

### Backend Swap & Fallback

- Both services support backend swap and fallback logic via configuration or dependency injection.
- If the primary backend fails, the service layer automatically falls back to an alternate backend (e.g., browser TTS for audio).
- All error handling and fallback logic is centralized in the service layer, ensuring maintainability and reliability.

### Hooks

- **useAudioPlayback**: Centralizes audio playback logic, exposes play/stop/loading/error state, and handles all fallback/error logic.
- **useConversationGenerator**: Centralizes conversation generation, exposes generate/loading/error state, and handles all fallback/error logic.

All components use these hooks for audio and conversation features, ensuring a DRY and robust architecture.

## Main Modules

### Monorepo Structure

- **apps/frontend**: React + Vite frontend application
  - `src/features`: Feature-based organization (e.g., mandarin learning)
  - `src/components`: Reusable UI components
  - `src/router`: React Router configuration
  - `public/data/vocabulary`: CSV-based vocabulary data organized by HSK level
- **apps/backend**: Node.js + Express backend API (deployed to Railway in production)
  - `src/`: Core services, controllers, and business logic
  - `routes/`: Express route definitions
  - `prisma/`: Database schema and migrations
  - Deployed via `Procfile` to Railway for production
- **packages/shared-types**: Shared TypeScript type definitions
- **packages/shared-constants**: Shared constants (API endpoints, HSK levels, etc.)
- **docs**: Documentation structure for architecture, implementation, and templates

## Backend Architecture: Single Express Application

### Overview

The backend is located in `apps/backend/` and uses a **single Express application** for both development and production:

- **Development**: Local Express server on port 3001 with hot reload via `tsx watch`
- **Production**: Same Express app deployed to Railway via `Procfile`

This unified approach eliminates the dual-backend maintenance burden and ensures identical behavior across environments. The monorepo structure enables clean separation and code reuse through workspace packages.

### Express Backend Structure (`apps/backend/`)

**Folder Structure:**

```
apps/backend/
├── server.js                           # Express app entry point
├── config/
│   └── index.js                        # Environment variable parsing
├── routes/
│   └── index.js                        # Route aggregation
├── controllers/
│   ├── ttsController.js                # TTS endpoints
│   ├── conversationController.js       # Conversation endpoints
│   ├── healthController.js             # Health checks
│   └── scaffoldController.js           # Dev fixtures
├── src/
│   ├── api/
│   │   ├── controllers/
│   │   │   └── authController.js       # Authentication endpoints
│   │   ├── routes/
│   │   │   └── auth.js                 # Auth route definitions
│   │   └── middleware/
│   │       ├── authenticate.js         # JWT validation
│   │       └── rateLimiter.js          # Rate limiting
│   └── core/
│       ├── services/
│       │   ├── AuthService.js          # Auth business logic
│       │   ├── ttsService.js           # Google Cloud TTS client
│       │   ├── gcsService.js           # Google Cloud Storage
│       │   ├── geminiService.js        # Gemini API client
│       │   └── conversationService.js  # Conversation generation
│       └── repositories/
│           └── UserRepository.js       # Database access layer
├── prisma/
│   └── schema.prisma                   # Database schema
├── utils/
│   ├── hashUtils.js                    # Cache key generation
│   ├── logger.js                       # Structured logging
│   └── conversationUtils.js            # Parsing and formatting
├── Procfile                            # Railway deployment config
└── railway.toml                        # Railway build settings
```

**Handler Pattern:**

```javascript
// server.js - Express app entry point
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mainRouter from "./routes/index.js";

const app = express();

// Middleware
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api", mainRouter);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

// controllers/ttsController.js - Express route handler
export const generateTTSAudio = async (req, res) => {
  const { text, voice } = req.body;
  // ... business logic
  res.json({ audioUrl });
};
```

**Key Characteristics:**

- **Express Middleware**: CORS with credentials, cookie-parser for httpOnly cookies, rate limiting
- **JWT Authentication**: Access tokens (15min) + refresh tokens (7 days) in httpOnly cookies
- **Clean Architecture**: Controllers → Services → Repositories pattern
- **Database**: PostgreSQL with Prisma ORM, connection pooling via Supabase
- **Deployment**: Railway via Procfile, automatic migrations on release

**Endpoints:**

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login (returns JWT + sets refresh cookie)
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Clear refresh token
- `GET /api/v1/auth/me` - Get current user (requires authentication)
- `POST /api/tts` - Generate TTS audio
- `POST /api/conversation` - Generate conversation (text + audio)
- `GET /api/health` - Health check

### Deployment Configuration

**Railway Deployment (`Procfile`):**

```
web: npm run start
release: npx prisma migrate deploy
```

**Railway Build Configuration (`railway.toml`):**

```toml
[build]
builder = "RAILPACK"
buildCommand = "npm install && npx prisma generate --schema=apps/backend/prisma/schema.prisma"

[deploy]
startCommand = "npm run dev --workspace=@mandarin/backend"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
```

**Environment Variables (Production):**

- `DATABASE_URL`: PostgreSQL connection string (Supabase)
- `JWT_SECRET`: Access token signing key
- `JWT_REFRESH_SECRET`: Refresh token signing key
- `FRONTEND_URL`: CORS origin (e.g., `https://pinyinpal.vercel.app`)
- `GOOGLE_TTS_CREDENTIALS_RAW`: Google Cloud service account JSON
- `GEMINI_API_CREDENTIALS_RAW`: Gemini API service account JSON
- `GCS_BUCKET_NAME`: Google Cloud Storage bucket name
- `NODE_ENV`: `production`

**Development Commands:**

```bash
# Install dependencies (monorepo root)
npm install

# Run backend locally
npm run dev:backend              # Port 3001 with hot reload

# Run frontend locally
npm run dev:frontend             # Port 5173 with Vite

# Run both concurrently
npm run dev                      # Starts both frontend + backend

# Database operations
npm run db:migrate               # Run Prisma migrations
npm run db:studio                # Open Prisma Studio
npm run db:seed                  # Seed database with test data
```

### Shared Business Logic

**Services (100% Shared):**

All service files are **identical** between `api/_lib/services/` and `local-backend/services/`:

- `ttsService.js` - Google Cloud TTS client with lazy initialization
- `gcsService.js` - Google Cloud Storage operations (upload, download, exists, getPublicUrl)
- `geminiService.js` - Gemini API client with JWT authentication
- `conversationService.js` - Conversation generation with caching and parsing

**Services are pure functions with no Express or Vercel coupling**, enabling seamless code reuse.

**Configuration:**

- **Vercel (`api/_lib/config/`)**: Simplified, production-only, no mode validation
- **Local (`local-backend/config/`)**: Extended with mode switching (scaffold/real), development defaults

Both parse the same environment variables:

- `GOOGLE_TTS_CREDENTIALS_RAW` (JSON)
- `GEMINI_API_CREDENTIALS_RAW` (JSON)
- `GCS_CREDENTIALS_RAW` (JSON, optional)
- `GCS_BUCKET_NAME` (string)

### API Path Mapping

**Shared Constants (`shared/constants/apiPaths.js`):**

```javascript
export const API_ROUTES = {
  ttsAudio: "/api/tts",
  conversation: "/api/conversation",
  // Legacy aliases for local-backend
  conversationText: "/api/mandarin/conversation/text",
  conversationAudio: "/api/mandarin/conversation/audio",
};

export const ROUTE_PATTERNS = {
  ttsAudio: "/api/tts",
  conversationText: "/api/mandarin/conversation/text",
  conversationAudio: "/api/mandarin/conversation/audio",
};
```

**Frontend Service Layer:**

Frontend services use `API_ROUTES` constants and always point to Vercel-compatible paths:

```typescript
// apps/frontend/src/features/mandarin/services/audioService.ts
const response = await fetch(API_ROUTES.ttsAudio, {
  method: "POST",
  body: JSON.stringify({ text, language, voiceName }),
});

// apps/frontend/src/features/mandarin/services/conversationService.ts
const response = await fetch(API_ROUTES.conversation, {
  method: "POST",
  body: JSON.stringify({ type: "text", wordId, word }),
});
```

### Migration Benefits

1. **Code Reuse**: 100% of business logic shared between dev and production
2. **Consistency**: Identical service behavior in both environments
3. **Flexibility**: Express features (middleware, logging) for dev; Vercel scalability for prod
4. **Maintainability**: Single source of truth for business logic
5. **Testing**: Local backend enables comprehensive integration testing

### Development Workflow

- **Local Development**: `npm run dev:backend` (Express on port 3001)
- **Frontend Dev Server**: `npm run dev:frontend` (Vite on port 5173)
- **Both Simultaneously**: `npm run dev` (runs both with concurrently)
- **Production Deployment**: `vercel` (deploys `apps/backend/api/` handlers)

Frontend automatically points to correct backend based on environment:

- Dev: `http://localhost:3001` (if configured)
- Prod: Vercel API routes

## Module Interaction

- The frontend (React) interacts with backend APIs (e.g., TTS, conversation) via HTTP requests
- Frontend services use shared `API_ROUTES` constants for endpoint paths
- Features are organized in self-contained modules with their own components and logic
- Common UI elements are shared via the components directory
- Routing handles navigation between different features and pages
- Backend services (TTS, GCS, Gemini) are pure functions callable from both Express and Vercel handlers

## State Management

The application uses a **reducer-based architecture with React Context API** for centralized state management.

### Architecture Pattern

**Mandarin Feature State:**

- **Provider:** `ProgressProvider` wraps the Mandarin feature (in `MandarinLayout`)
- **State:** Managed via `useReducer` with composed sub-reducers
- **Persistence:** Automatic localStorage sync on state changes

### Reducer Composition

The root reducer combines three domain-specific sub-reducers:

1. **`vocabLists`**: Normalized vocabulary data (type: `ListState`)

- State: `{ itemsById: Record<wordId, WordBasic>, itemIds: string[] }`
- Handles: Vocabulary normalization and lookup

2. **`progress`**: Normalized progress data (type: `ProgressState`)

- Source: Backend API (`/api/v1/progress/*`) with JWT authentication
- State: `{ wordsById: Record<wordId, WordProgress>, wordIds: string[] }`
- Persistence: PostgreSQL database (user-isolated via `userId` foreign key)
- Selectors: Always use `selectWordsById(state)` - avoid direct state access
- Actions:
  - `PROGRESS/LOAD_ALL` - Batch load from backend on login
  - `MARK_WORD_LEARNED` - Optimistic update + API sync (confidence = 1.0)
  - `UNMARK_WORD_LEARNED` - Delete progress record (toggle mastery)
  - `PROGRESS/UPDATE_WORD` - Optimistic update before API response
  - `PROGRESS/SYNC_WORD` - Reconcile with authoritative server data
- Cross-Device Sync: Progress automatically syncs across devices via backend

3. **`user`**: User identity and preferences (type: `UserState`)

- State: `{ userId: string | null, preferences: Record<string, unknown> }`
- Handles: User/device identity and settings

4. **`ui`**: UI state and compatibility (type: `UiState`)

- State: `{ isLoading, lastUpdated, selectedList, selectedWords, masteredProgress, error }`
- Handles: UI flags, selection, and mastered word tracking

### Split Context Pattern

For performance optimization, state and dispatch are provided via separate contexts:

- **`ProgressStateContext`**: Read-only state access (type: `RootState`)
- **`ProgressDispatchContext`**: Action dispatch function

This prevents unnecessary re-renders when components only need to dispatch actions.

### Custom Hooks

**Reading State:**

```typescript
useProgressState(selector: (s: RootState) => T): T
```

- Memoized selector hook for granular subscriptions
- Always access via slice pattern: `s.ui.*`, `s.lists.*`, `s.user.*`
- Examples:
  - `useProgressState(s => s.ui?.selectedWords ?? [])`
  - `useProgressState(s => s.ui?.isLoading ?? false)`
  - `useProgressState(s => s.lists?.wordsById)`

**Updating State:**

```typescript
useProgressActions(): ActionCreators
```

- Returns stable, memoized action creator functions
- Available actions: `setSelectedList()`, `setSelectedWords()`, `markWordLearned()`, `setLoading()`, `setError()`, `setMasteredProgress()`, `resetProgress()`, `init()`
- Example: `const { markWordLearned } = useProgressActions()`

**User Identity:**

```typescript
useUserIdentity(): [UserIdentity, () => void]
```

- Manages user/device identity and persistence
- Returns: `[identity, refresh]` tuple

### Data Flow

```
Component
  ↓ (reads via selector)
useProgressState(s => s.ui.selectedWords)
  ↓
ProgressStateContext (RootState)
  ↑ (updates via reducer)
rootReducer(state, action)
  ↑ (dispatches action)
useProgressActions().markWordLearned(id)
  ↑ (calls action creator)
Component
```

### Multi-User Support (Epic 13)

- **Authentication (Story 13.3):** JWT-based authentication with refresh tokens
- **User Identity:** Tracked server-side via `userId` (from JWT)
- **Progress Isolation:** All progress records filtered by authenticated `userId`
- **Database:** PostgreSQL with Prisma ORM
  - `users` table: email, passwordHash, displayName, tokens
  - `progress` table: userId, wordId, studyCount, correctCount, confidence, nextReview
  - Unique constraint on `(userId, wordId)` prevents duplicates
- **Cross-Device Sync:** Progress automatically synced across devices via backend API
- **Security:** bcrypt password hashing, JWT token expiration, strict user isolation

### Persistence Strategy (Updated: Story 13.4)

- **Backend API:** Progress saved to PostgreSQL via `/api/v1/progress/*` endpoints
- **Optimistic Updates:** Frontend immediately updates UI before API response
- **Server Reconciliation:** API response is authoritative; reconciles with optimistic state
- **Spaced Repetition:** `nextReview` dates calculated server-side based on confidence
- **Migration Complete:** localStorage no longer used for progress (migrated in Story 13.4)
- **Selectors:** Always use `selectWordsById(state)` from `progressReducer.ts`

For detailed state management documentation, see [`apps/frontend/src/features/mandarin/docs/design.md`](../apps/frontend/src/features/mandarin/docs/design.md) and [`apps/frontend/src/features/mandarin/docs/api-spec.md`](../apps/frontend/src/features/mandarin/docs/api-spec.md).

- **Google Cloud Text-to-Speech**: Integration in [../apps/backend/api/tts.js](../apps/backend/api/tts.js)
- **Google Cloud Storage**: Used for caching generated audio files

- **Backend**: Express server and Vercel functions providing TTS/GCS/Conversation functionality

  - Production: Serverless functions in [../apps/backend/api/](../apps/backend/api/) directory
  - Development: Express server in [../apps/backend/src/](../apps/backend/src/) directory
  - Includes detailed logging and error handling for development

- **Mandarin Feature**: Contains vocabulary learning flow and flashcard system

  - Loads vocabulary data from CSV files in [../apps/frontend/public/data/vocabulary/](../apps/frontend/public/data/vocabulary/)
  - CSV data structure follows standard format: `No,Chinese,Pinyin,English`
  - Processes CSV data using [../apps/frontend/src/utils/csvLoader.ts](../apps/frontend/src/utils/csvLoader.ts) utility
  - Uses context-based state management (implemented in Epic 3)
  - Uses nested routing structure (implemented in Epic 4)
  - Organized as separate page components for each step in the learning workflow
  - **Multi-User Progress (Epic 6)**: Progress is now tracked per user. All progress state, persistence, and logic are user-specific. The system is ready for future backend or authentication integration.
  - **Progress Logic Extraction**: All progress calculation logic is handled by helpers in `progressHelpers.ts`.

- **Mandarin Feature: Vocabulary List UI (Epic 5)**

  - **Card-Based UI**: Vocabulary lists are displayed as interactive cards with metadata (word count, difficulty, tags) and progress indicators.
  - **Search & Filter**: Users can search by name/description and filter by difficulty or tags, with real-time updates and combined logic.
  - **Responsive Design**: Layout adapts to mobile, tablet, and desktop using CSS Grid/Flexbox. Touch targets and accessibility are ensured.
  - **Visual Feedback**: Cards provide hover, focus, and active states, with subtle animations and dark mode support.
  - **Components**:
    - `VocabularyListPage.tsx`: Main selection page with search/filter UI and card grid
    - `VocabularyCard.tsx`: Card component for each vocabulary list, showing metadata and progress
    - `VocabularyCard.css`: Styles for card layout, feedback, and responsiveness
  - **Implemented in Epic 5 (Stories 5.1–5.4)**

## Navigation & Routing

The Mandarin feature uses nested routing with React Router.

**Route Structure:**

```
/ (Root)
└── /mandarin/* (MandarinRoutes)
    ├── /mandarin/ → redirects to /vocabulary-list
    ├── /mandarin/vocabulary-list (VocabularyListPage)
    └── /mandarin/flashcards/:listId (FlashCardPage)
```

**Navigation Flow:**

1. User visits `/mandarin` → auto-redirects to `/mandarin/vocabulary-list`
2. User selects a vocabulary list → navigates to `/mandarin/flashcards/:listId`
3. `FlashCardPage` loads CSV data for the selected list
4. User studies flashcards and marks words as mastered
5. Progress auto-saves to localStorage
6. User returns to vocabulary list → sees updated progress percentages

**Implementation:**

- Routes defined in [`apps/frontend/src/router/Router.tsx`](../apps/frontend/src/router/Router.tsx)
- Path constants in [`apps/frontend/src/constants/paths.ts`](../apps/frontend/src/constants/paths.ts)
- Feature routes in [`apps/frontend/src/features/mandarin/router/MandarinRoutes.tsx`](../apps/frontend/src/features/mandarin/router/MandarinRoutes.tsx)

- **Architecture**: This file for system-level design
- **Implementation**: Detailed implementation notes in [./issue-implementation/](./issue-implementation/)
- **Business Requirements**: Planning and requirements in [./business-requirements/](./business-requirements/)
- **Feature-Specific**: For detailed design of specific features, see each feature's docs folder (e.g., [../apps/frontend/src/features/mandarin/docs/](../apps/frontend/src/features/mandarin/docs/))

## Future Architecture (Placeholders)

- **Authentication System**: [Not implemented yet]
- **Database Integration**: [Not implemented yet]
- **Server-Side Rendering**: [Not implemented yet]
- **Testing Strategy**: [Not implemented yet]
