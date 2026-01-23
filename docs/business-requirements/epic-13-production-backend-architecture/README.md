# Epic 13: Production-Ready Multi-User Backend Architecture

## Epic Summary

**Goal:** Build a production-grade backend system that supports multi-user authentication, per-user progress isolation, and improved caching.

**Key Points:**

- Consolidate dual backends (local-backend + api/) into single monorepo structure for easier maintenance
- Implement JWT authentication with multi-user support enabling cross-device progress synchronization
- Integrate PostgreSQL database with Prisma ORM for reliable data persistence and scalability
- Add Redis caching layer to reduce external API costs and improve response times by 50%+
- Structure code with clean architecture (Controllers/Services/Repositories) to prepare for future .NET migration

**Status: Completed** (Stories 13.1-13.6 Complete)

**Last Update: 2026-01-23** (Legacy scaffold mode removed)

## Background

The current system has evolved to include complex features (TTS, conversation generation, progress tracking) but faces critical architectural limitations that block production deployment for paying customers.

**Current Pain Points:**

1. **Dual Backend Duplication**: Maintaining `local-backend/` (Express) and `api/` (Vercel functions) creates development friction, deployment complexity, and inconsistent behavior between local and production environments.

2. **Single-User Limitations**: Progress tracking is device-based (localStorage) only, preventing true multi-user support and cross-device synchronization. This blocks the $1000 customer contract requirement for team-based learning.

3. **Basic Caching**: File-based caching in Google Cloud Storage works but lacks optimization for high-traffic scenarios. Every cache miss hits expensive external APIs (Google TTS, Gemini).

4. **Monolithic Frontend Repo**: Backend logic mixed with frontend code complicates scaling, testing, and team collaboration. Cannot deploy backend and frontend independently.

5. **Migration Readiness**: Current architecture doesn't support gradual migration of business logic to separate services or alternative technologies (future .NET backend for CPU-intensive features).

**Strategic Goals:**

- Deliver working multi-user system for production customer needs (immediate $1000 revenue)
- Establish clean architecture patterns to enable future technology migration without rewriting everything
- Improve system performance through strategic caching (reduce API costs, faster user experience)
- Eliminate dual backend maintenance burden (single codebase, single deployment, single truth)

## User Stories

This epic consists of the following user stories:

1. [**Story 13.1: Monorepo Structure Setup**](./story-13-1-monorepo-setup.md)
   - As a developer, I want to set up npm workspaces with apps/frontend and apps/backend, so that frontend and backend can be developed and deployed independently.

2. [**Story 13.2: Database Schema & ORM Configuration**](./story-13-2-database-schema.md)
   - As a developer, I want to configure PostgreSQL with Prisma ORM and define User, Progress, and Word models, so that user data persists reliably across sessions and devices.

3. [**Story 13.3: JWT Authentication System**](./story-13-3-authentication.md)
   - As a user, I want to register an account and log in with email/password, so that my progress is saved and accessible from any device.

4. [**Story 13.4: Multi-User Progress API**](./story-13-4-progress-api.md)
   - As a user, I want my progress to be saved per-user on the server, so that I can access my progress from any device without losing data.

5. [**Story 13.5: Redis Caching Layer**](./story-13-5-redis-caching.md) ✅ **Completed**
   - As a developer, I want to implement Redis caching for API responses, so that repeated requests are faster and reduce external API costs.
   - **Implementation**: 6 phases completed, 23 files changed, 34 tests passing
   - **Key Deliverables**: Cache abstractions, CachedTTSService (24h TTL), CachedConversationService (1h TTL), integration tests achieving 66% hit rate, Artillery load test config, comprehensive monitoring
   - **Performance**: <20ms p95 for cache hits vs 1.5-2.5s for misses, >75% expected TTS hit rate after warmup

6. [**Story 13.6: Clean Architecture Preparation for .NET Migration**](./story-13-6-clean-architecture.md)
   - As a developer, I want to structure backend code following clean architecture principles, so that business logic can be migrated to .NET in the future without rewriting everything.

## Story Breakdown Logic

This epic is divided into stories based on the following approach:

