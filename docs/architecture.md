# System Architecture

> **Purpose:** High-level system design decisions, architectural patterns, and technology choices.  
> **For Implementation Details:** See feature-specific docs in `apps/backend/docs/` and `apps/frontend/src/features/*/docs/`.

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
└── terraform/             # Infrastructure as Code (GCS, IAM)
```

**See detailed structure:**

- Backend: [apps/backend/README.md](../apps/backend/README.md)
- Frontend: [apps/frontend/README.md](../apps/frontend/README.md)

## Backend Architecture

**Pattern:** Clean Architecture with 3 layers

**Layer Separation:**

- **API Layer** (`src/api/`): Controllers, routes, middleware (HTTP concerns)
- **Core Layer** (`src/core/`): Services, business logic (framework-agnostic)
- **Infrastructure Layer** (`src/infrastructure/`): Repositories, external clients, caching

**Dependency Rule:** Outer layers depend on inner (API → Core → Infrastructure, never reverse)

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

- **Features** (`src/features/`): Self-contained modules (mandarin, auth, etc.)
- **Shared Components** (`src/components/`): Reusable UI primitives
- **Routing** (`src/router/`): React Router configuration
- **Services** (per-feature): API clients, backend integration

**State Management:**

- **Pattern**: React Context + useReducer (split context for performance)
- **Persistence**: Backend API (PostgreSQL) for progress, localStorage for device identity
- **Architecture**: Reducer composition with normalized state shape

**See detailed documentation:**

- Mandarin feature design: [apps/frontend/src/features/mandarin/docs/design.md](../apps/frontend/src/features/mandarin/docs/design.md)

## Data Flow & Integration

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

- Vite proxy config: [docs/guides/vite-configuration-guide.md](./guides/vite-configuration-guide.md)
- Backend setup: [docs/guides/backend-setup-guide.md](./guides/backend-setup-guide.md)

## Caching Strategy

**Pattern:** Cache-Aside with Fail-Open

**Cached Resources:**

- **TTS Audio**: 24-hour TTL, SHA256-keyed, Base64-encoded binary storage
- **Conversations**: 1-hour TTL, SHA256-keyed, JSON structure with audio URLs

**Performance:**

- **Hit Rate**: 75% (TTS), 66% (Conversations) after warmup
- **Latency**: <20ms (cache hit) vs 1.5-5s (API call + generation)
- **Cost Savings**: >50% reduction in Google Cloud API costs

**Error Handling:**

- Redis failures return `null` (treated as cache miss)
- Requests always complete, using live API if cache unavailable
- Monitoring via `/api/health` endpoint exposes hit/miss metrics

**See detailed implementation:**

- Redis caching guide: [docs/guides/redis-caching-guide.md](./guides/redis-caching-guide.md)

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
- Environment setup: [docs/guides/environment-setup-guide.md](./guides/environment-setup-guide.md)

## External Services

**Google Cloud Platform:**

| Service             | Purpose                         | Client Location                                  | Configuration                |
| ------------------- | ------------------------------- | ------------------------------------------------ | ---------------------------- |
| Text-to-Speech      | Audio generation for vocabulary | `src/infrastructure/external/GoogleTTSClient.js` | `GOOGLE_TTS_CREDENTIALS_RAW` |
| Cloud Storage (GCS) | Audio/conversation file storage | `src/infrastructure/external/GCSClient.js`       | `GCS_BUCKET_NAME`            |
| Gemini AI           | Conversation generation         | `src/infrastructure/external/GeminiClient.js`    | `GEMINI_API_CREDENTIALS_RAW` |

**Upstash Redis:**

- **Purpose**: API response caching (TTS, conversations)
- **Client**: `src/infrastructure/cache/RedisCacheService.js`
- **Configuration**: `REDIS_URL` (auto-injected by Railway)

**Supabase PostgreSQL:**

- **Purpose**: User accounts, progress tracking, authentication
- **Client**: Prisma ORM (`src/infrastructure/database/client.js`)
- **Configuration**: `DATABASE_URL`

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

- Backend: [docs/guides/backend-setup-guide.md](./guides/backend-setup-guide.md#deployment)
- Environment variables: [docs/guides/environment-setup-guide.md](./guides/environment-setup-guide.md)

## Testing Strategy

**Backend (Vitest):**

- **Unit Tests**: Services, repositories, utilities (mocked dependencies)
- **Integration Tests**: Full API flows with test database (transactional isolation)
- **Coverage Target**: >80% for business logic

**Frontend (Jest + React Testing Library):**

- **Component Tests**: Render behavior, user interactions, accessibility
- **Hook Tests**: Custom hooks with `renderHook` utility
- **Integration Tests**: Feature flows with mocked backend

**See testing guide:** [docs/guides/testing-guide.md](./guides/testing-guide.md)

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
- **Code Conventions**: [docs/guides/code-conventions.md](./guides/code-conventions.md)

---

**Last Updated:** January 29, 2026
