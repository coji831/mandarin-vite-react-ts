# System Architecture

> **Purpose:** High-level system design decisions, architectural patterns, and technology choices.  
> **For Implementation Details:** See feature-specific docs in `apps/backend/docs/` and `apps/frontend/src/features/*/docs/`.

## Table of Contents

- [Overview](#overview)
- [Monorepo Structure](#monorepo-structure)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Data Flow & Integration](#data-flow--integration)
- [Caching Strategy](#caching-strategy)
- [Authentication & Multi-User](#authentication--multi-user)
- [Progress & Spaced Repetition System](#progress--spaced-repetition-system)
- [External Services](#external-services)

---

## Overview

PinyinPal is a **full-stack Mandarin learning platform** built with:

- **Frontend**: React 18 + TypeScript + Vite (deployed to Vercel)
- **Backend**: Node.js + Express (deployed to Railway)
- **Database**: PostgreSQL with Prisma ORM (hosted on Supabase)
- **Cache**: Redis (Upstash) for API response caching
- **External APIs**: Google Cloud TTS, Google Cloud Storage, Gemini AI

**Architecture Style:** Monorepo with npm workspaces, Clean Architecture on backend, Feature-Based Frontend

## Monorepo Structure

```
mandarin-vite-react-ts/
├── apps/
│   ├── frontend/          # React application (Vite + TypeScript)
│   └── backend/           # Express API (Node.js + Prisma)
├── packages/
│   ├── shared-types/      # Shared TypeScript interfaces
│   └── shared-constants/  # API routes, HSK levels, regex patterns
├── docs/                  # Architecture, guides, business requirements
├── content/              # Version-controlled content files (one JSON per entity)
│   ├── manifest.json
│   ├── characters/
│   ├── radicals/
│   ├── words/
│   ├── grammar/
│   └── chengyu/
└── terraform/             # Infrastructure as Code (GCS, IAM)
```

**See detailed structure:**

- Backend: [apps/backend/README.md](../apps/backend/README.md)
- Frontend: [apps/frontend/README.md](../apps/frontend/README.md)

## Backend Architecture

**Pattern:** Clean Architecture Modular Monolith

**Layer Separation (Modular Monolith):**

- **App Layer** (`src/app/`): Entry point, DI container (`container.js`), route registration (`routes.js`)
- **Module Layer** (`src/modules/*/`): Per-domain modules containing `api/` (controllers/routes), `services/` or `use-cases/` (business logic), `repositories/` (data access)
  - Current modules: `auth`, `gamification`, `progress`, `quiz`, `progression`, `tts`, `learning`, `examples`
- **Shared Layer** (`src/shared/`): Cross-cutting — `infrastructure/` (external clients, cache, database), `middleware/`, `utils/`, `config/`

**Dependency Rule:** API → Services/Use-Cases → Repositories → Infrastructure, never reverse

**Key Design Decisions:**

1. **Single Express App** (dev + prod): Unified behavior, no dual-backend maintenance
2. **ESM Modules**: Requires `.js` extensions in imports (Node.js ESM requirement)
3. **Dependency Injection**: Services accept repository/client dependencies for testability
4. **Fail-Open Caching**: Redis failures never block requests (degrades to API calls)
5. **Repository Pattern**: All database access through repositories (abstracts Prisma)

**See detailed documentation:**

- Backend structure: [apps/backend/README.md](../apps/backend/README.md)
- Backend design decisions: [apps/backend/docs/design.md](../apps/backend/docs/design.md)
- API specification: [apps/backend/docs/api-spec.md](../apps/backend/docs/api-spec.md)
- Database schema: [apps/backend/DATABASE.md](../apps/backend/DATABASE.md)

## Frontend Architecture

**Pattern:** Feature-Based Organization with Context API state management

**Structure:**

- **Features** (`src/features/`): Self-contained modules
  - **Auth**: User authentication and session management (LoginForm, RegisterForm, AuthContext)
  - **Dashboard**: Learning statistics and activity overview (LeechWidget, leechService)
  - **Foundations**: Phase 1 learning path with Pinyin, Tones, Strokes, and Animations reference content
  - **Gamification**: Streaks, badges, XP progress, mystery box rewards
  - **Quiz**: Quiz system with multiple question types and progress tracking
  - **Vocabulary**: Flashcard-based vocabulary learning with spaced repetition
- **Pages** (`src/pages/`): Route-level page orchestrators
  - `pages/learn/`: Learn section pages (FoundationsPage with 4 sub-tabs, ContentPlaceholderPage for locked sections)
- **Router** (`src/router/`): React Router configuration
  - `LearnRoutes.tsx`: Phase-gated route definitions for the `/learn/*` section with redirects from deprecated routes
- **Shared Layer** (`src/shared/`): Cross-cutting concerns
  - **api/**: HTTP client (axiosClient, aliased as `services`)
  - **components/**: Reusable UI primitives (Button, Input, ToggleSwitch, etc.)
  - **config/**: Application configuration (API_CONFIG)
  - **constants/**: Path constants, tone maps
  - **hooks/**: Shared React hooks (usePhaseGate for phase-gating access)
  - **layouts/**: AppLayout, LearnLayout (phase-gated route navigation with locked tab indicators)

**State Management:**

- **Pattern**: React Context + useReducer with split contexts and reducer composition
- **Provider Hierarchy**:
  ```
  BrowserRouter → AuthProvider (auth) → AppLayout → LearnLayout → ProgressProvider (quiz) + UserIdentityProvider (quiz)
  ```
- **Persistence**: Backend API (PostgreSQL) for progress, localStorage for device identity
- **Architecture**: Reducer composition with normalized state shape

**See detailed documentation:**

- Frontend structure: [apps/frontend/README.md](../apps/frontend/README.md)
- Feature modules: [apps/frontend/src/features/README.md](../apps/frontend/src/features/README.md)
- Frontend development guide: [Frontend Development Guide](./guides/setup/frontend-development.md)

#### Custom Data Fetching Hook

Story 16.2 introduced a custom React hook (`useExamples`) that mimics SWR behavior without external dependencies:

- **In-memory dedup:** Concurrent requests for the same (word, hskLevel, language) share a single promise for 60 seconds
- **sessionStorage cache:** Successful responses cached as JSON; on re-fetch, `sessionStorage` is checked before network
- **Cache invalidation:** 60-second TTL on the in-memory promise; explicit invalidation available via hook API
- **Hook API:** `const { data, isLoading, error, cacheHit } = useExamples(word, hskLevel, language)`
- **Use Case:** Word examples panel; reduces API calls for frequently viewed words
- **Rationale:** SWR not available in dependencies; custom hook pattern aligns with project architecture

**Integration Point:** Story 16.3 will integrate a real TTS audio endpoint (`GET /api/examples/audio`); no hook changes are required for that integration.

### Accessibility

**WCAG 2.1 AA Compliance:** Story 16.2 implements WCAG 2.1 AA patterns (ARIA labels, keyboard navigation, 44px+ touch targets, semantic HTML). See WordExamplesPanel for an example component pattern.

## Data Flow & Integration

**Content (static reference data) and User Data (dynamic progress) are separated at the storage layer and joined at query time.** See [Architecture Overview](../docs/architecture.md#content-data-flow) and [Content Registry Architecture](../verification-artifacts/content-registry-architecture.md) for the full design.

**Client → Server:**

```
Frontend Service → fetch(API_ROUTES.ttsAudio) → Vite Dev Proxy (dev) → Backend Controller
                                                 ↓
                                          Direct Request (prod)
```

**Backend Layers:**

```
Controller → Service (business logic) → Repository (database)
                ↓                            ↓
         External Client              Prisma ORM
         (Google TTS, Gemini)         (PostgreSQL)
                ↓
         Redis Cache (optional)
```

**Shared Constants:** `packages/shared-constants` ensures frontend/backend use identical API routes

**See detailed integration:**

- Vite proxy config: [Vite Setup Guide](./guides/setup/vite.md)
- Backend setup: [Backend Development Guide](./guides/setup/backend-development.md)

### Content Data Flow

Static content (characters, words, radicals, etc.) follows a separate path from dynamic user data:

```
┌───────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  content/*.json   │ ──► │  Seed Script /   │ ──► │  Prisma Content  │
│  (Git — versioned)│     │  Import Pipeline  │     │  Models (DB)     │
└───────────────────┘     └──────────────────┘     └────────┬────────┘
                                                            │
┌───────────────────┐     ┌──────────────────┐              │
│  review_log table │ ◄── │  CRUD Progress   │              │
│  (append-only)    │     │  API             │              │
└───────────────────┘     └──────────────────┘              │
                                                            ▼
                                                   ┌─────────────────┐
                                                   │  Read Model /   │
                                                   │  Query API      │
                                                   └─────────────────┘
```

**Key principles:**

- Content is authored in individual JSON files under `content/`, one per entity
- Entity relationships are stored in DB junction tables (CharacterRadical, WordCharacter, etc.)
- Dynamic user data uses CRUD with an append-only `review_log` side-effect table
- The Read Model pre-joins content + relationships + progress for query optimization

## Caching Strategy

**Pattern:** Cache-Aside with Fail-Open

**Cached Resources:**

- **TTS Audio**: 24-hour TTL, SHA256-keyed, Base64-encoded binary storage
- **AI Feedback**: 24-hour TTL, keyed per word+answer combination
- **Due Words**: 5-minute TTL per user
- **Quiz Sessions**: 24-hour TTL per user

**Performance:**

- **Hit Rate**: 75% (TTS) after warmup
- **Latency**: <20ms (cache hit) vs 1.5-5s (API call + generation)
- **Cost Savings**: >50% reduction in Google Cloud API costs

**Error Handling:**

- Redis failures return `null` (treated as cache miss)
- Requests always complete, using live API if cache unavailable
- Monitoring via `/api/v1/health` endpoint exposes hit/miss metrics

**See detailed implementation:**

- Redis caching guide: [Caching Patterns Guide](./guides/operations/caching-patterns.md)

## Authentication & Multi-User

**Pattern:** JWT with Refresh Token Rotation

**Token Strategy:**

- **Access Token**: 15-minute expiration, httpOnly cookie, used for API auth
- **Refresh Token**: 7-day expiration, stored in database, rotated on each refresh
- **Rotation**: Prevents replay attacks (each refresh issues new token, invalidates old)

**Password Security:**

- bcrypt hashing with cost factor 10
- Rate limiting: 5 login attempts per minute per IP

**Progress Isolation:**

- All progress records filtered by `userId` (from JWT claims)
- Foreign key constraints ensure referential integrity
- Unique constraint on `(userId, wordId)` prevents duplicates

**Cross-Device Sync:**

- Progress automatically synced to PostgreSQL via `/api/v1/progress/*` endpoints
- Frontend uses optimistic updates (immediate UI response, server reconciliation)

**See detailed implementation:**

- Auth system: [apps/backend/docs/api-spec.md](../apps/backend/docs/api-spec.md#authentication)
- Environment setup: [Environment Setup Guide](./guides/getting-started/environment-setup.md)

## Progress & Spaced Repetition System

**Pattern:** Quiz-based exponential backoff algorithm

**Core Formula:**

```
newDelay = correct ? min(365, currentDelay * 2) : 1
```

**Progression:** 1 → 2 → 4 → 8 → 16 → 32 → 64 → 128 → 256 → 365 days (max)

**Performance Multipliers:**

- **Quiz Correct**: Double the interval (exponential backoff), capped at 365 days
- **Quiz Incorrect**: Reset to 1 day (immediate review)

**Progress Tracking:**

- **Study Metrics**: `studyCount`, `correctCount`, `nextReview`, `currentDelay`
- **Quiz Metrics**: `lapseCount` (consecutive failures for leech detection)
- **Session Records**: `QuizSessionAnswer` table logs every quiz answer with timestamp, question type, correctness, and time spent

**Leech Detection:**

- Words with `lapseCount >= 5` flagged as "leeches" (high-difficulty vocabulary)
- Accessible via `GET /api/v1/learning/leeches` endpoint
- Sorted by struggle intensity (highest lapseCount first)
- Enables targeted review for 15% of words causing 50% of failures (Pareto principle)

**Quiz Session Endpoints (Primary):**

- `POST /api/v1/quiz/session/start` - Start or resume a session (returns 10 questions, handles daily check)
- `POST /api/v1/quiz/session/:sessionId/answer` - Submit answer, receive feedback + AI explanation if incorrect
- `GET /api/v1/quiz/session/:sessionId/summary` - Retrieve completed session metrics (XP, accuracy, badges)

**Learning Endpoints (Stateless / Supplementary):**

- `GET /api/v1/learning/due` - Fetch words requiring review (based on `nextReview <= date`)
- `POST /api/v1/learning/result` - Save quiz answer directly, adjust spaced repetition
- `GET /api/v1/learning/leeches` - Fetch struggling vocabulary for targeted practice

**Progression System:**

- **Phase Gating**: Users progress through 4 learning phases (Phase 1: Foundations, Phase 2: Characters, Phase 3: Readers, Phase 4: Mastery). Each phase has a gate quiz requirement to unlock the next. Phase gate state is stored server-side in PostgreSQL and cached in sessionStorage with a 5-minute TTL.
- **Foundation Progress**: Tracked per-section (Pinyin, Tones, Strokes, Animations) via the `progression` backend module. Records auto-initialize on first GET for new users. Section IDs are defined in `packages/shared-constants/` for cross-cutting validation.
- **API module**: `apps/backend/src/modules/progression/` — handles phase gating, foundation completion tracking, and quiz attempts.

**See detailed documentation:**

- Spaced repetition algorithm: [docs/knowledge-base/spaced-repetition-algorithms.md](./knowledge-base/spaced-repetition-algorithms.md)
- API specification: [apps/backend/docs/api-spec.md](../apps/backend/docs/api-spec.md#progress-tracking-endpoints)

## External Services

**Google Cloud Platform:**

| Service             | Purpose                         | Client Location                                         | Configuration                |
| ------------------- | ------------------------------- | ------------------------------------------------------- | ---------------------------- |
| Text-to-Speech      | Audio generation for vocabulary | `src/shared/infrastructure/external/GoogleTTSClient.js` | `GOOGLE_TTS_CREDENTIALS_RAW` |
| Cloud Storage (GCS) | Audio/file storage              | `src/shared/infrastructure/external/GCSClient.js`       | `GCS_BUCKET_NAME`            |
| Gemini AI           | AI feedback & examples          | `src/shared/infrastructure/external/GeminiClient.js`    | `GEMINI_API_CREDENTIALS_RAW` |

**Upstash Redis:**

- **Purpose**: API response caching (TTS, AI feedback, quiz sessions, due words)
- **Client**: `src/shared/infrastructure/cache/CacheService.js`
- **Configuration**: `REDIS_URL` (auto-injected by Railway)

**Supabase PostgreSQL:**

- **Purpose**: User accounts, progress tracking, authentication, gamification
- **Client**: Prisma ORM (`src/shared/infrastructure/database/client.js`)
- **Configuration**: `DATABASE_URL`
- **Key Tables**: `users`, `progress`, `refresh_tokens`, `QuizSession`, `QuizSessionAnswer`, `QuizSessionSummary`, `study_streaks`, `user_badges`

**Gamification System:**

- **Streak Tracking**: 48-hour grace period with freeze currency system (earn per 10 perfect quizzes)
- **Badge Awards**: 4 milestone tiers (7/30/100/365-day streaks), mystery box exclusive variants
- **XP System**: +10 base per correct answer, +5 bonus for 7+ day streaks, 500 XP daily cap
- **Mystery Boxes**: 5% drop rate on 7-day multiples, random rewards (50 XP / 1 freeze / rare badge)
- **API Endpoints**: `GET /api/v1/progress/streak`, `POST /api/v1/progress/streak/freeze`, `GET /api/v1/gamification/badges`

**AI Feedback System:**

- **Purpose**: Personalized error explanations for incorrect quiz answers using Gemini API
- **Delivery**: Auto-generated inline with answer submission (`POST /api/v1/quiz/session/:sessionId/answer`); only returned when incorrect
- **Error Classification**: Tone errors (mā vs mǎ), character confusion (妈 vs 马), meaning mix-ups
- **Caching**: Redis 24-hour TTL, cache key per word+answer combination, ~70-80% cost reduction
- **Timeout Protection**: 3-second limit with graceful fallback to generic messages
- **Rate Limiting**: 10 requests/minute per user to prevent API abuse
- **Security**: Input sanitization (XSS prevention), JWT authentication required
- **Standalone Endpoint**: `POST /api/v1/quiz/feedback` (available for direct AI feedback requests)

## Deployment Architecture

**Production Environment:**

| Component | Platform | Trigger          | Runtime                     |
| --------- | -------- | ---------------- | --------------------------- |
| Frontend  | Vercel   | Push to `main`   | Node.js 20 (Vite build)     |
| Backend   | Railway  | Push to `main`   | Node.js 20 (Express server) |
| Database  | Supabase | Manual migration | PostgreSQL 15               |
| Cache     | Upstash  | Always-on        | Redis 7                     |

**Development Environment:**

- **Frontend**: Vite dev server (port 5173) with HMR
- **Backend**: Express with `tsx watch` (port 3001) hot reload
- **Proxy**: Vite proxies `/api/*` to localhost:3001 for seamless development

**CI/CD:**

- Automatic deployments on push to `main`
- Backend runs Prisma migrations on release (`railway.toml`)
- Frontend builds via Vercel with automatic preview URLs

**See deployment guides:**

- Backend: [Backend Development Guide](./guides/setup/backend-development.md#deployment)
- Environment variables: [Environment Setup Guide](./guides/getting-started/environment-setup.md)

## Testing Strategy

**Backend (Vitest):**

- **Unit Tests**: Services, repositories, utilities (mocked dependencies)
- **Integration Tests**: Full API flows with test database (transactional isolation)
- **Coverage Target**: >80% for business logic

**Frontend (Jest + React Testing Library):**

- **Component Tests**: Render behavior, user interactions, accessibility
- **Hook Tests**: Custom hooks with `renderHook` utility
- **Integration Tests**: Feature flows with mocked backend

**See testing guides:** [Frontend Testing](./guides/testing/frontend.md) | [Backend Testing](./guides/testing/backend.md)

## Key Architecture Patterns

**Backend:**

- **Clean Architecture**: Controllers → Services → Repositories (strict layer boundaries)
- **Repository Pattern**: Abstracts Prisma ORM, enables testing with mocks
- **Dependency Injection**: Services receive dependencies via constructor/factory
- **Fail-Open Caching**: Redis failures degrade gracefully to API calls

📖 **Deep Dive:** [Backend Architecture Patterns](./knowledge-base/backend-architecture.md) - Layered architecture, CORS, middleware patterns

**Frontend:**

- **Feature-Based**: Self-contained modules with own components/hooks/services
- **Split Context**: Separate state/dispatch contexts prevent unnecessary re-renders
- **Reducer Composition**: Domain sub-reducers combined into root reducer
- **Normalized State**: `itemsById` + `itemIds` for O(1) lookups, immutable updates

**Shared:**

- **Monorepo**: Shared types/constants ensure API contract consistency
- **Fail-Fast Validation**: Input validation at API boundary (controllers)
- **Structured Logging**: Consistent log format for debugging and monitoring

## Related Documentation

- **Implementation Details**: [docs/issue-implementation/](./issue-implementation/)
- **Business Requirements**: [docs/business-requirements/](./business-requirements/)
- **Development Guides**: [docs/guides/](./guides/)
- **Knowledge Base**: [docs/knowledge-base/](./knowledge-base/)

- **Code Conventions**: [Backend Conventions](./guides/conventions/backend.md)

---

**Last Updated:** January 29, 2026

### Frontend: WordExamplesPanel Component (Story 16.2)

- **Location:** `apps/frontend/src/features/word/components/WordExamplesPanel.tsx`
- **Purpose:** Display 3–5 examples inline with on-demand TTS playback
- **Data Flow:**
  `     useExamples (custom hook)
       ↓ [in-memory 60s dedupe + sessionStorage cache]
       ↓ POST /api/examples (Story 16.1)
WordExamplesPanel (render list)
       ↓ [user clicks Play]
       ↓ GET /api/examples/audio (mocked, Story 16.3 integrates real)
audioService.playAudio()`
- **Performance:** Cached payloads <500ms (sessionStorage hit); skeleton UX reduces perceived latency
- **Accessibility:** ARIA labels, keyboard focus, `role=list/listitem`
- **Analytics:** Tracks `examples_shown`, `example_played` (stub service, ready for real backend)
