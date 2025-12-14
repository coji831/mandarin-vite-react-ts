# Epic 13: Production-Ready Multi-User Backend Architecture - Implementation

## Epic Summary

**Goal:** Implement production-grade backend system supporting multi-user authentication, per-user progress isolation, improved caching, and clean architecture for future .NET migration.

**Key Points:**

- Consolidate dual backends (local-backend + api/) into single monorepo with npm workspaces
- Implement JWT authentication with refresh tokens and bcrypt password hashing for secure multi-user support
- Integrate PostgreSQL + Prisma ORM for reliable data persistence with type-safe queries and migrations
- Add Redis caching layer to reduce external API costs by >50% and improve response times
- Structure code with clean architecture (Controllers/Services/Repositories) preparing for .NET migration

**Status:** Planned

**Last Update:** December 12, 2025

## Technical Overview

This epic transforms the current dual-backend system (local-backend + api/) into a single, production-ready backend with proper multi-user support, database persistence, and architecture patterns that enable future migration to .NET.

**Current Pain Points:**

- Dual backend duplication (local-backend/ + api/) causes development friction
- Single-user localStorage-only progress prevents cross-device sync
- Basic file-based caching lacks optimization for high-traffic scenarios
- Mixed frontend/backend code complicates independent deployment
- No clear migration path to alternative technologies

**Technical Objectives:**

- Deliver working multi-user system with secure authentication
- Establish clean architecture enabling gradual technology migration
- Improve performance through Redis caching (>50% API cost reduction)
- Eliminate dual backend maintenance burden
- Enable cross-device progress synchronization

**Technical Stack:**

- **Monorepo**: npm workspaces (Node.js built-in)
- **Backend**: Node.js 20+ with TypeScript + Express 5+
- **Database**: PostgreSQL 15+ with Prisma ORM 5+
- **Cache**: Redis 7+ (Upstash free tier)
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **Testing**: Jest + Supertest (integration tests)
- **Docs**: OpenAPI 3.1 (Swagger UI)
- **Deployment**: Vercel (serverless functions)

**Knowledge Base References:**

- [PostgreSQL Setup & Migrations](../../../knowledge-base/backend-database-postgres.md)
- [SQLite for Local Development](../../../knowledge-base/backend-database-sqlite.md)
- [Cloud Database Providers](../../../knowledge-base/backend-database-cloud.md)
- [Backend Architecture](../../../knowledge-base/backend-architecture.md)
- [Backend Advanced Patterns](../../../knowledge-base/backend-advanced-patterns.md)
- [Authentication](../../../knowledge-base/backend-authentication.md)
- [Caching Strategies](../../../knowledge-base/integration-caching.md)

## Architecture Decisions

1. **Monorepo with npm Workspaces (not Turborepo/Nx)**

   - **Rationale**: Lightweight, built-in to npm, sufficient for current scale (2 packages: frontend + backend)
   - **Alternatives**: Turborepo (more features but overkill for 2 packages), Nx (complex for small team), separate repos (harder to coordinate changes)
   - **Implications**: Simpler setup, can upgrade to Turborepo later if build caching becomes critical

2. **PostgreSQL + Prisma ORM**

   - **Rationale**: Postgres is proven, has free tier (Supabase/Neon), .NET compatible (EF Core can use same database). Prisma is TypeScript-first, generates types automatically, excellent DX
   - **Alternatives**: MongoDB (no strong need for schemaless), MySQL (Postgres has better JSON support), raw SQL (slower development, no type safety)
   - **Implications**: Schema migrations are versioned, can be shared with future .NET backend. Prisma client is heavy (bundle size) but acceptable for backend

3. **JWT Authentication (not OAuth/Passport yet)**

   - **Rationale**: Simple, stateless, sufficient for MVP. Can add Google/Facebook OAuth in future epic
   - **Alternatives**: Session-based auth (requires session store), OAuth (complex, not needed yet), Magic links (worse UX for repeat users)
   - **Implications**: Tokens expire after 15 minutes, refresh tokens required. Must handle token refresh gracefully in frontend