- **Stories 13.1-13.2** focus on infrastructure foundation (Planned) — Establishes monorepo, database, and ORM as the base for all subsequent work
- **Story 13.3** focuses on authentication (Planned) — Implements multi-user capability, blocking all user-specific features
- **Story 13.4** focuses on core business logic (Planned) — Migrates progress tracking (primary user value) to backend
- **Story 13.5** focuses on performance optimization (Planned) — Adds caching to reduce costs and improve speed
- **Story 13.6** focuses on architecture quality (Planned) — Refactors code structure to enable future migration

Each story builds upon the previous, ensuring incremental delivery with testable milestones. Stories 13.1-13.3 are prerequisites for 13.4. Story 13.5 can run in parallel with 13.6 if needed.

## Acceptance Criteria

- [ ] Multi-user system functional: Users can register, login, and maintain isolated progress (verify: create 2 users, check progress isolation in database)
- [ ] Authentication secure: JWT tokens with refresh mechanism, bcrypt password hashing (verify: JWT validation tests pass, passwords not stored in plaintext)
- [ ] Database reliable: PostgreSQL persisting all user data and progress with zero data loss (verify: stress test with 100+ concurrent users)
- [x] Caching effective: Redis reducing external API calls by >50%, API response times <200ms p95 (verified: integration tests show 66% hit rate, fail-open error handling working)
- [ ] Architecture clean: Controllers/Services/Repositories separation, OpenAPI spec published (verify: code review checklist, Swagger UI accessible at /api-docs)
- [ ] Production deployed: Backend running with health monitoring (verify: /health endpoint returns 200, Vercel deployment succeeds)
- [ ] Frontend migrated: All data fetching uses backend API, no local CSV loading for progress (verify: network tab shows API calls, localStorage cleared)
- [ ] Documentation complete: Architecture diagrams, API docs, deployment runbook (verify: docs/architecture.md updated, runbook tested by second developer)

## Architecture Decisions

- **Decision:** Monorepo with npm Workspaces (not Turborepo/Nx)
  - Rationale: Lightweight, built-in to npm, sufficient for current scale (2 packages: frontend + backend)
  - Alternatives considered: Turborepo (more features but overkill), Nx (complex for small team), separate repos (harder to coordinate changes)
  - Implications: Simpler setup, can upgrade to Turborepo later if build caching becomes critical

- **Decision:** PostgreSQL + Prisma ORM
  - Rationale: Postgres is proven, has free tier (Supabase/Neon), .NET compatible (EF Core can use same database). Prisma is TypeScript-first, generates types automatically, excellent DX.
  - Alternatives considered: MongoDB (no strong need for schemaless), MySQL (Postgres has better JSON support), raw SQL (slower development, no type safety)
  - Implications: Schema migrations are versioned, can be shared with future .NET backend. Prisma client is heavy (bundle size) but acceptable for backend.

- **Decision:** JWT Authentication (not OAuth/Passport yet)
  - Rationale: Simple, stateless, sufficient for MVP. Can add Google/Facebook OAuth in future epic.
  - Alternatives considered: Session-based auth (requires session store), OAuth (complex, not needed yet), Magic links (worse UX for repeat users)
  - Implications: Tokens expire after 15 minutes, refresh tokens required. Must handle token refresh gracefully in frontend.

- **Decision:** Redis for Caching (Upstash free tier)
  - Rationale: Fast, reliable, free tier available (10k requests/day), supports complex data types
  - Alternatives considered: Memcached (simpler but less features), In-memory (lost on redeploy), Database caching (slower)
  - Implications: Cache invalidation strategy required. Must handle Redis unavailable gracefully (fallback to database/API).

