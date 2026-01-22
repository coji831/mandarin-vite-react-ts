# Epic 13: Production-Ready Multi-User Backend Architecture - Implementation

## Epic Summary

**Goal:** Implement production-grade backend system supporting multi-user authentication, per-user progress isolation, improved caching, and clean architecture for future .NET migration.

**Key Points:**

- Consolidate dual backends (local-backend + api/) into single monorepo with npm workspaces
- Implement JWT authentication with refresh tokens and bcrypt password hashing for secure multi-user support
- Integrate PostgreSQL + Prisma ORM for reliable data persistence with type-safe queries and migrations
- Add Redis caching layer to reduce external API costs by >50% and improve response times
- Structure code with clean architecture (Controllers/Services/Repositories) preparing for .NET migration

**Status: Completed** (Stories 13.1-13.6 Complete)

**Last Update: 2026-01-22**

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

ConversationController → CachedConversationService → RedisCache → Redis
                                                  → ConversationService → Gemini API
```

## Story Implementations

### [Story 13.1: Monorepo Structure Setup](./story-13-1-monorepo-setup.md)

**Status**: ✅ Completed
**Key Deliverables**: npm workspaces configured, apps/frontend and apps/backend folders, package.json scripts

### [Story 13.2: Database Schema & ORM Configuration](./story-13-2-database-schema.md)

**Status**: ✅ Completed
**Key Deliverables**: Prisma schema with User, Progress, Word models, migration scripts, Supabase integration

### [Story 13.3: JWT Authentication System](./story-13-3-authentication.md)

**Status**: ✅ Completed
**Key Deliverables**: Register/login/refresh endpoints, bcrypt password hashing, JWT validation middleware, refresh token rotation

### [Story 13.4: Multi-User Progress API](./story-13-4-progress-api.md)

**Status**: ✅ Completed
**Key Deliverables**: Progress CRUD endpoints, per-user isolation, batch update API, stats aggregation, frontend migration from localStorage

### [Story 13.5: Redis Caching Layer](./story-13-5-redis-caching.md)

**Status**: ✅ Completed (2024-12-20)
**Branch**: epic-13-production-backend-architecture
**Commits**: bb70a7f, 3cfbaed, bcae1d0, 853b774, 82ab568, b7e950c

**Key Deliverables**:

- Cache abstractions: `RedisClient`, `RedisCacheService`, `NoOpCacheService`, factory pattern
- Domain-specific cached services: `CachedTTSService` (24h TTL), `CachedConversationService` (1h TTL)
- SHA256 cache key generation for deterministic caching
- Server integration: graceful shutdown, metrics middleware, health endpoint with Redis status
- Comprehensive testing: 34 passing tests (22 cache service + 12 cached service + 11 integration)
- Load testing infrastructure: Artillery config, LOAD_TEST_README.md
- Monitoring: Health endpoint with aggregated cache metrics (hits/misses/hitRate per service)
- Documentation: redis-caching-guide.md (400+ lines), API spec updates, expanded backend README

**Performance Results**:

- Integration tests: 66% hit rate achieved (exceeds 50% target)
- Expected production: <20ms p95 for cache hits vs 1.5-2.5s for misses
- > 75% TTS hit rate expected after warmup period
- Fail-open error handling ensures system functions without Redis

**Technical Highlights**:

- ES module architecture with manual mocks (Jest compatibility)
- Singleton RedisClient with static `getInstance()` method
- Synchronous factory to avoid race conditions
- ioredis-mock for integration tests (no Docker required)
- Cache-aside pattern with base64 audio storage, JSON conversation storage

**Files Changed**: 23 total (7 cache/config, 2 domain services, 5 server integration, 6 tests, 3 load testing/docs)

### [Story 13.6: Clean Architecture Preparation](./story-13-6-clean-architecture.md)

**Status**: Planned
**Key Deliverables**: Controllers/Services/Repositories refactor, OpenAPI spec, Swagger UI

```

```