4. **Redis for Caching (Upstash free tier)**

   - **Rationale**: Fast, reliable, free tier available (10k requests/day), supports complex data types
   - **Alternatives**: Memcached (simpler but less features), In-memory (lost on redeploy), Database caching (slower)
   - **Implications**: Cache invalidation strategy required. Must handle Redis unavailable gracefully (fallback to database/API)

5. **Clean Architecture Layers (Controllers → Services → Repositories)**

   - **Rationale**: Separates concerns, business logic becomes framework-agnostic (can port to .NET), testable in isolation
   - **Alternatives**: Flat structure (faster for MVP but harder to migrate), Domain-driven design (too complex for current needs)
   - **Implications**: More files/folders (slightly slower initial development), but pays off during .NET migration (Services can be ported directly to C#)

6. **Vercel Deployment (not Railway/Render)**
   - **Rationale**: Already using Vercel for frontend, can deploy backend as serverless functions (zero cost for low traffic)
   - **Alternatives**: Railway (better for long-running processes), Render (free tier), Heroku (no free tier)
   - **Implications**: 10s timeout on serverless functions (hobby plan), requires connection pooling for database (Prisma supports this)

## Technical Implementation

### Architecture

**Clean Architecture Pattern:**

```
apps/backend/src/
├── api/                    # HTTP Layer (Express/Vercel handlers)
│   ├── routes/             # Route definitions
│   ├── middleware/         # Auth, validation, error handling
│   └── controllers/        # Request/response mapping
│
├── core/                   # Business Logic Layer (Migration-Ready)
│   ├── services/           # Pure business logic (framework-agnostic)
│   │   ├── ProgressService.ts
│   │   ├── VocabularyService.ts
│   │   ├── TTSService.ts
│   │   └── ConversationService.ts
│   ├── domain/             # Domain models and interfaces
│   └── use-cases/          # Application-specific logic
│
├── infrastructure/         # Data Access Layer
│   ├── database/           # Prisma client, repositories
│   ├── cache/              # Redis client
│   ├── storage/            # GCS client
│   └── external/           # Google Cloud APIs
│
└── shared/                 # Cross-cutting concerns
    ├── config/             # Environment configuration
    ├── errors/             # Custom error classes
    └── utils/              # Helper functions
```

**Data Flow:**

```
Client Request
    ↓
API Layer (Express/Vercel) → Middleware (Auth, Validation)
    ↓
Controllers (Request mapping)
    ↓
Services (Business Logic) ← Domain Models
    ↓
Repositories (Data Access)
    ↓
Database (PostgreSQL) / Cache (Redis) / External APIs (Google Cloud)
```

**Migration Path to .NET:**

1. `core/services/` → C# Services (business logic identical)
2. `infrastructure/` → EF Core repositories (schema stays same)
3. `api/` → ASP.NET controllers (OpenAPI spec preserved)

### API Endpoints

**Authentication Endpoints:**

```
POST /api/v1/auth/register
Body: { email: string, password: string, displayName?: string }
Response: { user: User, tokens: { accessToken: string, refreshToken: string } }

POST /api/v1/auth/login
Body: { email: string, password: string }
Response: { user: User, tokens: { accessToken: string, refreshToken: string } }

POST /api/v1/auth/refresh
Body: { refreshToken: string }
Response: { accessToken: string, refreshToken: string }

POST /api/v1/auth/logout
Headers: Authorization: Bearer <accessToken>
Body: { refreshToken: string }
Response: { success: true }
```

**Progress Endpoints:**

```
GET /api/v1/progress
Headers: Authorization: Bearer <accessToken>
Response: Progress[]

GET /api/v1/progress/:wordId
Headers: Authorization: Bearer <accessToken>
Response: Progress

PUT /api/v1/progress/:wordId
Headers: Authorization: Bearer <accessToken>
Body: { studyCount?: number, correctCount?: number, confidence?: number, ... }
Response: Progress

POST /api/v1/progress/batch
Headers: Authorization: Bearer <accessToken>
Body: { updates: Array<{ wordId: string, ... }> }
Response: Progress[]

GET /api/v1/progress/stats
Headers: Authorization: Bearer <accessToken>
Response: { totalWords: number, studiedWords: number, masteredWords: number, ... }
```

### Component Relationships

**Monorepo Structure:**

```
mandarin-vite-react-ts/
├── apps/
│   ├── frontend/           # React + Vite app
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── backend/            # Node.js + Express API
│       ├── src/
│       │   ├── api/
│       │   ├── core/
│       │   ├── infrastructure/
│       │   └── shared/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── package.json
│
├── packages/
│   ├── shared-types/       # Shared TypeScript interfaces
│   └── shared-constants/   # API paths, config
│
├── package.json            # Root workspace config
├── vercel.json             # Deployment config
└── docs/                   # Documentation
```

**Service Dependencies:**

```
AuthController → AuthService → UserRepository → Prisma → PostgreSQL
                            → SessionRepository → Prisma → PostgreSQL

ProgressController → ProgressService → ProgressRepository → Prisma → PostgreSQL
                                    → CacheService → Redis (optional)

TTSController → CachedTTSService → RedisCache → Redis
                                → GCSService → Google Cloud Storage
                                → TTSService → Google TTS API
```

## Testing Strategy

**Unit Tests:**

- Services layer (pure business logic, framework-agnostic)
- Auth utilities (token generation, validation)
- Cache layer with mock Redis

**Integration Tests:**

- API endpoints with test database (PostgreSQL or SQLite)
- Auth flow: register → login → refresh → logout
- Progress API with multiple users (data isolation verification)

**End-to-End Tests:**

- Full user journey: register → study vocabulary → sync progress
- Multi-device scenario: 2 devices, same user, verify sync

**Test Coverage Targets:**

- Services: >90%
- Controllers: >80%
- Overall: >85%

**Test Commands:**

```bash
# Run all tests
npm test

# Run backend tests only
npm test --workspace=apps/backend

# Run integration tests
npm run test:integration --workspace=apps/backend

# Run with coverage
npm run test:coverage --workspace=apps/backend
```

## Performance Considerations

**Caching Strategy:**

- Redis TTL: 24 hours for TTS audio URLs
- Redis TTL: 1 hour for conversation responses
- Cache key format: `{resource}:{params}:{hash}`
- Graceful fallback when Redis unavailable

**Database Optimization:**

- Indexes on frequently queried fields (userId, wordId, nextReview)
- Connection pooling via Prisma (5-10 connections)
- Batch operations for progress updates (reduce round trips)

**API Response Times (Target):**

- Authenticated requests: <100ms p95
- Cache hit: <50ms p95
- Cache miss (TTS): <2s p95
- Database queries: <50ms p95

**Monitoring:**

- Cache hit/miss rates logged
- API response times tracked
- Database query performance monitored
- Redis availability checked

## Security Considerations

**Authentication:**

- JWT access tokens: 15-minute expiry
- Refresh tokens: 7-day expiry, stored in database
- Passwords hashed with bcrypt (10 rounds)
- httpOnly cookies for refresh tokens (CSRF protection)

**API Security:**

- CORS enabled only for frontend domain (not wildcard)
- Rate limiting: 100 requests/min per IP
- Input validation via express-validator
- HTTPS only in production

**Data Isolation:**

- All progress queries filtered by authenticated userId
- No cross-user data leaks (verified in tests)
- Database-level constraints on unique userId+wordId

**Secret Management:**

- Environment variables for all secrets
- Never commit .env files
- Vercel secrets for production
- JWT secrets rotated quarterly

## Deployment Notes

**Environment Variables:**

Development (`.env.local`):

```bash
DATABASE_URL="postgresql://localhost:5432/mandarin_dev"
JWT_SECRET="dev-secret-change-in-production"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production"
REDIS_URL="redis://localhost:6379"
```

Production (Vercel Secrets):

```bash
vercel secrets add database_url "postgresql://user:pass@host/mandarin_prod"
vercel secrets add jwt_secret "$(openssl rand -base64 32)"
vercel secrets add jwt_refresh_secret "$(openssl rand -base64 32)"
vercel secrets add redis_url "redis://user:pass@upstash-host"
```

**Vercel Configuration (`vercel.json`):**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "apps/backend/src/api/**/*.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "apps/backend/src/api/$1" },
    { "src": "/(.*)", "dest": "apps/frontend/$1" }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret",
    "JWT_REFRESH_SECRET": "@jwt_refresh_secret",
    "REDIS_URL": "@redis_url"
  }
}
```

**Health Check Endpoint:**

```
GET /api/health
Response: {
  status: 'ok',
  database: 'connected',
  redis: 'connected' | 'unavailable',
  timestamp: ISO8601
}
```

**Deployment Steps:**

1. Run migrations: `npm run db:migrate --workspace=apps/backend`
2. Build frontend: `npm run build:frontend`
3. Build backend: `npm run build:backend`
4. Deploy to Vercel: `vercel --prod`
5. Verify health check: `curl https://app.vercel.app/api/health`