- **Decision:** Clean Architecture Layers (Controllers → Services → Repositories)
  - Rationale: Separates concerns, business logic becomes framework-agnostic (can port to .NET), testable in isolation
  - Alternatives considered: Flat structure (faster for MVP but harder to migrate), Domain-driven design (too complex for current needs)
  - Implications: More files/folders (slightly slower initial development), but pays off during .NET migration (Services can be ported directly to C#).

- **Decision:** Vercel Deployment (not Railway/Render)
  - Rationale: Already using Vercel for frontend, can deploy backend as serverless functions (zero cost for low traffic)
  - Alternatives considered: Railway (better for long-running processes), Render (free tier), Heroku (no free tier)
  - Implications: 10s timeout on serverless functions (hobby plan), requires connection pooling for database (Prisma supports this).

## Implementation Plan

1. Phase 1: Foundation (Stories 13.1-13.2) — Set up monorepo structure, configure database and ORM, deploy development environment
2. Phase 2: Authentication (Story 13.3) — Implement user registration, login, JWT token generation/validation, frontend auth integration
3. Phase 3: API Development (Story 13.4) — Build progress tracking REST API, migrate frontend to use backend endpoints, data migration utility for existing users
4. Phase 4: Performance (Story 13.5) — Integrate Redis caching for TTS/conversation responses, optimize API response times, load testing
5. Phase 5: Architecture Refinement (Story 13.6) — Refactor to clean architecture patterns, generate OpenAPI/Swagger documentation, code review and quality gates
6. Phase 6: Deployment & Testing — Integration tests for all endpoints, production deployment to Vercel, customer acceptance testing

**Timeline**: 3-4 weeks total (Week 1: Stories 13.1-13.3, Week 2-3: Stories 13.4-13.5, Week 3-4: Story 13.6 + testing + deployment)

## Risks & mitigations

- **Risk:** Database migration breaks existing users' progress — Severity: High
  - Mitigation: Create migration script to import localStorage data to backend, test thoroughly with 10+ beta users before production rollout, provide manual import UI as backup
  - Rollback: Keep localStorage sync enabled for first 2 weeks post-deployment (write to both localStorage and backend), can revert to localStorage-only mode via feature flag

- **Risk:** Auth security vulnerabilities (token theft, weak passwords) — Severity: High
  - Mitigation: Use proven JWT libraries (jsonwebtoken + bcrypt), implement rate limiting (express-rate-limit), security audit checklist before production, HTTPS only, httpOnly cookies for refresh tokens
  - Rollback: Emergency auth disable flag (APP_AUTH_ENABLED=false), revert to read-only mode if breach detected, rotate JWT secret immediately

- **Risk:** Redis downtime affecting user experience — Severity: Medium
  - Mitigation: Graceful fallback to database queries if Redis unavailable (try-catch around Redis calls), monitor cache hit rates and alert if <30%, use Upstash (99.9% SLA)
  - Rollback: Disable Redis integration via environment variable (USE_REDIS=false), all traffic goes to origin APIs/database

- **Risk:** Vercel serverless cold starts causing slow response (>1s) — Severity: Low
  - Mitigation: Use Vercel edge functions where possible, implement keep-alive ping every 5 minutes, optimize bundle size, measure p95 latency
  - Rollback: Migrate to Railway/Render if cold starts >500ms for >10% of requests (cost ~$5/month)

- **Risk:** Breaking changes for existing users (localStorage structure changes) — Severity: Medium
  - Mitigation: Provide smooth migration path (localStorage → backend sync on first login), preserve existing progress (never delete localStorage data for 30 days), clear user communication (email/in-app notification)
  - Rollback: Progressive rollout (20% users first week, monitor error rates), feature flag to disable backend sync (SYNC_TO_BACKEND=false)

## Implementation notes

- **Conventions**: Follow `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md` for all code
- **Testing**: Write integration tests for all API endpoints using supertest (minimum: happy path + 1 error case per endpoint)
- **Database**: Use Prisma migrations for schema changes (`npx prisma migrate dev`), never modify database schema manually
- **Environment**: Separate .env files for development, staging, production (use .env.example as template)
- **Monitoring**: Set up health check endpoint (`GET /health`) for deployment monitoring, returns 200 with database connectivity status
- **Security**: Enable CORS only for frontend domain (not wildcard), implement rate limiting (100 req/min per IP), validate all inputs (express-validator)
- **API Versioning**: Use `/api/v1/` prefix for all endpoints to allow future breaking changes
- **Error Handling**: Standardize error response format: `{ error: string, code: string, details?: any }`

**Future Migration Path**: This architecture prepares for Epic 14 (.NET migration) by:

- Clean separation of layers (Controllers/Services/Repositories) — Services contain business logic that can be ported to C# without rewriting API contracts
- OpenAPI/Swagger spec generated from code — .NET backend can implement same spec (contract-first development)
- Database schema is technology-agnostic — Entity Framework Core can connect to same PostgreSQL database
- Business logic in Services is pure TypeScript — Can be translated to C# line-by-line with minimal changes