## Story Implementation Details

### Story 13.1: Monorepo Structure Setup

- Set up npm workspaces with apps/frontend and apps/backend
- Create packages/shared-types and packages/shared-constants
- Configure root package.json with workspace scripts
- Update Vercel deployment configuration
- **Success Criteria**: `npm run dev` runs both frontend and backend

### Story 13.2: Database Schema & ORM Configuration

- Define Prisma schema (User, Session, Progress, VocabularyWord models)
- Create initial migration
- Set up Prisma Client generation
- Create seed script for development data
- **Success Criteria**: Prisma Studio accessible, sample data loaded

### Story 13.3: JWT Authentication System

- Implement AuthService (register, login, refresh, logout)
- Create auth middleware (requireAuth)
- Build auth controllers and routes
- Add frontend auth UI (login/register forms)
- **Success Criteria**: Users can register, login, receive tokens

### Story 13.4: Multi-User Progress API

- Implement ProgressService (CRUD operations)
- Create progress controllers and routes
- Build data migration utility (localStorage → backend)
- Update frontend to use backend API
- **Success Criteria**: Per-user progress isolated, cross-device sync works

### Story 13.5: Redis Caching Layer

- Set up Redis client with graceful fallback
- Implement CachedTTSService
- Add cache metrics logging
- Load test cache performance
- **Success Criteria**: >50% reduction in external API calls

### Story 13.6: Clean Architecture Preparation

- Refactor code into clean architecture layers
- Generate OpenAPI/Swagger documentation
- Document .NET migration guide
- Code review and quality gates
- **Success Criteria**: Services are framework-agnostic, OpenAPI spec accessible

## Related Implementation Docs

- [Story 13.1: Monorepo Setup](./story-13-1-monorepo-setup.md) (to be created)
- [Story 13.2: Database Schema](./story-13-2-database-schema.md) (to be created)
- [Story 13.3: Authentication](./story-13-3-authentication.md) (to be created)
- [Story 13.4: Progress API](./story-13-4-progress-api.md) (to be created)
- [Story 13.5: Redis Caching](./story-13-5-redis-caching.md) (to be created)
- [Story 13.6: Clean Architecture](./story-13-6-clean-architecture.md) (to be created)

## Related Documentation

- [Epic 13 Business Requirements](../../business-requirements/epic-13-production-backend-architecture/README.md)
- [Architecture Overview](../../architecture.md)
- [Code Conventions](../../guides/code-conventions.md)
- [SOLID Principles](../../guides/solid-principles.md)
- [Git Convention Guide](../../guides/git-convention.md)
